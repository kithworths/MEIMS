import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('meims')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks(lambda: ['apps.accounts', 'apps.departments', 'apps.authorization', 'apps.audit', 'apps.projects', 'apps.stands', 'apps.tasks', 'apps.documents', 'apps.finance', 'apps.reports', 'apps.notifications', 'apps.gis'])


@app.task(bind=True)
def debug_task(self):
    return {'message': f'Request: {self.request!r}'}
