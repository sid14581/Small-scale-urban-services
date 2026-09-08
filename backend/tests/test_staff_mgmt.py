from django.conf import settings as django_settings
from django.contrib.auth.models import Group, User
from django.test import TestCase, override_settings
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APIClient

from scmgs.models import UserProfile
from scmgs.permissions import IsAdmin, is_admin

TEST_REST_FRAMEWORK = {
    **django_settings.REST_FRAMEWORK,
    'DEFAULT_THROTTLE_CLASSES': [],
}

TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

TEST_OTP_SETTINGS = {
    'TWILIO_VERIFY_SERVICE_SID': '',
    'TWILIO_ACCOUNT_SID': '',
    'TWILIO_AUTH_TOKEN': '',
    'TWILIO_PHONE_NUMBER': '',
}


@override_settings(DATABASES=TEST_DATABASES, REST_FRAMEWORK=TEST_REST_FRAMEWORK, **TEST_OTP_SETTINGS)
class StaffManagementAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        Group.objects.create(name='User')
        Group.objects.create(name='Staff')

        self.citizen = User.objects.create_user('citizen', 'c@test.com', 'Pass12345')
        self.citizen.groups.add(Group.objects.get(name='User'))
        UserProfile.objects.create(user=self.citizen, phone='+15551111111')

        self.staff = User.objects.create_user('staff', 's@test.com', 'Pass12345')
        self.staff.groups.add(Group.objects.get(name='Staff'))
        UserProfile.objects.create(user=self.staff, phone='+15552222222')

        self.admin = User.objects.create_superuser('admin', 'a@test.com', 'Admin@1234')
        self.admin.groups.add(Group.objects.get(name='Staff'))
        UserProfile.objects.create(user=self.admin, phone='+15553333333')

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._auth_throttle_patch = patch(
            'scmgs.views.auth_views.AuthRateThrottle.allow_request',
            return_value=True,
        )
        cls._auth_throttle_patch.start()

    @classmethod
    def tearDownClass(cls):
        cls._auth_throttle_patch.stop()
        super().tearDownClass()

    def _login(self, username, password):
        res = self.client.post('/api/auth/login/', {'username': username, 'password': password})
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        if res.cookies.get('access_token'):
            self.client.cookies.update(res.cookies)
        elif res.data.get('access'):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        return res

    def test_is_admin_helper(self):
        self.assertTrue(is_admin(self.admin))
        self.assertFalse(is_admin(self.staff))
        self.assertFalse(is_admin(self.citizen))
        request = type('R', (), {'user': self.admin})()
        self.assertTrue(IsAdmin().has_permission(request, None))

    def test_admin_lists_staff(self):
        self._login('admin', 'Admin@1234')
        res = self.client.get('/api/admin/staff/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        usernames = [row['username'] for row in res.data]
        self.assertIn('staff', usernames)
        self.assertNotIn('admin', usernames)
        self.assertNotIn('citizen', usernames)

    def test_admin_creates_staff(self):
        self._login('admin', 'Admin@1234')
        res = self.client.post('/api/admin/staff/', {
            'username': 'newstaff',
            'email': 'ns@test.com',
            'first_name': 'New',
            'phone': '+15556667777',
            'password': 'StaffPass1',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data['username'], 'newstaff')
        self.assertEqual(res.data['password'], 'StaffPass1')
        user = User.objects.get(username='newstaff')
        self.assertTrue(user.groups.filter(name='Staff').exists())
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)
        self.assertEqual(user.profile.phone, '+15556667777')
        self.assertTrue(user.check_password('StaffPass1'))

    def test_admin_creates_staff_with_generated_password(self):
        self._login('admin', 'Admin@1234')
        res = self.client.post('/api/admin/staff/', {
            'username': 'genstaff',
            'email': 'gs@test.com',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertTrue(res.data.get('password'))
        user = User.objects.get(username='genstaff')
        self.assertTrue(user.check_password(res.data['password']))

    def test_admin_patch_staff(self):
        self._login('admin', 'Admin@1234')
        res = self.client.patch(f'/api/admin/staff/{self.staff.id}/', {
            'first_name': 'Updated',
            'email': 'updated-staff@test.com',
            'is_active': False,
            'phone': '+15558889999',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.staff.refresh_from_db()
        self.assertEqual(self.staff.first_name, 'Updated')
        self.assertEqual(self.staff.email, 'updated-staff@test.com')
        self.assertFalse(self.staff.is_active)
        self.assertEqual(self.staff.profile.phone, '+15558889999')

    def test_admin_reset_credentials(self):
        self._login('admin', 'Admin@1234')
        res = self.client.post(f'/api/admin/staff/{self.staff.id}/reset-credentials/', {
            'password': 'FreshPass1',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(res.data['password'], 'FreshPass1')
        self.staff.refresh_from_db()
        self.assertTrue(self.staff.check_password('FreshPass1'))

    def test_staff_forbidden_from_staff_mgmt(self):
        self._login('staff', 'Pass12345')
        res = self.client.get('/api/admin/staff/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res = self.client.post('/api/admin/staff/', {'username': 'x', 'password': 'StaffPass1'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_citizen_forbidden_from_staff_mgmt(self):
        self._login('citizen', 'Pass12345')
        res = self.client.get('/api/admin/staff/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res = self.client.patch(f'/api/admin/staff/{self.staff.id}/', {'first_name': 'Nope'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res = self.client.post(f'/api/admin/staff/{self.staff.id}/reset-credentials/', {})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_citizen_still_forbidden_from_staff_stats(self):
        self._login('citizen', 'Pass12345')
        res = self.client.get('/api/stats/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_staff_detail(self):
        self._login('admin', 'Admin@1234')
        res = self.client.get(f'/api/admin/staff/{self.staff.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'staff')
        self.assertEqual(res.data['phone'], '+15552222222')
