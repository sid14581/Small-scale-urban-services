"""Siddu716_project URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from scmgs import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.fourth, name='home'),
    path('admin', admin.site.urls),

    path('second', views.second),
    path('e_register', views.e_register),
    path('third', views.third),
    path('E_third', views.E_third),

    path('sub0', views.sub0),
    path('sub1', views.sub1),
    path('sub2', views.sub2),
    path('sub3', views.sub3),
    path('sub4', views.sub4),
    path('sub5', views.sub5),
    path('sub6', views.sub6),

    path('success', views.success),    
    path('feedback', views.feedback),
    path('view_fb', views.view_fb),
    path('success1', views.success1),

    path('A_show', views.A_show),
    path('E_show', views.E_show),
    path('R_show', views.R_show),
    path('S_show', views.S_show),
    path('W_show', views.W_show),
    path("O_show", views.O_show),
    path('logout',views.logout)   


]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
