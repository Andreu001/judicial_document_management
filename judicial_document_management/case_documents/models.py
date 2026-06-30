from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.utils import timezone
import os
import logging

logger = logging.getLogger(__name__)


class DocumentTemplate(models.Model):
    """
    Модель для шаблонов документов. Управляется через админку.
    """
    CASE_CATEGORY_CHOICES = [
        ('criminal', 'Уголовные'),
        ('admin_offense', 'Административные правонарушения (КОАП)'),
        ('civil', 'Гражданские'),
        ('kas', 'Административное судопроизводство (КАС)'),
        ('common', 'Общие для всех'),
    ]
    case_category = models.CharField(
        max_length=20,
        choices=CASE_CATEGORY_CHOICES,
        verbose_name="Категория дела",
        help_text="Для какого типа дел предназначен этот шаблон"
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Название шаблона"
    )
    description = models.TextField(
        verbose_name="Описание",
        blank=True,
        help_text="Для чего нужен этот документ"
    )
    template_file = models.FileField(
        upload_to='document_templates/',
        verbose_name="Файл шаблона",
        blank=True,
        null=True,
        help_text="Загрузите файл шаблона (например, в формате .docx)"
    )
    is_active = models.BooleanField(
        verbose_name="Активен",
        default=True,
        help_text="Отображается ли этот шаблон для выбора"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Шаблон документа"
        verbose_name_plural = "Шаблоны документов"
        ordering = ['case_category', 'name']

    def __str__(self):
        return f"{self.get_case_category_display()}: {self.name}"


class CaseDocument(models.Model):
    """
    Модель для хранения СУДЕБНЫХ РЕШЕНИЙ/ПОСТАНОВЛЕНИЙ (документы, вынесенные судьей).
    Не изменяется!
    """
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'model__in': (
                'criminalproceedings',
                'administrativeproceedings',
                'civilproceedings',
                'kasproceedings'
            )
        },
        verbose_name="Тип дела"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('content_type', 'object_id')
    template = models.ForeignKey(
        DocumentTemplate,
        on_delete=models.PROTECT,
        related_name='documents',
        verbose_name="Шаблон документа"
    )
    title = models.CharField(
        max_length=500,
        verbose_name="Заголовок документа",
        help_text="Например: Постановление о назначении экспертизы по делу №123"
    )
    content = models.TextField(
        verbose_name="Содержимое документа",
        help_text="Текст документа. Здесь можно будет использовать HTML или другой формат."
    )
    generated_file = models.FileField(
        upload_to='generated_documents/%Y/%m/',
        verbose_name="Сгенерированный файл",
        blank=True, null=True,
        help_text="Файл, сгенерированный из шаблона (например, .docx или .pdf)"
    )
    DOCUMENT_STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('signed', 'Подписан'),
    ]
    status = models.CharField(
        max_length=10,
        choices=DOCUMENT_STATUS_CHOICES,
        default='draft',
        verbose_name="Статус"
    )
    signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Подписал",
        related_name='signed_documents'
    )
    signed_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Дата и время подписания"
    )
    signature_text = models.TextField(
        verbose_name="Текст подписи",
        blank=True,
        help_text="Сгенерированный текст подписи (например, с датой и ФИО)"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Создал",
        related_name='created_documents'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Судебный документ (решение/постановление)"
        verbose_name_plural = "Судебные документы (решения/постановления)"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def sign(self, user):
        if self.status == 'signed':
            return False, "Документ уже подписан."
        signature = f"\n\n---\nДокумент подписан: {user.get_full_name() or user.username}\nДата и время: {timezone.now().strftime('%d.%m.%Y %H:%M:%S')}"
        self.signature_text = signature
        self.content += signature
        self.status = 'signed'
        self.signed_by = user
        self.signed_at = timezone.now()
        self.save()
        return True, "Документ успешно подписан."


# ========== НОВАЯ МОДЕЛЬ ДЛЯ ДОКУМЕНТОВ СТОРОН (ПОСТУПАЮЩИЕ ДОКУМЕНТЫ) ==========

class PartyDocument(models.Model):
    """
    Модель для хранения документов, поступивших от сторон по делу.
    Это могут быть сканы исков, ходатайств, апелляций, кассаций, 
    возражений, отзывов и прочих документов, подаваемых участниками процесса.
    """
    
    # Типы документов сторон
    DOCUMENT_TYPE_CHOICES = [
        ('statement_of_claim', 'Исковое заявление'),
        ('statement_of_claim_amended', 'Уточненное исковое заявление'),
        ('counterclaim', 'Встречное исковое заявление'),
        ('petition', 'Ходатайство'),
        ('motion', 'Заявление'),
        ('objection', 'Возражение'),
        ('appeal', 'Апелляционная жалоба'),
        ('appeal_response', 'Отзыв на апелляционную жалобу'),
        ('cassation', 'Кассационная жалоба'),
        ('cassation_response', 'Отзыв на кассационную жалобу'),
        ('supervisory', 'Надзорная жалоба'),
        ('evidence', 'Доказательство'),
        ('expert_opinion', 'Заключение эксперта'),
        ('response', 'Отзыв на иск'),
        ('explanation', 'Пояснение'),
        ('reconciliation', 'Мировое соглашение'),
        ('other', 'Иной документ'),
    ]
    
    # Статус рассмотрения документа судом
    REVIEW_STATUS_CHOICES = [
        ('pending', 'Ожидает регистрации'),
        ('registered', 'Зарегистрирован в суде'),
        ('under_review', 'На рассмотрении судьи'),
        ('accepted', 'Приобщен к материалам дела'),
        ('rejected', 'Отказано в приобщении'),
        ('returned', 'Возвращен заявителю'),
        ('attached_to_case', 'Приобщен к материалам дела'),
    ]
    
    # Способ поступления
    SUBMISSION_METHOD_CHOICES = [
        ('online', 'Через портал (онлайн)'),
        ('paper', 'На бумажном носителе'),
        ('email', 'По электронной почте'),
        ('mail', 'Почтовым отправлением'),
        ('through_court', 'Через канцелярию суда'),
    ]
    
    # --- Связь с делом через GenericForeignKey ---
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'model__in': (
                'criminalproceedings',
                'administrativeproceedings',
                'civilproceedings',
                'kasproceedings'
            )
        },
        verbose_name="Тип дела"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('content_type', 'object_id')
    
    # --- Информация о документе ---
    document_type = models.CharField(
        max_length=50,
        choices=DOCUMENT_TYPE_CHOICES,
        verbose_name="Тип документа"
    )
    title = models.CharField(
        max_length=500,
        verbose_name="Заголовок документа",
        help_text="Например: Ходатайство о приобщении дополнительных доказательств"
    )
    description = models.TextField(
        verbose_name="Краткое описание",
        blank=True,
        help_text="Краткое содержание документа"
    )
    
    # --- Файл документа ---
    document_file = models.FileField(
        upload_to='party_documents/%Y/%m/',
        verbose_name="Файл документа",
        help_text="Загрузите файл документа (PDF, DOCX, JPG, PNG)"
    )
    file_name = models.CharField(max_length=255, verbose_name="Имя файла", blank=True)
    file_size = models.PositiveIntegerField(verbose_name="Размер файла (байт)", null=True, blank=True)
    
    # --- Кто подал документ ---
    # Для внешних пользователей (через Яндекс ID)
    external_user = models.ForeignKey(
        'side_case_access.ExternalUser',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Внешний пользователь",
        related_name='submitted_documents'
    )
    # Для внутренних сотрудников суда
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Сотрудник, загрузивший документ",
        related_name='submitted_party_documents'
    )
    # Информация о стороне (дениормализовано для удобства)
    submitter_name = models.CharField(
        max_length=255,
        verbose_name="Имя подателя",
        help_text="ФИО стороны, подавшей документ"
    )
    submitter_role = models.CharField(
        max_length=100,
        verbose_name="Роль подателя",
        blank=True,
        help_text="Например: Истец, Ответчик, Обвиняемый и т.д."
    )
    
    # --- Статус документа в суде ---
    review_status = models.CharField(
        max_length=30,
        choices=REVIEW_STATUS_CHOICES,
        default='pending',
        verbose_name="Статус рассмотрения"
    )
    
    # Регистрационные данные
    registration_number = models.CharField(
        max_length=100,
        verbose_name="Входящий номер",
        blank=True,
        help_text="Номер входящей корреспонденции суда"
    )
    registration_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Дата регистрации"
    )
    
    # Дата фактической подачи (может отличаться от даты регистрации)
    submission_date = models.DateTimeField(
        default=timezone.now,
        verbose_name="Дата подачи"
    )
    
    # Способ подачи
    submission_method = models.CharField(
        max_length=30,
        choices=SUBMISSION_METHOD_CHOICES,
        default='online',
        verbose_name="Способ подачи"
    )
    
    # --- Решение судьи по документу ---
    judge_decision = models.TextField(
        verbose_name="Решение судьи",
        blank=True,
        help_text="Решение судьи по данному документу (например: Приобщить к материалам дела)"
    )
    judge_decision_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Дата принятия решения"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Судья, принявший решение",
        related_name='reviewed_documents'
    )
    
    # --- Для апелляций/кассаций: связь с обжалуемым решением ---
    appealed_document = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Обжалуемый документ/решение",
        help_text="Для апелляций/кассаций - ссылка на обжалуемый документ или решение"
    )
    
    # --- Примечания ---
    internal_notes = models.TextField(
        verbose_name="Внутренние заметки суда",
        blank=True,
        help_text="Только для сотрудников суда"
    )
    
    # --- Метаданные ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания записи")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    
    class Meta:
        verbose_name = "Документ стороны (поступающий)"
        verbose_name_plural = "Документы сторон (поступающие)"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["review_status"]),
            models.Index(fields=["document_type"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["registration_number"]),
            models.Index(fields=["submission_date"]),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_document_type_display()}: {self.title} ({self.get_review_status_display()})"
    
    def save(self, *args, **kwargs):
        # Сохраняем имя файла и размер при сохранении
        if self.document_file and not self.file_name:
            self.file_name = self.document_file.name
            if self.document_file.size:
                self.file_size = self.document_file.size
        super().save(*args, **kwargs)
    
    def register_document(self, registration_number, user):
        """Регистрация документа в суде (присвоение входящего номера)"""
        from django.utils import timezone
        
        self.registration_number = registration_number
        self.registration_date = timezone.now()  # Используем timezone.now(), а не просто дату
        self.review_status = 'registered'
        # Не забываем сохранить reviewed_by (кто зарегистрировал)
        self.reviewed_by = user
        self.judge_decision_date = timezone.now()
        self.judge_decision = f"Документ зарегистрирован с входящим номером {registration_number}"
        self.save()
        return True
    
    def accept_to_case(self, judge, decision_text=None):
        """Принятие документа к приобщению к материалам дела"""
        self.review_status = 'accepted'
        self.reviewed_by = judge
        self.judge_decision_date = timezone.now()
        if decision_text:
            self.judge_decision = decision_text
        else:
            self.judge_decision = "Документ приобщен к материалам дела."
        self.save()
        
        # ДОБАВИТЬ: Создаем активность об изменении статуса
        try:
            from notifications.activity_service import CaseActivityService
            if self.case:
                CaseActivityService.create_activity(
                    case=self.case,
                    activity_type='document_status_changed',
                    title=f"Статус документа изменен",
                    description=f"Документ '{self.title}' приобщен к материалам дела",
                    related_object=self
                )
        except Exception as e:
            logger.error(f"Ошибка создания активности: {e}")
        
        return True
    
    def reject_attachment(self, judge, reason):
        """Отказ в приобщении документа"""
        self.review_status = 'rejected'
        self.reviewed_by = judge
        self.judge_decision_date = timezone.now()
        self.judge_decision = f"Отказано в приобщении. Причина: {reason}"
        self.save()
        return True
    
    def return_to_submitter(self, judge, reason):
        """Возврат документа заявителю"""
        self.review_status = 'returned'
        self.reviewed_by = judge
        self.judge_decision_date = timezone.now()
        self.judge_decision = f"Возвращено заявителю. Причина: {reason}"
        self.save()
        return True
    
    @property
    def can_be_downloaded_by_submitter(self):
        """Может ли податель скачать документ (всегда да для своих документов)"""
        return True
    
    @property
    def is_official_court_document(self):
        """Это официальный судебный документ? (Нет, это документ стороны)"""
        return False


class PartyDocumentHistory(models.Model):
    """
    История изменения статуса документа стороны.
    """
    document = models.ForeignKey(
        PartyDocument,
        on_delete=models.CASCADE,
        related_name='history_entries'
    )
    previous_status = models.CharField(
        max_length=30,
        verbose_name="Предыдущий статус"
    )
    new_status = models.CharField(
        max_length=30,
        verbose_name="Новый статус"
    )
    changed_by = models.CharField(
        max_length=255,
        verbose_name="Кто изменил"
    )
    comment = models.TextField(verbose_name="Комментарий", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "История документа стороны"
        verbose_name_plural = "История документов сторон"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.document} - {self.previous_status} -> {self.new_status}"