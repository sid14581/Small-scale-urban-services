from django.conf import settings as django_settings
from django.contrib.auth.models import Group, User
from django.test import TestCase, override_settings
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APIClient

from scmgs.models import AuthAuditEvent, AuthAuditLog, UserProfile

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
class AuditLogTests(TestCase):
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

    def test_login_failure_creates_audit_log(self):
        res = self.client.post('/api/auth/login/init/', {
            'username': 'citizen',
            'password': 'wrongpassword',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(
            AuthAuditLog.objects.filter(
                event_type=AuthAuditEvent.LOGIN_FAILED,
                username='citizen',
            ).exists()
        )

    def test_otp_verify_failure_creates_audit_log(self):
        with patch('scmgs.services.otp_service.generate_otp_code', return_value='123456'):
            init = self.client.post('/api/auth/login/init/', {
                'username': 'citizen',
                'password': 'Pass12345',
            })
        self.assertEqual(init.status_code, status.HTTP_200_OK)
        verify = self.client.post('/api/auth/otp/verify/', {
            'otp_session': init.data['otp_session'],
            'code': '000000',
        })
        self.assertEqual(verify.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(
            AuthAuditLog.objects.filter(event_type=AuthAuditEvent.OTP_FAILED).exists()
        )

    def test_staff_can_list_audit_logs(self):
        AuthAuditLog.objects.create(
            event_type=AuthAuditEvent.LOGIN_FAILED,
            username='someone',
            detail='test entry',
        )
        login = self.client.post('/api/auth/login/', {
            'username': 'staff', 'password': 'Pass12345',
        })
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        if login.cookies.get('access_token'):
            self.client.cookies.update(login.cookies)
        res = self.client.get('/api/audit-logs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['event_type'], AuthAuditEvent.LOGIN_FAILED)

    def test_citizen_cannot_list_audit_logs(self):
        login = self.client.post('/api/auth/login/', {
            'username': 'citizen', 'password': 'Pass12345',
        })
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        if login.cookies.get('access_token'):
            self.client.cookies.update(login.cookies)
        res = self.client.get('/api/audit-logs/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
