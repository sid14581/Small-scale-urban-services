from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from scmgs.models import AuthAuditEvent
from scmgs.services.audit_logger import log_auth_event


ACCESS_COOKIE = 'access_token'
REFRESH_COOKIE = 'refresh_token'


class AuthRateThrottle(AnonRateThrottle):
    rate = '5/minute'


def _cookie_kwargs(max_age):
    return {
        'httponly': True,
        'secure': not settings.DEBUG,
        'samesite': 'Lax',
        'max_age': max_age,
    }


def set_jwt_cookies(response, access, refresh):
    response.set_cookie(ACCESS_COOKIE, access, **_cookie_kwargs(60 * 60))
    response.set_cookie(REFRESH_COOKIE, refresh, **_cookie_kwargs(7 * 24 * 60 * 60))
    return response


def clear_jwt_cookies(response):
    response.delete_cookie(ACCESS_COOKIE)
    response.delete_cookie(REFRESH_COOKIE)
    return response


class CookieTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            set_jwt_cookies(response, response.data['access'], response.data['refresh'])
        return response


class CookieTokenRefreshView(TokenRefreshView):
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        refresh = request.data.get('refresh') or request.COOKIES.get(REFRESH_COOKIE)
        if not refresh:
            log_auth_event(request, AuthAuditEvent.LOGIN_FAILED, detail='Refresh token missing')
            return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={'refresh': refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            log_auth_event(request, AuthAuditEvent.LOGIN_FAILED, detail='Invalid refresh token')
            raise

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        set_jwt_cookies(response, serializer.validated_data['access'], refresh)
        try:
            user = User.objects.get(pk=RefreshToken(refresh)['user_id'])
            log_auth_event(
                request, AuthAuditEvent.TOKEN_REFRESH,
                user=user, username=user.username, detail='Token refreshed',
            )
        except (User.DoesNotExist, KeyError):
            log_auth_event(request, AuthAuditEvent.TOKEN_REFRESH, detail='Token refreshed')
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({'detail': 'Logged out.'})
        return clear_jwt_cookies(response)
