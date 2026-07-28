# audio_transcription/tasks.py
from celery import shared_task
from .services import process_audio_task, cancel_processing
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=2)
def transcribe_audio_task(self, transcription_id):
    try:
        process_audio_task(transcription_id)
    except Exception as e:
        from .models import AudioTranscription
        try:
            instance = AudioTranscription.objects.get(id=transcription_id)
            if instance.status == 'cancelled':
                logger.info(f"Задача {transcription_id} была отменена")
                return "Task was cancelled"
        except:
            pass
        # Повторяем через 10 секунд
        raise self.retry(exc=e, countdown=10)

@shared_task
def cancel_audio_task(transcription_id):
    """Отменяет задачу по распознаванию"""
    return cancel_processing(transcription_id)
