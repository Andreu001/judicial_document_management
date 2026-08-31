# audio_transcription/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.http import FileResponse, Http404
from django.contrib.contenttypes.models import ContentType
from .models import AudioTranscription
from .serializers import AudioUploadSerializer, AudioTranscriptionSerializer, TYPE_MAP
from .services import cancel_processing, get_protocol_structured_data
from django.db.models import Q
import os

from side_case_access.models import CaseAccessGrant


class AudioTranscriptionViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AudioTranscriptionSerializer
    # ВАЖНО: добавляем queryset для правильной генерации URL
    queryset = AudioTranscription.objects.all().order_by('-created_at')

    def get_queryset(self):
        return AudioTranscription.objects.all().order_by('-created_at')

    def create(self, request):
        """Загрузка аудиофайла и старт распознавания"""
        serializer = AudioUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        return Response({
            'id': instance.id,
            'message': 'Файл загружен и отправлен на распознавание',
            'status': instance.status
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        """Проверка статуса и получение текста"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """Скачивание готового DOCX файла"""
        instance = self.get_object()
        
        if not instance.result_docx:
            return Response({'error': 'Файл еще не готов'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            response = FileResponse(
                instance.result_docx.open('rb'),
                as_attachment=True,
                filename=instance.get_docx_filename()
            )
            return response
        except FileNotFoundError:
            raise Http404("Файл не найден на сервере")
    
    @action(detail=False, methods=['get'], url_path='by-case')
    def by_case(self, request):
        """Получить все расшифровки для конкретного дела"""
        case_type = request.query_params.get('case_type')
        case_id = request.query_params.get('case_id')
        
        if not case_type or not case_id:
            return Response({'error': 'Укажите case_type и case_id'}, status=status.HTTP_400_BAD_REQUEST)
            
        if case_type not in TYPE_MAP:
            return Response({'error': 'Неверный тип дела'}, status=status.HTTP_400_BAD_REQUEST)
            
        app_label, model = TYPE_MAP[case_type]
        
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model)
        except ContentType.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)
        
        transcriptions = AudioTranscription.objects.filter(
            case_content_type=ct,
            case_object_id=case_id
        ).order_by('-created_at')
        
        serializer = self.get_serializer(transcriptions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """Отмена обработки аудио"""
        instance = self.get_object()
        
        if instance.status not in ['pending', 'processing']:
            return Response({
                'error': f'Нельзя отменить запись в статусе "{instance.get_status_display()}"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        success = cancel_processing(pk)
        if success:
            return Response({
                'message': 'Обработка успешно отменена',
                'status': 'cancelled'
            })
        return Response({
            'error': 'Не удалось отменить обработку'
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='delete')
    def delete_transcription(self, request, pk=None):
        """Удаление записи (только если не в процессе обработки)"""
        instance = self.get_object()
        
        if instance.status == 'processing':
            return Response({
                'error': 'Нельзя удалить запись во время обработки. Сначала отмените задачу.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if instance.audio_file:
            instance.audio_file.delete()
        if instance.result_docx:
            instance.result_docx.delete()
            
        instance.delete()
        
        return Response({
            'message': 'Запись успешно удалена'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='progress')
    def get_progress(self, request, pk=None):
        """Получение текущего прогресса обработки"""
        instance = self.get_object()
        
        return Response({
            'progress': instance.progress_percent,
            'status': instance.status,
            'message': f'Обработка... {instance.progress_percent}%' if instance.status in ['pending', 'processing'] else 'Процесс не активен'
        })

    @action(detail=True, methods=['get'], url_path='structured')
    def get_structured(self, request, pk=None):
        """Получение структурированных данных протокола"""
        instance = self.get_object()
        
        if instance.status != 'completed' or not instance.result_json:
            return Response({
                'error': 'Данные еще не готовы'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(instance.result_json)

    @action(detail=True, methods=['get'], url_path='protocol-preview')
    def protocol_preview(self, request, pk=None):
        """Предпросмотр протокола с разбивкой по участникам"""
        instance = self.get_object()
        
        # Проверяем наличие данных
        if instance.status != 'completed':
            return Response({
                'error': f'Транскрипция еще не готова. Текущий статус: {instance.get_status_display()}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not instance.result_json:
            return Response({
                'error': 'Структурированные данные отсутствуют. Запустите обработку заново.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = instance.result_json
        segments = data.get('segments', [])
        speakers = data.get('speakers', {})
        
        if not segments:
            return Response({
                'error': 'В транскрипции нет сегментов для отображения'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Группируем по ролям
        role_names = {
            'judge': 'Судья',
            'prosecutor': 'Прокурор',
            'defense': 'Защитник',
            'defendant': 'Подсудимый',
            'victim': 'Потерпевший',
        }
        
        grouped_segments = {}
        for seg in segments:
            role = seg.get('role', 'unknown')
            display_role = role_names.get(role, role)
            if display_role not in grouped_segments:
                grouped_segments[display_role] = []
            grouped_segments[display_role].append({
                'start': seg.get('start', 0),
                'end': seg.get('end', 0),
                'text': seg.get('text', '')
            })
        
        return Response({
            'speakers': {role_names.get(r, r): count for r, count in speakers.items()},
            'segments_by_role': grouped_segments,
            'total_segments': len(segments),
            'duration': data.get('duration', 0)
        })

    @action(detail=True, methods=['post'], url_path='save-speaker-roles')
    def save_speaker_roles(self, request, pk=None):
        """Сохранение ролей участников"""
        instance = self.get_object()
        
        speaker_mapping = request.data.get('speaker_mapping', {})
        
        if not speaker_mapping:
            return Response(
                {'error': 'Не передано сопоставление спикеров'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Получаем существующие данные
            if instance.result_json:
                data = instance.result_json
            else:
                data = {}
            
            # Сохраняем маппинг
            data['speaker_mapping'] = speaker_mapping
            
            # Перестраиваем сегменты с новыми ролями
            if 'segments' in data:
                # Сначала создаем словарь для быстрого поиска
                mapping_dict = {}
                for speaker_id, mapping in speaker_mapping.items():
                    mapping_dict[speaker_id] = mapping
                
                # Обновляем каждый сегмент
                for seg in data['segments']:
                    speaker_id = seg.get('role')
                    if speaker_id in mapping_dict:
                        mapping = mapping_dict[speaker_id]
                        # Обновляем роль
                        seg['role'] = mapping.get('role', speaker_id)
                        # Добавляем custom_name если есть
                        if mapping.get('customName'):
                            seg['custom_name'] = mapping['customName']
                        # Добавляем custom_role если есть (для "Другое")
                        if mapping.get('customRole'):
                            seg['custom_role'] = mapping['customRole']
            
            # Обновляем speakers с новыми именами
            new_speakers = {}
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
                'other': 'Другое'
            }
            
            for speaker_id, mapping in speaker_mapping.items():
                role = mapping.get('role', speaker_id)
                custom_name = mapping.get('customName', '')
                custom_role = mapping.get('customRole', '')
                count = mapping.get('count', 0)
                
                if custom_name:
                    if custom_role:
                        # Если есть кастомная роль (для "Другое")
                        display_name = f"{custom_name} ({custom_role})"
                    else:
                        display_name = f"{custom_name} ({role_names.get(role, role)})"
                else:
                    if role == 'other' and custom_role:
                        display_name = custom_role
                    else:
                        display_name = role_names.get(role, role)
                
                new_speakers[display_name] = count
            
            data['speakers'] = new_speakers
            
            # ВАЖНО: обновляем speaker_count
            instance.speaker_count = len(new_speakers)
            
            instance.result_json = data
            instance.save(update_fields=['result_json', 'speaker_count', 'updated_at'])
            
            return Response({
                'message': 'Роли успешно сохранены',
                'speakers': new_speakers
            })
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Ошибка сохранения ролей: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], url_path='speaker-roles')
    def get_speaker_roles(self, request, pk=None):
        """Получение сохраненных ролей"""
        instance = self.get_object()
        
        if not instance.result_json:
            return Response({})
        
        speaker_mapping = instance.result_json.get('speaker_mapping', {})
        return Response(speaker_mapping)


class AudioTranscriptionDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, transcription_id, format=None):
        try:
            transcription = AudioTranscription.objects.get(id=transcription_id)
        except AudioTranscription.DoesNotExist:
            raise Http404("Аудио-протокол не найден.")

        # Проверяем, есть ли у пользователя доступ к делу
        user = request.user
        content_type = transcription.case_content_type
        object_id = transcription.case_object_id

        try:
            grant = CaseAccessGrant.objects.get(
                external_user=user,
                content_type=content_type,
                object_id=object_id,
                is_active=True
            )
        except CaseAccessGrant.DoesNotExist:
            return Response({"error": "У вас нет доступа к этому делу."}, status=403)

        file_path = transcription.audio_file.path
        if not os.path.exists(file_path):
            raise Http404("Файл не найден на сервере.")

        # Возвращаем файл для скачивания
        return FileResponse(open(file_path, 'rb'), as_attachment=True)