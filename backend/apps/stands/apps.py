from django.apps import AppConfig


class StandsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.stands'
    verbose_name = 'Stands'

    def ready(self):
        import apps.stands.signals  # noqa: F401
