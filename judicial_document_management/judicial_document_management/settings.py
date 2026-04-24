from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-jy6dbh^$(!jm=ld4&i0sggl!1@*@&t8!lj2=7va!3531m&z@%o'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '[::1]',
    'testserver',
    'web',
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'administrative_code',
    'administrative_proceedings',
    'business_card.apps.BusinessCardConfig',
    'civil_proceedings',
    'criminal_proceedings.apps.CriminalProceedingsConfig',
    'rest_framework',
    'rest_framework.authtoken',
    'core',
    'users',
    'corsheaders',
    'djoser',
    'notifications',
    'case_registry.apps.CaseRegistryConfig',
    'django_filters',
    'personnel',
    'legal_documents',
    'search',
    'case_documents',
    'other_materials',
    'case_management',
    'statistics_app',
    'social_django',
    'citizen_access',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
]

ROOT_URLCONF = 'judicial_document_management.urls'

TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [TEMPLATES_DIR],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'judicial_document_management.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'ru'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]


LOGIN_URL = 'users:login'

EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'

EMAIL_FILE_PATH = os.path.join(BASE_DIR, 'sent_emails')

POSTS_NUMBER = 6
# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

X_FRAME_OPTIONS = 'ALLOWALL'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Замените этот URL на ваш фронтенд URL
    # Другие разрешенные источники...
]

CORS_ALLOW_ALL_ORIGINS = True  # Временно разрешаем все источники.

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CSRF_USE_SESSIONS = False  # Необходимо, чтобы дать

APPEND_SLASH = True

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # 'rest_framework.permissions.IsAuthenticated',
    ),
}

DJOSER = {
    'SERIALIZERS': {
        'user_create': 'users.serializers.UserCreateSerializer',
        'user': 'users.serializers.UserSerializer',
        'current_user': 'users.serializers.UserSerializer',
        'token_create': 'djoser.serializers.TokenCreateSerializer',
    },
    'PERMISSIONS': {
        'user': ['rest_framework.permissions.IsAuthenticated'],
        'user_list': ['rest_framework.permissions.IsAdminUser'],
    },
    'HIDE_USERS': False,
        'SOCIAL_AUTH_ALLOWED_REDIRECT_URIS': [
        'http://localhost:3000/social-login/complete/vk/',      # Адрес вашего фронтенда для VK
        'http://localhost:3000/social-login/complete/yandex/', # Адрес вашего фронтенда для Yandex
    ],
}

REST_AUTH_TOKEN_MODEL = 'rest_framework.authtoken.models.Token'

NOTIFICATIONS_TARGETS = [
    {
        "app_label": "criminal_proceedings",
        "model": "CriminalProceedings",
        "human_name": "Уголовное судопроизводство",
        # поля даты которые надо отслеживать (заполни по реальным названиям моделях)
        "date_fields": ["hearing_date", "decision_date", "copy_sent_date"],
        # можно задать глобальные фильтры для queryset (опционально)
        "filters": {},
    },

    {
        "app_label": "civil_proceedings",
        "model": "CivilProceedings",
        "human_name": "Гражданское судопроизводство",
        # поля даты которые надо отслеживать (заполни по реальным названиям моделях)
        "date_fields": ["hearing_date", "decision_date", "copy_sent_date"],
        # можно задать глобальные фильтры для queryset (опционально)
        "filters": {},
    },
]

# Настройки для загрузки файлов
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Ограничения на размер загружаемых файлов (например, 50MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB

# Поддерживаемые форматы файлов
ALLOWED_UPLOAD_EXTENSIONS = ['.pdf', '.doc', '.docx']

# Настройки логирования
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'level': 'INFO',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'notifications.log',
            'formatter': 'verbose',
            'level': 'DEBUG',
        },
    },
    'loggers': {
        'notifications': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# Настройки для TinyMCE
TINYMCE_DEFAULT_CONFIG = {
    'height': 600,
    'width': '100%',
    'menubar': True,
    'plugins': 'advlist autolink lists link image charmap print preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
    'toolbar': 'undo redo | formatselect | bold italic underline strikethrough | fontselect fontsizeselect | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
    'content_css': '//www.tiny.cloud/css/codepen.min.css',
}

# Настройки для mammoth (конвертация Word)
MAMMOTH_CUSTOM_STYLES = {
    'p[style-name="Heading 1"]': 'h1',
    'p[style-name="Heading 2"]': 'h2',
    'p[style-name="Heading 3"]': 'h3',
    'p[style-name="Title"]': 'h1.title',
    'p[style-name="Subtitle"]': 'h2.subtitle',
}

AUTHENTICATION_BACKENDS = (
    'social_core.backends.vk.VKOAuth2',          # Бэкенд для VK
    'social_core.backends.yandex.YandexOAuth2',  # Бэкенд для Yandex
    'django.contrib.auth.backends.ModelBackend',
)

SOCIAL_AUTH_VK_OAUTH2_KEY = 'ВАШ_CLIENT_ID_VK'
SOCIAL_AUTH_VK_OAUTH2_SECRET = 'ВАШ_CLIENT_SECRET_VK'
# Для VK нужно запросить доступ к email пользователя
SOCIAL_AUTH_VK_OAUTH2_SCOPE = []

# ========== НАСТРОЙКИ YANDEX OAUTH ==========
SOCIAL_AUTH_YANDEX_OAUTH2_KEY = '7ae23a1626884d3e8fb7399c3f1dc630'
SOCIAL_AUTH_YANDEX_OAUTH2_SECRET = 'e70c4567a8db4a53945610e0873688c4'
SOCIAL_AUTH_YANDEX_OAUTH2_SCOPE = ['login:info', 'login:email']

# Получение данных пользователя
SOCIAL_AUTH_YANDEX_OAUTH2_EXTRA_DATA = [
    ('id', 'id'),
    ('login', 'login'),
    ('default_email', 'email'),
    ('real_name', 'fullname'),
    ('first_name', 'first_name'),
    ('last_name', 'last_name'),
    ('display_name', 'display_name'),
    ('sex', 'sex'),
    ('birthday', 'birthday'),
]

# Версия API
SOCIAL_AUTH_YANDEX_OAUTH2_API_VERSION = '1'

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

SOCIAL_AUTH_LOGIN_REDIRECT_URL = '/citizen/oauth-callback/'
SOCIAL_AUTH_LOGIN_ERROR_URL = '/citizen/login-error/'

LOGIN_REDIRECT_URL = '/citizen/dashboard/'

SOCIAL_AUTH_REDIRECT_IS_HTTPS = False
SOCIAL_AUTH_URL_NAMESPACE = 'social'

SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.social_auth.associate_by_email',
    'social_core.pipeline.user.create_user',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
    'citizen_access.pipeline.save_social_id',
    'citizen_access.pipeline.set_citizen_role',
    'citizen_access.pipeline.auto_verify_from_yandex',
)