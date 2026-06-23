from django.contrib.admin import AdminSite
from django.contrib.admin.forms import AdminAuthenticationForm
from django.core.exceptions import ValidationError


class SuperuserAuthenticationForm(AdminAuthenticationForm):
    def confirm_login_allowed(self, user):
        if not user.is_active:
            raise ValidationError(
                self.error_messages['inactive'],
                code='inactive',
            )
        if not user.is_superuser:
            raise ValidationError(
                'Only the superuser account can access Django admin. '
                'Use username admin (not staff or citizen).',
                code='invalid_login',
            )


class SuperuserOnlyAdminSite(AdminSite):
    login_form = SuperuserAuthenticationForm

    def has_permission(self, request):
        return (
            request.user.is_active
            and request.user.is_superuser
        )


admin_site = SuperuserOnlyAdminSite(name='admin')
