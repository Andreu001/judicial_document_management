# case_management/views.py - исправленный

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.apps import apps
from django.http import Http404
from .models import (CaseProgressEntry, ProgressActionType,
    NotificationChannel, NotificationStatus, 
    NotificationTemplate, Notification
)
from .serializers import (CaseProgressEntrySerializer, ProgressActionTypeSerializer,
    NotificationChannelSerializer, NotificationStatusSerializer,
    NotificationTemplateSerializer, NotificationSerializer,
    NotificationMarkSentSerializer, NotificationMarkDeliveredSerializer,
    NotificationMarkUndeliveredSerializer
)


class ProgressActionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProgressActionType.objects.all()
    serializer_class = ProgressActionTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class CriminalCaseProgressViewSet(viewsets.ModelViewSet):
    serializer_class = CaseProgressEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        case_id = self.kwargs.get('case_id')
        if not case_id:
            return CaseProgressEntry.objects.none()
        try:
            from criminal_proceedings.models import CriminalProceedings
            criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
            content_type = ContentType.objects.get_for_model(criminal_case)
            return CaseProgressEntry.objects.filter(
                case_content_type=content_type,
                case_object_id=criminal_case.id
            ).order_by('-action_date', '-created_date')
        except ImportError:
            return CaseProgressEntry.objects.none()

    def perform_create(self, serializer):
        case_id = self.kwargs.get('case_id')
        try:
            from criminal_proceedings.models import CriminalProceedings
            criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
            content_type = ContentType.objects.get_for_model(criminal_case)
            serializer.save(
                case_content_type=content_type,
                case_object_id=criminal_case.id,
                author=self.request.user,
                description=self.request.data.get('description', '')
            )
        except ImportError:
            pass


class NotificationChannelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationChannel.objects.filter(is_active=True)
    serializer_class = NotificationChannelSerializer


class NotificationStatusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationStatus.objects.all()
    serializer_class = NotificationStatusSerializer


class NotificationTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationTemplate.objects.filter(is_active=True)
    serializer_class = NotificationTemplateSerializer
    
    @action(detail=False, methods=['get'])
    def by_case_category(self, request):
        case_category = request.query_params.get('case_category')
        participant_type = request.query_params.get('participant_type')
        
        if not case_category:
            return Response({'error': 'Не указана case_category'}, status=400)
        
        queryset = self.get_queryset().filter(case_category=case_category)
        if participant_type:
            queryset = queryset.filter(participant_type=participant_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    queryset = Notification.objects.all()
    
    def get_queryset(self):
        queryset = Notification.objects.all()
        
        case_type = self.request.query_params.get('case_type')
        case_id = self.request.query_params.get('case_id')
        
        if case_type and case_id:
            from django.contrib.contenttypes.models import ContentType
            app_label_map = {
                'criminal': 'criminal_proceedings',
                'civil': 'civil_proceedings',
                'coap': 'administrative_code',
                'kas': 'administrative_proceedings'
            }
            app_label = app_label_map.get(case_type)
            if app_label:
                model_name_map = {
                    'criminal': 'criminalproceedings',
                    'civil': 'civilproceedings',
                    'coap': 'administrativeproceedings',
                    'kas': 'kasproceedings',
                }
                model_name = model_name_map.get(case_type)
                if model_name:
                    try:
                        ct = ContentType.objects.get(app_label=app_label, model=model_name)
                        queryset = queryset.filter(case_content_type=ct, case_object_id=case_id)
                    except ContentType.DoesNotExist:
                        pass
        
        status_code = self.request.query_params.get('status')
        if status_code:
            queryset = queryset.filter(status__code=status_code)
        
        return queryset.select_related('channel', 'status', 'template', 'progress_entry')
    
    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        notification = self.get_object()
        
        if notification.status.code in ['delivered', 'undelivered']:
            return Response(
                {'error': f'Нельзя изменить статус: уже {notification.status.name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = NotificationMarkSentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification.mark_as_sent(request.user)
        
        from .models import CaseProgressEntry, ProgressActionType
        from django.utils import timezone
        
        action_type = ProgressActionType.objects.filter(code='send_notification').first()
        if action_type and not notification.progress_entry:
            progress_entry = CaseProgressEntry.objects.create(
                case_content_type=notification.case_content_type,
                case_object_id=notification.case_object_id,
                action_type=action_type,
                description=f"Направлено уведомление {notification.participant_name} (канал: {notification.channel.name})",
                action_date=timezone.now().date(),
                author=request.user
            )
            notification.progress_entry = progress_entry
            notification.save(update_fields=['progress_entry'])
        
        return Response(NotificationSerializer(notification, context={'request': request}).data)
    
    @action(detail=True, methods=['post'])
    def mark_delivered(self, request, pk=None):
        notification = self.get_object()
        
        if notification.status.code != 'sent':
            return Response(
                {'error': f'Нельзя отметить как врученное: текущий статус {notification.status.name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = NotificationMarkDeliveredSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification.mark_as_delivered(serializer.validated_data.get('delivery_date'))
        
        return Response(NotificationSerializer(notification, context={'request': request}).data)
    
    @action(detail=True, methods=['post'])
    def mark_undelivered(self, request, pk=None):
        notification = self.get_object()
        
        if notification.status.code != 'sent':
            return Response(
                {'error': f'Нельзя отметить как не врученное: текущий статус {notification.status.name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = NotificationMarkUndeliveredSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification.mark_as_undelivered(serializer.validated_data['return_reason'])
        
        return Response(NotificationSerializer(notification, context={'request': request}).data)
    
    @action(detail=False, methods=['post'])
    def generate_preview(self, request):
        """
        Генерация предпросмотра уведомления на основе шаблона и данных участника.
        """
        template_id = request.data.get('template_id')
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        participant_type = request.data.get('participant_type')
        participant_id = request.data.get('participant_id')
        hearing_date = request.data.get('hearing_date')
        hearing_time = request.data.get('hearing_time')
        hearing_room = request.data.get('hearing_room', '')
        
        print(f"generate_preview: template_id={template_id}, case_type={case_type}, case_id={case_id}, participant_type={participant_type}, participant_id={participant_id}")
        
        if not template_id:
            return Response({'error': 'Не указан template_id'}, status=status.HTTP_400_BAD_REQUEST)
        if not case_type:
            return Response({'error': 'Не указан case_type'}, status=status.HTTP_400_BAD_REQUEST)
        if not case_id:
            return Response({'error': 'Не указан case_id'}, status=status.HTTP_400_BAD_REQUEST)
        if not participant_type:
            return Response({'error': 'Не указан participant_type'}, status=status.HTTP_400_BAD_REQUEST)
        if not participant_id:
            return Response({'error': 'Не указан participant_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Получаем шаблон
        try:
            template = NotificationTemplate.objects.get(id=template_id, is_active=True)
        except NotificationTemplate.DoesNotExist:
            return Response({'error': 'Шаблон не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        # Получаем данные участника с учетом типа дела
        participant_data = self._get_participant_data_by_case_type(case_type, participant_type, participant_id)
        if not participant_data:
            return Response({'error': f'Участник не найден: case_type={case_type}, participant_type={participant_type}, id={participant_id}'}, status=status.HTTP_404_NOT_FOUND)
        
        # Получаем номер дела
        case_number = self._get_case_number(case_type, case_id)
        
        court_name = self._get_court_name()
        
        context = {
            'case_number': case_number,
            'full_name': participant_data.get('name', ''),
            'address': participant_data.get('address', ''),
            'hearing_date': hearing_date,
            'hearing_time': hearing_time,
            'hearing_room': hearing_room,
            'court_name': court_name,
        }
        
        message_text = self._render_template(template.content, context)
        
        return Response({
            'message_text': message_text,
            'participant_name': participant_data.get('name'),
            'participant_role': participant_data.get('role'),
            'contact_phone': participant_data.get('phone'),
            'contact_email': participant_data.get('email'),
            'contact_address': participant_data.get('address'),
        })

    def _get_participant_data_by_case_type(self, case_type, participant_type, participant_id):
        """Получение данных участника в зависимости от типа дела"""
        try:
            participant_id = int(participant_id)
        except (ValueError, TypeError):
            return None
        
        # Для уголовных дел
        if case_type == 'criminal':
            if participant_type == 'defendant':
                try:
                    from criminal_proceedings.models import Defendant
                    defendant = Defendant.objects.get(id=participant_id)
                    return {
                        'name': defendant.full_name_criminal or '',
                        'role': 'Подсудимый/Обвиняемый',
                        'phone': '',
                        'email': '',
                        'address': defendant.address or '',
                    }
                except Exception as e:
                    print(f"Error getting defendant: {e}")
                    return None
            
            elif participant_type == 'lawyer':
                try:
                    from criminal_proceedings.models import LawyerCriminal
                    lawyer = LawyerCriminal.objects.get(id=participant_id)
                    if lawyer.lawyer:
                        return {
                            'name': lawyer.lawyer.law_firm_name or '',
                            'role': 'Адвокат/Защитник',
                            'phone': lawyer.lawyer.law_firm_phone or '',
                            'email': lawyer.lawyer.law_firm_email or '',
                            'address': lawyer.lawyer.law_firm_address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting criminal lawyer: {e}")
                    return None
            
            elif participant_type == 'side':
                try:
                    from criminal_proceedings.models import CriminalSidesCaseInCase
                    side = CriminalSidesCaseInCase.objects.get(id=participant_id)
                    if side.criminal_side_case:
                        return {
                            'name': side.criminal_side_case.name or '',
                            'role': side.sides_case_criminal.sides_case if side.sides_case_criminal else 'Сторона',
                            'phone': side.criminal_side_case.phone or '',
                            'email': side.criminal_side_case.email or '',
                            'address': side.criminal_side_case.address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting criminal side: {e}")
                    return None
        
        # Для гражданских дел
        elif case_type == 'civil':
            if participant_type == 'side':
                try:
                    from civil_proceedings.models import CivilSidesCaseInCase
                    side = CivilSidesCaseInCase.objects.get(id=participant_id)
                    if side.sides_case_incase:
                        return {
                            'name': side.sides_case_incase.name or '',
                            'role': side.sides_case_role.sides_case if side.sides_case_role else 'Сторона',
                            'phone': side.sides_case_incase.phone or '',
                            'email': side.sides_case_incase.email or '',
                            'address': side.sides_case_incase.address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting civil side: {e}")
                    return None
            
            elif participant_type == 'lawyer':
                try:
                    from civil_proceedings.models import CivilLawyer
                    lawyer = CivilLawyer.objects.get(id=participant_id)
                    if lawyer.lawyer:
                        return {
                            'name': lawyer.lawyer.law_firm_name or '',
                            'role': 'Представитель',
                            'phone': lawyer.lawyer.law_firm_phone or '',
                            'email': lawyer.lawyer.law_firm_email or '',
                            'address': lawyer.lawyer.law_firm_address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting civil lawyer: {e}")
                    return None
        
        # Для дел об АП (КоАП) - case_type 'coap' соответствует administrative_code
        elif case_type == 'coap':
            if participant_type == 'side':
                try:
                    from administrative_code.models import AdministrativeSidesCaseInCase
                    side = AdministrativeSidesCaseInCase.objects.get(id=participant_id)
                    if side.sides_case_incase:
                        return {
                            'name': side.sides_case_incase.name or '',
                            'role': side.sides_case_role.sides_case if side.sides_case_role else 'Сторона',
                            'phone': side.sides_case_incase.phone or '',
                            'email': side.sides_case_incase.email or '',
                            'address': side.sides_case_incase.address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting coap side: {e}")
                    return None
            
            elif participant_type == 'lawyer':
                try:
                    from administrative_code.models import AdministrativeLawyer
                    lawyer = AdministrativeLawyer.objects.get(id=participant_id)
                    if lawyer.lawyer:
                        return {
                            'name': lawyer.lawyer.law_firm_name or '',
                            'role': 'Защитник',
                            'phone': lawyer.lawyer.law_firm_phone or '',
                            'email': lawyer.lawyer.law_firm_email or '',
                            'address': lawyer.lawyer.law_firm_address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting coap lawyer: {e}")
                    return None
        
        # Для дел по КАС - case_type 'kas' соответствует administrative_proceedings
        elif case_type == 'kas':
            if participant_type == 'side':
                try:
                    from administrative_proceedings.models import KasSidesCaseInCase
                    side = KasSidesCaseInCase.objects.get(id=participant_id)
                    if side.sides_case_incase:
                        return {
                            'name': side.sides_case_incase.name or '',
                            'role': side.sides_case_role.sides_case if side.sides_case_role else 'Сторона',
                            'phone': side.sides_case_incase.phone or '',
                            'email': side.sides_case_incase.email or '',
                            'address': side.sides_case_incase.address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting kas side: {e}")
                    return None
            
            elif participant_type == 'lawyer':
                try:
                    from administrative_proceedings.models import KasLawyer
                    lawyer = KasLawyer.objects.get(id=participant_id)
                    if lawyer.lawyer:
                        return {
                            'name': lawyer.lawyer.law_firm_name or '',
                            'role': 'Представитель',
                            'phone': lawyer.lawyer.law_firm_phone or '',
                            'email': lawyer.lawyer.law_firm_email or '',
                            'address': lawyer.lawyer.law_firm_address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting kas lawyer: {e}")
                    return None
        
        # Для иных материалов
        elif case_type == 'other':
            if participant_type == 'side':
                try:
                    from other_materials.models import OtherMaterialSidesCaseInCase
                    side = OtherMaterialSidesCaseInCase.objects.get(id=participant_id)
                    if side.sides_case_incase:
                        return {
                            'name': side.sides_case_incase.name or '',
                            'role': side.sides_case_role.sides_case if side.sides_case_role else 'Сторона',
                            'phone': side.sides_case_incase.phone or '',
                            'email': side.sides_case_incase.email or '',
                            'address': side.sides_case_incase.address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting other side: {e}")
                    return None
            
            elif participant_type == 'lawyer':
                try:
                    from other_materials.models import OtherMaterialLawyer
                    lawyer = OtherMaterialLawyer.objects.get(id=participant_id)
                    if lawyer.lawyer:
                        return {
                            'name': lawyer.lawyer.law_firm_name or '',
                            'role': 'Представитель',
                            'phone': lawyer.lawyer.law_firm_phone or '',
                            'email': lawyer.lawyer.law_firm_email or '',
                            'address': lawyer.lawyer.law_firm_address or '',
                        }
                    return None
                except Exception as e:
                    print(f"Error getting other lawyer: {e}")
                    return None
        
        return None
    
    def _get_case_number(self, case_type, case_id):
        """Получение номера дела"""
        try:
            if case_type == 'criminal':
                from criminal_proceedings.models import CriminalProceedings
                case = CriminalProceedings.objects.get(id=case_id)
                return case.case_number_criminal or f"№{case_id}"
            elif case_type == 'civil':
                from civil_proceedings.models import CivilProceedings
                case = CivilProceedings.objects.get(id=case_id)
                return case.case_number_civil or f"№{case_id}"
            elif case_type == 'coap':
                from administrative_code.models import AdministrativeProceedings
                case = AdministrativeProceedings.objects.get(id=case_id)
                return case.case_number_admin or f"№{case_id}"
            elif case_type == 'kas':
                from administrative_proceedings.models import KasProceedings
                case = KasProceedings.objects.get(id=case_id)
                return case.case_number_kas or f"№{case_id}"
            elif case_type == 'other':
                from other_materials.models import OtherMaterial
                case = OtherMaterial.objects.get(id=case_id)
                return case.registration_number or f"№{case_id}"
            else:
                return f"№{case_id}"
        except Exception as e:
            print(f"Error getting case number: {e}")
            return f"№{case_id}"
    
    def _get_court_name(self):
        return "Районный суд"
    
    def _render_template(self, template_content, context):
        result = template_content
        for key, value in context.items():
            placeholder = f"{{{{ {key} }}}}"
            result = result.replace(placeholder, str(value) if value else '')
            placeholder2 = f"{{{{{key}}}}}"
            result = result.replace(placeholder2, str(value) if value else '')
        return result


class CaseParticipantsViewSet(viewsets.GenericViewSet):
    """ViewSet для получения участников дела"""
    
    @action(detail=False, methods=['get'])
    def list_participants(self, request):
        case_type = request.query_params.get('case_type')
        case_id = request.query_params.get('case_id')
        
        if not case_type or not case_id:
            return Response({'error': 'Не указаны case_type и case_id'}, status=400)
        
        participants = []
        
        # Получаем стороны
        sides = self._get_case_sides(case_type, case_id)
        for side in sides:
            participants.append({
                'id': side['id'],
                'type': 'side',
                'type_label': 'Сторона',
                'name': side['name'],
                'role': side['role'],
                'phone': side['phone'],
                'email': side['email'],
                'address': side['address'],
            })
        
        # Получаем адвокатов/представителей
        lawyers = self._get_case_lawyers(case_type, case_id)
        for lawyer in lawyers:
            participants.append({
                'id': lawyer['id'],
                'type': 'lawyer',
                'type_label': 'Адвокат',
                'name': lawyer['name'],
                'role': lawyer['role'],
                'phone': lawyer['phone'],
                'email': lawyer['email'],
                'address': lawyer['address'],
            })
        
        # Для уголовных дел добавляем подсудимых
        if case_type == 'criminal':
            defendants = self._get_case_defendants(case_id)
            for defendant in defendants:
                participants.append({
                    'id': defendant['id'],
                    'type': 'defendant',
                    'type_label': 'Подсудимый',
                    'name': defendant['name'],
                    'role': 'Подсудимый/Обвиняемый',
                    'phone': '',
                    'email': '',
                    'address': defendant['address'],
                })
        
        return Response(participants)
    
    def _get_case_sides(self, case_type, case_id):
        result = []
        try:
            if case_type == 'criminal':
                from criminal_proceedings.models import CriminalSidesCaseInCase
                sides = CriminalSidesCaseInCase.objects.filter(criminal_proceedings_id=case_id).select_related('criminal_side_case', 'sides_case_criminal')
                for side in sides:
                    result.append({
                        'id': side.id,
                        'name': side.criminal_side_case.name if side.criminal_side_case else '',
                        'role': side.sides_case_criminal.sides_case if side.sides_case_criminal else '',
                        'phone': side.criminal_side_case.phone if side.criminal_side_case else '',
                        'email': side.criminal_side_case.email if side.criminal_side_case else '',
                        'address': side.criminal_side_case.address if side.criminal_side_case else '',
                    })
            elif case_type == 'civil':
                from civil_proceedings.models import CivilSidesCaseInCase
                sides = CivilSidesCaseInCase.objects.filter(civil_proceedings_id=case_id).select_related('sides_case_incase', 'sides_case_role')
                for side in sides:
                    result.append({
                        'id': side.id,
                        'name': side.sides_case_incase.name if side.sides_case_incase else '',
                        'role': side.sides_case_role.sides_case if side.sides_case_role else '',
                        'phone': side.sides_case_incase.phone if side.sides_case_incase else '',
                        'email': side.sides_case_incase.email if side.sides_case_incase else '',
                        'address': side.sides_case_incase.address if side.sides_case_incase else '',
                    })
            elif case_type == 'coap':
                from administrative_code.models import AdministrativeSidesCaseInCase
                sides = AdministrativeSidesCaseInCase.objects.filter(administrative_proceedings_id=case_id).select_related('sides_case_incase', 'sides_case_role')
                for side in sides:
                    result.append({
                        'id': side.id,
                        'name': side.sides_case_incase.name if side.sides_case_incase else '',
                        'role': side.sides_case_role.sides_case if side.sides_case_role else '',
                        'phone': side.sides_case_incase.phone if side.sides_case_incase else '',
                        'email': side.sides_case_incase.email if side.sides_case_incase else '',
                        'address': side.sides_case_incase.address if side.sides_case_incase else '',
                    })
            elif case_type == 'kas':
                from administrative_proceedings.models import KasSidesCaseInCase
                sides = KasSidesCaseInCase.objects.filter(kas_proceedings_id=case_id).select_related('sides_case_incase', 'sides_case_role')
                for side in sides:
                    result.append({
                        'id': side.id,
                        'name': side.sides_case_incase.name if side.sides_case_incase else '',
                        'role': side.sides_case_role.sides_case if side.sides_case_role else '',
                        'phone': side.sides_case_incase.phone if side.sides_case_incase else '',
                        'email': side.sides_case_incase.email if side.sides_case_incase else '',
                        'address': side.sides_case_incase.address if side.sides_case_incase else '',
                    })
        except Exception as e:
            print(f"Error in _get_case_sides: {e}")
        return result
    
    def _get_case_lawyers(self, case_type, case_id):
        result = []
        try:
            if case_type == 'criminal':
                from criminal_proceedings.models import LawyerCriminal
                lawyers = LawyerCriminal.objects.filter(criminal_proceedings_id=case_id).select_related('lawyer', 'sides_case_role')
                for lawyer in lawyers:
                    result.append({
                        'id': lawyer.id,
                        'name': lawyer.lawyer.law_firm_name if lawyer.lawyer else '',
                        'role': lawyer.sides_case_role.sides_case if lawyer.sides_case_role else 'Адвокат',
                        'phone': lawyer.lawyer.law_firm_phone if lawyer.lawyer else '',
                        'email': lawyer.lawyer.law_firm_email if lawyer.lawyer else '',
                        'address': lawyer.lawyer.law_firm_address if lawyer.lawyer else '',
                    })
            elif case_type == 'civil':
                from civil_proceedings.models import CivilLawyer
                lawyers = CivilLawyer.objects.filter(civil_proceedings_id=case_id).select_related('lawyer', 'sides_case_role')
                for lawyer in lawyers:
                    result.append({
                        'id': lawyer.id,
                        'name': lawyer.lawyer.law_firm_name if lawyer.lawyer else '',
                        'role': lawyer.sides_case_role.sides_case if lawyer.sides_case_role else 'Представитель',
                        'phone': lawyer.lawyer.law_firm_phone if lawyer.lawyer else '',
                        'email': lawyer.lawyer.law_firm_email if lawyer.lawyer else '',
                        'address': lawyer.lawyer.law_firm_address if lawyer.lawyer else '',
                    })
            elif case_type == 'coap':
                from administrative_code.models import AdministrativeLawyer
                lawyers = AdministrativeLawyer.objects.filter(administrative_proceedings_id=case_id).select_related('lawyer', 'sides_case_role')
                for lawyer in lawyers:
                    result.append({
                        'id': lawyer.id,
                        'name': lawyer.lawyer.law_firm_name if lawyer.lawyer else '',
                        'role': lawyer.sides_case_role.sides_case if lawyer.sides_case_role else 'Защитник',
                        'phone': lawyer.lawyer.law_firm_phone if lawyer.lawyer else '',
                        'email': lawyer.lawyer.law_firm_email if lawyer.lawyer else '',
                        'address': lawyer.lawyer.law_firm_address if lawyer.lawyer else '',
                    })
            elif case_type == 'kas':
                from administrative_proceedings.models import KasLawyer
                lawyers = KasLawyer.objects.filter(kas_proceedings_id=case_id).select_related('lawyer', 'sides_case_role')
                for lawyer in lawyers:
                    result.append({
                        'id': lawyer.id,
                        'name': lawyer.lawyer.law_firm_name if lawyer.lawyer else '',
                        'role': lawyer.sides_case_role.sides_case if lawyer.sides_case_role else 'Представитель',
                        'phone': lawyer.lawyer.law_firm_phone if lawyer.lawyer else '',
                        'email': lawyer.lawyer.law_firm_email if lawyer.lawyer else '',
                        'address': lawyer.lawyer.law_firm_address if lawyer.lawyer else '',
                    })
        except Exception as e:
            print(f"Error in _get_case_lawyers: {e}")
        return result
    
    def _get_case_defendants(self, case_id):
        result = []
        try:
            from criminal_proceedings.models import Defendant
            defendants = Defendant.objects.filter(criminal_proceedings_id=case_id)
            for defendant in defendants:
                result.append({
                    'id': defendant.id,
                    'name': defendant.full_name_criminal or '',
                    'address': defendant.address or '',
                })
        except Exception as e:
            print(f"Error in _get_case_defendants: {e}")
        return result


class GenericCaseProgressViewSet(viewsets.ModelViewSet):
    serializer_class = CaseProgressEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_case_model(self, case_type, case_id):
        models_map = {
            'criminal': ('criminal_proceedings', 'CriminalProceedings'),
            'civil': ('civil_proceedings', 'CivilProceedings'),
            'coap': ('administrative_code', 'AdministrativeProceedings'),
            'kas': ('administrative_proceedings', 'KasProceedings'),
        }
        
        if case_type not in models_map:
            return None
        
        app_label, model_name = models_map[case_type]
        try:
            app = apps.get_app_config(app_label)
            model = app.get_model(model_name)
            return model.objects.get(pk=case_id)
        except Exception:
            return None
    
    def get_queryset(self):
        case_type = self.kwargs.get('case_type')
        case_id = self.kwargs.get('case_id')
        
        if not case_type or not case_id:
            return CaseProgressEntry.objects.none()
        
        case = self.get_case_model(case_type, case_id)
        if not case:
            return CaseProgressEntry.objects.none()
        
        content_type = ContentType.objects.get_for_model(case)
        return CaseProgressEntry.objects.filter(
            case_content_type=content_type,
            case_object_id=case.id
        ).order_by('-action_date', '-created_date')
    
    def perform_create(self, serializer):
        case_type = self.kwargs.get('case_type')
        case_id = self.kwargs.get('case_id')
        
        case = self.get_case_model(case_type, case_id)
        if not case:
            raise Http404("Дело не найдено")
        
        content_type = ContentType.objects.get_for_model(case)
        serializer.save(
            case_content_type=content_type,
            case_object_id=case.id,
            author=self.request.user,
            description=self.request.data.get('description', '')
        )