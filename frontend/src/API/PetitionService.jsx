import baseService from './baseService';

const CIVIL_BASE_URL = '/civil_proceedings/civil-proceedings/';
const ADMIN_BASE_URL = '/administrative_code/administrative-proceedings/';

class PetitionService {
  
  // === Гражданские дела ===
  
  // Получение всех ходатайств по гражданскому делу
  static async getAllCivilPetitions(cardId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${cardId}/petitions/`);
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllCivilPetitions:', error);
      throw error;
    }
  }

  // Получение конкретного ходатайства по гражданскому делу
  static async getCivilPetition(cardId, petitionId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${cardId}/petitions/${petitionId}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting civil petition:', error);
      throw error;
    }
  }

  // Создание нового ходатайства по гражданскому делу
  static async createCivilPetition(cardId, petitionData) {
    try {
      const response = await baseService.post(
        `${CIVIL_BASE_URL}${cardId}/petitions/`,
        petitionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating civil petition:', error);
      throw error;
    }
  }

  // Обновление ходатайства по гражданскому делу
  static async updateCivilPetition(cardId, petitionId, petitionData) {
    try {
      if (!petitionId || petitionId === 'create') {
        throw new Error('Не указан ID ходатайства для обновления');
      }
      
      const response = await baseService.patch(
        `${CIVIL_BASE_URL}${cardId}/petitions/${petitionId}/`,
        petitionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating civil petition:', error);
      throw error;
    }
  }

  // Удаление ходатайства по гражданскому делу
  static async deleteCivilPetition(cardId, petitionId) {
    try {
      const response = await baseService.delete(
        `${CIVIL_BASE_URL}${cardId}/petitions/${petitionId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting civil petition:', error);
      throw new Error(`Ошибка удаления ходатайства: ${error.message}`);
    }
  }

  // === Административные дела ===
  
  // Получение всех ходатайств по административному делу
  static async getAllAdminPetitions(cardId) {
    try {
      const response = await baseService.get(`${ADMIN_BASE_URL}${cardId}/petitions/`);
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllAdminPetitions:', error);
      throw error;
    }
  }

  // Получение конкретного ходатайства по административному делу
  static async getAdminPetition(cardId, petitionId) {
    try {
      const response = await baseService.get(`${ADMIN_BASE_URL}${cardId}/petitions/${petitionId}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting admin petition:', error);
      throw error;
    }
  }

  // Создание нового ходатайства по административному делу
  static async createAdminPetition(cardId, petitionData) {
    try {
      const response = await baseService.post(
        `${ADMIN_BASE_URL}${cardId}/petitions/`,
        petitionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating admin petition:', error);
      throw error;
    }
  }

  // Обновление ходатайства по административному делу
  static async updateAdminPetition(cardId, petitionId, petitionData) {
    try {
      if (!petitionId || petitionId === 'create') {
        throw new Error('Не указан ID ходатайства для обновления');
      }
      
      const response = await baseService.patch(
        `${ADMIN_BASE_URL}${cardId}/petitions/${petitionId}/`,
        petitionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating admin petition:', error);
      throw error;
    }
  }

  // Удаление ходатайства по административному делу
  static async deleteAdminPetition(cardId, petitionId) {
    try {
      const response = await baseService.delete(
        `${ADMIN_BASE_URL}${cardId}/petitions/${petitionId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting admin petition:', error);
      throw new Error(`Ошибка удаления ходатайства: ${error.message}`);
    }
  }

  // === Универсальные методы ===
  
  static async getAllPetitions(cardId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.getAllAdminPetitions(cardId);
    }
    return this.getAllCivilPetitions(cardId);
  }

  static async getPetition(cardId, petitionId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.getAdminPetition(cardId, petitionId);
    }
    return this.getCivilPetition(cardId, petitionId);
  }

  static async createPetition(cardId, petitionData, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.createAdminPetition(cardId, petitionData);
    }
    return this.createCivilPetition(cardId, petitionData);
  }

  static async updatePetition(cardId, petitionId, petitionData, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.updateAdminPetition(cardId, petitionId, petitionData);
    }
    return this.updateCivilPetition(cardId, petitionId, petitionData);
  }

  static async deletePetition(cardId, petitionId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.deleteAdminPetition(cardId, petitionId);
    }
    return this.deleteCivilPetition(cardId, petitionId);
  }

  // === Общие методы (не зависят от типа дела) ===
  
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
  static async getCivilSides(cardId) {
    try {
      const response = await baseService.get(
        `${CIVIL_BASE_URL}${cardId}/sides/`
      );
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при загрузке сторон по гражданскому делу:', error);
      return [];
    }
  }

  // Получение списка сторон для административного дела (для выбора заявителя)
  static async getAdminSides(cardId) {
    try {
      const response = await baseService.get(
        `${ADMIN_BASE_URL}${cardId}/sides/`
      );
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при загрузке сторон по административному делу:', error);
      return [];
    }
  }

  // Получение списка адвокатов для гражданского дела (для выбора заявителя)
  static async getCivilLawyers(cardId) {
    try {
      const response = await baseService.get(
        `${CIVIL_BASE_URL}${cardId}/lawyers/`
      );
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при загрузке адвокатов по гражданскому делу:', error);
      return [];
    }
  }

  // Получение списка защитников для административного дела (для выбора заявителя)
  static async getAdminLawyers(cardId) {
    try {
      const response = await baseService.get(
        `${ADMIN_BASE_URL}${cardId}/lawyers/`
      );
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при загрузке защитников по административному делу:', error);
      return [];
    }
  }

  // Универсальные методы для получения участников
  static async getSides(cardId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.getAdminSides(cardId);
    }
    return this.getCivilSides(cardId);
  }

  static async getLawyers(cardId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.getAdminLawyers(cardId);
    }
    return this.getCivilLawyers(cardId);
  }
}

export default PetitionService;