import baseService from './baseService';

const BASE_URL = '/criminal_proceedings/businesscard/';

class CriminalCaseService {
  static cleanData(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  static async getRulings(businesscardId) {
    try {
      const response = await baseService.get(`${BASE_URL}${businesscardId}/rulings/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching rulings:', error);
      throw error;
    }
  }

  static async getRulingById(businesscardId, rulingId) {
    try {
      const response = await baseService.get(`${BASE_URL}${businesscardId}/rulings/${rulingId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Постановление не найдено');
      }
      console.error('Error fetching ruling:', error);
      throw error;
    }
  }

  static async createRuling(businesscardId, rulingData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}${businesscardId}/rulings/`, 
        rulingData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating ruling:', error);
      throw error;
    }
  }

  static async updateRuling(businesscardId, rulingId, rulingData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}${businesscardId}/rulings/${rulingId}/`, 
        rulingData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating ruling:', error);
      throw error;
    }
  }

  static async deleteRuling(businesscardId, rulingId) {
    try {
      await baseService.delete(`${BASE_URL}${businesscardId}/rulings/${rulingId}/`);
    } catch (error) {
      console.error('Error deleting ruling:', error);
      throw error;
    }
  }

  static async update(businesscardId, criminalData) {
    try {
      // Получаем существующую запись
      const existingData = await this.getByBusinessCardId(businesscardId);
      
      if (!existingData) {
        // Если запись не существует, создаем новую
        console.log('Создание новой записи уголовного дела');
        return await this.create(businesscardId, criminalData);
      }

      // Проверяем, что ID существует
      if (!existingData.id) {
        throw new Error('ID уголовного дела не найден в существующих данных');
      }

      console.log('Обновление существующей записи с ID:', existingData.id);
      
      // Очищаем данные от null значений
      const cleanedData = this.cleanData(criminalData);
      
      // Отправляем PATCH запрос
      const response = await baseService.patch(
        `/criminal_proceedings/businesscard/${businesscardId}/criminal/${existingData.id}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating criminal case:', error);
      
      // Добавляем более детальную информацию об ошибке
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      
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
      console.log('Ответ от сервера:', response.data);
      
      // Сервер возвращает массив, берем первый элемент
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0]; // Возвращаем первый объект из массива
      }
      
      // Если массив пустой или null, возвращаем null
      console.log('Уголовное дело не найдено, возвращаем null');
      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Уголовное дело не найдено (404), возвращаем null');
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
