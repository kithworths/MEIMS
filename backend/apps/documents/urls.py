from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AttachmentViewSet,
    DocumentViewSet,
    DocumentVersionViewSet,
    PlanViewSet,
    PlanVersionViewSet,
)

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-versions', DocumentVersionViewSet, basename='documentversion')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'plan-versions', PlanVersionViewSet, basename='planversion')

urlpatterns = [
    path('', include(router.urls)),
]
