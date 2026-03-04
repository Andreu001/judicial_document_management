from django.db import models
from django.db.models import Q
from typing import List, Dict, Any
from administrative_code.models import AdministrativeProceedings
from administrative_proceedings.models import KasProceedings
from criminal_proceedings.models import CriminalProceedings
from civil_proceedings.models import CivilProceedings
from business_card.models import SidesCaseInCase
from django.contrib.contenttypes.models import ContentType
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class CaseSearchService:
    """Сервис для поиска по всем типам дел"""
    
    SEARCHABLE_MODELS = {
        'criminal': CriminalProceedings,
        'civil': CivilProceedings,
        'administrative': AdministrativeProceedings,
        'kas': KasProceedings,
    }
    
    @classmethod
    def search(cls, query: str, case_types: List[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Поиск по всем типам дел или по указанным типам
        
        Args:
            query: Поисковый запрос
            case_types: Список типов дел для поиска (criminal, civil, administrative, kas)
                       Если None, ищет по всем типам
        
        Returns:
            Словарь с результатами поиска по каждому типу дел
        """
        if not query or len(query.strip()) < 2:
            return {}
        
        query = query.strip()
        results = {}
        
        # Определяем, по каким моделям искать
        models_to_search = {}
        if case_types:
            for case_type in case_types:
                if case_type in cls.SEARCHABLE_MODELS:
                    models_to_search[case_type] = cls.SEARCHABLE_MODELS[case_type]
        else:
            models_to_search = cls.SEARCHABLE_MODELS
        
        # Поиск по каждой модели
        for case_type, model in models_to_search.items():
            try:
                case_results = cls._search_in_model(model, query, case_type)
                if case_results:
                    results[case_type] = case_results
            except Exception as e:
                logger.error(f"Ошибка поиска в модели {case_type}: {e}")
        
        return results
    
    @classmethod
    def _search_in_model(cls, model, query: str, case_type: str) -> List[Dict[str, Any]]:
        """Поиск в конкретной модели"""
        
        # Логируем общее количество записей
        total_count = model.objects.count()
        logger.info(f"Всего записей в {case_type}: {total_count}")
        
        # Базовый запрос по номеру дела
        if case_type == 'criminal':
            number_field = 'case_number_criminal'
        elif case_type == 'civil':
            number_field = 'case_number_civil'
        elif case_type == 'administrative':
            number_field = 'case_number_admin'
        elif case_type == 'kas':
            number_field = 'case_number_kas'
        else:
            number_field = 'case_number'
        
        # Создаем Q объект для поиска
        q_objects = Q()
        
        # Поиск по номеру дела
        q_objects |= Q(**{f"{number_field}__icontains": query})
        
        # Поиск по связанным сторонам дела
        if case_type == 'criminal':
            # ИСПРАВЛЕНО: используем criminal_sides (новый related_name)
            q_objects |= Q(
                criminal_sides__criminal_side_case__name__icontains=query
            )
            
            # 2. Поиск по обвиняемым
            q_objects |= Q(defendants__full_name_criminal__icontains=query)
            
            # 3. Поиск по адвокатам
            q_objects |= Q(
                criminal_sides_lawyer__sides_case_lawyer_criminal__law_firm_name__icontains=query
            )
            
            # 4. Поиск по petitions (если нужно)
            q_objects |= Q(petitions__notation__icontains=query)
            
        elif case_type == 'civil':
            q_objects |= Q(
                civil_sides__sides_case_incase__name__icontains=query
            )
        elif case_type == 'administrative':
            q_objects |= Q(
                admin_sides__sides_case_incase__name__icontains=query
            )
        elif case_type == 'kas':
            q_objects |= Q(
                kas_sides__sides_case_incase__name__icontains=query
            )
        
        # Поиск по особым отметкам
        q_objects |= Q(special_notes__icontains=query)
        
        # Выполняем запрос
        queryset = model.objects.filter(q_objects).distinct()
        
        # Логируем результат
        logger.info(f"Поиск в {case_type}: запрос '{query}', найдено {queryset.count()} результатов")
        
        # Формируем результаты
        results = []
        for instance in queryset[:50]:
            case_data = cls._format_case_data(instance, case_type)
            
            # Добавляем информацию о сторонах
            sides = cls._get_case_sides(instance, case_type)
            if sides:
                case_data['sides'] = sides
            
            results.append(case_data)
        
        return results


    @classmethod
    def _format_case_data(cls, instance, case_type: str) -> Dict[str, Any]:
        """Форматирование данных дела для ответа"""
        
        # Получаем номер дела в зависимости от типа
        if case_type == 'criminal':
            case_number = instance.case_number_criminal
        elif case_type == 'civil':
            case_number = instance.case_number_civil
        elif case_type == 'administrative':
            case_number = instance.case_number_admin
        elif case_type == 'kas':
            case_number = instance.case_number_kas
        else:
            case_number = getattr(instance, 'case_number', '')
        
        # Получаем дату поступления
        incoming_date = getattr(instance, 'incoming_date', None)
        if incoming_date:
            incoming_date = incoming_date.isoformat()
        
        # Получаем статус
        status = getattr(instance, 'status', 'active')
        status_display = dict(instance.STATUS_CHOICES).get(status, status)
        
        # Определяем, есть ли решение и исполнение
        has_decision = cls._has_decision(instance, case_type)
        has_execution = cls._has_execution(instance, case_type)
        
        return {
            'id': instance.id,
            'case_type': case_type,
            'case_number': case_number,
            'incoming_date': incoming_date,
            'status': status,
            'status_display': status_display,
            'has_decision': has_decision,
            'has_execution': has_execution,
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
            'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
        }
    
    @classmethod
    def _get_case_sides(cls, instance, case_type: str) -> List[Dict[str, str]]:
        """Получение сторон дела"""
        sides = []
        
        try:
            if case_type == 'criminal':
                # ИСПРАВЛЕНО: используем criminal_sides вместо criminalsidescaseincase
                if hasattr(instance, 'criminal_sides'):
                    for side in instance.criminal_sides.all():
                        if side.criminal_side_case:
                            sides.append({
                                'name': side.criminal_side_case.name,
                                'role': side.sides_case_criminal.sides_case if side.sides_case_criminal else 'Сторона'
                            })
                
                # Добавляем обвиняемых
                if hasattr(instance, 'defendants'):
                    for defendant in instance.defendants.all():
                        sides.append({
                            'name': defendant.full_name_criminal,
                            'role': 'Обвиняемый'
                        })
                
                # Добавляем адвокатов
                if hasattr(instance, 'criminal_sides_lawyer'):
                    for lawyer in instance.criminal_sides_lawyer.all():
                        if lawyer.sides_case_lawyer_criminal:
                            sides.append({
                                'name': lawyer.sides_case_lawyer_criminal.law_firm_name,
                                'role': 'Адвокат'
                            })

            elif case_type == 'civil' and hasattr(instance, 'civil_sides'):
                for side in instance.civil_sides.all():
                    if side.sides_case_incase:
                        sides.append({
                            'name': side.sides_case_incase.name,
                            'role': side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                        })
            
            elif case_type == 'administrative' and hasattr(instance, 'admin_sides'):
                for side in instance.admin_sides.all():
                    if side.sides_case_incase:
                        sides.append({
                            'name': side.sides_case_incase.name,
                            'role': side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                        })
            
            elif case_type == 'kas' and hasattr(instance, 'kas_sides'):
                for side in instance.kas_sides.all():
                    if side.sides_case_incase:
                        sides.append({
                            'name': side.sides_case_incase.name,
                            'role': side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                        })
        except Exception as e:
            logger.error(f"Ошибка получения сторон для дела {instance.id}: {e}")
        
        return sides[:5]  # Возвращаем не более 5 сторон
    
    @classmethod
    def _has_decision(cls, instance, case_type: str) -> bool:
        """Проверяет, есть ли решение по делу"""
        try:
            if case_type == 'criminal' and hasattr(instance, 'criminal_decisions'):
                return instance.criminal_decisions.exists()
            elif case_type == 'civil' and hasattr(instance, 'civil_decisions'):
                return instance.civil_decisions.exists()
            elif case_type == 'administrative' and hasattr(instance, 'admin_decisions'):
                return instance.admin_decisions.exists()
            elif case_type == 'kas' and hasattr(instance, 'kas_decisions'):
                return instance.kas_decisions.exists()
        except Exception:
            pass
        return False
    
    @classmethod
    def _has_execution(cls, instance, case_type: str) -> bool:
        """Проверяет, есть ли исполнение по делу"""
        try:
            if case_type == 'criminal' and hasattr(instance, 'criminal_executions'):
                return instance.criminal_executions.exists()
            elif case_type == 'civil' and hasattr(instance, 'civil_executions'):
                return instance.civil_executions.exists()
            elif case_type == 'administrative' and hasattr(instance, 'admin_executions'):
                return instance.admin_executions.exists()
            elif case_type == 'kas' and hasattr(instance, 'kas_executions'):
                return instance.kas_executions.exists()
        except Exception:
            pass
        return False


class CaseStatusService:
    """Сервис для автоматического обновления статуса дел"""
    
    @classmethod
    def update_case_status(cls, instance, case_type: str) -> str:
        """
        Обновляет статус дела на основе наличия решений и исполнений
        
        Returns:
            Новый статус дела
        """
        # Проверяем, есть ли решение
        has_decision = False
        has_execution = False
        
        try:
            if case_type == 'criminal':
                if hasattr(instance, 'criminal_decisions'):
                    has_decision = instance.criminal_decisions.exists()
                if hasattr(instance, 'criminal_executions'):
                    has_execution = instance.criminal_executions.exists()
                
                # Проверяем дату приговора
                if instance.sentence_date:
                    has_decision = True
                
            elif case_type == 'civil':
                if hasattr(instance, 'civil_decisions'):
                    has_decision = instance.civil_decisions.exists()
                if hasattr(instance, 'civil_executions'):
                    has_execution = instance.civil_executions.exists()
                
                # Проверяем дату решения
                if instance.hearing_date:
                    has_decision = True
                
            elif case_type == 'administrative':
                if hasattr(instance, 'admin_decisions'):
                    has_decision = instance.admin_decisions.exists()
                if hasattr(instance, 'admin_executions'):
                    has_execution = instance.admin_executions.exists()
                
                # Проверяем дату рассмотрения
                if instance.hearing_date:
                    has_decision = True
                
            elif case_type == 'kas':
                if hasattr(instance, 'kas_decisions'):
                    has_decision = instance.kas_decisions.exists()
                if hasattr(instance, 'kas_executions'):
                    has_execution = instance.kas_executions.exists()
                
                # Проверяем дату рассмотрения
                if instance.hearing_date:
                    has_decision = True
        except Exception as e:
            logger.error(f"Ошибка проверки статуса для дела {instance.id}: {e}")
            return instance.status
        
        # Определяем новый статус
        if has_execution:
            new_status = 'execution'
        elif has_decision:
            new_status = 'completed'
        else:
            new_status = 'active'
        
        # Если дело в архиве, не меняем статус
        if instance.status == 'archived':
            return instance.status
        
        return new_status
    
    @classmethod
    def update_all_case_statuses(cls, instance, case_type: str):
        """Обновляет статус дела и сохраняет его"""
        new_status = cls.update_case_status(instance, case_type)
        
        if new_status != instance.status:
            instance.status = new_status
            instance.save(update_fields=['status'])
            logger.info(f"Статус дела {instance.id} ({case_type}) обновлен на {new_status}")
        
        return new_status


class PersonSearchService:
    """Сервис для получения подробной информации об участнике и всех его делах"""
    
    @classmethod
    def get_person_details(cls, person_id: int) -> Dict[str, Any]:
        """
        Получает подробную информацию об участнике и все дела, в которых он участвует
        
        Args:
            person_id: ID участника (SidesCaseInCase)
            
        Returns:
            Словарь с данными участника и списком дел
        """
        try:
            person = SidesCaseInCase.objects.get(id=person_id)
        except SidesCaseInCase.DoesNotExist:
            return None
        
        # Основная информация об участнике
        person_data = {
            'id': person.id,
            'name': person.name,
            'person_type': person.person_type,
            'phone': person.phone,
            'address': person.address,
            'email': person.email,
            'comment': person.comment,
            'business_card_id': person.business_card_id,
            'created_at': person.created_at.isoformat() if person.created_at else None,
            'updated_at': person.updated_at.isoformat() if person.updated_at else None,
        }
        
        # Добавляем дополнительные поля для физических лиц
        if hasattr(person, 'birth_date'):
            person_data['birth_date'] = person.birth_date.isoformat() if person.birth_date else None
        if hasattr(person, 'gender'):
            person_data['gender'] = person.gender
        if hasattr(person, 'document_type'):
            person_data['document_type'] = person.document_type
        if hasattr(person, 'document_series'):
            person_data['document_series'] = person.document_series
        if hasattr(person, 'document_number'):
            person_data['document_number'] = person.document_number
        
        # Добавляем поля для юридических лиц
        if hasattr(person, 'inn'):
            person_data['inn'] = person.inn
        if hasattr(person, 'kpp'):
            person_data['kpp'] = person.kpp
        if hasattr(person, 'ogrn'):
            person_data['ogrn'] = person.ogrn
        if hasattr(person, 'director_name'):
            person_data['director_name'] = person.director_name
        if hasattr(person, 'legal_address'):
            person_data['legal_address'] = person.legal_address
        
        # Находим все дела, в которых участвует этот человек
        cases = cls._find_all_cases_for_person(person_id, person.name)
        
        return {
            'person': person_data,
            'cases': cases
        }
    
    @classmethod
    def _find_all_cases_for_person(cls, person_id: int, person_name: str) -> List[Dict[str, Any]]:
        """Поиск всех дел, в которых участвует человек"""
        cases = []
        
        # Поиск в уголовных делах
        criminal_cases = cls._search_in_criminal_cases(person_id, person_name)
        cases.extend(criminal_cases)
        
        # Поиск в гражданских делах
        civil_cases = cls._search_in_civil_cases(person_id, person_name)
        cases.extend(civil_cases)
        
        # Поиск в административных делах (КоАП)
        admin_cases = cls._search_in_admin_cases(person_id, person_name)
        cases.extend(admin_cases)
        
        # Поиск в делах КАС
        kas_cases = cls._search_in_kas_cases(person_id, person_name)
        cases.extend(kas_cases)
        
        return cases
    
    @classmethod
    def _search_in_criminal_cases(cls, person_id: int, person_name: str) -> List[Dict[str, Any]]:
        """Поиск в уголовных делах"""
        from criminal_proceedings.models import CriminalProceedings, CriminalSidesCaseInCase, Defendant, LawyerCriminal
        
        cases = []
        
        # Поиск через CriminalSidesCaseInCase
        sides = CriminalSidesCaseInCase.objects.filter(
            criminal_side_case_id=person_id
        ).select_related('criminal_proceedings')
        
        for side in sides:
            if side.criminal_proceedings:
                case_data = cls._format_case_data(
                    side.criminal_proceedings, 
                    'criminal',
                    side.sides_case_criminal.sides_case if side.sides_case_criminal else 'Сторона'
                )
                cases.append(case_data)
        
        # Поиск через Defendants
        defendants = Defendant.objects.filter(
            sides_case_defendant_id=person_id
        ).select_related('criminal_proceedings')
        
        for defendant in defendants:
            if defendant.criminal_proceedings:
                case_data = cls._format_case_data(
                    defendant.criminal_proceedings,
                    'criminal',
                    'Обвиняемый'
                )
                cases.append(case_data)
        
        # Поиск через LawyerCriminal
        lawyers = LawyerCriminal.objects.filter(
            sides_case_lawyer_criminal_id=person_id
        ).select_related('criminal_proceedings')
        
        for lawyer in lawyers:
            if lawyer.criminal_proceedings:
                case_data = cls._format_case_data(
                    lawyer.criminal_proceedings,
                    'criminal',
                    'Адвокат'
                )
                cases.append(case_data)
        
        return cases
    
    @classmethod
    def _search_in_civil_cases(cls, person_id: int, person_name: str) -> List[Dict[str, Any]]:
        """Поиск в гражданских делах"""
        from civil_proceedings.models import CivilProceedings, CivilSidesCaseInCase, CivilLawyer
        
        cases = []
        
        # Поиск через CivilSidesCaseInCase
        sides = CivilSidesCaseInCase.objects.filter(
            sides_case_incase_id=person_id
        ).select_related('civil_proceedings', 'sides_case_role')
        
        for side in sides:
            if side.civil_proceedings:
                case_data = cls._format_case_data(
                    side.civil_proceedings,
                    'civil',
                    side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                )
                cases.append(case_data)
        
        # Поиск через CivilLawyer
        lawyers = CivilLawyer.objects.filter(
            lawyer_id=person_id
        ).select_related('civil_proceedings', 'sides_case_role')
        
        for lawyer in lawyers:
            if lawyer.civil_proceedings:
                case_data = cls._format_case_data(
                    lawyer.civil_proceedings,
                    'civil',
                    f"Представитель ({lawyer.sides_case_role.sides_case if lawyer.sides_case_role else ''})"
                )
                cases.append(case_data)
        
        return cases
    
    @classmethod
    def _search_in_admin_cases(cls, person_id: int, person_name: str) -> List[Dict[str, Any]]:
        """Поиск в административных делах (КоАП)"""
        from administrative_code.models import AdministrativeProceedings, AdministrativeSidesCaseInCase, AdministrativeLawyer
        
        cases = []
        
        # Поиск через AdministrativeSidesCaseInCase
        sides = AdministrativeSidesCaseInCase.objects.filter(
            sides_case_incase_id=person_id
        ).select_related('administrative_proceedings', 'sides_case_role')
        
        for side in sides:
            if side.administrative_proceedings:
                case_data = cls._format_case_data(
                    side.administrative_proceedings,
                    'administrative',
                    side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                )
                cases.append(case_data)
        
        # Поиск через AdministrativeLawyer
        lawyers = AdministrativeLawyer.objects.filter(
            lawyer_id=person_id
        ).select_related('administrative_proceedings', 'sides_case_role')
        
        for lawyer in lawyers:
            if lawyer.administrative_proceedings:
                case_data = cls._format_case_data(
                    lawyer.administrative_proceedings,
                    'administrative',
                    f"Защитник ({lawyer.sides_case_role.sides_case if lawyer.sides_case_role else ''})"
                )
                cases.append(case_data)
        
        return cases
    
    @classmethod
    def _search_in_kas_cases(cls, person_id: int, person_name: str) -> List[Dict[str, Any]]:
        """Поиск в делах КАС"""
        from administrative_proceedings.models import KasProceedings, KasSidesCaseInCase, KasLawyer
        
        cases = []
        
        # Поиск через KasSidesCaseInCase
        sides = KasSidesCaseInCase.objects.filter(
            sides_case_incase_id=person_id
        ).select_related('kas_proceedings', 'sides_case_role')
        
        for side in sides:
            if side.kas_proceedings:
                case_data = cls._format_case_data(
                    side.kas_proceedings,
                    'kas',
                    side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                )
                cases.append(case_data)
        
        # Поиск через KasLawyer
        lawyers = KasLawyer.objects.filter(
            lawyer_id=person_id
        ).select_related('kas_proceedings', 'sides_case_role')
        
        for lawyer in lawyers:
            if lawyer.kas_proceedings:
                case_data = cls._format_case_data(
                    lawyer.kas_proceedings,
                    'kas',
                    f"Представитель ({lawyer.sides_case_role.sides_case if lawyer.sides_case_role else ''})"
                )
                cases.append(case_data)
        
        return cases
    
    @classmethod
    def _format_case_data(cls, instance, case_type: str, role: str) -> Dict[str, Any]:
        """Форматирование данных дела для ответа"""
        
        # Получаем номер дела в зависимости от типа
        if case_type == 'criminal':
            case_number = instance.case_number_criminal
        elif case_type == 'civil':
            case_number = instance.case_number_civil
        elif case_type == 'administrative':
            case_number = instance.case_number_admin
        elif case_type == 'kas':
            case_number = instance.case_number_kas
        else:
            case_number = getattr(instance, 'case_number', '')
        
        # Получаем дату поступления
        incoming_date = getattr(instance, 'incoming_date', None)
        if incoming_date:
            incoming_date = incoming_date.isoformat()
        
        # Получаем статус
        status = getattr(instance, 'status', 'active')
        
        return {
            'id': instance.id,
            'case_type': case_type,
            'case_number': case_number,
            'incoming_date': incoming_date,
            'status': status,
            'role': role,
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
        }
