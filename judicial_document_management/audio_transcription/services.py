# audio_transcription/services.py

import os
import logging

# Пути к DLL FFmpeg 8.1.2 и PyTorch
_FFMPEG_DLL_DIR = r"C:\ffmpeg-8.1.2-shared\bin"
_TORCH_DLL_DIR = r"D:\Dev_2\venv\Lib\site-packages\torch\lib"

# Дескрипторы необходимо сохранять в глобальной переменной,
# иначе Windows может отключить регистрацию DLL.
_DLL_HANDLES = []

for _dll_dir in (_FFMPEG_DLL_DIR, _TORCH_DLL_DIR):
    if os.path.isdir(_dll_dir):
        _DLL_HANDLES.append(os.add_dll_directory(_dll_dir))
        os.environ["PATH"] = (
            _dll_dir + os.pathsep + os.environ.get("PATH", "")
        )
    else:
        raise FileNotFoundError(
            f"Не найдена директория DLL: {_dll_dir}"
        )

# Ограничиваем число потоков CPU
from django.conf import settings

_CPU_THREADS = max(1, int(getattr(settings, "GIGAAM_CPU_THREADS", 4)))

os.environ.setdefault("OMP_NUM_THREADS", str(_CPU_THREADS))
os.environ.setdefault("MKL_NUM_THREADS", str(_CPU_THREADS))
os.environ.setdefault("OPENBLAS_NUM_THREADS", str(_CPU_THREADS))

# Только теперь импортируем библиотеки, использующие DLL
import tempfile
import json
import re
import torchaudio
import numpy as np
import torch
import subprocess

from pathlib import Path
from django.core.cache import cache
from django.utils import timezone
from django.core.files import File

from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

logger = logging.getLogger(__name__)

_gigaam_model = None

def load_audio_via_ffmpeg(audio_path, target_sr=16000):
    """Декодирование аудио через ffmpeg CLI, обход torchcodec/torchaudio."""
    cmd = [
        "ffmpeg", "-i", audio_path,
        "-f", "s16le", "-acodec", "pcm_s16le",
        "-ac", "1", "-ar", str(target_sr),
        "-"
    ]
    proc = subprocess.run(cmd, capture_output=True, check=True)
    audio = np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    waveform = torch.from_numpy(audio).unsqueeze(0)  # (1, time)
    return waveform, target_sr


def get_gigaam_model():
    """Ленивая загрузка GigaAM-v3 напрямую из Hugging Face.

    Этот способ не использует проблемный CDN opensmodel.sberdevices.ru.
    Модель и её код загружаются из официальной карточки ai-sage/GigaAM-v3.
    """
    global _gigaam_model, _gigaam_model_name

    if _gigaam_model is not None:
        return _gigaam_model

    model_name = getattr(settings, "GIGAAM_MODEL_NAME", "v3_e2e_ctc")
    hf_repo = getattr(settings, "GIGAAM_HF_REPO", "ai-sage/GigaAM-v3")
    # Для v3_e2e_ctc используем ветку e2e_ctc репозитория Hugging Face.
    revision = getattr(settings, "GIGAAM_HF_REVISION", None)
    if not revision:
        revision = model_name.replace("v3_", "", 1)

    hf_token = getattr(settings, "HF_TOKEN", "")
    if hf_token:
        # Longform VAD использует токен для доступа к pyannote/segmentation-3.0.
        os.environ["HF_TOKEN"] = hf_token
        os.environ.setdefault("HUGGINGFACEHUB_API_TOKEN", hf_token)

    try:
        import torch
        torch.set_num_threads(_CPU_THREADS)
        try:
            torch.set_num_interop_threads(max(1, min(4, _CPU_THREADS)))
        except RuntimeError:
            pass
    except ImportError as exc:
        raise RuntimeError(
            "PyTorch не установлен в окружении Django/Celery."
        ) from exc

    try:
        from transformers import AutoModel
    except ImportError as exc:
        raise RuntimeError(
            "Не установлен transformers. Выполните: "
            "python -m pip install transformers==4.57.1"
        ) from exc

    logger.info(
        "Загрузка GigaAM-v3 из Hugging Face: repo=%s, revision=%s, CPU threads=%s",
        hf_repo, revision, _CPU_THREADS
    )

    try:
        _gigaam_model = AutoModel.from_pretrained(
            hf_repo,
            revision=revision,
            trust_remote_code=True,
            token=hf_token or None,
        )
        # У пользователя CPU-only компьютер; явно оставляем модель на CPU.
        _gigaam_model.to("cpu")
        _gigaam_model.eval()
    except Exception as exc:
        _gigaam_model = None
        raise RuntimeError(
            f"Не удалось загрузить GigaAM из Hugging Face ({hf_repo}, "
            f"revision={revision}). Проверьте доступность huggingface.co, "
            f"установку transformers и зависимости модели. Исходная ошибка: {exc}"
        ) from exc

    _gigaam_model_name = f"{hf_repo}@{revision}"
    logger.info("GigaAM успешно загружена из Hugging Face: %s", _gigaam_model_name)
    return _gigaam_model


def _read_segment_value(segment, *names, default=None):
    """Читает поле из dict или объекта сегмента разных версий GigaAM."""
    for name in names:
        if isinstance(segment, dict) and name in segment:
            return segment[name]
        if hasattr(segment, name):
            return getattr(segment, name)
    return default


def _normalise_gigaam_segments(utterances):
    """Приводит результат longform GigaAM к единому формату start/end/text.

    Поддерживает актуальный объектный API (segment.start/end/text) и
    прежний словарный API (transcription/boundaries).
    """
    segments = []
    for item in utterances or []:
        text = _read_segment_value(item, "text", "transcription", default="")
        text = str(text or "").strip()
        if not text:
            continue

        boundaries = _read_segment_value(item, "boundaries", default=None)
        start = _read_segment_value(item, "start", default=None)
        end = _read_segment_value(item, "end", default=None)

        if (start is None or end is None) and boundaries is not None:
            try:
                start, end = boundaries[0], boundaries[1]
            except (TypeError, IndexError, KeyError):
                start, end = 0.0, 0.0

        try:
            start = max(0.0, float(start or 0.0))
            end = max(start, float(end or start))
        except (TypeError, ValueError):
            start, end = 0.0, 0.0

        segments.append({"start": start, "end": end, "text": text})

    return segments


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
    """Предварительно определяет процессуальную роль по текстовым маркерам.

    Важно: это НЕ диаризация. GigaAM longform сегментирует речь по паузам,
    но сама по себе не устанавливает, какой человек произнёс конкретную реплику.
    Поэтому неизвестным репликам не присваиваются вымышленные speaker_1/2/3.
    """
    if not segments:
        return [], {}

    speakers = {}
    speaker_segments = []

    role_keywords = {
        "judge": [
            "суд постановил", "суд определил", "председательствующий",
            "разъясняет", "объявляет", "устанавливает личность",
            "оглашает", "выясняет", "сообщает"
        ],
        "prosecutor": [
            "поддерживаю", "прошу суд", "государственный обвинитель",
            "считаю необходимым", "полагаю"
        ],
        "defense": [
            "прошу оправдать", "не согласен", "защитник",
            "прошу назначить", "прошу принять во внимание"
        ],
        "defendant": [
            "вину признаю", "не признаю", "раскаиваюсь",
            "подсудимый", "я не согласен", "я прошу"
        ],
        "victim": [
            "потерпевший", "потерпевшая", "ущерб",
            "претензий не имею", "прошу наказать"
        ],
    }

    for seg in segments:
        text = str(seg.get("text", "")).strip()
        if not text:
            continue

        lower_text = text.lower()
        role = "other"
        for candidate_role, keywords in role_keywords.items():
            if any(keyword in lower_text for keyword in keywords):
                role = candidate_role
                break

        speakers[role] = speakers.get(role, 0) + 1
        speaker_segments.append({
            "start": float(seg.get("start", 0) or 0),
            "end": float(seg.get("end", 0) or 0),
            "text": text,
            "role": role,
            # GigaAM longform не возвращает идентификатор говорящего.
            "speaker_id": None,
        })

    return speaker_segments, speakers


def process_audio_task(transcription_id):
    """Обработка аудио: GigaAM longform -> JSON -> DOCX."""
    from .models import AudioTranscription

    instance = AudioTranscription.objects.get(id=transcription_id)
    if instance.status == "cancelled":
        logger.info("Задача %s отменена до начала обработки", transcription_id)
        return

    if not instance.audio_file:
        raise ValueError("Для расшифровки не прикреплён аудиофайл.")

    instance.status = "processing"
    instance.processing_started_at = timezone.now()
    instance.progress_percent = 0
    instance.error_message = ""
    instance.save(update_fields=[
        "status", "processing_started_at", "progress_percent",
        "error_message", "updated_at"
    ])

    temp_path = None
    try:
        audio_path = instance.audio_file.path
        if not os.path.isfile(audio_path):
            raise FileNotFoundError(f"Аудиофайл не найден: {audio_path}")

        update_progress(transcription_id, 10, "Загрузка GigaAM...")
        model = get_gigaam_model()
        model_name = _gigaam_model_name or getattr(
            settings, "GIGAAM_MODEL_NAME", "v3_e2e_ctc"
        )

        instance.refresh_from_db()
        if instance.status == "cancelled":
            return

        # Вызов longform блокирующий. У GigaAM нет callback прогресса по процентам,
        # поэтому не показываем искусственный рост процента во время инференса.
        update_progress(transcription_id, 25, "GigaAM распознаёт аудиозапись. Это может занять время...")
        logger.info("Начало GigaAM longform: id=%s, file=%s", transcription_id, audio_path)

        utterances = model.transcribe_longform(audio_path)

                # Преобразуем результат GigaAM в единый формат,
        # который используется остальной частью приложения.
        segments_list = []

        logger.info(
            "Результат GigaAM: type=%s, количество элементов=%s",
            type(utterances).__name__,
            len(utterances) if utterances is not None else 0
        )

        if not utterances:
            raise ValueError("GigaAM не вернула ни одного сегмента распознавания.")

        for index, item in enumerate(utterances):
            try:
                # Формат Hugging Face GigaAM-v3:
                # {"transcription": "...", "boundaries": (start, end)}
                if isinstance(item, dict):
                    text = item.get("transcription", item.get("text", ""))
                    boundaries = item.get("boundaries")

                    if boundaries is not None and len(boundaries) >= 2:
                        start = float(boundaries[0])
                        end = float(boundaries[1])
                    else:
                        start = float(item.get("start", 0.0))
                        end = float(item.get("end", 0.0))

                else:
                    # Поддержка варианта, возвращающего объекты
                    # с атрибутами start, end и text.
                    text = getattr(item, "text", "")
                    start = float(getattr(item, "start", 0.0))
                    end = float(getattr(item, "end", 0.0))

                text = str(text).strip()

                if not text:
                    continue

                if end < start:
                    raise ValueError(
                        f"Некорректные границы сегмента: {start} - {end}"
                    )

                segments_list.append({
                    "start": start,
                    "end": end,
                    "text": text,
                })

            except Exception:
                logger.exception(
                    "Ошибка преобразования сегмента GigaAM №%s: %r",
                    index,
                    item
                )
                raise

        if not segments_list:
            raise ValueError(
                "После преобразования результата GigaAM список сегментов пуст."
            )

        logger.info(
            "GigaAM: преобразовано сегментов=%s; первый сегмент=%r",
            len(segments_list),
            segments_list[0]
        )

        instance.refresh_from_db()
        if instance.status == "cancelled":
            logger.info("Задача %s отменена во время распознавания", transcription_id)
            return

        total_segments = len(segments_list)
        duration = max((segment["end"] for segment in segments_list), default=0.0)
        instance.duration_seconds = int(round(duration))
        logger.info(
            "GigaAM завершила распознавание: id=%s, сегментов=%s, длительность=%s",
            transcription_id, total_segments, format_time(instance.duration_seconds)
        )

        update_progress(transcription_id, 80, "Распознавание завершено. Анализ текста...")
        speaker_segments, speakers = detect_speakers_from_text(segments_list)

        structured_data = {
            "transcription_id": transcription_id,
            "model": model_name,
            "duration": instance.duration_seconds,
            "total_segments": len(speaker_segments),
            "speakers": speakers,
            "segments": speaker_segments,
            "raw_text": "\n".join(segment["text"] for segment in speaker_segments),
            "diarization_available": False,
            "speaker_identification_note": (
                "GigaAM longform выполняет сегментацию речи, но не определяет личности "
                "говорящих. Процессуальные роли предварительно предполагаются по тексту "
                "и требуют проверки человеком."
            ),
        }

        instance.raw_text = structured_data["raw_text"]
        instance.result_json = structured_data
        # Диаризация не выполнялась, поэтому не выдаём число ролей за число голосов.
        instance.speaker_count = 0
        instance.progress_percent = 90
        instance.save(update_fields=[
            "raw_text", "result_json", "speaker_count", "duration_seconds",
            "progress_percent", "updated_at"
        ])

        instance.refresh_from_db()
        if instance.status == "cancelled":
            return

        update_progress(transcription_id, 93, "Формирование проекта протокола DOCX...")
        doc = create_protocol_document(instance, speaker_segments, speakers)

        with tempfile.NamedTemporaryFile(
            suffix=".docx", prefix=f"protocol_{transcription_id}_", delete=False
        ) as temp_file:
            temp_path = temp_file.name

        doc.save(temp_path)
        update_progress(transcription_id, 97, "Сохранение проекта протокола...")

        docx_filename = f"protocol_draft_{transcription_id}.docx"
        with open(temp_path, "rb") as docx_file:
            instance.result_docx.save(docx_filename, File(docx_file), save=False)

        instance.status = "completed"
        instance.error_message = ""
        instance.progress_percent = 100
        instance.save()

        cache.set(f"audio_progress_{transcription_id}", 100, 3600)
        cache.set(f"audio_status_{transcription_id}", "Готово!", 3600)
        logger.info("Успешная обработка аудио %s", transcription_id)

    except Exception as exc:
        logger.exception("Ошибка обработки аудио %s: %s", transcription_id, exc)
        try:
            instance.refresh_from_db()
            if instance.status != "cancelled":
                instance.status = "error"
                instance.error_message = str(exc)[:1000]
                instance.save(update_fields=["status", "error_message", "updated_at"])
        except Exception:
            logger.exception("Не удалось сохранить ошибку задачи %s", transcription_id)
        cache.delete(f"audio_progress_{transcription_id}")
        cache.set(f"audio_status_{transcription_id}", "Ошибка обработки", 3600)
        # Не пробрасываем исключение наружу: статус и error_message хранятся в БД.
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                logger.warning("Не удалось удалить временный DOCX: %s", temp_path)


def create_protocol_document(instance, speaker_segments, speakers):
    """
    Создает документ протокола с правильной структурой и поддержкой пользовательских ролей.
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
    date_match = re.search(r'(\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})', first_segment_text)
    if date_match:
        date_str = date_match.group(1)
        doc.add_paragraph(f'{date_str} город [НАЗВАНИЕ ГОРОДА]', style='Normal').alignment = WD_ALIGN_PARAGRAPH.CENTER
    else:
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
    
    # ВАЖНО: используем обновлённые сегменты из result_json, если они есть
    segments_to_use = speaker_segments
    if instance.result_json and 'segments' in instance.result_json:
        segments_to_use = instance.result_json['segments']
    
    # Получаем маппинг пользовательских ролей из result_json
    speaker_mapping = {}
    if instance.result_json and 'speaker_mapping' in instance.result_json:
        speaker_mapping = instance.result_json['speaker_mapping']
    
    # Роли с отображением (базовые)
    role_names = {
        'judge': 'Судья',
        'prosecutor': 'Прокурор',
        'defense': 'Защитник',
        'defendant': 'Подсудимый',
        'victim': 'Потерпевший',
        'witness': 'Свидетель',
        'expert': 'Эксперт',
        'interpreter': 'Переводчик',
        'secretary': 'Секретарь',
        'other': 'Участник'
    }
    
    # Группируем сегменты по ролям
    current_role = None
    
    for seg in segments_to_use:
        role = seg.get('role', 'unknown')
        text = seg['text']
        start_time = seg.get('start', 0)
        
        # Показываем время для каждой реплики
        time_str = format_time_ms(start_time)
        
        # Проверяем, есть ли пользовательское имя для этого спикера
        custom_name = seg.get('custom_name', '')
        custom_role = seg.get('custom_role', '')
        
        # Если custom_name не в сегменте, проверяем в маппинге
        if not custom_name and role in speaker_mapping:
            mapping = speaker_mapping[role]
            custom_name = mapping.get('customName', '')
            if mapping.get('role') == 'other':
                custom_role = mapping.get('customRole', '')
        
        # Определяем отображение роли
        if custom_name:
            # Если есть кастомное имя, используем его
            if custom_role:
                # Если есть кастомная роль (для "Другое")
                display_role = f"{custom_name} ({custom_role})"
            else:
                # Определяем базовую роль
                base_role = role_names.get(role, role)
                display_role = f"{custom_name} ({base_role})"
        else:
            # Если нет кастомного имени, используем базовую роль
            if role == 'other' and custom_role:
                # Для "Другое" с кастомной ролью
                display_role = f"{custom_role}:"
            else:
                display_role = f"{role_names.get(role, role)}:"
        
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
        'witness': 'Свидетель',
        'expert': 'Эксперт',
        'interpreter': 'Переводчик',
        'secretary': 'Секретарь',
        'other': 'Другое'
    }
    
    total = sum(speakers.values())
    for role, count in sorted(speakers.items(), key=lambda x: -x[1]):
        row_cells = table.add_row().cells
        
        # Определяем отображение имени
        # Проверяем, есть ли маппинг для этого спикера
        display_name = role
        if role in speaker_mapping:
            mapping = speaker_mapping[role]
            custom_name = mapping.get('customName', '')
            custom_role = mapping.get('customRole', '')
            
            if custom_name:
                if custom_role:
                    display_name = f"{custom_name} ({custom_role})"
                else:
                    base_role = role_names_display.get(role, role)
                    display_name = f"{custom_name} ({base_role})"
            else:
                if role == 'other' and custom_role:
                    display_name = custom_role
                else:
                    display_name = role_names_display.get(role, role)
        else:
            display_name = role_names_display.get(role, role)
        
        row_cells[0].text = display_name
        row_cells[1].text = str(count)
        row_cells[2].text = f'{round(count / total * 100, 1) if total else 0}%'
    
    # Информация о длительности
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Общая длительность аудиозаписи: ').bold = True
    p.add_run(format_time(instance.duration_seconds))
    
    p2 = doc.add_paragraph()
    p2.add_run('Количество распознанных фрагментов: ').bold = True
    p2.add_run(str(len(segments_to_use)))
    
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
