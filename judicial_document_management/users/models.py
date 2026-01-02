from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.contrib.auth.hashers import make_password


class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username must be set')

        email = self.normalize_email(email) if email else None
        user = self.model(username=username, email=email, **extra_fields)

        if password:
            user.password = make_password(password)

        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    USER_ROLES = (
        ('admin', 'Администратор'),
        ('judge', 'Судья'),
        ('secretary', 'Секретарь'),
        ('lawyer', 'Адвокат'),
        ('citizen', 'Гражданин'),
    )

    SUBJECT_LEVELS = (
        ('magistrate', 'Мировой суд'),
        ('city_district', 'Городской/районный суд'),
        ('subject_level', 'Суд уровня субъекта'),
    )

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    middle_name = models.CharField(max_length=150, blank=True)

    role = models.CharField(max_length=20, choices=USER_ROLES, default='citizen')
    phone = models.CharField(max_length=15, blank=True)
    court = models.CharField(max_length=100, blank=True)
    bar_association = models.CharField(max_length=100, blank=True)
    subject_level = models.CharField(max_length=20,
                                     choices=SUBJECT_LEVELS,
                                     blank=True,
                                     verbose_name='Уровень субъекта')

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return f'{self.first_name} {self.last_name}' if self.first_name else self.username

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def get_short_name(self):
        return self.first_name
