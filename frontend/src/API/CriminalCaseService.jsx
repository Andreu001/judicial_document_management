import baseService from './baseService';

const BASE_URL = '/criminal_proceedings/businesscard/';

class CriminalCaseService {
  static async update(businesscardId, criminalData) {
    try {
      // Получаем существующую запись
      const existingData = await this.getByBusinessCardId(businesscardId);
      
      if (!existingData) {
        throw new Error('Уголовное дело не найдено');
      }

      // Отправляем только измененные данные
      const response = await baseService.patch(
        `/criminal_proceedings/businesscard/${businesscardId}/criminal/${existingData.id}/`,
        criminalData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating criminal case:', error);
      throw error;
    }
  }

  static async create(businesscardId, criminalData) {
    try {
      const response = await baseService.post(
        `/criminal_proceedings/businesscard/${businesscardId}/criminal/`,
        criminalData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating criminal case:', error);
      throw error;
    }
  }

  static async updateDefendant(businesscardId, defendantId, defendantData) {
    try {
      // Для ManyToManyField нужно отправлять полный массив
      const response = await baseService.patch(
        `${BASE_URL}${businesscardId}/defendants/${defendantId}/`, 
        defendantData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating defendant:', error);
      throw error;
    }
  }

  static async getDefendantById(businesscardId, defendantId) {
    try {
      const response = await baseService.get(`${BASE_URL}${businesscardId}/defendants/${defendantId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Обвиняемый не найден');
      }
      console.error('Error fetching defendant:', error);
      throw error;
    }
  }

  static async createDefendant(businesscardId, defendantData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}${businesscardId}/defendants/`, 
        defendantData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating defendant:', error);
      throw error;
    }
  }

  static async getByBusinessCardId(businesscardId) {
    try {
      const response = await baseService.get(`/criminal_proceedings/businesscard/${businesscardId}/criminal/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Full error:', error);
        return null;
      }
      console.error('Error fetching criminal case:', error);
      throw error;
    }
  }

  static async getDefendants(businesscardId) {
    try {
      const response = await baseService.get(`${BASE_URL}${businesscardId}/defendants/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching defendants:', error);
      throw error;
    }
  }

  static async createDefendant(businesscardId, defendantData) {
    try {
      const response = await baseService.post(`${BASE_URL}${businesscardId}/defendants/`, defendantData);
      return response.data;
    } catch (error) {
      console.error('Error creating defendant:', error);
      throw error;
    }
  }

  static async updateDefendant(businesscardId, defendantId, defendantData) {
    try {
      const response = await baseService.patch(`${BASE_URL}${businesscardId}/defendants/${defendantId}/`, defendantData);
      return response.data;
    } catch (error) {
      console.error('Error updating defendant:', error);
      throw error;
    }
  }

  static async deleteDefendant(businesscardId, defendantId) {
    try {
      await baseService.delete(`${BASE_URL}${businesscardId}/defendants/${defendantId}/`);
    } catch (error) {
      console.error('Error deleting defendant:', error);
      throw error;
    }
  }

  static async create(businesscardId, criminalData) {
    try {
      const response = await baseService.post(
        `/criminal_proceedings/businesscard/${businesscardId}/criminal/`,
        criminalData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating criminal case:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  static async getDecisions(businesscardId) {
    try {
      const response = await baseService.get(`${BASE_URL}${businesscardId}/criminal-decisions/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching criminal decisions:', error);
      throw error;
    }
  }

  static async getDecisionById(businesscardId, decisionId) {
    try {
      const response = await baseService.get(`${BASE_URL}${businesscardId}/criminal-decisions/${decisionId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Решение не найдено');
      }
      console.error('Error fetching criminal decision:', error);
      throw error;
    }
  }

  static async createDecision(businesscardId, decisionData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}${businesscardId}/criminal-decisions/`, 
        decisionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating criminal decision:', error);
      throw error;
    }
  }

  static async updateDecision(businesscardId, decisionId, decisionData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}${businesscardId}/criminal-decisions/${decisionId}/`, 
        decisionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating criminal decision:', error);
      throw error;
    }
  }

  static async deleteDecision(businesscardId, decisionId) {
    try {
      await baseService.delete(`${BASE_URL}${businesscardId}/criminal-decisions/${decisionId}/`);
    } catch (error) {
      console.error('Error deleting criminal decision:', error);
      throw error;
    }
  }
}

export default CriminalCaseService;