from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('scmgs', '0004_alter_userprofile_phone'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuthAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(
                    choices=[
                        ('otp_sent', 'OTP Sent'),
                        ('otp_failed', 'OTP Failed'),
                        ('login_failed', 'Login Failed'),
                        ('token_refresh', 'Token Refresh'),
                        ('register_init', 'Register Initiated'),
                    ],
                    db_index=True,
                    max_length=20,
                )),
                ('username', models.CharField(blank=True, default='', max_length=150)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('detail', models.CharField(blank=True, default='', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='auth_audit_logs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['event_type', 'created_at'], name='scmgs_auth_event_created_idx'),
                ],
            },
        ),
    ]
