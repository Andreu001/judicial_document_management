from pathlib import Path
import os

os.environ['OMP_NUM_THREADS'] = '4'
os.environ['MKL_NUM_THREADS'] = '4'

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
    'side_case_access',
    'judge_assistant',
    'legal_codes',
    'court_registry',
    'communication',
    'channels',
    'case_distribution.apps.CaseDistributionConfig',
    'audio_transcription',
]

ASGI_APPLICATION = 'judicial_document_management.asgi.application'
CHANNEL_LAYERS = {

    "default": {

        "BACKEND":
            "channels.layers.InMemoryChannelLayer",

    },
}

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

# Настройки Celery для Windows
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Europe/Moscow'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 минут
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 минут

CELERY_WORKER_POOL = 'solo'  # Windows не поддерживает prefork
CELERY_WORKER_CONCURRENCY = 1  # Для Windows лучше 1

WSGI_APPLICATION = 'judicial_document_management.wsgi.application'

# Настройки для нашего модуля
WHISPER_MODEL_SIZE = 'small'  # 'small' - лучший баланс качества русского и скорости
WHISPER_DEVICE = 'cpu'        # Если есть видеокарта NVIDIA, поставь 'cuda'
WHISPER_COMPUTE_TYPE = 'int8' # Оптимизация для CPU

# Увеличиваем лимит загрузки файлов (аудио могут быть весомыми)
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600

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



# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
    BASE_DIR / 'static' / 'admin_custom',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'


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
        'side_case_access.auth.ExternalUserAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
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

# Добавьте в конец settings.py

# Настройки логирования для отслеживания прогресса
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
            'filename': 'audio_transcription.log',
            'formatter': 'verbose',
            'level': 'DEBUG',
        },
    },
    'loggers': {
        'audio_transcription': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
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

SOCIAL_AUTH_LOGIN_REDIRECT_URL = '/side_case/oauth-callback/'
SOCIAL_AUTH_LOGIN_ERROR_URL = '/side_case/login-error/'

LOGIN_REDIRECT_URL = '/side_case/dashboard/'

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
    'side_case_access.pipeline.save_social_id',
    'side_case_access.pipeline.set_side_case_role',
    'side_case_access.pipeline.auto_verify_from_yandex',
)

EXTERNAL_USER_MODEL = 'side_case_access.ExternalUser'

SOCIAL_AUTH_USER_MODEL = 'side_case_access.ExternalUser'

ADMIN_SITE_HEADER = "Судебная система - Администрирование"
ADMIN_SITE_TITLE = "Панель управления"
ADMIN_INDEX_TITLE = "Добро пожаловать в систему управления"


LANGUAGE_CODE = 'ru-ru'  # Изменено с 'ru' на 'ru-ru'
TIME_ZONE = 'Europe/Moscow'  # Изменено с 'UTC' на 'Europe/Moscow'
USE_I18N = True
USE_TZ = True

# Для отображения дат в русском формате
USE_L10N = True

# Настройка форматов дат
DATE_FORMAT = 'd.m.Y'
DATETIME_FORMAT = 'd.m.Y H:i'
SHORT_DATE_FORMAT = 'd.m.Y'
SHORT_DATETIME_FORMAT = 'd.m.Y H:i'
