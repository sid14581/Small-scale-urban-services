from django.contrib.auth.models import User
from django.test import TestCase, override_settings

TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


@override_settings(DATABASES=TEST_DATABASES)
class SeedGroupsTests(TestCase):
    def test_seed_groups_command(self):
        from django.core.management import call_command
        call_command('seed_groups')
        self.assertTrue(User.objects.filter(username='admin').exists())
        admin = User.objects.get(username='admin')
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.check_password('Admin@1234'))
        staff = User.objects.get(username='staff')
        self.assertFalse(staff.is_staff)
