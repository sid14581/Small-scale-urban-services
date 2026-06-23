from django.contrib.auth.models import Group, User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


@override_settings(DATABASES=TEST_DATABASES)
class AdminAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        Group.objects.create(name='Staff')

        self.staff = User.objects.create_user('staff', 's@test.com', 'Pass12345')
        self.staff.is_staff = True
        self.staff.save()
        self.staff.groups.add(Group.objects.get(name='Staff'))

        self.admin = User.objects.create_superuser('admin', 'a@test.com', 'Admin@1234')

    def test_staff_cannot_access_django_admin_index(self):
        self.client.force_login(self.staff)
        res = self.client.get('/admin/')
        self.assertIn(res.status_code, (302, 403))
        if res.status_code == 302:
            self.assertIn('login', res.url)

    def test_superuser_can_access_django_admin_index(self):
        self.client.force_login(self.admin)
        res = self.client.get('/admin/')
        self.assertEqual(res.status_code, 200)
