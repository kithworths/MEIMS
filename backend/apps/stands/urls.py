from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import StandStageViewSet, StandStageTransitionViewSet, StandViewSet, StageHistoryViewSet

router = DefaultRouter()
router.register(r'stand-stages', StandStageViewSet, basename='standstage')
router.register(r'stand-stage-transitions', StandStageTransitionViewSet, basename='standstagetransition')
router.register(r'stands', StandViewSet, basename='stand')
router.register(r'stage-history', StageHistoryViewSet, basename='stagehistory')

urlpatterns = [
    path('v1/', include(router.urls)),
]
