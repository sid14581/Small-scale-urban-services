from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scmgs', '0005_authauditlog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='authauditlog',
            name='event_type',
            field=models.CharField(
                choices=[
                    ('otp_sent', 'OTP Sent'),
                    ('otp_failed', 'OTP Failed'),
                    ('login_failed', 'Login Failed'),
                    ('token_refresh', 'Token Refresh'),
                    ('register_init', 'Register Initiated'),
                    ('password_change', 'Password Change'),
                    ('password_forgot', 'Password Forgot'),
                    ('password_reset', 'Password Reset'),
                    ('password_failed', 'Password Failed'),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
    ]
