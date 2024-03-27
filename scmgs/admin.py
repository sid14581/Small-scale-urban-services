from django.contrib import admin
from .models import *


# Register your models here.

class mydata1(admin.ModelAdmin):
    list_display = ('complain', 'phone', 'address', 'link')

class mydata2(admin.ModelAdmin):
    list_display = ('problem','comment')


admin.site.register(Upload1, mydata1)

admin.site.register(Upload2, mydata1)

admin.site.register(Upload3, mydata1)

admin.site.register(Upload4, mydata1)

admin.site.register(Upload5, mydata1)

admin.site.register(Upload6, mydata1)

admin.site.register(FeedBack, mydata2)