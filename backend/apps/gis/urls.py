from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GISLocationViewSet

router = DefaultRouter()
router.register(r'gis-locations', GISLocationViewSet, basename='gislocation')

urlpatterns = [
    path('v1/', include(router.urls)),
]
