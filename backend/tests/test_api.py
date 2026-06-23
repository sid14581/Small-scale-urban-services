from django.conf import settings as django_settings
from django.contrib.auth.models import Group, User
from django.test import TestCase, override_settings
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APIClient

from scmgs.models import Complaint, ComplaintCategory, ComplaintStatus, FeedBack, UserProfile
from scmgs.permissions import is_staff_member
from scmgs.serializers import UserSerializer

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
class APITests(TestCase):
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
        access = res.data.get('access')
        if access:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        elif res.cookies.get('access_token'):
            self.client.cookies.update(res.cookies)
        else:
            self.fail('Login response missing access token')
        return res

    def test_register_and_login(self):
        with patch('scmgs.services.otp_service.generate_otp_code', return_value='123456'):
            init = self.client.post('/api/auth/register/init/', {
                'username': 'newuser', 'email': 'n@test.com', 'first_name': 'New',
                'password': 'Longpass123', 'password_confirm': 'Longpass123',
                'phone': '+15559998888',
            })
        self.assertEqual(init.status_code, status.HTTP_200_OK, init.data)
        verify = self.client.post('/api/auth/otp/verify/', {
            'otp_session': init.data['otp_session'],
            'code': '123456',
        })
        self.assertEqual(verify.status_code, status.HTTP_200_OK)
        self.assertTrue(UserProfile.objects.filter(phone='+15559998888').exists())

    def test_login_init_rejects_bad_password(self):
        res = self.client.post('/api/auth/login/init/', {
            'username': 'citizen',
            'password': 'wrongpassword',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_otp_verify_rejects_wrong_code(self):
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

    def test_otp_login_flow_sets_cookies(self):
        with patch('scmgs.services.otp_service.generate_otp_code', return_value='123456'):
            init = self.client.post('/api/auth/login/init/', {
                'username': 'citizen',
                'password': 'Pass12345',
            })
        self.assertEqual(init.status_code, status.HTTP_200_OK)
        verify = self.client.post('/api/auth/otp/verify/', {
            'otp_session': init.data['otp_session'],
            'code': '123456',
        })
        self.assertEqual(verify.status_code, status.HTTP_200_OK)
        self.assertTrue(verify.cookies.get('access_token') or verify.data.get('username'))

    def test_register_always_creates_citizen(self):
        with patch('scmgs.services.otp_service.generate_otp_code', return_value='654321'):
            init = self.client.post('/api/auth/register/init/', {
                'username': 'newcitizen', 'email': 'nc@test.com', 'first_name': 'NC',
                'password': 'Longpass123', 'password_confirm': 'Longpass123',
                'phone': '+15557776666',
            })
        self.client.post('/api/auth/otp/verify/', {
            'otp_session': init.data['otp_session'],
            'code': '654321',
        })
        user = User.objects.get(username='newcitizen')
        self.assertTrue(user.groups.filter(name='User').exists())
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.profile.phone, '+15557776666')

    def test_user_serializer_admin_role(self):
        data = UserSerializer(self.admin).data
        self.assertEqual(data['role'], 'admin')

    def test_user_serializer_staff_role(self):
        data = UserSerializer(self.staff).data
        self.assertEqual(data['role'], 'staff')

    def test_is_staff_member_includes_superuser(self):
        self.assertTrue(is_staff_member(self.admin))
        self.assertTrue(is_staff_member(self.staff))
        self.assertFalse(is_staff_member(self.citizen))

    def test_citizen_submit_complaint(self):
        self._login('citizen', 'Pass12345')
        res = self.client.post('/api/complaints/', {
            'category': 'air_pollution',
            'complain': 'Heavy smoke near the factory area',
            'phone': '9999999999',
            'address': 'A',
            'area': 'Downtown',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Complaint.objects.count(), 1)

    def test_staff_update_status(self):
        c = Complaint.objects.create(
            category=ComplaintCategory.WASTE,
            complain='Bin overflow',
            phone='111', address='B', area='South',
            submitted_by=self.citizen,
        )
        self._login('staff', 'Pass12345')
        res = self.client.patch(f'/api/complaints/{c.id}/status/', {'status': 'resolved'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        c.refresh_from_db()
        self.assertEqual(c.status, ComplaintStatus.RESOLVED)

    def test_invalid_status_transition_rejected(self):
        c = Complaint.objects.create(
            category=ComplaintCategory.WASTE,
            complain='Bin overflow',
            phone='111', address='B', area='South',
            submitted_by=self.citizen,
            status=ComplaintStatus.RESOLVED,
        )
        self._login('staff', 'Pass12345')
        res = self.client.patch(f'/api/complaints/{c.id}/status/', {'status': 'open'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_access_stats(self):
        self._login('admin', 'Admin@1234')
        res = self.client.get('/api/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_citizen_cannot_access_stats(self):
        self._login('citizen', 'Pass12345')
        res = self.client.get('/api/stats/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_stats(self):
        self._login('staff', 'Pass12345')
        res = self.client.get('/api/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total', res.data)

    def test_feedback_submission(self):
        self._login('citizen', 'Pass12345')
        res = self.client.post('/api/feedback/', {'problem': 'UI', 'comment': 'Looks great'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_complaint_search(self):
        Complaint.objects.create(
            category=ComplaintCategory.ROAD,
            complain='Pothole on Main Street',
            phone='111', address='123 Main St', area='Downtown',
            submitted_by=self.citizen,
        )
        Complaint.objects.create(
            category=ComplaintCategory.WASTE,
            complain='Bin overflow',
            phone='222', address='Other', area='Uptown',
            submitted_by=self.citizen,
        )
        self._login('staff', 'Pass12345')
        res = self.client.get('/api/complaints/', {'search': 'pothole'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data['results'] if 'results' in res.data else res.data
        self.assertEqual(len(results), 1)
        self.assertIn('Pothole', results[0]['complain'])

    def test_profile_get_and_patch(self):
        self._login('citizen', 'Pass12345')
        res = self.client.get('/api/auth/profile/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.patch('/api/auth/profile/', {
            'first_name': 'Updated',
            'email': 'updated@test.com',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['first_name'], 'Updated')
        self.assertEqual(res.data['email'], 'updated@test.com')

    def test_bulk_status_update(self):
        c1 = Complaint.objects.create(
            category=ComplaintCategory.WASTE,
            complain='Bin overflow one',
            phone='111', address='B', area='South',
            submitted_by=self.citizen,
        )
        c2 = Complaint.objects.create(
            category=ComplaintCategory.WASTE,
            complain='Bin overflow two',
            phone='112', address='C', area='South',
            submitted_by=self.citizen,
        )
        self._login('staff', 'Pass12345')
        res = self.client.patch('/api/complaints/bulk-status/', {
            'ids': [c1.id, c2.id],
            'status': 'in_progress',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['updated']), 2)
        c1.refresh_from_db()
        self.assertEqual(c1.status, ComplaintStatus.IN_PROGRESS)

    def test_export_csv(self):
        Complaint.objects.create(
            category=ComplaintCategory.ROAD,
            complain='Export test complaint',
            phone='111', address='A', area='North',
            submitted_by=self.citizen,
        )
        self._login('staff', 'Pass12345')
        res = self.client.get('/api/complaints/export/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'text/csv')
        self.assertIn('Export test complaint', res.content.decode())
