from scmgs.views.api_views import (
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

__all__ = [
    'ComplaintViewSet',
    'FeedBackViewSet',
    'HealthView',
    'ProfileView',
    'RegisterView',
    'StatsView',
    'CookieTokenObtainPairView',
    'CookieTokenRefreshView',
    'LogoutView',
    'LoginInitView',
    'OtpVerifyView',
    'RegisterInitView',
    'PasswordChangeView',
    'PasswordForgotView',
    'PasswordResetView',
    'StaffDetailView',
    'StaffListCreateView',
    'StaffResetCredentialsView',
]
