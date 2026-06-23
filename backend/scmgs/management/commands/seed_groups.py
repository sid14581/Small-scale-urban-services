from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand
from django.utils import timezone

from scmgs.models import UserProfile

SHARED_DEMO_PHONE = '+917729900077'


class Command(BaseCommand):
    help = 'Create User/Staff groups and optional demo accounts'

    DEMO_PHONES = {
        'admin': SHARED_DEMO_PHONE,
        'citizen': SHARED_DEMO_PHONE,
        'staff': SHARED_DEMO_PHONE,
    }

    def _ensure_profile(self, user, phone):
        UserProfile.objects.update_or_create(user=user, defaults={'phone': phone})

    def handle(self, *args, **options):
        for name in ('User', 'Staff'):
            group, created = Group.objects.get_or_create(name=name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created group: {name}'))

        staff_group = Group.objects.get(name='Staff')

        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@scms.local',
                'first_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin_user.set_password('Admin@1234')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        if admin_user.last_login is None:
            admin_user.last_login = timezone.now()
        admin_user.save()
        admin_user.groups.add(staff_group)
        self._ensure_profile(admin_user, self.DEMO_PHONES['admin'])
        if created:
            self.stdout.write('Created superuser admin (admin / Admin@1234)')
        else:
            self.stdout.write('Ensured superuser admin password (admin / Admin@1234)')

        if not User.objects.filter(username='citizen').exists():
            citizen = User.objects.create_user(
                username='citizen',
                password='demo1234',
                email='citizen@demo.com',
                first_name='Demo',
                last_login=timezone.now(),
            )
            citizen.groups.add(Group.objects.get(name='User'))
            self._ensure_profile(citizen, self.DEMO_PHONES['citizen'])
            self.stdout.write('Created demo citizen (citizen / demo1234)')

        if not User.objects.filter(username='staff').exists():
            staff = User.objects.create_user(
                username='staff',
                password='demo1234',
                email='staff@demo.com',
                first_name='Demo',
                last_login=timezone.now(),
            )
            staff.groups.add(staff_group)
            self._ensure_profile(staff, self.DEMO_PHONES['staff'])
            self.stdout.write('Created demo staff (staff / demo1234)')

        User.objects.filter(username='staff', is_superuser=False).update(is_staff=False)

        for username, phone in self.DEMO_PHONES.items():
            try:
                user = User.objects.get(username=username)
                self._ensure_profile(user, phone)
            except User.DoesNotExist:
                pass

        self.stdout.write(f'Demo OTP phone for admin/citizen/staff: {SHARED_DEMO_PHONE}')
