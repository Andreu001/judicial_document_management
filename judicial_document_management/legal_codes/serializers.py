from rest_framework import serializers
from .models import (CriminalCodeArticle, CivilCodeArticle,
    AdministrativeCodeArticle, KASCodeArticle
)

class CriminalCodeArticleSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    parts_list = serializers.SerializerMethodField()
    
    class Meta:
        model = CriminalCodeArticle
        fields = ['id', 'full_number', 'number', 'title', 'full_text', 'display_name', 'chapter', 'section', 'structure', 'parts_list']
    
    def get_display_name(self, obj):
        return f"Ст. {obj.full_number}"
    
    def get_parts_list(self, obj):
        return obj.structure.get('parts', [])


class CivilCodeArticleSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    parts_list = serializers.SerializerMethodField()
    
    class Meta:
        model = CivilCodeArticle
        fields = ['id', 'full_number', 'number', 'title', 'full_text', 'display_name', 
                  'part', 'section', 'subsection', 'chapter', 'structure', 'parts_list']
    
    def get_display_name(self, obj):
        return f"Ст. {obj.full_number} ГК РФ"
    
    def get_parts_list(self, obj):
        return obj.structure.get('parts', [])


class AdministrativeCodeArticleSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    parts_list = serializers.SerializerMethodField()
    
    class Meta:
        model = AdministrativeCodeArticle
        fields = ['id', 'full_number', 'number', 'title', 'full_text', 'display_name', 
                  'section', 'chapter', 'structure', 'parts_list']
    
    def get_display_name(self, obj):
        return f"Ст. {obj.full_number} КоАП РФ"
    
    def get_parts_list(self, obj):
        return obj.structure.get('parts', [])


class KASCodeArticleSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    parts_list = serializers.SerializerMethodField()

    class Meta:
        model = KASCodeArticle
        fields = ['id', 'full_number', 'number', 'title', 'full_text', 'display_name',
                  'section', 'chapter', 'structure', 'parts_list']

    def get_display_name(self, obj):
        return f"Ст. {obj.full_number} КАС РФ"

    def get_parts_list(self, obj):
        return obj.structure.get('parts', [])
