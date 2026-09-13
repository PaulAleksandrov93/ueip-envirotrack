#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
    python manage.py migrate --noinput

    python - <<'PY'
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "envirotrack.settings")

import django
django.setup()

from django.contrib.auth import get_user_model

username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")
if not password:
    raise SystemExit("DJANGO_SUPERUSER_PASSWORD is not set")

User = get_user_model()
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, "", password)
PY
fi

if [ "$1" = "gunicorn" ]; then
    shift
    exec gunicorn envirotrack.wsgi:application \
        --bind 0.0.0.0:8000 \
        --workers "${GUNICORN_WORKERS:-3}" \
        --timeout 90 \
        --access-logfile - \
        --error-logfile - \
        --log-level info \
        "$@"
fi

exec "$@"
