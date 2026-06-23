from django.conf import settings
from django.test import SimpleTestCase


class DatabaseSettingsTests(SimpleTestCase):
    def test_conn_max_age_configured(self):
        self.assertEqual(settings.DATABASES['default'].get('CONN_MAX_AGE'), 600)


class CacheSettingsTests(SimpleTestCase):
    def test_default_cache_backend_configured(self):
        backend = settings.CACHES['default']['BACKEND']
        self.assertIn(
            backend,
            (
                'django.core.cache.backends.locmem.LocMemCache',
                'django_redis.cache.RedisCache',
            ),
        )

    def test_redis_url_setting_exists(self):
        self.assertTrue(hasattr(settings, 'REDIS_URL'))

    def test_redis_conditional_uses_matching_backend(self):
        if settings.REDIS_URL:
            self.assertEqual(
                settings.CACHES['default']['BACKEND'],
                'django_redis.cache.RedisCache',
            )
            self.assertEqual(settings.CACHES['default']['LOCATION'], settings.REDIS_URL)
        else:
            self.assertEqual(
                settings.CACHES['default']['BACKEND'],
                'django.core.cache.backends.locmem.LocMemCache',
            )
