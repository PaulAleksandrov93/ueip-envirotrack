# urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
# from backend.admin import custom_admin_site
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # path('admin/', custom_admin_site.urls),
    path('admin/', admin.site.urls),
    path('api/', include('backend.api.urls')),
    path('', TemplateView.as_view(template_name='index.html')),
    re_path(r'^login.*$', TemplateView.as_view(template_name='index.html')),
    re_path(r'^building.*$', TemplateView.as_view(template_name='index.html')),
    re_path(r'^room.*$', TemplateView.as_view(template_name='index.html')),
    re_path(r'^measur.*$', TemplateView.as_view(template_name='index.html')),
    re_path(r'^param.*$', TemplateView.as_view(template_name='index.html')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)