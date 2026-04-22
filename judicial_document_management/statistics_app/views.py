from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, serializers
from django.contrib.contenttypes.models import ContentType
from django.apps import apps
from statistics_app.services import StatisticsQueryService
from statistics_app.models import SavedQueryView, Dashboard, DashboardWidget
import logging

logger = logging.getLogger(__name__)

class AvailableModelsView(APIView):
    """Возвращает список доступных для статистики моделей."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Список приложений и моделей, которые мы хотим включить в статистику
        target_apps = [
            'criminal_proceedings', 'civil_proceedings',
            'administrative_code', 'administrative_proceedings',
            'case_registry', 'other_materials', 'business_card'
        ]
        models_data = []
        for ct in ContentType.objects.filter(app_label__in=target_apps):
            model_class = ct.model_class()
            if model_class:
                models_data.append({
                    'id': ct.id,
                    'label': model_class._meta.verbose_name,
                    'app_label': ct.app_label,
                    'model': ct.model,
                })
        return Response(sorted(models_data, key=lambda x: x['label']))


class ModelFieldsView(APIView):
    """Возвращает поля выбранной модели для построения отчета."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ct_id):
        try:
            ct = ContentType.objects.get(id=ct_id)
            model_class = ct.model_class()
            if not model_class:
                return Response({"error": "Модель не найдена"}, status=status.HTTP_404_NOT_FOUND)

            fields = []
            for field in model_class._meta.get_fields():
                # Пропускаем некоторые типы полей, которые сложно группировать
                if field.is_relation and not field.many_to_one:
                    continue
                fields.append({
                    'name': field.name,
                    'verbose_name': field.verbose_name,
                    'type': field.get_internal_type(),
                })
            return Response(fields)
        except ContentType.DoesNotExist:
            return Response({"error": "ContentType не найден"}, status=status.HTTP_404_NOT_FOUND)


class ExecuteQueryView(APIView):
    """Выполняет статистический запрос на основе полученной конфигурации."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = QueryConfigSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            ct = ContentType.objects.get(id=data['content_type_id'])
        except ContentType.DoesNotExist:
            return Response({"error": "ContentType не найден"}, status=status.HTTP_400_BAD_REQUEST)

        query_config = data.get('query_config', {})
        result, error = StatisticsQueryService.execute_query(ct, query_config)

        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        # Сохраняем время последнего выполнения, если запрос сохранен
        if data.get('saved_query_id'):
            try:
                sq = SavedQueryView.objects.get(id=data['saved_query_id'], created_by=request.user)
                sq.last_run = timezone.now()
                sq.save(update_fields=['last_run'])
            except SavedQueryView.DoesNotExist:
                pass

        return Response({"data": result})


class DrillDownView(APIView):
    """Получает данные для детализации по конкретному агрегированному результату."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DrillDownSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            ct = ContentType.objects.get(id=data['content_type_id'])
        except ContentType.DoesNotExist:
            return Response({"error": "ContentType не найден"}, status=status.HTTP_400_BAD_REQUEST)

        result = StatisticsQueryService.get_drill_down_data(
            ct,
            data['query_config'],
            data['group_by_values']
        )

        if result is None:
            return Response({"error": "Ошибка при получении данных для детализации"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"data": result})


class SavedQueryViewSet(APIView):
    """CRUD для сохраненных запросов."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queries = SavedQueryView.objects.filter(created_by=request.user) | SavedQueryView.objects.filter(is_public=True)
        serializer = SavedQuerySerializer(queries, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SavedQuerySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            query = SavedQueryView.objects.get(pk=pk, created_by=request.user)
        except SavedQueryView.DoesNotExist:
            return Response({"error": "Запрос не найден"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SavedQuerySerializer(query, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            query = SavedQueryView.objects.get(pk=pk, created_by=request.user)
            query.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedQueryView.DoesNotExist:
            return Response({"error": "Запрос не найден"}, status=status.HTTP_404_NOT_FOUND)


class DashboardViewSet(APIView):
    """CRUD для дашбордов."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        dashboards = Dashboard.objects.filter(created_by=request.user) | Dashboard.objects.filter(is_public=True)
        serializer = DashboardSerializer(dashboards, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DashboardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            dashboard = Dashboard.objects.get(pk=pk, created_by=request.user)
        except Dashboard.DoesNotExist:
            return Response({"error": "Дашборд не найден"}, status=status.HTTP_404_NOT_FOUND)
        serializer = DashboardSerializer(dashboard, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            dashboard = Dashboard.objects.get(pk=pk, created_by=request.user)
            dashboard.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Dashboard.DoesNotExist:
            return Response({"error": "Дашборд не найден"}, status=status.HTTP_404_NOT_FOUND)


# --- Сериализаторы ---
from rest_framework import serializers

class QueryConfigSerializer(serializers.Serializer):
    content_type_id = serializers.IntegerField()
    saved_query_id = serializers.IntegerField(required=False, allow_null=True)
    query_config = serializers.JSONField()


class DrillDownSerializer(serializers.Serializer):
    content_type_id = serializers.IntegerField()
    query_config = serializers.JSONField()
    group_by_values = serializers.JSONField()


class SavedQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedQueryView
        fields = ['id', 'name', 'description', 'target_content_type', 'query_config', 'is_public', 'created_at', 'last_run']
        read_only_fields = ['id', 'created_by', 'created_at', 'last_run']


class DashboardWidgetSerializer(serializers.ModelSerializer):
    saved_query_details = SavedQuerySerializer(source='saved_query', read_only=True)

    class Meta:
        model = DashboardWidget
        fields = ['id', 'saved_query', 'saved_query_details', 'order', 'chart_type', 'width', 'height']


class DashboardSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True, source='dashboardwidget_set')

    class Meta:
        model = Dashboard
        fields = ['id', 'name', 'description', 'widgets', 'layout_config', 'is_public', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']