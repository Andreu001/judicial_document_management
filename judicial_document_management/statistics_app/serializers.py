# statistics_app/serializers.py
from rest_framework import serializers
from django.apps import apps
from django.db.models import Model


class DynamicFieldSerializer(serializers.Serializer):
    """Динамический сериализатор для любых моделей"""
    
    def __init__(self, model_class, fields, *args, **kwargs):
        self.model_class = model_class
        self.fields_list = fields
        super().__init__(*args, **kwargs)
        
        # Динамически создаем поля
        for field_name in fields:
            self.fields[field_name] = serializers.SerializerMethodField()
    
    def get_field_value(self, obj, field_name):
        """Получение значения поля с поддержкой вложенных связей"""
        parts = field_name.split('__')
        value = obj
        for part in parts:
            if value is None:
                return None
            if hasattr(value, part):
                value = getattr(value, part)
                if callable(value):
                    value = value()
            else:
                return None
        
        # Форматирование дат и других объектов
        if hasattr(value, 'strftime'):
            return value.strftime('%Y-%m-%d')
        if hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool, type(None))):
            return str(value)
        return value
    
    def to_representation(self, instance):
        result = {}
        for field_name in self.fields_list:
            result[field_name] = self.get_field_value(instance, field_name)
        return result