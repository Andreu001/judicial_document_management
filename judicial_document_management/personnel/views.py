from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny  # IMPORTANT: Import AllowAny
from users.models import User
from .models import AbsenceType, AbsenceRecord
from .serializers import JudgeSerializer, AbsenceTypeSerializer, AbsenceRecordSerializer


class JudgeListView(generics.ListAPIView):
    """Список всех судей (для выпадающего списка на фронте)."""
    queryset = User.objects.filter(role='judge', is_active=True)
    serializer_class = JudgeSerializer
    permission_classes = [AllowAny]  # Временно разрешаем всем


class AbsenceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """Типы отсутствий (только чтение)."""
    queryset = AbsenceType.objects.filter(is_active=True)
    serializer_class = AbsenceTypeSerializer
    permission_classes = [AllowAny]  # Временно разрешаем всем


class AbsenceRecordViewSet(viewsets.ModelViewSet):
    """Полный CRUD для записей отсутствий."""
    queryset = AbsenceRecord.objects.all()
    serializer_class = AbsenceRecordSerializer
    permission_classes = [AllowAny]  # Временно разрешаем всем

    def get_queryset(self):
        qs = super().get_queryset()
        # фильтрация по судье, если передан параметр ?user_id=
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs.select_related('user', 'absence_type')