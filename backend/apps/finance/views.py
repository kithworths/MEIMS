from decimal import Decimal

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

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        receipt = self.get_object()
        receipt.is_deleted = True
        receipt.is_active = False
        receipt.updated_by = request.user
        receipt.save()
        return success_response(message='Payment receipt soft-deleted.')
