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
]
