import csv
import logging

from django.contrib.auth.models import User
from django.core.cache import cache
from django.db.models import Count, Q
from django.http import HttpResponse
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from scmgs.auth_views import AuthRateThrottle
from scmgs.models import Complaint, ComplaintCategory, ComplaintStatus, FeedBack
from scmgs.permissions import IsStaff, IsStaffOrReadOwn, is_staff_member
from scmgs.serializers import (
    BulkComplaintStatusSerializer,
    ComplaintSerializer,
    ComplaintStatusSerializer,
    FeedBackSerializer,
    UserProfileUpdateSerializer,
    UserRegisterSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)
STATS_CACHE_KEY = 'complaint_stats'
STATS_CACHE_TTL = 60


def invalidate_stats_cache():
    cache.delete(STATS_CACHE_KEY)


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok'})


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def create(self, request, *args, **kwargs):
        logger.info(f"Registration attempt: {request.data.get('username')}")
        try:
            response = super().create(request, *args, **kwargs)
            logger.info(f"User registered: {response.data.get('username')}")
            return response
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            raise


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer
    permission_classes = [IsStaffOrReadOwn]

    def _apply_staff_filters(self, qs):
        category = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status')
        area = self.request.query_params.get('area')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if area:
            qs = qs.filter(area__icontains=area)
        if search:
            qs = qs.filter(
                Q(complain__icontains=search)
                | Q(area__icontains=search)
                | Q(address__icontains=search)
            )
        return qs

    def get_queryset(self):
        qs = Complaint.objects.select_related('submitted_by')
        user = self.request.user
        if is_staff_member(user):
            return self._apply_staff_filters(qs)
        return qs.filter(submitted_by=user)

    def get_serializer_class(self):
        if self.action == 'update_status':
            return ComplaintStatusSerializer
        return ComplaintSerializer

    def perform_create(self, serializer):
        super().perform_create(serializer)
        invalidate_stats_cache()

    @action(detail=True, methods=['patch'], permission_classes=[IsStaff], url_path='status')
    def update_status(self, request, pk=None):
        complaint = self.get_object()
        old_status = complaint.status
        serializer = ComplaintStatusSerializer(complaint, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        invalidate_stats_cache()
        logger.info(f"Complaint {complaint.reference_id} status updated: {old_status} -> {complaint.status}")
        return Response(ComplaintSerializer(complaint).data)

    @action(detail=False, methods=['patch'], permission_classes=[IsStaff], url_path='bulk-status')
    def bulk_status(self, request):
        serializer = BulkComplaintStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data['ids']
        new_status = serializer.validated_data['status']
        complaints = list(Complaint.objects.filter(id__in=ids))
        found_ids = {c.id for c in complaints}
        missing = [i for i in ids if i not in found_ids]
        updated = []
        failed = []
        for complaint in complaints:
            status_serializer = ComplaintStatusSerializer(
                complaint, data={'status': new_status}, partial=True
            )
            if status_serializer.is_valid():
                status_serializer.save()
                updated.append(complaint.id)
            else:
                failed.append({
                    'id': complaint.id,
                    'reference_id': complaint.reference_id,
                    'errors': status_serializer.errors,
                })
        if updated:
            invalidate_stats_cache()
        return Response({
            'updated': updated,
            'failed': failed,
            'missing': missing,
        })

    @action(detail=False, methods=['get'], permission_classes=[IsStaff], url_path='export')
    def export_csv(self, request):
        qs = self._apply_staff_filters(Complaint.objects.select_related('submitted_by'))
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="complaints.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'Reference ID', 'Category', 'Description', 'Phone', 'Address',
            'Area', 'Status', 'Submitted By', 'Created At',
        ])
        for complaint in qs:
            writer.writerow([
                complaint.reference_id,
                complaint.get_category_display(),
                complaint.complain,
                complaint.phone,
                complaint.address,
                complaint.area,
                complaint.get_status_display(),
                complaint.submitted_by.username if complaint.submitted_by else '',
                complaint.created_at.isoformat(),
            ])
        return response


class FeedBackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedBackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = FeedBack.objects.select_related('submitted_by')
        if is_staff_member(self.request.user):
            return qs
        return qs.filter(submitted_by=self.request.user)


class StatsView(APIView):
    permission_classes = [IsStaff]

    def _compute_stats(self):
        total = Complaint.objects.count()
        status_stats = Complaint.objects.values('status').annotate(count=Count('id'))
        by_status = {stat['status']: stat['count'] for stat in status_stats}
        category_stats = Complaint.objects.values('category').annotate(count=Count('id'))
        category_map = {cat: label for cat, label in ComplaintCategory.choices}
        by_category = [
            {'category': cat, 'label': category_map.get(cat, cat), 'count': count}
            for stat in category_stats
            for cat, count in [(stat['category'], stat['count'])]
        ]
        return {
            'total': total,
            'open': by_status.get(ComplaintStatus.OPEN, 0),
            'in_progress': by_status.get(ComplaintStatus.IN_PROGRESS, 0),
            'resolved': by_status.get(ComplaintStatus.RESOLVED, 0),
            'by_category': by_category,
        }

    def get(self, request):
        logger.info("Stats endpoint accessed")
        try:
            data = cache.get(STATS_CACHE_KEY)
            if data is None:
                data = self._compute_stats()
                cache.set(STATS_CACHE_KEY, data, STATS_CACHE_TTL)
            return Response(data)
        except Exception as e:
            logger.error(f"Stats retrieval failed: {str(e)}")
            raise
