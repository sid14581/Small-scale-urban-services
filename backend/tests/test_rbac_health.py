from django.conf import settings as django_settings
from django.contrib.auth.models import Group, User
from django.test import TestCase, override_settings
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APIClient

from scmgs.models import UserProfile
from scmgs.serializers import UserSerializer
from scmgs.views.api_views import HealthView

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
class RbacAndHealthTests(TestCase):
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

    def test_health_returns_200(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get('status'), 'ok')

    def test_health_view_has_no_throttle(self):
        self.assertEqual(HealthView.throttle_classes, [])

    def test_user_serializer_citizen_role(self):
        data = UserSerializer(self.citizen).data
        self.assertEqual(data['role'], 'citizen')

    def test_citizen_blocked_from_admin_staff(self):
        self._login('citizen', 'Pass12345')
        self.assertEqual(self.client.get('/api/admin/staff/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get('/api/stats/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get('/api/audit-logs/').status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_blocked_from_admin_staff_endpoints(self):
        self._login('staff', 'Pass12345')
        self.assertEqual(self.client.get('/api/admin/staff/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post('/api/admin/staff/', {
                'username': 'x',
                'password': 'StaffPass1',
            }).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.get(f'/api/admin/staff/{self.staff.id}/').status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_can_access_stats_not_audit(self):
        self._login('staff', 'Pass12345')
        self.assertEqual(self.client.get('/api/stats/').status_code, status.HTTP_200_OK)
