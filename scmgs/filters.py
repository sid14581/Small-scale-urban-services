import django_filters 
from django_filters import CharFilter
from .models import *

class Upload1Filter(django_filters.FilterSet):
    area = CharFilter(field_name='area', lookup_expr='icontains')

    class Meta:
        model = Upload1
        fields = ['area',]

class Upload2Filter(django_filters.FilterSet):
    area = CharFilter(field_name='area', lookup_expr='icontains')

    class Meta:
        model = Upload2
        fields = ['area',]

class Upload3Filter(django_filters.FilterSet):
    area = CharFilter(field_name='area', lookup_expr='icontains')

    class Meta:
        model = Upload2
        fields = ['area',]

class Upload4Filter(django_filters.FilterSet):
    area = CharFilter(field_name='area', lookup_expr='icontains')

    class Meta:
        model = Upload2
        fields = ['area',]

class Upload5Filter(django_filters.FilterSet):
    area = CharFilter(field_name='area', lookup_expr='icontains')

    class Meta:
        model = Upload5
        fields = ['area',]

class Upload6Filter(django_filters.FilterSet):
    area = CharFilter(field_name='area', lookup_expr='icontains')

    class Meta:
        model = Upload6
        fields = ['area',]