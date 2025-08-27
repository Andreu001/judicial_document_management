from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_ROLES = (
        ('admin', 'Администратор'),
        ('judge', 'Судья'),
        ('secretary', 'Секретарь'),
        ('lawyer', 'Адвокат'),
        ('citizen', 'Гражданин'),
    )
    
    role = models.CharField(max_length=20, choices=USER_ROLES, default='citizen')
    phone = models.CharField(max_length=15, blank=True)
    court = models.CharField(max_length=100, blank=True)
    bar_association = models.CharField(max_length=100, blank=True)
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return f'{self.first_name} {self.last_name}' if self.first_name else self.username