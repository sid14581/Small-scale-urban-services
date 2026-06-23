from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scmgs', '0003_userprofile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='phone',
            field=models.CharField(db_index=True, max_length=20),
        ),
    ]
