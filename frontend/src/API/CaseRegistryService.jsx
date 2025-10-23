import baseService from './baseService';

class CaseRegistryService {
  // Получить все индексы
  async getIndexes() {
    try {
      const response = await baseService.get('/case-registry/indexes/');
      return response.data;
    } catch (error) {
      console.error('Error fetching registry indexes:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  // Получить следующий номер для индекса
  async getNextNumber(indexCode) {
    try {
      console.log('Fetching next number for index:', indexCode);
      const response = await baseService.get(`/case-registry/next-number/${indexCode}/`);
      console.log('Next number response:', response.data);
      return response.data.next_number;
    } catch (error) {
      console.error('Error fetching next number:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  async registerCase(caseData) {
    try {
      console.log('Registering case:', caseData);
      // ИСПРАВИТЕ URL на правильный
      const response = await baseService.post('/case-registry/cases/register/', caseData);
      console.log('Case registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error registering case:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  // Обновить зарегистрированное дело
  async updateCase(caseId, caseData) {
    try {
      const response = await baseService.patch(`/case-registry/cases/${caseId}/`, caseData);
      return response.data;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  }

  // Получить зарегистрированные дела
  async getCases(params = {}) {
    try {
      const response = await baseService.get('/case-registry/cases/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching cases:', error);
      throw error;
    }
  }

  // Удалить дело (с откатом нумерации)
  async deleteCase(caseId, reason = "Удаление по запросу пользователя") {
    try {
      const response = await baseService.post(`/case-registry/cases/${caseId}/delete_case/`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting case:', error);
      throw error;
    }
  }
}

export default new CaseRegistryService();