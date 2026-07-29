from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.shortcuts import get_object_or_404

from common.services.audit import AuditLogService
from .models import Payment, PaymentAllocation, PaymentReceipt


class PaymentService:
    @staticmethod
    def get(payment_id):
        return get_object_or_404(Payment.objects.select_related('project', 'stand', 'service_type'), pk=payment_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = Payment.objects.select_related('project', 'stand', 'service_type').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        payment = Payment.objects.create(**kwargs)
        AuditLogService.record(
            module='payments',
            action='Create',
            description=f'Created payment {payment.reference} for {payment.payment_type}.',
            user=payment.created_by,
        )
        return payment

    @staticmethod
    @transaction.atomic
    def reverse(payment, reason: str, user=None):
        reversal = Payment.objects.create(
            payment_type=Payment.PAYMENT_REVERSAL,
            original_payment=payment,
            amount=-payment.amount,
            currency=payment.currency,
            exchange_rate=payment.exchange_rate,
            notes=f'Reversal of {payment.reference}: {reason}',
            created_by=user,
            updated_by=user,
        )
        AuditLogService.record(
            module='payments',
            action='Reverse',
            description=f'Reversed payment {payment.reference}.',
            user=user,
        )
        return reversal

    @staticmethod
    @transaction.atomic
    def refund(payment, amount: Decimal, reason: str, user=None):
        if amount <= 0:
            raise ValueError('Refund amount must be greater than zero.')

        refund = Payment.objects.create(
            payment_type=Payment.PAYMENT_REFUND,
            original_payment=payment,
            amount=-amount,
            currency=payment.currency,
            exchange_rate=payment.exchange_rate,
            notes=f'Refund for {payment.reference}: {reason}',
            created_by=user,
            updated_by=user,
        )
        AuditLogService.record(
            module='payments',
            action='Refund',
            description=f'Refunded {amount} for payment {payment.reference}.',
            user=user,
        )
        return refund

    @staticmethod
    @transaction.atomic
    def allocate(payment, target, amount: Decimal, user=None):
        if amount <= 0:
            raise ValueError('Allocation amount must be positive.')

        allocation = PaymentAllocation.objects.create(
            payment=payment,
            target_content_type=ContentType.objects.get_for_model(target),
            target_object_id=target.pk,
            amount=amount,
            created_by=user,
            updated_by=user,
        )
        AuditLogService.record(
            module='payments',
            action='Update',
            description=f'Allocated {amount} from payment {payment.reference}.',
            user=user,
        )
        return allocation


class PaymentReceiptService:
    @staticmethod
    def get(receipt_id):
        return get_object_or_404(PaymentReceipt.objects.select_related('payment'), pk=receipt_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = PaymentReceipt.objects.select_related('payment').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def issue(payment, pdf_ready_data: dict, original_receipt=None, user=None):
        receipt = PaymentReceipt.objects.create(
            payment=payment,
            pdf_ready_data=pdf_ready_data,
            original_receipt=original_receipt,
            created_by=user,
            updated_by=user,
        )
        AuditLogService.record(
            module='paymentreceipts',
            action='Create',
            description=f'Issued receipt {receipt.receipt_number} for payment {payment.reference}.',
            user=user,
        )
        return receipt

    @staticmethod
    @transaction.atomic
    def reprint(receipt, user=None):
        reprint = PaymentReceipt.objects.create(
            payment=receipt.payment,
            pdf_ready_data=receipt.pdf_ready_data,
            original_receipt=receipt,
            status=PaymentReceipt.STATUS_REPRINTED,
            created_by=user,
            updated_by=user,
        )
        AuditLogService.record(
            module='paymentreceipts',
            action='Reprint',
            description=f'Reprinted receipt {receipt.receipt_number}.',
            user=user,
        )
        return reprint

    @staticmethod
    @transaction.atomic
    def verify(receipt, verification_hash: str, user=None):
        verified = receipt.verify(verification_hash)
        if verified:
            AuditLogService.record(
                module='paymentreceipts',
                action='Verify',
                description=f'Verified receipt {receipt.receipt_number}.',
                user=user,
            )
        return verified
