# tasks.py

import os
from datetime import datetime
from celery import shared_task
from django.conf import settings

@shared_task
def backup_db():
    db_name = settings.DATABASES['default']['NAME']
    db_user = settings.DATABASES['default']['USER']
    db_password = settings.DATABASES['default']['PASSWORD']
    db_host = settings.DATABASES['default']['HOST']
    db_port = settings.DATABASES['default']['PORT']
    backup_dir = '/backups'
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    backup_file = f'{backup_dir}/{db_name}_{timestamp}.sql.gz'

    os.environ['PGPASSWORD'] = db_password
    dump_cmd = f'pg_dump -U {db_user} -h {db_host} -p {db_port} {db_name} | gzip > {backup_file}'

    os.system(dump_cmd)
    return f'Backup {backup_file} created'