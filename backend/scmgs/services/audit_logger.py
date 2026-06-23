import logging

from scmgs.models import AuthAuditLog

logger = logging.getLogger(__name__)


def _client_ip(request):
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_auth_event(request, event_type, *, username='', user=None, detail=''):
    ip_address = _client_ip(request)
    try:
        AuthAuditLog.objects.create(
            event_type=event_type,
            username=username or (user.username if user else ''),
            user=user,
            ip_address=ip_address,
            detail=detail[:255],
        )
    except Exception as exc:
        logger.error('Failed to write auth audit log (%s): %s', event_type, exc)
