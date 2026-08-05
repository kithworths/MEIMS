from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0003_alter_auditlog_action_alter_auditlog_module_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='auditlog',
            name='object_type',
            field=models.CharField(blank=True, help_text='The object type that was affected by the audited event.', max_length=128, verbose_name='object type', default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='auditlog',
            name='object_id',
            field=models.CharField(blank=True, help_text='The identifier of the audited object.', max_length=128, verbose_name='object id', default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='auditlog',
            name='old_value',
            field=models.JSONField(blank=True, help_text='Previous value of the audited object, when applicable.', null=True, verbose_name='old value'),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='new_value',
            field=models.JSONField(blank=True, help_text='New value of the audited object, when applicable.', null=True, verbose_name='new value'),
        ),
    ]
