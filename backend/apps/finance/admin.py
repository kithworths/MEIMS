from django.contrib import admin

from .models import Payment, PaymentAllocation, PaymentReceipt


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reference', 'payment_type', 'amount', 'currency', 'status', 'payment_date', 'is_active')
    search_fields = ('reference', 'external_reference', 'notes')
    list_filter = ('payment_type', 'status', 'currency')


@admin.register(PaymentAllocation)
class PaymentAllocationAdmin(admin.ModelAdmin):
    list_display = ('payment', 'amount', 'allocated_at', 'is_active')
    search_fields = ('payment__reference',)


@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'payment', 'status', 'issued_at', 'verified_at', 'is_active')
    search_fields = ('receipt_number', 'payment__reference')
    list_filter = ('status',)
