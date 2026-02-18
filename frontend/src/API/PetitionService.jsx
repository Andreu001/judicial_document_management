import baseService from './baseService';

const CIVIL_BASE_URL = '/civil_proceedings/civil-proceedings/';

class PetitionService {
  // Получение всех ходатайств по гражданскому делу
  static async getAllPetitions(cardId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${cardId}/petitions/`);
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllPetitions:', error);
      throw error;
    }
  }

  // Получение конкретного ходатайства
  static async getPetition(cardId, petitionId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${cardId}/petitions/${petitionId}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting petition:', error);
      throw error;
    }
  }

  // Создание нового ходатайства
  static async createPetition(cardId, petitionData) {
    try {
      const response = await baseService.post(
        `${CIVIL_BASE_URL}${cardId}/petitions/`,
        petitionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating petition:', error);
      throw error;
    }
  }

  static async updatePetition(cardId, petitionId, petitionData) {
    try {
      // Проверяем, что petitionId существует
      if (!petitionId || petitionId === 'create') {
        throw new Error('Не указан ID ходатайства для обновления');
      }
      
      const response = await baseService.patch(
        `${CIVIL_BASE_URL}${cardId}/petitions/${petitionId}/`,
        petitionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating petition:', error);
      throw error;
    }
  }

  // Удаление ходатайства
  static async deletePetition(cardId, petitionId) {
    try {
      const response = await baseService.delete(
        `${CIVIL_BASE_URL}${cardId}/petitions/${petitionId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting petition:', error);
      throw new Error(`Ошибка удаления ходатайства: ${error.message}`);
    }
  }

  // Получение списка всех доступных типов ходатайств
  static async getPetitionTypes() {
    try {
      const response = await baseService.get('/business_card/petitions/');
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при загрузке типов ходатайств:', error);
      throw error;
    }
  }

  // Получение списка всех решений для ходатайств
  static async getDecisions() {
    try {
      const response = await baseService.get('/business_card/decisions/');
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при загрузке решений:', error);
      throw error;
    }
  }

  // Получение списка сторон для гражданского дела (для выбора заявителя)
  static async getSides(cardId) {
    try {
      const response = await baseService.get(
        `/civil_proceedings/civil-proceedings/${cardId}/sides/`
      );
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при загрузке сторон:', error);
      return [];
    }
  }

  // Получение списка адвокатов для гражданского дела (для выбора заявителя)
  static async getLawyers(cardId) {
    try {
      const response = await baseService.get(
        `/civil_proceedings/civil-proceedings/${cardId}/lawyers/`
      );
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при загрузке адвокатов:', error);
      return [];
    }
  }
}

export default PetitionService;