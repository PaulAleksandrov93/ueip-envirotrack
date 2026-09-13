from django.db import migrations


def round_humidity_columns(apps, schema_editor):
    """Округляет существующие значения и сужает колонку до 1 знака после запятой."""
    with schema_editor.connection.cursor() as cursor:
        for table in ('backend_parameterset', 'backend_parametersetforstorage'):
            cursor.execute('SELECT to_regclass(%s)', [f'public.{table}'])
            if cursor.fetchone()[0] is None:
                continue
            cursor.execute(
                f"""
                ALTER TABLE {table}
                ALTER COLUMN humidity_percentage TYPE numeric(5, 1)
                USING ROUND(humidity_percentage, 1)
                """
            )


def revert_humidity_columns(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        for table in ('backend_parameterset', 'backend_parametersetforstorage'):
            cursor.execute('SELECT to_regclass(%s)', [f'public.{table}'])
            if cursor.fetchone()[0] is None:
                continue
            cursor.execute(
                f"""
                ALTER TABLE {table}
                ALTER COLUMN humidity_percentage TYPE numeric(5, 2)
                """
            )


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0033_alter_enviromentalparameters_options_and_more'),
    ]

    operations = [
        migrations.RunPython(round_humidity_columns, revert_humidity_columns),
    ]
