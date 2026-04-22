from rest_framework import serializers
from ..models import StatisticalReport, ReportSchedule


class StatisticalReportSerializer(serializers.ModelSerializer):
    """Сериализатор для статистического отчета."""
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    base_model = serializers.CharField(source='base_content_type.model', read_only=True)
    
    class Meta:
        model = StatisticalReport
        fields = [
            'id', 'name', 'code', 'report_type', 'report_type_display', 'description',
            'status', 'status_display', 'rows_definition', 'columns_definition',
            'measures_definition', 'default_filters', 'available_filters',
            'default_output_format', 'is_drilldown_enabled', 'order', 'base_model',
            'drilldown_reports', 'created_at', 'updated_at'
        ]


class ExecuteReportSerializer(serializers.Serializer):
    """Сериализатор для выполнения отчета."""
    filters = serializers.JSONField(required=False, default=dict)
    output_format = serializers.ChoiceField(choices=['table', 'chart', 'pivot'], default='table')


class ReportScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSchedule
        fields = '__all__'
        read_only_fields = ['last_run', 'next_run']