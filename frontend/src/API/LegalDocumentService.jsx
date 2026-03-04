// LegalDocumentService.js
import baseService from './baseService';

class LegalDocumentService {
  // Получение списка документов с фильтрацией
  async getDocuments(params = {}) {
    try {
      const response = await baseService.get('/legal-documents/documents/', { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
      throw error;
    }
  }

  // Получение документа по ID
  async getDocumentById(id) {
    try {
      const response = await baseService.get(`/legal-documents/documents/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки документа:', error);
      throw error;
    }
  }

  // Создание документа
  async createDocument(data) {
    try {
      const response = await baseService.post('/legal-documents/documents/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка создания документа:', error);
      throw error;
    }
  }

  // Обновление документа
  async updateDocument(id, data) {
    try {
      const response = await baseService.patch(`/legal-documents/documents/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления документа:', error);
      throw error;
    }
  }

  // Удаление документа
  async deleteDocument(id) {
    try {
      const response = await baseService.delete(`/legal-documents/documents/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления документа:', error);
      throw error;
    }
  }

  // Получение документов по типу
  async getDocumentsByType(type) {
    try {
      const response = await baseService.get(`/legal-documents/documents/by-type/${type}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки документов по типу:', error);
      throw error;
    }
  }

  // Получение документов по категории
  async getDocumentsByCategory(category) {
    try {
      const response = await baseService.get(`/legal-documents/documents/by-category/${category}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки документов по категории:', error);
      throw error;
    }
  }

  // Последние загруженные документы
  async getRecentDocuments() {
    try {
      const response = await baseService.get('/legal-documents/documents/recent/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки последних документов:', error);
      throw error;
    }
  }

  // Расширенный поиск
  async advancedSearch(searchParams) {
    try {
      const response = await baseService.post('/legal-documents/documents/advanced_search/', searchParams);
      return response.data;
    } catch (error) {
      console.error('Ошибка расширенного поиска:', error);
      throw error;
    }
  }

  // Получение статистики
  async getStats() {
    try {
      const response = await baseService.get('/legal-documents/documents/stats/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      throw error;
    }
  }
}

export default new LegalDocumentService();