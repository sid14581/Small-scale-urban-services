from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework import serializers

from scmgs.serializers import UserRegisterSerializer, validate_password_strength


class SerializerValidationTests(TestCase):
    def test_username_max_30_chars(self):
        serializer = UserRegisterSerializer(data={
            'username': 'a' * 31,
            'email': 'test@example.com',
            'password': 'Validpass1',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_weak_password_rejected(self):
        with self.assertRaises(serializers.ValidationError):
            validate_password_strength('alllowercase1')
        with self.assertRaises(serializers.ValidationError):
            validate_password_strength('ALLUPPERCASE1')
        with self.assertRaises(serializers.ValidationError):
            validate_password_strength('NoDigitsHere')

    def test_strong_password_accepted(self):
        self.assertEqual(validate_password_strength('Validpass1'), 'Validpass1')

    def test_invalid_email_rejected(self):
        serializer = UserRegisterSerializer(data={
            'username': 'validuser',
            'email': 'not-an-email',
            'password': 'Validpass1',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_valid_registration_data(self):
        Group.objects.create(name='User')
        serializer = UserRegisterSerializer(data={
            'username': 'validuser',
            'email': 'valid@example.com',
            'password': 'Validpass1',
            'first_name': 'Test',
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.username, 'validuser')
