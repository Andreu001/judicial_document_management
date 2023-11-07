# users/views.py
from django.views.generic import CreateView
from django.urls import reverse_lazy
from .forms import CreationForm
from django.core.mail import send_mail


send_mail(
    'Тема письма',
    'Текст письма.',
    'from@example.com',
    ['to@example.com'],
    fail_silently=False,
)


class SignUp(CreateView):
    form_class = CreationForm
    success_url = reverse_lazy('business_card:index')
    template_name = 'users/signup.html'
