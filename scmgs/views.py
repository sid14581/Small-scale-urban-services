from django.shortcuts import render, redirect
from scmgs.form import *
from scmgs.models import *
from django.contrib.auth.models import User, auth
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .decorators import unauthenticated_user, staff_only, unauthenticated_staff
from django.contrib.auth.models import Group
from .filters import *


def logout(request):
    auth.logout(request)
    return redirect('home')

def home(request):
    if request.method == "GET":
        return render(request, 'HOME_PAGE.html')
    
#@unauthenticated_user
def second(request):
    if request.method == "POST":
        first_name = request.POST['first_name']
        email = request.POST['email']
        username = request.POST['username']
        password1 = request.POST['password1']
        password2 = request.POST['password2']

        if password1 == password2:

            if User.objects.filter(username=username).exists():
                messages.info(request, "USER ALREADY EXISTS.")
                return redirect('/second')

            elif User.objects.filter(email=email).exists():
                messages.info(request, "EMAIL ALREADY EXISTS.")
                return redirect('/second')

            else:
                user = User.objects.create_user(username=username, password=password1, email=email,
                                                first_name=first_name)
                user.save()
                group = Group.objects.get(name='User')
                user.groups.add(group)

                return redirect('/third')

        else:
            messages.info(request, "PASSWORD NOT MATCHING.")
            return redirect('/second')

    else:
        return render(request, 'Register.html')



#@unauthenticated_staff
def e_register(request):
    if request.method == "POST":
        first_name = request.POST['first_name']
        email = request.POST['email']

        username = request.POST['username']
        password1 = request.POST['password1']
        password2 = request.POST['password2']

        if password1 == password2:

            if User.objects.filter(username=username).exists():
                messages.info(request, "USER ALREADY EXISTS.")
                return redirect('/e_register')

            elif User.objects.filter(email=email).exists():
                messages.info(request, "EMAIL ALREADY EXISTS.")
                return redirect('/e_register')

            else:
                user = User.objects.create_user(username=username, password=password1, email=email,
                                                first_name=first_name)
                user.is_staff = True
                user.save()
                group = Group.objects.get(name='Staff')
                user.groups.add(group)

                return redirect('/E_third')

        else:
            messages.info(request, "PASSWORD NOT MATCHING.")
            return redirect('/e_register')

    else:
        return render(request, 'E_Register.html')



#@unauthenticated_user
def third(request):
    if request.method == "POST":

        username = request.POST['username']
        password = request.POST['password']

        user = auth.authenticate(username=username, password=password)

        if user is not None:
            auth.login(request, user)
            return redirect("/sub1")

        else:
            messages.info(request, "INVALID CREDENTIALS.")
            return redirect("/third")

    else:
        return render(request, 'Login.html')



#@unauthenticated_staff
def E_third(request):
    if request.method == "POST":

        username = request.POST['username']
        password = request.POST['password']

        user = auth.authenticate(username=username, password=password)

        if user is not None:
            auth.login(request, user)
            return redirect("/sub0")

        else:
            messages.info(request, "INVALID CREDENTIALS.")
            return  redirect("/E_third")
    else:
        return render(request, 'E_Login.html')




def fourth(request):
    if request.method == "GET":
        return render(request, 'SCMS.html')


@login_required(login_url="/E_third")
@staff_only
def sub0(request):
    if request.method == "GET":
        return render(request, 'Employee_view.html')



@login_required(login_url="/third")
def sub1(request):
    if request.method == "POST":
        form = Upload1Form(request.POST)
        if form.is_valid():
            try:
                form.save()
                return redirect("/success")
            except:
                pass

    else:
        form = Upload1Form()

    return render(request, "Complain.html", {'form': form})



@login_required(login_url="/third")
def success(request):
    if request.method == "GET":
        return render(request, 'Acknowledge.html')




@login_required(login_url="/third")
def sub2(request):
    if request.method == "POST":

        form = Upload2Form(request.POST)
        if form.is_valid():
            try:
                form.save()
                return redirect("/success")
            except:
                pass

    else:
        form = Upload2Form()

    return render(request, "Complain.html", {'form': form})



@login_required(login_url="/third")
def sub3(request):
    if request.method == "POST":

        form = Upload3Form(request.POST)
        if form.is_valid():
            try:
                form.save()
                return redirect("/success")

            except:
                pass

    else:
        form = Upload3Form()

    return render(request, "Complain.html", {'form': form})



@login_required(login_url="/third")
def sub4(request):
    if request.method == "POST":

        form = Upload4Form(request.POST)
        if form.is_valid():
            try:
                form.save()
                return redirect("/success")
            except:
                pass

    else:
        form = Upload4Form()

    return render(request, "Complain.html", {'form': form})



@login_required(login_url="/third")
def sub5(request):
    if request.method == "POST":

        form = Upload5Form(request.POST)
        if form.is_valid():
            try:
                form.save()
                return redirect("/success")
            except:
                pass

    else:
        form = Upload5Form()

    return render(request, "Complain.html", {'form': form})


@login_required(login_url="/third")
def sub6(request):
    if request.method == "POST":

        form = Upload6Form(request.POST)
        if form.is_valid():
            try:
                form.save()
                return redirect("/success")
            except:
                pass

    else:
        form = Upload6Form()

    return render(request, "Complain.html", {'form': form})



@login_required(login_url="/third")
def success1(request):
    if request.method == "GET":
        return render(request, 'fb_Acknowledge.html')



@login_required(login_url="/E_third")
@staff_only
def A_show(request):
    if request.method == "GET":
        results1 = Upload1.objects.all()
        myFilters1 = Upload1Filter(request.GET, queryset=results1)
        results1 = myFilters1.qs
        return render(request, "A_show.html", {'results1': results1,'myFilters1':myFilters1})



@login_required(login_url="/E_third")
@staff_only
def E_show(request):
    if request.method == "GET":
        results2 = Upload2.objects.all()
        myFilters2 = Upload2Filter(request.GET, queryset=results2)
        results2 = myFilters2.qs
        return render(request, "E_show.html", {'results2': results2,'myFilters2':myFilters2})



@login_required(login_url="/E_third")
@staff_only
def R_show(request):
    if request.method == "GET":
        results3 = Upload3.objects.all()
        myFilters3 = Upload3Filter(request.GET, queryset=results3)
        results3 = myFilters3.qs
        return render(request, "R_show.html", {'results3': results3, 'myFilters3':myFilters3})




@login_required(login_url="/E_third")
@staff_only
def S_show(request):
    if request.method == "GET":
        results4 = Upload4.objects.all()
        myFilters4 = Upload4Filter(request.GET, queryset=results4)
        results4 = myFilters4.qs
        return render(request, "S_show.html", {'results4': results4, 'myFilters4':myFilters4})



@login_required(login_url="/E_third")
@staff_only
def W_show(request):
    if request.method == "GET":
        results5 = Upload5.objects.all()
        myFilters5 = Upload5Filter(request.GET, queryset=results5)
        results5 = myFilters5.qs
        return render(request, "W_show.html", {'results5': results5,'myFilters5':myFilters5})


@login_required(login_url="/E_third")
@staff_only
def O_show(request):
    if request.method == "GET":
        results6 = Upload6.objects.all()
        myFilters6 = Upload6Filter(request.GET, queryset=results6)
        results6 = myFilters6.qs
        return render(request, "O_show.html", {'results6': results6,'myFilters6':myFilters6})


@login_required(login_url="/third")
def feedback(request):
    if request.method == "POST":

        form = FeedBackForm(request.POST)
        if form.is_valid():
            try:
                form.save()
                return redirect("/success1")
            except:
                pass

    else:
        form = FeedBackForm()

    return render(request, "feedback.html", {'form': form})




@login_required(login_url="/E_third")
@staff_only
def view_fb(request):
    if request.method == "GET":
        fbs = FeedBack.objects.all()

        return render(request,"View_FB.html",{'fbs':fbs})
