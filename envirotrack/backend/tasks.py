from celery import shared_task
from django.core.management import call_command

@shared_task
def backup_db():
    call_command('backup_db')