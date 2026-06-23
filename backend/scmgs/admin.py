from django.contrib import admin

from scmgs.admin_site import admin_site
from scmgs.models import Complaint, FeedBack


class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        'reference_id', 'category', 'complain', 'area', 'status',
        'submitted_by', 'created_at',
    )
    list_filter = ('category', 'status', 'created_at')
    search_fields = ('reference_id', 'complain', 'phone', 'area')
    readonly_fields = ('reference_id', 'created_at', 'updated_at')


class FeedBackAdmin(admin.ModelAdmin):
    list_display = ('problem', 'comment', 'submitted_by', 'created_at')
    search_fields = ('problem', 'comment')


admin_site.register(Complaint, ComplaintAdmin)
admin_site.register(FeedBack, FeedBackAdmin)
