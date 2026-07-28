# audio_transcription/serializers.py
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import AudioTranscription

TYPE_MAP = {
    'criminal': ('criminal_proceedings', 'criminalproceedings'),
    'civil': ('civil_proceedings', 'civilproceedings'),
    'coap': ('administrative_code', 'administrativeproceedings'),
    'kas': ('administrative_proceedings', 'kasproceedings'),
}


class AudioUploadSerializer(serializers.Serializer):
    audio_file = serializers.FileField(write_only=True)
    case_type = serializers.ChoiceField(choices=list(TYPE_MAP.keys()), write_only=True)
    case_id = serializers.IntegerField(write_only=True)

    def validate_audio_file(self, value):
        valid_extensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.opus']
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in valid_extensions:
            raise serializers.ValidationError(
                f"Неподдерживаемый формат файла: {ext}. Разрешены: {', '.join(valid_extensions)}"
            )
        if value.size > 200 * 1024 * 1024:
            raise serializers.ValidationError("Файл слишком большой. Максимум 200 МБ.")
        return value

    def create(self, validated_data):
        case_type_key = validated_data.pop('case_type')
        case_id = validated_data.pop('case_id')
        audio_file = validated_data.pop('audio_file')

        if case_type_key not in TYPE_MAP:
            raise serializers.ValidationError(f"Неизвестный тип дела: {case_type_key}")
            
        app_label, model = TYPE_MAP[case_type_key]
        
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model)
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(f"Тип дела {case_type_key} не найден в системе.")

        transcription = AudioTranscription.objects.create(
            case_content_type=ct,
            case_object_id=case_id,
            audio_file=audio_file
        )

        from .tasks import transcribe_audio_task
        transcribe_audio_task.delay(transcription.id)

        return transcription


class AudioTranscriptionSerializer(serializers.ModelSerializer):
    case_type_display = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    structured_data = serializers.SerializerMethodField()
    speakers_summary = serializers.SerializerMethodField()

    class Meta:
        model = AudioTranscription
        fields = [
            'id', 'status', 'raw_text', 'error_message', 
            'duration_seconds', 'created_at', 'case_type_display',
            'download_url', 'progress_percent', 'can_cancel', 'can_delete',
            'structured_data', 'speakers_summary', 'speaker_count'
        ]
        read_only_fields = fields

    def get_case_type_display(self, obj):
        return obj.case_content_type.model if obj.case_content_type else None

    def get_download_url(self, obj):
        if obj.status == 'completed' and obj.result_docx:
            return f"/api/audio-transcription/transcriptions/{obj.id}/download/"
        return None
    
    def get_can_cancel(self, obj):
        return obj.status in ['pending', 'processing']
    
    def get_can_delete(self, obj):
        return obj.status != 'processing'
    
    def get_structured_data(self, obj):
        """Возвращает структурированные данные протокола для отображения"""
        if obj.result_json:
            return obj.result_json
        return None
    
    def get_speakers_summary(self, obj):
        """Возвращает сводку по говорящим"""
        if obj.result_json and 'speakers' in obj.result_json:
            speakers = obj.result_json['speakers']
            role_names = {
                'judge': 'Судья',
                'prosecutor': 'Прокурор',
                'defense': 'Защитник',
                'defendant': 'Подсудимый',
                'victim': 'Потерпевший',
            }
            result = {}
            for role, count in speakers.items():
                display_name = role_names.get(role, role)
                result[display_name] = count
            return result
        return {}
