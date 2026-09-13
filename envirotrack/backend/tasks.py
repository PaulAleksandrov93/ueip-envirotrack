import gzip
import os
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

from celery import shared_task
from django.conf import settings

BACKUP_KEEP_DAYS = 14


@shared_task
def backup_db():
    db = settings.DATABASES['default']
    db_name = db['NAME']
    backup_dir = Path('/backups')
    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    backup_file = backup_dir / f'{db_name}_{timestamp}.sql.gz'

    env = os.environ.copy()
    env['PGPASSWORD'] = db['PASSWORD']
    dump = subprocess.run(
        [
            'pg_dump',
            '-U', db['USER'],
            '-h', db['HOST'],
            '-p', str(db['PORT']),
            db_name,
        ],
        check=True,
        capture_output=True,
        env=env,
    )
    backup_file.write_bytes(gzip.compress(dump.stdout))

    cutoff = datetime.now() - timedelta(days=BACKUP_KEEP_DAYS)
    for old in backup_dir.glob(f'{db_name}_*.sql.gz'):
        try:
            file_time = datetime.strptime(old.stem.split('_', 1)[1], '%Y-%m-%d_%H-%M-%S')
        except (IndexError, ValueError):
            continue
        if file_time < cutoff:
            old.unlink(missing_ok=True)

    return f'Backup {backup_file} created'
