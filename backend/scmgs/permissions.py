from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_staff_member(user):
    return (
        user
        and user.is_authenticated
        and (user.is_superuser or user.groups.filter(name='Staff').exists())
    )


class IsStaff(BasePermission):
    def has_permission(self, request, view):
        return is_staff_member(request.user)


class IsCitizen(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name='User').exists()
        )


class IsStaffOrReadOwn(BasePermission):
    """Staff sees all; citizens see/create only their own complaints."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if is_staff_member(request.user):
            return True
        if request.method in SAFE_METHODS:
            return obj.submitted_by == request.user
        return obj.submitted_by == request.user
