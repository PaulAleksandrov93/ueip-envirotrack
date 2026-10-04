from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

spa = TemplateView.as_view(template_name='index.html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend.api.urls')),
    path('', spa),
    re_path(r'^(login|rooms-parameters|buildings-parameters|measuring-instruments|room-parameter|building-parameter|measurement-instrument).*$', spa),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
