import csv
import io
from decimal import Decimal
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.http import HttpResponse

from rest_framework.decorators import action

from common.utils.api_response import error_response, success_response
from common.views import BaseModelViewSet

from .filters import PaymentFilter, PaymentReceiptFilter, PaymentAllocationFilter
from .models import Payment, PaymentAllocation, PaymentReceipt
from .permissions import PaymentPermissions, PaymentReceiptPermissions
from .serializers import PaymentSerializer, PaymentAllocationSerializer, PaymentReceiptSerializer
from .services import PaymentService, PaymentReceiptService


class PaymentViewSet(BaseModelViewSet):
    queryset = Payment.objects.select_related('project', 'stand', 'service_type').all()
    serializer_class = PaymentSerializer
    permission_classes = [PaymentPermissions]
    permission_module = 'payments'
    filterset_class = PaymentFilter
    search_fields = ['reference', 'external_reference', 'notes']
    ordering_fields = ['payment_date', 'amount', 'created_at', 'updated_at']
    ordering = ['-payment_date']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def reverse(self, request, pk=None):
        payment = self.get_object()
        reason = request.data.get('reason', 'Reversal requested.')
        try:
            reversal = PaymentService.reverse(payment, reason, user=request.user)
        except Exception as exc:
            return error_response(errors={'detail': str(exc)}, message='Could not reverse payment.', status_code=400)
        serializer = PaymentSerializer(reversal, context=self.get_serializer_context())
        return success_response(data=serializer.data, message='Payment reversal created.', status_code=201)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        payment = self.get_object()
        amount = request.data.get('amount')
        reason = request.data.get('reason', 'Refund requested.')
        try:
            amount = Decimal(str(amount))
            refund = PaymentService.refund(payment, amount, reason, user=request.user)
        except Exception as exc:
            return error_response(errors={'detail': str(exc)}, message='Could not refund payment.', status_code=400)
        serializer = PaymentSerializer(refund, context=self.get_serializer_context())
        return success_response(data=serializer.data, message='Payment refund created.', status_code=201)

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payments.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Reference',
            'Payment Type',
            'Project',
            'Stand',
            'Service Type',
            'Amount',
            'Currency',
            'Base Amount',
            'Status',
            'Payment Date',
            'External Reference',
            'Notes',
        ])

        for payment in queryset:
            writer.writerow([
                payment.reference,
                payment.payment_type,
                payment.project_id or '',
                payment.stand_id or '',
                payment.service_type_id or '',
                f'{payment.amount:.2f}',
                payment.currency,
                f'{payment.base_amount:.2f}',
                payment.status,
                payment.payment_date.isoformat(),
                payment.external_reference,
                payment.notes,
            ])

        return response

    @action(detail=False, methods=['get'], url_path='export-excel')
    def export_excel(self, request):
        return self.export_csv(request)

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        totals = queryset.aggregate(
            total_revenue=Sum('base_amount', filter=Q(payment_type__in=[Payment.PAYMENT_PROJECT, Payment.PAYMENT_STAND, Payment.PAYMENT_SERVICE])),
            payment_count=Count('id', filter=Q(payment_type__in=[Payment.PAYMENT_PROJECT, Payment.PAYMENT_STAND, Payment.PAYMENT_SERVICE])),
            refund_count=Count('id', filter=Q(payment_type=Payment.PAYMENT_REFUND)),
            reversal_count=Count('id', filter=Q(payment_type=Payment.PAYMENT_REVERSAL)),
        )
        daily = (
            queryset.filter(payment_type__in=[Payment.PAYMENT_PROJECT, Payment.PAYMENT_STAND, Payment.PAYMENT_SERVICE])
            .annotate(date=TruncDate('payment_date'))
            .values('date')
            .annotate(amount=Sum('base_amount'), count=Count('id'))
            .order_by('date')
        )

        return success_response(
            data={
                'total_revenue': str(totals['total_revenue'] or 0),
                'payment_count': totals['payment_count'] or 0,
                'refund_count': totals['refund_count'] or 0,
                'reversal_count': totals['reversal_count'] or 0,
                'daily_revenue': [
                    {'date': item['date'].isoformat(), 'amount': str(item['amount'] or 0), 'count': item['count']}
                    for item in daily
                ],
            },
        )

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        payment = self.get_object()
        payment.is_deleted = True
        payment.is_active = False
        payment.updated_by = request.user
        payment.save()
        return success_response(message='Payment soft-deleted.')


class PaymentAllocationViewSet(BaseModelViewSet):
    queryset = PaymentAllocation.objects.select_related('payment', 'target_content_type').all()
    serializer_class = PaymentAllocationSerializer
    permission_classes = [PaymentPermissions]
    permission_module = 'payments'
    filterset_class = PaymentAllocationFilter
    search_fields = ['payment__reference']
    ordering_fields = ['allocated_at', 'amount']
    ordering = ['-allocated_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        allocation = self.get_object()
        allocation.is_deleted = True
        allocation.is_active = False
        allocation.updated_by = request.user
        allocation.save()
        return success_response(message='Payment allocation soft-deleted.')


class PaymentReceiptViewSet(BaseModelViewSet):
    queryset = PaymentReceipt.objects.select_related('payment', 'original_receipt').all()
    serializer_class = PaymentReceiptSerializer
    permission_classes = [PaymentReceiptPermissions]
    permission_module = 'paymentreceipts'
    filterset_class = PaymentReceiptFilter
    search_fields = ['receipt_number', 'payment__reference']
    ordering_fields = ['issued_at', 'created_at']
    ordering = ['-issued_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def reprint(self, request, pk=None):
        receipt = self.get_object()
        try:
            reprint = PaymentReceiptService.reprint(receipt, user=request.user)
        except Exception as exc:
            return error_response(errors={'detail': str(exc)}, message='Could not create receipt reprint.', status_code=400)
        serializer = PaymentReceiptSerializer(reprint, context=self.get_serializer_context())
        return success_response(data=serializer.data, message='Receipt reprinted.', status_code=201)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        receipt = self.get_object()
        verification_hash = request.data.get('verification_hash')
        if not verification_hash:
            return error_response(errors={'verification_hash': 'Verification hash is required.'}, message='Verification failed.', status_code=400)
        verified = PaymentReceiptService.verify(receipt, verification_hash, user=request.user)
        if not verified:
            return error_response(errors={'verification_hash': 'Receipt verification failed.'}, message='Verification failed.', status_code=400)
        serializer = PaymentReceiptSerializer(receipt, context=self.get_serializer_context())
        return success_response(data=serializer.data, message='Receipt verified.')

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payment_receipts.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Receipt Number',
            'Payment',
            'Issued At',
            'Status',
            'Verified At',
            'Original Receipt',
        ])

        for receipt in queryset:
            writer.writerow([
                receipt.receipt_number,
                receipt.payment_id,
                receipt.issued_at.isoformat(),
                receipt.status,
                receipt.verified_at.isoformat() if receipt.verified_at else '',
                receipt.original_receipt_id or '',
            ])

        return response

    @action(detail=False, methods=['get'], url_path='export-excel')
    def export_excel(self, request):
        return self.export_csv(request)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        receipt = self.get_object()
        receipt.is_deleted = True
        receipt.is_active = False
        receipt.updated_by = request.user
        receipt.save()
        return success_response(message='Payment receipt soft-deleted.')
