from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from scmgs.api_views import (
    ComplaintViewSet,
    FeedBackViewSet,
    HealthView,
    ProfileView,
    RegisterView,
    StatsView,
)
from scmgs.auth_views import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView
from scmgs.otp_views import LoginInitView, OtpVerifyView, RegisterInitView

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'feedback', FeedBackViewSet, basename='feedback')

urlpatterns = [
    path('health/', HealthView.as_view(), name='api_health'),
    path('schema/', SpectacularAPIView.as_view(), name='api_schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='api_schema'), name='api_docs'),
    path('auth/register/', RegisterView.as_view(), name='api_register'),
    path('auth/register/init/', RegisterInitView.as_view(), name='api_register_init'),
    path('auth/login/', CookieTokenObtainPairView.as_view(), name='api_login'),
    path('auth/login/init/', LoginInitView.as_view(), name='api_login_init'),
    path('auth/otp/verify/', OtpVerifyView.as_view(), name='api_otp_verify'),
    path('auth/refresh/', CookieTokenRefreshView.as_view(), name='api_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='api_logout'),
    path('auth/profile/', ProfileView.as_view(), name='api_profile'),
    path('stats/', StatsView.as_view(), name='api_stats'),
    path('', include(router.urls)),
]
