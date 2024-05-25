import os
from django.core.management.base import BaseCommand
from django.conf import settings
from datetime import datetime

class Command(BaseCommand):
    help = 'Backup the database'

    def handle(self, *args, **kwargs):
        db_name = settings.DATABASES['default']['NAME']
        db_user = settings.DATABASES['default']['USER']
        db_password = settings.DATABASES['default']['PASSWORD']
        db_host = settings.DATABASES['default']['HOST']
        db_port = settings.DATABASES['default']['PORT']
        backup_dir = '/path/to/backup/dir'  # Замените на путь к каталогу бэкапов
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_file = f'{backup_dir}/{db_name}_{timestamp}.sql.gz'

        os.environ['PGPASSWORD'] = db_password
        dump_cmd = f'pg_dump -U {db_user} -h {db_host} -p {db_port} {db_name} | gzip > {backup_file}'

        os.system(dump_cmd)
        self.stdout.write(self.style.SUCCESS(f'Backup {backup_file} created'))