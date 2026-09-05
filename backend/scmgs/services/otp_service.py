import logging
import random
import uuid

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail

from scmgs.models import AuthAuditEvent
from scmgs.services.audit_logger import log_auth_event

logger = logging.getLogger(__name__)

OTP_TTL = 600  # 10 minutes


def _otp_rate_limit():
    return getattr(settings, 'OTP_RATE_LIMIT', 3)


def _otp_rate_window():
    return getattr(settings, 'OTP_RATE_WINDOW', 900)


def _twilio_credentials():
    return (
        getattr(settings, 'TWILIO_ACCOUNT_SID', '') or '',
        getattr(settings, 'TWILIO_AUTH_TOKEN', '') or '',
    )


def _use_twilio_verify():
    account_sid, auth_token = _twilio_credentials()
    verify_sid = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', '') or ''
    return bool(account_sid and auth_token and verify_sid)


def is_email_configured():
    return bool(getattr(settings, 'EMAIL_HOST', '') or '')


def _cache_key(session_id):
    return f'otp:session:{session_id}'


def _rate_key(subject):
    return f'otp:rate:{subject}'


def generate_otp_code():
    return f'{random.randint(0, 999999):06d}'


def check_rate_limit(subject, *, username=''):
    key = _rate_key(subject)
    count = cache.get(key, 0)
    if count >= _otp_rate_limit():
        log_auth_event(
            None, AuthAuditEvent.OTP_FAILED,
            username=username, detail=f'Rate limit exceeded for {subject}',
        )
        return False
    cache.set(key, count + 1, _otp_rate_window())
    return True


def send_verify_otp(phone):
    account_sid, auth_token = _twilio_credentials()
    verify_sid = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', '')

    try:
        from twilio.rest import Client

        client = Client(account_sid, auth_token)

        # Cancel pending verifications so Twilio sends a fresh code (not the same one)
        try:
            pending = client.verify.v2.services(verify_sid).verifications.list(to=phone, limit=10)
            for verification in pending:
                if verification.status == 'pending':
                    client.verify.v2.services(verify_sid).verifications(
                        verification.sid,
                    ).update(status='canceled')
                    logger.info('Canceled pending Verify OTP for %s', phone)
        except Exception as cancel_exc:
            logger.warning('Could not cancel pending Verify OTP for %s: %s', phone, cancel_exc)

        verification = client.verify.v2.services(verify_sid).verifications.create(
            to=phone,
            channel='sms',
        )
        logger.info('Twilio Verify OTP sent to %s (status=%s)', phone, verification.status)
        return True
    except Exception as exc:
        logger.error('Twilio Verify send failed for %s: %s', phone, exc)
        return False


def check_verify_otp(phone, code):
    account_sid, auth_token = _twilio_credentials()
    verify_sid = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', '')

    try:
        from twilio.rest import Client

        client = Client(account_sid, auth_token)
        result = client.verify.v2.services(verify_sid).verification_checks.create(
            to=phone,
            code=str(code).strip(),
        )
        return result.status == 'approved'
    except Exception as exc:
        logger.error('Twilio Verify check failed for %s: %s', phone, exc)
        return False


def send_sms_otp(phone, code):
    account_sid, auth_token = _twilio_credentials()
    from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '') or ''

    if not all([account_sid, auth_token, from_number]):
        logger.warning('Twilio not configured — OTP for %s: %s', phone, code)
        return True

    if from_number == phone:
        logger.warning(
            'TWILIO_PHONE_NUMBER must be your Twilio sender number, not the recipient. '
            'OTP for %s: %s',
            phone,
            code,
        )
        return True

    try:
        from twilio.rest import Client

        client = Client(account_sid, auth_token)
        client.messages.create(
            body=f'Your SCMS verification code is: {code}',
            from_=from_number,
            to=phone,
        )
        logger.info('SMS OTP sent to %s', phone)
        return True
    except Exception as exc:
        logger.error('Failed to send SMS OTP to %s: %s — fallback OTP: %s', phone, exc, code)
        return True


def send_email_otp(email, code):
    if not is_email_configured():
        logger.error('EMAIL_HOST not configured — cannot send OTP to %s', email)
        return False

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '') or 'noreply@scms.local'
    try:
        send_mail(
            subject='SCMS password reset code',
            message=f'Your SCMS password reset code is: {code}\n\nThis code expires in 10 minutes.',
            from_email=from_email,
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info('Email OTP sent to %s', email)
        return True
    except Exception as exc:
        logger.error('Failed to send email OTP to %s: %s', email, exc)
        return False


def create_otp_session(
    flow,
    phone='',
    *,
    user_id=None,
    register_data=None,
    rate_subject=None,
    channel='sms',
    email='',
):
    """Create an OTP session.

    channel: 'sms' (default, Twilio) or 'email' (django send_mail).
    Email channel is used for password_reset; login/register keep SMS.
    """
    channel = (channel or 'sms').lower()
    if channel not in ('sms', 'email'):
        raise ValueError('invalid_channel')

    subject = rate_subject or (f'user:{user_id}' if user_id else (email or phone))
    username = ''
    if user_id:
        from django.contrib.auth.models import User
        username = User.objects.filter(pk=user_id).values_list('username', flat=True).first() or ''
    elif register_data:
        username = register_data.get('username', '')

    if not check_rate_limit(subject, username=username):
        raise ValueError('rate_limit')

    if channel == 'email':
        if not email:
            raise ValueError('email_required')
        if not is_email_configured():
            raise ValueError('email_not_configured')
        use_verify = False
        code = generate_otp_code()
    else:
        if not phone:
            raise ValueError('phone_required')
        use_verify = _use_twilio_verify()
        code = None if use_verify else generate_otp_code()

    session_id = uuid.uuid4().hex
    payload = {
        'code': code,
        'verify': use_verify,
        'flow': flow,
        'channel': channel,
        'phone': phone or '',
        'email': email or '',
        'user_id': user_id,
        'register_data': register_data,
    }
    cache.set(_cache_key(session_id), payload, OTP_TTL)

    if channel == 'email':
        if not send_email_otp(email, code):
            cache.delete(_cache_key(session_id))
            raise ValueError('email_failed')
    elif use_verify:
        if not send_verify_otp(phone):
            cache.delete(_cache_key(session_id))
            raise ValueError('sms_failed')
    elif not send_sms_otp(phone, code):
        cache.delete(_cache_key(session_id))
        raise ValueError('sms_failed')

    log_auth_event(
        None, AuthAuditEvent.OTP_SENT,
        username=username,
        detail=f'{flow} OTP session created via {channel}',
    )
    return session_id


def verify_otp_session(session_id, code):
    payload = cache.get(_cache_key(session_id))
    if not payload:
        return None

    if payload.get('verify'):
        if not check_verify_otp(payload['phone'], code):
            return None
    elif payload['code'] != str(code).strip():
        return None

    cache.delete(_cache_key(session_id))
    return payload
