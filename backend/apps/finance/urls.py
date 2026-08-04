from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PaymentViewSet, PaymentAllocationViewSet, PaymentReceiptViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payment-allocations', PaymentAllocationViewSet, basename='paymentallocation')
router.register(r'payment-receipts', PaymentReceiptViewSet, basename='paymentreceipt')

urlpatterns = [
    path('', include(router.urls)),
]
