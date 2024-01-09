
from django.shortcuts import render
from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect
from django.urls import reverse


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            # Перенаправление на страницу после успешной авторизации
            return HttpResponseRedirect(reverse('user-profile'))
        else:
            # Логика для обработки ошибки входа
            return render(
                request,
                'login.html',
                {'error_message': 'Invalid credentials'}
                )
    else:
        return render(request, 'login.html')
