import baseService from './baseService';

class CaseRegistryService {
  async getIndexes() {
    try {
      const response = await baseService.get('/case-registry/indexes/');
      return response.data;
    } catch (error) {
      console.error('Error fetching registry indexes:', error);
      console.error('Error details:', error.response?.data);
      return [];
    }
  }

  async getNextNumber(indexCode) {
    try {
      console.log('Fetching next number for index:', indexCode);
      
      // Экранируем слеши для URL
      const encodedIndex = encodeURIComponent(indexCode);
      const response = await baseService.get(`/case-registry/next-number/${encodedIndex}/`);
      
      console.log('Next number response:', response.data);
      return response.data.next_number;
    } catch (error) {
      console.error('Error fetching next number:', error);
      console.error('Error details:', error.response?.data);
      return null;
    }
  }

  async registerCase(caseData) {
    try {
      console.log('Registering case:', caseData);
      
      const payload = {
        index: caseData.index,
        description: caseData.description || '',
        case_number: caseData.case_number,
        registration_date: caseData.registration_date || new Date().toISOString().split('T')[0],
        business_card_id: caseData.business_card_id || null,
        criminal_proceedings_id: caseData.criminal_proceedings_id || null,
      };
      
      const response = await baseService.post('/case-registry/cases/register/', payload);
      console.log('Case registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error registering case:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  async updateCase(caseId, caseData) {
    try {
      const response = await baseService.patch(`/case-registry/cases/${caseId}/`, caseData);
      return response.data;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  }

  async getCases(params = {}) {
    try {
      if (params.business_card) {
        const response = await baseService.get('/case-registry/cases/', { 
          params: {
            business_card: params.business_card
          }
        });
        return response.data;
      }

      const response = await baseService.get('/case-registry/cases/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching cases:', error);
      console.error('Error URL:', error.config?.url);
      console.error('Error status:', error.response?.status);
      return [];
    }
  }

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