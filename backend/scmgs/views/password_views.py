import logging

from django.contrib.auth.models import User
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from scmgs.models import AuthAuditEvent, UserProfile
from scmgs.serializers import validate_password_strength
from scmgs.services.audit_logger import log_auth_event
from scmgs.services.otp_service import create_otp_session, verify_otp_session
from scmgs.views.auth_views import AuthRateThrottle

logger = logging.getLogger(__name__)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        return validate_password_strength(value)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class PasswordForgotSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    channel = serializers.ChoiceField(choices=('sms', 'email'))

    def validate(self, attrs):
        username = (attrs.get('username') or '').strip()
        email = (attrs.get('email') or '').strip()
        if not username and not email:
            raise serializers.ValidationError('Provide username or email.')
        attrs['username'] = username
        attrs['email'] = email
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    otp_session = serializers.CharField()
    code = serializers.CharField(min_length=4, max_length=8)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        return validate_password_strength(value)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data['current_password']):
            log_auth_event(
                request, AuthAuditEvent.PASSWORD_FAILED,
                user=user, username=user.username, detail='Change password: wrong current password',
            )
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        log_auth_event(
            request, AuthAuditEvent.PASSWORD_CHANGE,
            user=user, username=user.username, detail='Password changed',
        )
        return Response({'detail': 'Password updated.'})


class PasswordForgotView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = PasswordForgotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        email = serializer.validated_data['email']
        channel = serializer.validated_data['channel']

        user = None
        if username:
            user = User.objects.filter(username=username).first()
        if user is None and email:
            user = User.objects.filter(email__iexact=email).first()

        # Generic response when account is missing (avoid user enumeration)
        generic = {'detail': 'If an account exists, a reset code has been sent.', 'otp_session': None}

        if user is None:
            log_auth_event(
                request, AuthAuditEvent.PASSWORD_FORGOT,
                username=username or email, detail='Forgot password: user not found',
            )
            return Response(generic)

        if channel == 'sms':
            try:
                phone = user.profile.phone
            except UserProfile.DoesNotExist:
                phone = None
            if not phone:
                log_auth_event(
                    request, AuthAuditEvent.PASSWORD_FAILED,
                    user=user, username=user.username, detail='Forgot password: no phone on file',
                )
                return Response(
                    {'detail': 'No phone number on file for this account. Try email or contact an administrator.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                session_id = create_otp_session(
                    'password_reset',
                    phone,
                    user_id=user.id,
                    channel='sms',
                    rate_subject=f'password_reset:{user.id}',
                )
            except ValueError as exc:
                return self._otp_error_response(exc)
        else:
            if not (user.email or '').strip():
                log_auth_event(
                    request, AuthAuditEvent.PASSWORD_FAILED,
                    user=user, username=user.username, detail='Forgot password: no email on file',
                )
                return Response(
                    {'detail': 'No email on file for this account. Try SMS or contact an administrator.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                session_id = create_otp_session(
                    'password_reset',
                    '',
                    user_id=user.id,
                    channel='email',
                    email=user.email.strip(),
                    rate_subject=f'password_reset:{user.id}',
                )
            except ValueError as exc:
                return self._otp_error_response(exc)

        log_auth_event(
            request, AuthAuditEvent.PASSWORD_FORGOT,
            user=user, username=user.username, detail=f'Forgot password OTP via {channel}',
        )
        return Response({'detail': 'If an account exists, a reset code has been sent.', 'otp_session': session_id})

    @staticmethod
    def _otp_error_response(exc):
        code = str(exc)
        if code == 'rate_limit':
            return Response(
                {'detail': 'Too many OTP requests. Try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        if code == 'email_not_configured':
            return Response(
                {'detail': 'Email delivery is not configured. Use SMS or contact an administrator.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if code in ('email_failed', 'sms_failed'):
            return Response(
                {'detail': 'Failed to send reset code. Try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {'detail': 'Failed to send reset code. Try again later.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_id = serializer.validated_data['otp_session']
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        payload = verify_otp_session(session_id, code)
        if not payload or payload.get('flow') != 'password_reset':
            log_auth_event(
                request, AuthAuditEvent.PASSWORD_FAILED,
                detail='Password reset: invalid or expired OTP',
            )
            return Response(
                {'detail': 'Invalid or expired OTP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=payload['user_id'])
        except (User.DoesNotExist, KeyError, TypeError):
            log_auth_event(
                request, AuthAuditEvent.PASSWORD_FAILED,
                detail='Password reset: user not found',
            )
            return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        log_auth_event(
            request, AuthAuditEvent.PASSWORD_RESET,
            user=user, username=user.username, detail='Password reset successful',
        )
        logger.info('Password reset for user %s', user.username)
        return Response({'detail': 'Password has been reset. You can log in now.'})
