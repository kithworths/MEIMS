from django.apps import AppConfig


class GisConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gis'
    verbose_name = 'Gis'

    def ready(self):
        import apps.gis.signals  # noqa: F401
