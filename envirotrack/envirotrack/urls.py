# admin.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from backend.admin import custom_admin_site


urlpatterns = [
    path('admin/', custom_admin_site.urls),
    path('api/', include('backend.api.urls')),
    path('', TemplateView.as_view(template_name='index.html')),
    re_path(r'^login.*$', TemplateView.as_view(template_name='index.html')),
    re_path(r'^parameter.*$', TemplateView.as_view(template_name='index.html')),
]