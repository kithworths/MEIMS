from django.db import migrations


def create_default_departments(apps, schema_editor):
    Department = apps.get_model('departments', 'Department')
    default_departments = [
        {
            'department_name': 'Water',
            'department_code': 'WATER',
        },
        {
            'department_name': 'Survey',
            'department_code': 'SURVEY',
        },
        {
            'department_name': 'Town Planning',
            'department_code': 'TOWN_PLANNING',
        },
        {
            'department_name': 'Civil Engineering',
            'department_code': 'CIVIL_ENGINEERING',
        },
        {
            'department_name': 'Administration',
            'department_code': 'ADMINISTRATION',
        },
        {
            'department_name': 'Finance',
            'department_code': 'FINANCE',
        },
        {
            'department_name': 'ICT',
            'department_code': 'ICT',
        },
    ]

    for department_data in default_departments:
        Department.objects.update_or_create(
            department_code=department_data['department_code'],
            defaults=department_data,
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('departments', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_departments, noop),
    ]
