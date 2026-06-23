from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scmgs', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='complaint',
            name='complain',
            field=models.CharField(max_length=500),
        ),
        migrations.AddIndex(
            model_name='complaint',
            index=models.Index(fields=['status'], name='scmgs_compl_status_8b0e0e_idx'),
        ),
        migrations.AddIndex(
            model_name='complaint',
            index=models.Index(fields=['category'], name='scmgs_compl_categor_2a2f8d_idx'),
        ),
        migrations.AddIndex(
            model_name='complaint',
            index=models.Index(fields=['submitted_by'], name='scmgs_compl_submitt_0e8a2a_idx'),
        ),
    ]
