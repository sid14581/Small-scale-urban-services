import logging

from django.contrib.auth import authenticate
from django.contrib.auth.models import Group, User
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from scmgs.views.auth_views import AuthRateThrottle, set_jwt_cookies
from scmgs.models import UserProfile
from scmgs.services.otp_service import create_otp_session, verify_otp_session
from scmgs.serializers import UserRegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)


class LoginInitSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class RegisterInitSerializer(UserRegisterSerializer):
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta(UserRegisterSerializer.Meta):
        fields = UserRegisterSerializer.Meta.fields + ('phone', 'password_confirm')

    def validate_phone(self, value):
        value = value.strip()
        if not value.startswith('+') or len(value) < 10:
            raise serializers.ValidationError('Phone must be in E.164 format (e.g. +15551234567).')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs


class OtpVerifySerializer(serializers.Serializer):
    otp_session = serializers.CharField()
    code = serializers.CharField(min_length=4, max_length=8)


def _issue_jwt_response(user):
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    refresh_str = str(refresh)
    response = Response(UserSerializer(user).data, status=status.HTTP_200_OK)
    return set_jwt_cookies(response, access, refresh_str)


class LoginInitView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = LoginInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            phone = user.profile.phone
        except UserProfile.DoesNotExist:
            return Response(
                {'detail': 'No phone number on file. Contact an administrator.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session_id = create_otp_session(
                'login', phone, user_id=user.id, rate_subject=f'user:{user.id}',
            )
        except ValueError as exc:
            if str(exc) == 'rate_limit':
                return Response({'detail': 'Too many OTP requests. Try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            return Response({'detail': 'Failed to send OTP. Try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        logger.info('Login OTP initiated for user %s', username)
        return Response({'otp_session': session_id})


class RegisterInitView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = RegisterInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        data.pop('password_confirm', None)
        phone = data.pop('phone')
        password = data.pop('password')

        register_data = {**data, 'password': password}

        try:
            session_id = create_otp_session(
                'register',
                phone,
                register_data=register_data,
                rate_subject=f"register:{register_data['username']}",
            )
        except ValueError as exc:
            if str(exc) == 'rate_limit':
                return Response({'detail': 'Too many OTP requests. Try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            return Response({'detail': 'Failed to send OTP. Try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        logger.info('Register OTP initiated for phone %s', phone)
        return Response({'otp_session': session_id})


class OtpVerifyView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_id = serializer.validated_data['otp_session']
        code = serializer.validated_data['code']

        payload = verify_otp_session(session_id, code)
        if not payload:
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if payload['flow'] == 'login':
            try:
                user = User.objects.get(pk=payload['user_id'])
            except User.DoesNotExist:
                return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)
            logger.info('Login OTP verified for user %s', user.username)
            return _issue_jwt_response(user)

        if payload['flow'] == 'register':
            register_data = payload['register_data']
            phone = payload['phone']
            if User.objects.filter(username=register_data['username']).exists():
                return Response({'detail': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

            password = register_data.pop('password')
            user = User.objects.create_user(password=password, **register_data)
            group, _ = Group.objects.get_or_create(name='User')
            user.groups.add(group)
            UserProfile.objects.create(user=user, phone=phone)
            logger.info('Register OTP verified — user created: %s', user.username)
            return _issue_jwt_response(user)

        return Response({'detail': 'Invalid session.'}, status=status.HTTP_400_BAD_REQUEST)
