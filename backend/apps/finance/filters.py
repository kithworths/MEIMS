import django_filters
from .models import Payment, PaymentReceipt, PaymentAllocation


class PaymentFilter(django_filters.FilterSet):
    payment_type = django_filters.CharFilter(field_name='payment_type', lookup_expr='iexact')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    currency = django_filters.CharFilter(field_name='currency', lookup_expr='iexact')
    payment_date_after = django_filters.DateTimeFilter(field_name='payment_date', lookup_expr='gte')
    payment_date_before = django_filters.DateTimeFilter(field_name='payment_date', lookup_expr='lte')
    project = django_filters.UUIDFilter(field_name='project')
    stand = django_filters.UUIDFilter(field_name='stand')
    service_type = django_filters.UUIDFilter(field_name='service_type')

    class Meta:
        model = Payment
        fields = ['payment_type', 'status', 'currency', 'project', 'stand', 'service_type']


class PaymentReceiptFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    receipt_number = django_filters.CharFilter(field_name='receipt_number', lookup_expr='icontains')
    issued_after = django_filters.DateTimeFilter(field_name='issued_at', lookup_expr='gte')
    issued_before = django_filters.DateTimeFilter(field_name='issued_at', lookup_expr='lte')
    payment = django_filters.UUIDFilter(field_name='payment')

    class Meta:
        model = PaymentReceipt
        fields = ['status', 'receipt_number', 'payment']


class PaymentAllocationFilter(django_filters.FilterSet):
    payment = django_filters.UUIDFilter(field_name='payment')
    target_object_id = django_filters.UUIDFilter(field_name='target_object_id')

    class Meta:
        model = PaymentAllocation
        fields = ['payment', 'target_object_id']
