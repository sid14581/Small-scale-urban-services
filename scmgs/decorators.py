
from django.shortcuts import redirect


def unauthenticated_user(view_func):
    def wrapper_func(request, *arg, **kwargs):
        if request.user.is_authenticated:
            return redirect('/sub1')

        else:
            return view_func(request, *arg, **kwargs)

    return wrapper_func

def unauthenticated_staff(view_func):
    def wrapper_func(request, *arg, **kwargs):
        if request.user.is_authenticated:
            return redirect('/sub0')

        else:
            return view_func(request, *arg, **kwargs)

    return wrapper_func

def staff_only(view_func):
    def wrapper_function(request, *args, **kwargs):
        group = None
        if request.user.groups.exists():
            group = request.user.groups.all()[0].name

        if group == 'User':
            return redirect('/sub1')

        if group == 'Staff':
            return view_func(request, *args, **kwargs)

    return wrapper_function
