import logging
import secrets
import string

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from scmgs.models import UserProfile
from scmgs.permissions import IsAdmin
from scmgs.serializers import validate_password_strength
from scmgs.services.otp_service import is_email_configured

logger = logging.getLogger(__name__)


def generate_staff_password(length=12):
    """Generate a password that satisfies validate_password_strength."""
    lower = secrets.choice(string.ascii_lowercase)
    upper = secrets.choice(string.ascii_uppercase)
    digit = secrets.choice(string.digits)
    alphabet = string.ascii_letters + string.digits
    rest = ''.join(secrets.choice(alphabet) for _ in range(max(length - 3, 5)))
    chars = list(lower + upper + digit + rest)
    secrets.SystemRandom().shuffle(chars)
    return ''.join(chars)


def staff_queryset():
    return (
        User.objects.filter(groups__name='Staff', is_superuser=False)
        .distinct()
        .order_by('username')
    )


class StaffSerializer(serializers.ModelSerializer):
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'phone',
            'is_active', 'date_joined',
        )
        read_only_fields = fields

    def get_phone(self, obj):
        try:
            return obj.profile.phone
        except UserProfile.DoesNotExist:
            return None


class StaffCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=30)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    password = serializers.CharField(required=False, allow_blank=True, write_only=True, min_length=8)
    notify = serializers.BooleanField(required=False, default=False)
    notify_channel = serializers.ChoiceField(
        choices=('sms', 'email'), required=False, allow_null=True, default=None,
    )

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_phone(self, value):
        if value:
            value = value.strip()
            if not value.startswith('+') or len(value) < 10:
                raise serializers.ValidationError(
                    'Phone must be in E.164 format (e.g. +15551234567).',
                )
        return value

    def validate_password(self, value):
        if value:
            return validate_password_strength(value)
        return value


class StaffUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True, min_length=8)

    def validate_phone(self, value):
        if value:
            value = value.strip()
            if not value.startswith('+') or len(value) < 10:
                raise serializers.ValidationError(
                    'Phone must be in E.164 format (e.g. +15551234567).',
                )
        return value

    def validate_password(self, value):
        if value:
            return validate_password_strength(value)
        return value


class StaffResetCredentialsSerializer(serializers.Serializer):
    password = serializers.CharField(required=False, allow_blank=True, write_only=True, min_length=8)
    notify = serializers.BooleanField(required=False, default=False)
    notify_channel = serializers.ChoiceField(
        choices=('sms', 'email'), required=False, allow_null=True, default=None,
    )

    def validate_password(self, value):
        if value:
            return validate_password_strength(value)
        return value


def _notify_credentials(user, password, channel):
    """Best-effort notify staff of new credentials. Returns status string."""
    if channel == 'sms':
        try:
            phone = user.profile.phone
        except UserProfile.DoesNotExist:
            return 'skipped_no_phone'
        if not phone:
            return 'skipped_no_phone'
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '') or ''
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '') or ''
        from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '') or ''
        if not all([account_sid, auth_token, from_number]):
            logger.warning(
                'Twilio not configured — staff credentials for %s not SMS-delivered',
                user.username,
            )
            return 'skipped_no_twilio'
        try:
            from twilio.rest import Client
            Client(account_sid, auth_token).messages.create(
                body=(
                    f'Your SCMS staff account credentials:\n'
                    f'Username: {user.username}\nPassword: {password}'
                ),
                from_=from_number,
                to=phone,
            )
            return 'sent_sms'
        except Exception as exc:
            logger.error('Failed to SMS staff credentials to %s: %s', user.username, exc)
            return 'failed'
    if channel == 'email':
        if not is_email_configured() or not (user.email or '').strip():
            return 'skipped_no_email'
        try:
            send_mail(
                subject='SCMS staff account credentials',
                message=(
                    f'Your SCMS staff account credentials:\n'
                    f'Username: {user.username}\nPassword: {password}\n'
                    f'Please change your password after logging in.'
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@scms.local'),
                recipient_list=[user.email.strip()],
                fail_silently=False,
            )
            return 'sent_email'
        except Exception as exc:
            logger.error('Failed to email staff credentials to %s: %s', user.username, exc)
            return 'failed'
    return 'skipped'


def _staff_response(user, *, password=None, notify_status=None):
    data = StaffSerializer(user).data
    if password is not None:
        data['password'] = password
    if notify_status is not None:
        data['notify_status'] = notify_status
    return data


class StaffListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = staff_queryset()
        return Response(StaffSerializer(qs, many=True).data)

    def post(self, request):
        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        password = data.get('password') or generate_staff_password()
        if not data.get('password'):
            validate_password_strength(password)

        user = User.objects.create_user(
            username=data['username'],
            email=data.get('email') or '',
            first_name=data.get('first_name') or '',
            password=password,
        )
        user.is_superuser = False
        user.is_staff = False
        user.save(update_fields=['is_superuser', 'is_staff'])
        group, _ = Group.objects.get_or_create(name='Staff')
        user.groups.add(group)

        phone = data.get('phone') or ''
        if phone:
            UserProfile.objects.create(user=user, phone=phone)

        notify_status = None
        if data.get('notify') and data.get('notify_channel'):
            notify_status = _notify_credentials(user, password, data['notify_channel'])

        logger.info('Admin %s created staff user %s', request.user.username, user.username)
        return Response(
            _staff_response(user, password=password, notify_status=notify_status),
            status=status.HTTP_201_CREATED,
        )


class StaffDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        user = get_object_or_404(staff_queryset(), pk=pk)
        return Response(StaffSerializer(user).data)

    def patch(self, request, pk):
        user = get_object_or_404(staff_queryset(), pk=pk)
        serializer = StaffUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if 'email' in data:
            user.email = data['email']
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if data.get('password'):
            user.set_password(data['password'])
        user.save()

        if 'phone' in data:
            phone = data['phone']
            if phone:
                UserProfile.objects.update_or_create(user=user, defaults={'phone': phone})
            elif hasattr(user, 'profile'):
                try:
                    user.profile.delete()
                except UserProfile.DoesNotExist:
                    pass

        return Response(StaffSerializer(user).data)


class StaffResetCredentialsView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        user = get_object_or_404(staff_queryset(), pk=pk)
        serializer = StaffResetCredentialsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        password = data.get('password') or generate_staff_password()
        if not data.get('password'):
            validate_password_strength(password)

        user.set_password(password)
        user.save(update_fields=['password'])

        notify_status = None
        if data.get('notify') and data.get('notify_channel'):
            notify_status = _notify_credentials(user, password, data['notify_channel'])

        logger.info('Admin %s reset credentials for staff %s', request.user.username, user.username)
        return Response(_staff_response(user, password=password, notify_status=notify_status))
