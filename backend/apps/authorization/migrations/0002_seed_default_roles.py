from django.db import migrations


def create_default_roles(apps, schema_editor):
    Role = apps.get_model('authorization', 'Role')
    default_roles = [
        'System Administrator',
        'Director',
        'Water Engineer',
        'Surveyor',
        'Town Planner',
        'Finance Officer',
        'Inspector',
    ]

    for role_name in default_roles:
        Role.objects.update_or_create(
            name=role_name,
            defaults={'description': f'Built-in role for {role_name}.', 'is_active': True},
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('authorization', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_roles, noop),
    ]
