# audio_transcription/services.py
import os
import logging
import tempfile
import subprocess
import json
import re
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

logger = logging.getLogger(__name__)

_whisper_model = None


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        logger.info(f"Загрузка Whisper модели '{settings.WHISPER_MODEL_SIZE}' на {settings.WHISPER_DEVICE}...")
        _whisper_model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE
        )
        logger.info("Модель Whisper успешно загружена в память.")
    return _whisper_model


def format_time(seconds):
    if seconds is None:
        return "00:00:00"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def format_time_ms(seconds):
    """Форматирует секунды в ЧЧ:ММ:СС.МС"""
    if seconds is None:
        return "00:00:00.000"
    ms = int((seconds % 1) * 1000)
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def enhance_audio_for_whisper(audio_path):
    """Улучшает качество аудио перед распознаванием"""
    try:
        temp_audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        temp_audio.close()
        
        cmd = [
            'ffmpeg', '-i', audio_path,
            '-af', 'volume=20dB,afftdn=snr=20:noise=0.2:floor=0.1,highpass=f=80,lowpass=f=8000,compand=0.01|0.01:0.01|0.01:-70|-60|-50|-30:-20|-20|-20|-20',
            '-ac', '1',
            '-ar', '16000',
            temp_audio.name
        ]
        
        subprocess.run(cmd, capture_output=True, check=True)
        logger.info(f"Аудио улучшено: {temp_audio.name}")
        return temp_audio.name
        
    except Exception as e:
        logger.warning(f"Не удалось улучшить аудио: {e}. Используем оригинал.")
        return audio_path


def update_progress(transcription_id, progress, status_message=None):
    """Обновляет прогресс в модели и кэше"""
    from .models import AudioTranscription
    try:
        update_data = {
            'progress_percent': progress,
            'updated_at': timezone.now()
        }
        AudioTranscription.objects.filter(id=transcription_id).update(**update_data)
        cache.set(f'audio_progress_{transcription_id}', progress, 3600)
        if status_message:
            cache.set(f'audio_status_{transcription_id}', status_message, 3600)
        logger.debug(f"Прогресс {transcription_id}: {progress}%")
    except Exception as e:
        logger.error(f"Ошибка обновления прогресса: {e}")


def detect_speakers_from_text(segments):
    """
    Анализирует сегменты для определения говорящих.
    Использует различные эвристики для группировки реплик.
    """
    if not segments:
        return [], {}
    
    speakers = {}
    speaker_segments = []
    
    # Временные метки и текст для анализа
    for i, seg in enumerate(segments):
        text = seg.get('text', '').strip()
        if not text:
            continue
            
        start = seg.get('start', 0)
        end = seg.get('end', 0)
        
        # Проверяем, является ли текст репликой судьи (по ключевым словам)
        is_judge = any(keyword in text.lower() for keyword in [
            'суд постановил', 'суд определил', 'председательствующий',
            'разъясняет', 'объявляет', 'устанавливает личность',
            'оглашает', 'выясняет', 'сообщает'
        ])
        
        # Проверяем, является ли текст репликой прокурора
        is_prosecutor = any(keyword in text.lower() for keyword in [
            'поддерживаю', 'прошу суд', 'государственный обвинитель',
            'считаю необходимым', 'полагаю'
        ])
        
        # Проверяем, является ли текст репликой защитника
        is_defense = any(keyword in text.lower() for keyword in [
            'прошу оправдать', 'не согласен', 'защитник',
            'прошу назначить', 'прошу принять во внимание'
        ])
        
        # Проверяем, является ли текст репликой подсудимого
        is_defendant = any(keyword in text.lower() for keyword in [
            'вину признаю', 'не признаю', 'раскаиваюсь',
            'подсудимый', 'я не согласен', 'я прошу'
        ])
        
        # Проверяем, является ли текст репликой потерпевшего
        is_victim = any(keyword in text.lower() for keyword in [
            'потерпевший', 'потерпевшая', 'ущерб',
            'претензий не имею', 'прошу наказать'
        ])
        
        # Определяем роль на основе ключевых слов и контекста
        if is_judge:
            role = 'judge'
        elif is_prosecutor:
            role = 'prosecutor'
        elif is_defense:
            role = 'defense'
        elif is_defendant:
            role = 'defendant'
        elif is_victim:
            role = 'victim'
        else:
            # Если не удалось определить, используем speaker_id из whisper
            role = f'speaker_{seg.get("speaker_id", i % 3 + 1)}'
        
        speakers[role] = speakers.get(role, 0) + 1
        
        speaker_segments.append({
            'start': start,
            'end': end,
            'text': text,
            'role': role,
            'speaker_id': seg.get('speaker_id', None)
        })
    
    return speaker_segments, speakers


def process_audio_task(transcription_id):
    """Основная функция обработки: Аудио -> Структурированные данные -> DOCX"""
    from .models import AudioTranscription
    import json
    
    instance = AudioTranscription.objects.get(id=transcription_id)
    
    if instance.status == 'cancelled':
        logger.info(f"Задача {transcription_id} была отменена до начала обработки")
        return
    
    instance.status = 'processing'
    instance.processing_started_at = timezone.now()
    instance.progress_percent = 0
    instance.save(update_fields=['status', 'processing_started_at', 'progress_percent', 'updated_at'])
    logger.info(f"Начало обработки аудио {transcription_id}")

    audio_path = instance.audio_file.path
    
    try:
        # 1. Загрузка модели
        update_progress(transcription_id, 10, "Загрузка модели распознавания...")
        model = get_whisper_model()
        update_progress(transcription_id, 20, "Модель загружена, подготовка к распознаванию...")
        
        instance.refresh_from_db()
        if instance.status == 'cancelled':
            return
        
        # 2. Распознавание
        logger.info(f"Начало распознавания аудио: {audio_path}")
        update_progress(transcription_id, 25, "Распознавание речи...")
        
        segments_iter, info = model.transcribe(
            audio_path,
            language="ru",
            beam_size=5,
            best_of=5,
            temperature=[0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
            vad_filter=True,
            vad_parameters={
                "threshold": 0.5,
                "min_speech_duration_ms": 250,
                "min_silence_duration_ms": 100,
                "max_speech_duration_s": float('inf'),
            },
            condition_on_previous_text=True,
            no_speech_threshold=0.6,
        )
        
        instance.duration_seconds = int(info.duration)
        logger.info(f"Длительность аудио: {format_time(instance.duration_seconds)}")
        
        # Собираем все сегменты
        segments_list = []
        for seg in segments_iter:
            text = seg.text.strip()
            if text:
                segments_list.append({
                    'start': seg.start,
                    'end': seg.end,
                    'text': text,
                })
        
        total_segments = len(segments_list)
        logger.info(f"Всего сегментов для обработки: {total_segments}")
        
        # Обновляем прогресс по ходу обработки
        for i, seg in enumerate(segments_list):
            if i % 20 == 0:
                instance.refresh_from_db()
                if instance.status == 'cancelled':
                    return
                progress = 25 + int((i / max(total_segments, 1)) * 65)
                update_progress(transcription_id, min(progress, 90), 
                               f"Распознавание: {i+1}/{total_segments} сегментов")
        
        # 3. Анализ и определение говорящих
        update_progress(transcription_id, 90, "Анализ структуры диалога...")
        
        speaker_segments, speakers = detect_speakers_from_text(segments_list)
        instance.speaker_count = len(speakers)
        
        # 4. Формирование структурированных данных
        structured_data = {
            'transcription_id': transcription_id,
            'duration': instance.duration_seconds,
            'total_segments': len(speaker_segments),
            'speakers': speakers,
            'segments': speaker_segments,
            'raw_text': '\n'.join([s['text'] for s in speaker_segments])
        }
        
        instance.raw_text = structured_data['raw_text']
        # ВАЖНО: присваиваем напрямую
        instance.result_json = structured_data
        instance.progress_percent = 95
        
        # 5. Создание DOCX
        update_progress(transcription_id, 95, "Создание черновика протокола...")
        
        doc = create_protocol_document(instance, speaker_segments, speakers)
        
        # Сохраняем DOCX
        docx_filename = f"protocol_draft_{transcription_id}.docx"
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, docx_filename)
        doc.save(temp_path)
        
        update_progress(transcription_id, 98, "Сохранение документа...")
        
        instance.result_docx.save(docx_filename, open(temp_path, 'rb'), save=True)
        os.remove(temp_path)
        
        # 6. Завершение - ПРИНУДИТЕЛЬНОЕ СОХРАНЕНИЕ ВСЕХ ПОЛЕЙ
        instance.status = 'completed'
        instance.error_message = ''
        instance.progress_percent = 100
        # Сохраняем все поля, включая result_json
        instance.save()
        
        # Дополнительная проверка: если result_json не сохранился, пробуем через update
        if not instance.result_json:
            AudioTranscription.objects.filter(id=transcription_id).update(
                result_json=structured_data,
                speaker_count=len(speakers),
                updated_at=timezone.now()
            )
            logger.info(f"Принудительное обновление result_json для {transcription_id}")
        
        logger.info(f"Успешная обработка аудио {transcription_id}")
        update_progress(transcription_id, 100, "Готово!")

    except Exception as e:
        logger.exception(f"Ошибка при обработке аудио {transcription_id}: {str(e)}")
        instance.status = 'error'
        instance.error_message = str(e)[:1000]
        instance.save(update_fields=['status', 'error_message', 'updated_at'])
        cache.delete(f'audio_progress_{transcription_id}')
        cache.delete(f'audio_status_{transcription_id}')


def create_protocol_document(instance, speaker_segments, speakers):
    """
    Создает документ протокола с правильной структурой.
    """
    doc = Document()
    
    # Настройка стилей
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    paragraph_format = style.paragraph_format
    paragraph_format.line_spacing = 1.5
    paragraph_format.space_before = Pt(6)
    paragraph_format.space_after = Pt(6)
    
    # Заголовок протокола
    title = doc.add_heading('ПРОТОКОЛ СУДЕБНОГО ЗАСЕДАНИЯ', level=1)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in title.runs:
        run.font.color.rgb = RGBColor(255, 0, 0)
    
    # Информация о деле
    doc.add_paragraph('СУДЕБНОГО ЗАСЕДАНИЯ', style='Normal').alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Дата и место извлекаем из первого сегмента, если есть
    first_segment_text = speaker_segments[0]['text'] if speaker_segments else ''
    # Попытка извлечь дату из текста
    date_match = re.search(r'(\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})', first_segment_text)
    if date_match:
        date_str = date_match.group(1)
        doc.add_paragraph(f'{date_str} город [НАЗВАНИЕ ГОРОДА]', style='Normal').alignment = WD_ALIGN_PARAGRAPH.CENTER
    else:
        # Используем дату создания
        date_str = instance.created_at.strftime('%d %B %Y')
        date_str = date_str.replace('January', 'января').replace('February', 'февраля').replace('March', 'марта')
        date_str = date_str.replace('April', 'апреля').replace('May', 'мая').replace('June', 'июня')
        date_str = date_str.replace('July', 'июля').replace('August', 'августа').replace('September', 'сентября')
        date_str = date_str.replace('October', 'октября').replace('November', 'ноября').replace('December', 'декабря')
        doc.add_paragraph(f'{date_str} город [НАЗВАНИЕ ГОРОДА]', style='Normal').alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    doc.add_paragraph()
    
    # Информация о составе суда
    doc.add_paragraph('Судебное заседание открыто в 10 часов 00 минут.', style='Normal')
    doc.add_paragraph()
    
    doc.add_paragraph('_____________________________ суд _____________________________ области в составе:', style='Normal')
    doc.add_paragraph('председательствующего судьи [Ф.И.О. судьи],', style='Normal')
    doc.add_paragraph('при секретаре [Ф.И.О. секретаря],', style='Normal')
    doc.add_paragraph()
    
    doc.add_paragraph('с участием:', style='Normal')
    doc.add_paragraph('государственного обвинителя — [Ф.И.О. прокурора],', style='Normal')
    doc.add_paragraph('подсудимого [Ф.И.О. подсудимого],', style='Normal')
    doc.add_paragraph('защитника — адвоката [Ф.И.О. адвоката],', style='Normal')
    
    if 'victim' in speakers:
        doc.add_paragraph('потерпевшей/потерпевшего [Ф.И.О. потерпевшего],', style='Normal')
    
    doc.add_paragraph()
    
    # Разделитель
    doc.add_paragraph('_' * 80, style='Normal')
    doc.add_paragraph()
    
    # Основное содержание с разбивкой по участникам
    doc.add_heading('ХОД СУДЕБНОГО ЗАСЕДАНИЯ', level=2)
    
    # Группируем сегменты по ролям
    current_role = None
    role_names = {
        'judge': 'Председательствующий:',
        'prosecutor': 'Государственный обвинитель:',
        'defense': 'Защитник:',
        'defendant': 'Подсудимый:',
        'victim': 'Потерпевший/Потерпевшая:',
    }
    
    for seg in speaker_segments:
        role = seg.get('role', 'unknown')
        text = seg['text']
        start_time = seg.get('start', 0)
        
        # Показываем время для каждой реплики
        time_str = format_time_ms(start_time)
        
        # Определяем, какую роль отображать
        display_role = role_names.get(role, f'Участник {role}:')
        
        # Добавляем реплику с указанием роли
        p = doc.add_paragraph()
        p.add_run(f'[{time_str}] ').font.size = Pt(9)
        p.add_run(f'{display_role} ').bold = True
        p.add_run(f'{text}')
        
        # Добавляем пустую строку между разными ролями
        if current_role != role:
            current_role = role
    
    doc.add_paragraph()
    doc.add_paragraph('_' * 80, style='Normal')
    
    # Статистика по участникам
    doc.add_heading('СТАТИСТИКА РЕПЛИК', level=3)
    
    # Создаем таблицу со статистикой
    table = doc.add_table(rows=1, cols=3)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Заголовки таблицы
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'Участник'
    hdr_cells[1].text = 'Количество реплик'
    hdr_cells[2].text = 'Процент'
    
    role_names_display = {
        'judge': 'Судья',
        'prosecutor': 'Прокурор',
        'defense': 'Защитник',
        'defendant': 'Подсудимый',
        'victim': 'Потерпевший',
    }
    
    total = sum(speakers.values())
    for role, count in sorted(speakers.items(), key=lambda x: -x[1]):
        row_cells = table.add_row().cells
        row_cells[0].text = role_names_display.get(role, role)
        row_cells[1].text = str(count)
        row_cells[2].text = f'{round(count / total * 100, 1)}%'
    
    # Информация о длительности
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Общая длительность аудиозаписи: ').bold = True
    p.add_run(format_time(instance.duration_seconds))
    
    p2 = doc.add_paragraph()
    p2.add_run('Количество распознанных фрагментов: ').bold = True
    p2.add_run(str(len(speaker_segments)))
    
    p3 = doc.add_paragraph()
    p3.add_run('Статус: ').bold = True
    p3.add_run('Сформировано системой распознавания речи. Обязательна сверка с аудио и ручная корректировка!').italic = True
    
    return doc


def cancel_processing(transcription_id):
    """Отменяет обработку аудио"""
    from .models import AudioTranscription
    try:
        instance = AudioTranscription.objects.get(id=transcription_id)
        if instance.status in ['pending', 'processing']:
            instance.status = 'cancelled'
            instance.save(update_fields=['status', 'updated_at'])
            cache.delete(f'audio_progress_{transcription_id}')
            cache.delete(f'audio_status_{transcription_id}')
            logger.info(f"Задача {transcription_id} отменена пользователем")
            return True
        return False
    except AudioTranscription.DoesNotExist:
        return False


def get_protocol_structured_data(transcription_id):
    """Возвращает структурированные данные протокола для фронтенда"""
    from .models import AudioTranscription
    try:
        instance = AudioTranscription.objects.get(id=transcription_id)
        if instance.result_json:
            return instance.result_json
        return None
    except AudioTranscription.DoesNotExist:
        return None
