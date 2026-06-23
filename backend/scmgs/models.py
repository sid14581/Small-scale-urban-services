import uuid

from django.contrib.auth.models import User
from django.db import models


class ComplaintCategory(models.TextChoices):
    AIR_POLLUTION = 'air_pollution', 'Air Pollution'
    ELECTRICITY = 'electricity', 'Electricity'
    ROAD = 'road', 'Road Construction'
    SEWAGE = 'sewage', 'Sewage & Water Logging'
    WASTE = 'waste', 'Waste Management'
    OTHERS = 'others', 'Others'


class ComplaintStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    IN_PROGRESS = 'in_progress', 'In Progress'
    RESOLVED = 'resolved', 'Resolved'


class Complaint(models.Model):
    reference_id = models.CharField(max_length=12, unique=True, editable=False, blank=True)
    category = models.CharField(max_length=20, choices=ComplaintCategory.choices)
    complain = models.CharField(max_length=500)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    link = models.URLField(max_length=500, blank=True, default='')
    area = models.CharField(max_length=100)
    attachment = models.FileField(upload_to='complaints/', blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=ComplaintStatus.choices,
        default=ComplaintStatus.OPEN,
    )
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaints',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['submitted_by']),
        ]

    def save(self, *args, **kwargs):
        if not self.reference_id:
            self.reference_id = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.reference_id} - {self.get_category_display()}'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, db_index=True)

    def __str__(self):
        return f'{self.user.username} ({self.phone})'


class FeedBack(models.Model):
    problem = models.CharField(max_length=50)
    comment = models.CharField(max_length=1000)
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.problem
