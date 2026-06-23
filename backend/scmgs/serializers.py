import re

from django.contrib.auth.models import Group, User
from django.core.validators import EmailValidator
from rest_framework import serializers

from scmgs.models import Complaint, ComplaintCategory, ComplaintStatus, FeedBack, UserProfile

_email_validator = EmailValidator()


def validate_password_strength(value):
    if len(value) < 8:
        raise serializers.ValidationError('Password must be at least 8 characters.')
    if not re.search(r'[A-Z]', value):
        raise serializers.ValidationError('Password must contain at least one uppercase letter.')
    if not re.search(r'[a-z]', value):
        raise serializers.ValidationError('Password must contain at least one lowercase letter.')
    if not re.search(r'\d', value):
        raise serializers.ValidationError('Password must contain at least one digit.')
    return value


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'password', 'phone')
        extra_kwargs = {'email': {'required': True}}

    def validate_username(self, value):
        value = value.strip()
        if len(value) > 30:
            raise serializers.ValidationError('Username must be 30 characters or fewer.')
        return value

    def validate_email(self, value):
        value = value.strip()
        _email_validator(value)
        return value

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate_phone(self, value):
        if value:
            value = value.strip()
            if not value.startswith('+') or len(value) < 10:
                raise serializers.ValidationError('Phone must be in E.164 format (e.g. +15551234567).')
        return value

    def create(self, validated_data):
        phone = validated_data.pop('phone', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        group, _ = Group.objects.get_or_create(name='User')
        user.groups.add(group)
        if phone:
            UserProfile.objects.create(user=user, phone=phone)
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'role', 'phone')

    def get_phone(self, obj):
        try:
            return obj.profile.phone
        except UserProfile.DoesNotExist:
            return None

    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        if obj.groups.filter(name='Staff').exists():
            return 'staff'
        return 'citizen'


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'email')
        extra_kwargs = {'email': {'required': False}}


class BulkComplaintStatusSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(min_value=1), min_length=1)
    status = serializers.ChoiceField(choices=ComplaintStatus.choices)


class ComplaintSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True)

    class Meta:
        model = Complaint
        fields = (
            'id', 'reference_id', 'category', 'category_display',
            'complain', 'phone', 'address', 'link', 'area', 'attachment',
            'status', 'status_display', 'submitted_by', 'submitted_by_username',
            'created_at', 'updated_at',
        )
        read_only_fields = ('reference_id', 'submitted_by', 'created_at', 'updated_at')

    def validate_phone(self, value):
        # E.164-like format: optional +, optional 1, 9-15 digits
        if not re.match(r'^\+?1?\d{9,15}$', value.strip()):
            raise serializers.ValidationError("Phone number must be in valid format (e.g., +1-234-567-8900 or 9876543210)")
        return value.strip()

    def validate_complain(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Complaint description must be at least 10 characters.")
        if len(value) > 500:
            raise serializers.ValidationError("Complaint description must not exceed 500 characters.")
        return value

    def validate_area(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Area is required.")
        if len(value) > 100:
            raise serializers.ValidationError("Area must not exceed 100 characters.")
        return value

    def validate_link(self, value):
        if value:
            value = value.strip()
            if value.startswith('data:') or value.startswith('javascript:'):
                raise serializers.ValidationError("Invalid URL scheme.")
        return value

    def validate_attachment(self, value):
        if value:
            # Max 5MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("File size must not exceed 5MB.")
            # Allowed MIME types
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError("Only JPEG, PNG, WebP, and PDF files are allowed.")
        return value

    def create(self, validated_data):
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)


class ComplaintStatusSerializer(serializers.ModelSerializer):
    ALLOWED_TRANSITIONS = {
        ComplaintStatus.OPEN: {ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED},
        ComplaintStatus.IN_PROGRESS: {ComplaintStatus.RESOLVED},
        ComplaintStatus.RESOLVED: set(),
    }

    class Meta:
        model = Complaint
        fields = ('status',)

    def validate_status(self, value):
        instance = self.instance
        if instance and value != instance.status:
            allowed = self.ALLOWED_TRANSITIONS.get(instance.status, set())
            if value not in allowed:
                raise serializers.ValidationError(
                    f"Cannot transition from '{instance.status}' to '{value}'."
                )
        return value


class FeedBackSerializer(serializers.ModelSerializer):
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True)

    class Meta:
        model = FeedBack
        fields = ('id', 'problem', 'comment', 'submitted_by', 'submitted_by_username', 'created_at')
        read_only_fields = ('submitted_by', 'created_at')

    def create(self, validated_data):
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)
