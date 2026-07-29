from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EngineerTicketHistoryViewSet,
    EngineerTicketViewSet,
    ProjectTaskViewSet,
    ServiceTypeViewSet,
    SiteInspectionViewSet,
    SiteVisitViewSet,
    TaskHistoryViewSet,
)

router = DefaultRouter()
router.register(r'service-types', ServiceTypeViewSet, basename='servicetype')
router.register(r'project-tasks', ProjectTaskViewSet, basename='projecttask')
router.register(r'task-histories', TaskHistoryViewSet, basename='taskhistory')
router.register(r'engineer-tickets', EngineerTicketViewSet, basename='engineerticket')
router.register(r'engineer-ticket-histories', EngineerTicketHistoryViewSet, basename='engineertickethistory')
router.register(r'site-visits', SiteVisitViewSet, basename='sitevisit')
router.register(r'site-inspections', SiteInspectionViewSet, basename='siteinspection')

urlpatterns = [
    path('v1/', include(router.urls)),
]
