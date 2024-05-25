from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Установить настройки Django для Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'envirotrack.settings')

app = Celery('envirotrack')

# Загружаем настройки из конфигурации Django
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматически находим задачи в файлах tasks.py всех приложений
app.autodiscover_tasks()