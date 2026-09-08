#!/bin/bash
set -e
./wait-for-it.sh db:3306 --timeout=90 --strict --

echo "Waiting for MySQL to accept SQL queries..."
MYSQL_READY=0
for i in $(seq 1 45); do
  if python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Siddu716_project.settings')
import django
django.setup()
from django.db import connection
connection.ensure_connection()
with connection.cursor() as cursor:
    cursor.execute('SELECT 1')
" 2>/dev/null; then
    echo "MySQL ready after ${i} attempt(s)"
    MYSQL_READY=1
    break
  fi
  sleep 2
done

if [ "$MYSQL_READY" -ne 1 ]; then
  echo "ERROR: MySQL did not become ready for queries"
  exit 1
fi

echo "Pausing 30s for MySQL DDL stability..."
sleep 30

MIGRATE_OK=0
for attempt in $(seq 1 3); do
  if python manage.py migrate --noinput; then
    MIGRATE_OK=1
    break
  fi
  echo "Migrate attempt ${attempt} failed, retrying in 15s..."
  sleep 15
done

if [ "$MIGRATE_OK" -ne 1 ]; then
  echo "ERROR: migrations failed after 3 attempts"
  exit 1
fi

python manage.py seed_groups
python manage.py collectstatic --noinput

RELOAD_FLAG=""
if [ "${GUNICORN_RELOAD:-1}" = "1" ]; then
  RELOAD_FLAG="--reload"
fi
exec gunicorn Siddu716_project.wsgi:application \
  --bind 0.0.0.0:8000 --workers 3 $RELOAD_FLAG
