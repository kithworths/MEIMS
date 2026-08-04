"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('apps.api.urls')),
    path('api/v1/', include('apps.departments.urls')),
    path('api/v1/', include('apps.authorization.urls')),
    path('api/v1/', include('apps.stands.urls')),
    path('api/v1/', include('apps.tasks.urls')),
    path('api/v1/', include('apps.finance.urls')),
    path('api/v1/', include('apps.documents.urls')),
    path('api/v1/', include('apps.gis.urls')),
    path('api/', include(('apps.api.urls', 'api'), namespace='api_legacy')),
    path('api/', include('apps.departments.urls')),
    path('api/', include('apps.authorization.urls')),
    path('api/', include('apps.stands.urls')),
    path('api/', include('apps.tasks.urls')),
    path('api/', include('apps.finance.urls')),
    path('api/', include('apps.documents.urls')),
    path('api/', include('apps.gis.urls')),
]

# Use JSON handlers for 404 and 500 so API clients get standardized error payloads
handler404 = 'common.exceptions.handlers.handle_404'
handler500 = 'common.exceptions.handlers.handle_500'
