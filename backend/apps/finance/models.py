import hashlib
import uuid
from decimal import Decimal

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class FinanceBaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_updated',
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['is_active', 'is_deleted', 'created_at'], name='%(app_label)s_%(class)s_active_deleted_created_idx'),
        ]


class Payment(FinanceBaseModel):
    PAYMENT_PROJECT = 'Project'
    PAYMENT_STAND = 'Stand'
    PAYMENT_SERVICE = 'Service'
    PAYMENT_REVERSAL = 'Reversal'
    PAYMENT_REFUND = 'Refund'

    PAYMENT_TYPE_CHOICES = [
        (PAYMENT_PROJECT, 'Project Payment'),
        (PAYMENT_STAND, 'Stand Payment'),
        (PAYMENT_SERVICE, 'Service Payment'),
        (PAYMENT_REVERSAL, 'Reversal Entry'),
        (PAYMENT_REFUND, 'Refund Entry'),
    ]

    STATUS_POSTED = 'Posted'
    STATUS_REVERSED = 'Reversed'
    STATUS_REFUNDED = 'Refunded'

    STATUS_CHOICES = [
        (STATUS_POSTED, 'Posted'),
        (STATUS_REVERSED, 'Reversed'),
        (STATUS_REFUNDED, 'Refunded'),
    ]

    reference = models.CharField(max_length=36, unique=True, editable=False)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, db_index=True)
    project = models.ForeignKey(
        'projects.Project',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    stand = models.ForeignKey(
        'stands.Stand',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    service_type = models.ForeignKey(
        'tasks.ServiceType',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD', db_index=True)
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=6, default=Decimal('1.000000'))
    base_amount = models.DecimalField(max_digits=14, decimal_places=2, editable=False)
    external_reference = models.CharField(max_length=128, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_POSTED, db_index=True)
    original_payment = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='corrections',
    )

    payment_date = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        verbose_name = 'payment'
        verbose_name_plural = 'payments'
        indexes = [
            models.Index(fields=['payment_type'], name='payment_type_idx'),
            models.Index(fields=['currency'], name='payment_currency_idx'),
            models.Index(fields=['status'], name='payment_status_idx'),
            models.Index(fields=['payment_date'], name='payment_date_idx'),
        ]

    def clean(self):
        if self.amount <= 0:
            raise ValidationError({'amount': 'Payment amount must be greater than zero.'})

        if self.payment_type == self.PAYMENT_PROJECT and self.project is None:
            raise ValidationError({'project': 'Project payments must target a project.'})

        if self.payment_type == self.PAYMENT_STAND and self.stand is None:
            raise ValidationError({'stand': 'Stand payments must target a stand.'})

        if self.payment_type == self.PAYMENT_SERVICE and self.service_type is None:
            raise ValidationError({'service_type': 'Service payments must target a service type.'})

        if self.payment_type in [self.PAYMENT_REVERSAL, self.PAYMENT_REFUND] and self.original_payment is None:
            raise ValidationError({'original_payment': 'Corrections must reference an original payment.'})

        if self.payment_type in [self.PAYMENT_REVERSAL, self.PAYMENT_REFUND] and self.amount >= 0:
            raise ValidationError({'amount': 'Correction payments must use a negative amount.'})

        if self.exchange_rate <= 0:
            raise ValidationError({'exchange_rate': 'Exchange rate must be greater than zero.'})

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f'PAY-{uuid.uuid4().hex[:16].upper()}'
        self.base_amount = (self.amount * self.exchange_rate).quantize(Decimal('0.01'))

        if self.pk:
            original = Payment.objects.filter(pk=self.pk).first()
            if original and original.status == self.STATUS_POSTED:
                raise ValidationError('Completed financial transactions cannot be modified.')

        super().save(*args, **kwargs)

    @property
    def allocated_amount(self):
        return self.allocations.filter(is_active=True, is_deleted=False).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

    @property
    def remaining_amount(self):
        remaining = self.amount - self.allocated_amount
        return remaining if remaining >= 0 else Decimal('0.00')

    @property
    def overpayment_amount(self):
        overpayment = self.allocated_amount - self.amount
        return overpayment if overpayment > 0 else Decimal('0.00')

    def __str__(self):
        return f'{self.reference} ({self.payment_type})'


class PaymentAllocation(FinanceBaseModel):
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='allocations',
    )
    target_content_type = models.ForeignKey(ContentType, on_delete=models.PROTECT)
    target_object_id = models.UUIDField()
    target_object = GenericForeignKey('target_content_type', 'target_object_id')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    allocated_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        verbose_name = 'payment allocation'
        verbose_name_plural = 'payment allocations'
        indexes = [
            models.Index(fields=['allocated_at'], name='payalloc_allocated_idx'),
        ]

    def clean(self):
        if self.amount <= 0:
            raise ValidationError({'amount': 'Allocation amount must be greater than zero.'})

        if self.payment.status != Payment.STATUS_POSTED:
            raise ValidationError({'payment': 'Allocations can only be made against posted payments.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        target = self.target_object
        return f'Allocation {self.amount} to {target} for {self.payment.reference}'


class PaymentReceipt(FinanceBaseModel):
    STATUS_ISSUED = 'Issued'
    STATUS_REPRINTED = 'Reprinted'
    STATUS_VOID = 'Void'
    STATUS_VERIFIED = 'Verified'

    STATUS_CHOICES = [
        (STATUS_ISSUED, 'Issued'),
        (STATUS_REPRINTED, 'Reprinted'),
        (STATUS_VOID, 'Void'),
        (STATUS_VERIFIED, 'Verified'),
    ]

    receipt_number = models.CharField(max_length=32, unique=True, editable=False)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        related_name='receipts',
    )
    issued_at = models.DateTimeField(default=timezone.now, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ISSUED, db_index=True)
    pdf_ready_data = models.JSONField(default=dict, blank=True)
    original_receipt = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='reprints',
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_hash = models.CharField(max_length=64, blank=True, editable=False)

    class Meta:
        verbose_name = 'payment receipt'
        verbose_name_plural = 'payment receipts'
        indexes = [
            models.Index(fields=['receipt_number'], name='paymentreceipt_number_idx'),
            models.Index(fields=['status'], name='paymentreceipt_status_idx'),
        ]

    def clean(self):
        if self.original_receipt and self.original_receipt.payment != self.payment:
            raise ValidationError({'original_receipt': 'Reprint receipts must reference the same payment.'})

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = f'RPT-{uuid.uuid4().hex[:12].upper()}'

        input_data = f'{self.receipt_number}:{self.payment.reference}:{self.issued_at.isoformat()}'.encode('utf-8')
        self.verification_hash = hashlib.sha256(input_data).hexdigest()

        if self.pk:
            original = PaymentReceipt.objects.filter(pk=self.pk).first()
            if original and original.status in [self.STATUS_ISSUED, self.STATUS_REPRINTED]:
                if self.status == self.STATUS_VERIFIED:
                    pass
                else:
                    raise ValidationError('Issued or reprinted receipts are immutable and cannot be modified.')
            if original and original.status == self.STATUS_VERIFIED:
                if self.status == self.STATUS_VERIFIED:
                    pass
                else:
                    raise ValidationError('Verified receipts are immutable and cannot be modified.')

        super().save(*args, **kwargs)

    def verify(self, verification_hash: str) -> bool:
        if self.verification_hash != verification_hash:
            return False
        if self.status != self.STATUS_VOID:
            self.status = self.STATUS_VERIFIED
            self.verified_at = timezone.now()
            super().save(update_fields=['status', 'verified_at'])
        return True

    @property
    def is_reprint(self):
        return self.original_receipt is not None

    @property
    def reprint_count(self):
        return self.reprints.count()

    def __str__(self):
        return f'{self.receipt_number} for {self.payment.reference}'
