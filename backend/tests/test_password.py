from django.conf import settings as django_settings
from django.contrib.auth.models import Group, User
from django.core import mail
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


@override_settings(
    DATABASES=TEST_DATABASES,
    REST_FRAMEWORK=TEST_REST_FRAMEWORK,
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    EMAIL_HOST='smtp.test.local',
    DEFAULT_FROM_EMAIL='noreply@test.local',
    **TEST_OTP_SETTINGS,
)
class PasswordAPITests(TestCase):
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

        self.no_phone = User.objects.create_user('nophone', 'np@test.com', 'Pass12345')
        self.no_phone.groups.add(Group.objects.get(name='User'))

        self.no_email = User.objects.create_user('noemail', '', 'Pass12345')
        self.no_email.groups.add(Group.objects.get(name='User'))
        UserProfile.objects.create(user=self.no_email, phone='+15554444444')

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

    def test_password_change_success(self):
        self._login('citizen', 'Pass12345')
        res = self.client.post('/api/auth/password/change/', {
            'current_password': 'Pass12345',
            'new_password': 'NewPass99',
            'new_password_confirm': 'NewPass99',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.citizen.refresh_from_db()
        self.assertTrue(self.citizen.check_password('NewPass99'))
        self.assertTrue(
            AuthAuditLog.objects.filter(
                event_type=AuthAuditEvent.PASSWORD_CHANGE,
                username='citizen',
            ).exists()
        )

    def test_password_change_wrong_current(self):
        self._login('citizen', 'Pass12345')
        res = self.client.post('/api/auth/password/change/', {
            'current_password': 'WrongPass1',
            'new_password': 'NewPass99',
            'new_password_confirm': 'NewPass99',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_change_requires_auth(self):
        res = self.client.post('/api/auth/password/change/', {
            'current_password': 'Pass12345',
            'new_password': 'NewPass99',
            'new_password_confirm': 'NewPass99',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_password_change_weak_password(self):
        self._login('citizen', 'Pass12345')
        res = self.client.post('/api/auth/password/change/', {
            'current_password': 'Pass12345',
            'new_password': 'alllowercase1',
            'new_password_confirm': 'alllowercase1',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.citizen.refresh_from_db()
        self.assertTrue(self.citizen.check_password('Pass12345'))

    def test_password_change_mismatch(self):
        self._login('citizen', 'Pass12345')
        res = self.client.post('/api/auth/password/change/', {
            'current_password': 'Pass12345',
            'new_password': 'NewPass99',
            'new_password_confirm': 'OtherPass99',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password_confirm', res.data)
        self.citizen.refresh_from_db()
        self.assertTrue(self.citizen.check_password('Pass12345'))

    def test_forgot_requires_channel(self):
        res = self.client.post('/api/auth/password/forgot/', {
            'username': 'citizen',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forgot_invalid_channel(self):
        res = self.client.post('/api/auth/password/forgot/', {
            'username': 'citizen',
            'channel': 'whatsapp',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forgot_rate_limit_returns_429(self):
        with patch(
            'scmgs.views.password_views.create_otp_session',
            side_effect=ValueError('rate_limit'),
        ):
            res = self.client.post('/api/auth/password/forgot/', {
                'username': 'citizen',
                'channel': 'sms',
            })
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn('Too many OTP', res.data.get('detail', ''))

    def test_forgot_email_not_configured_code(self):
        with patch(
            'scmgs.views.password_views.create_otp_session',
            side_effect=ValueError('email_not_configured'),
        ):
            res = self.client.post('/api/auth/password/forgot/', {
                'username': 'citizen',
                'channel': 'email',
            })
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('Email delivery is not configured', res.data.get('detail', ''))

    def test_reset_password_mismatch(self):
        with patch('scmgs.services.otp_service.generate_otp_code', return_value='123456'):
            forgot = self.client.post('/api/auth/password/forgot/', {
                'username': 'citizen',
                'channel': 'sms',
            })
        res = self.client.post('/api/auth/password/reset/', {
            'otp_session': forgot.data['otp_session'],
            'code': '123456',
            'new_password': 'ResetPass1',
            'new_password_confirm': 'Different1',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.citizen.refresh_from_db()
        self.assertTrue(self.citizen.check_password('Pass12345'))

    def test_forgot_sms_and_reset(self):
        with patch('scmgs.services.otp_service.generate_otp_code', return_value='123456'):
            forgot = self.client.post('/api/auth/password/forgot/', {
                'username': 'citizen',
                'channel': 'sms',
            })
        self.assertEqual(forgot.status_code, status.HTTP_200_OK, forgot.data)
        self.assertTrue(forgot.data.get('otp_session'))

        reset = self.client.post('/api/auth/password/reset/', {
            'otp_session': forgot.data['otp_session'],
            'code': '123456',
            'new_password': 'ResetPass1',
            'new_password_confirm': 'ResetPass1',
        })
        self.assertEqual(reset.status_code, status.HTTP_200_OK, reset.data)
        self.citizen.refresh_from_db()
        self.assertTrue(self.citizen.check_password('ResetPass1'))
        self.assertTrue(
            AuthAuditLog.objects.filter(event_type=AuthAuditEvent.PASSWORD_RESET).exists()
        )
        # Does not auto-login
        self.assertFalse(reset.cookies.get('access_token'))

    def test_forgot_email_and_reset(self):
        mail.outbox.clear()
        with patch('scmgs.services.otp_service.generate_otp_code', return_value='654321'):
            forgot = self.client.post('/api/auth/password/forgot/', {
                'email': 's@test.com',
                'channel': 'email',
            })
        self.assertEqual(forgot.status_code, status.HTTP_200_OK, forgot.data)
        self.assertTrue(forgot.data.get('otp_session'))
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('654321', mail.outbox[0].body)

        reset = self.client.post('/api/auth/password/reset/', {
            'otp_session': forgot.data['otp_session'],
            'code': '654321',
            'new_password': 'EmailReset1',
            'new_password_confirm': 'EmailReset1',
        })
        self.assertEqual(reset.status_code, status.HTTP_200_OK, reset.data)
        self.staff.refresh_from_db()
        self.assertTrue(self.staff.check_password('EmailReset1'))

    def test_forgot_email_without_smtp_returns_503(self):
        with override_settings(EMAIL_HOST=''):
            res = self.client.post('/api/auth/password/forgot/', {
                'username': 'citizen',
                'channel': 'email',
            })
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_forgot_sms_without_phone(self):
        res = self.client.post('/api/auth/password/forgot/', {
            'username': 'nophone',
            'channel': 'sms',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forgot_email_without_email(self):
        res = self.client.post('/api/auth/password/forgot/', {
            'username': 'noemail',
            'channel': 'email',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forgot_unknown_user_generic(self):
        res = self.client.post('/api/auth/password/forgot/', {
            'username': 'doesnotexist',
            'channel': 'sms',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNone(res.data.get('otp_session'))

    def test_reset_wrong_code(self):
        with patch('scmgs.services.otp_service.generate_otp_code', return_value='123456'):
            forgot = self.client.post('/api/auth/password/forgot/', {
                'username': 'citizen',
                'channel': 'sms',
            })
        res = self.client.post('/api/auth/password/reset/', {
            'otp_session': forgot.data['otp_session'],
            'code': '000000',
            'new_password': 'ResetPass1',
            'new_password_confirm': 'ResetPass1',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.citizen.refresh_from_db()
        self.assertTrue(self.citizen.check_password('Pass12345'))
