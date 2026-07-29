#!/bin/sh
set -e

# In production, ensure database migrations are applied and static assets are collected.
if [ "$1" = "gunicorn" ]; then
  echo "Applying database migrations..."
  python manage.py migrate --noinput
  echo "Collecting static assets..."
  python manage.py collectstatic --noinput
fi

exec "$@"
