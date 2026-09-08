from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from scmgs.views.api_views import (
    AuditLogListView,
    ComplaintViewSet,
    FeedBackViewSet,
    HealthView,
    ProfileView,
    RegisterView,
    StatsView,
)
from scmgs.views.auth_views import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView
from scmgs.views.otp_views import LoginInitView, OtpVerifyView, RegisterInitView
from scmgs.views.password_views import PasswordChangeView, PasswordForgotView, PasswordResetView
from scmgs.views.staff_views import StaffDetailView, StaffListCreateView, StaffResetCredentialsView

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
    path('auth/password/change/', PasswordChangeView.as_view(), name='api_password_change'),
    path('auth/password/forgot/', PasswordForgotView.as_view(), name='api_password_forgot'),
    path('auth/password/reset/', PasswordResetView.as_view(), name='api_password_reset'),
    path('admin/staff/', StaffListCreateView.as_view(), name='api_admin_staff_list'),
    path('admin/staff/<int:pk>/', StaffDetailView.as_view(), name='api_admin_staff_detail'),
    path(
        'admin/staff/<int:pk>/reset-credentials/',
        StaffResetCredentialsView.as_view(),
        name='api_admin_staff_reset_credentials',
    ),
    path('stats/', StatsView.as_view(), name='api_stats'),
    path('audit-logs/', AuditLogListView.as_view(), name='api_audit_logs'),
    path('', include(router.urls)),
]
