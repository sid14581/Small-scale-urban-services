from django.test import TestCase, override_settings

from scmgs.models import Complaint, ComplaintCategory, ComplaintStatus

TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


@override_settings(DATABASES=TEST_DATABASES)
class ComplaintModelTests(TestCase):
    def test_reference_id_generated(self):
        c = Complaint.objects.create(
            category=ComplaintCategory.ROAD,
            complain='Pothole',
            phone='123',
            address='Main St',
            area='North',
        )
        self.assertTrue(c.reference_id)
        self.assertEqual(c.status, ComplaintStatus.OPEN)
