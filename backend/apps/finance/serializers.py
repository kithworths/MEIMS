from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import Payment, PaymentAllocation, PaymentReceipt
from .validators import validate_currency_code, validate_payment_reference


class PaymentSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Payment._meta.get_field('project').remote_field.model.objects.filter(is_deleted=False),
        required=False,
        allow_null=True,
    )
    stand = serializers.PrimaryKeyRelatedField(
        queryset=Payment._meta.get_field('stand').remote_field.model.objects.filter(is_deleted=False),
        required=False,
        allow_null=True,
    )
    service_type = serializers.PrimaryKeyRelatedField(
        queryset=Payment._meta.get_field('service_type').remote_field.model.objects.filter(is_deleted=False),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Payment
        fields = (
            'id',
            'reference',
            'payment_type',
            'project',
            'stand',
            'service_type',
            'amount',
            'currency',
            'exchange_rate',
            'base_amount',
            'external_reference',
            'notes',
            'status',
            'original_payment',
            'payment_date',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = ('id', 'reference', 'base_amount', 'status', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def validate_currency(self, value):
        validate_currency_code(value)
        return value

    def validate(self, attrs):
        payment_type = attrs.get('payment_type', getattr(self.instance, 'payment_type', None))
        if payment_type in [Payment.PAYMENT_PROJECT] and attrs.get('project') is None:
            raise serializers.ValidationError({'project': 'Project payment requires a project target.'})
        if payment_type in [Payment.PAYMENT_STAND] and attrs.get('stand') is None:
            raise serializers.ValidationError({'stand': 'Stand payment requires a stand target.'})
        if payment_type in [Payment.PAYMENT_SERVICE] and attrs.get('service_type') is None:
            raise serializers.ValidationError({'service_type': 'Service payment requires a service type.'})
        if payment_type in [Payment.PAYMENT_REVERSAL, Payment.PAYMENT_REFUND] and attrs.get('original_payment') is None:
            raise serializers.ValidationError({'original_payment': 'Corrections must reference an original payment.'})
        return attrs


class PaymentAllocationSerializer(serializers.ModelSerializer):
    target_content_type = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all(),
    )
    target_object_id = serializers.UUIDField()

    class Meta:
        model = PaymentAllocation
        fields = (
            'id',
            'payment',
            'target_content_type',
            'target_object_id',
            'amount',
            'allocated_at',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = ('id', 'allocated_at', 'created_at', 'updated_at', 'created_by', 'updated_by')


class PaymentReceiptSerializer(serializers.ModelSerializer):
    original_receipt = serializers.PrimaryKeyRelatedField(
        queryset=PaymentReceipt.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = PaymentReceipt
        fields = (
            'id',
            'receipt_number',
            'payment',
            'issued_at',
            'status',
            'pdf_ready_data',
            'original_receipt',
            'verified_at',
            'verification_hash',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = (
            'id',
            'receipt_number',
            'status',
            'verified_at',
            'verification_hash',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
