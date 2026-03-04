import baseService from './baseService';

const CIVIL_BASE_URL = '/civil_proceedings/civil-proceedings/';
const ADMIN_BASE_URL = '/administrative_code/administrative-proceedings/';

class MovementService {
  
  // === Гражданские дела ===
  
  static async getAllCivilMove(cardId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${cardId}/movements/`);
      return response;
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllCivilMove:', error);
      throw error;
    }
  }

  static async getCivilMovement(cardId, moveId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${cardId}/movements/${moveId}/`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении движения по гражданскому делу:', error);
      throw error;
    }
  }

  static async createCivilMovement(cardId, movementData) {
    try {
      const response = await baseService.post(
        `${CIVIL_BASE_URL}${cardId}/movements/`,
        movementData
      );
      return response;
    } catch (error) {
      console.error('Ошибка при создании движения по гражданскому делу:', error);
      throw error;
    }
  }

  static async updateCivilMovement(cardId, moveId, updatedData) {
    try {
      const response = await baseService.patch(
        `${CIVIL_BASE_URL}${cardId}/movements/${moveId}/`,
        updatedData
      );
      return response;
    } catch (error) {
      console.error('Error updating civil movement:', error);
      throw error;
    }
  }

  static async deleteCivilMovement(cardId, moveId) {
    try {
      const response = await baseService.delete(`${CIVIL_BASE_URL}${cardId}/movements/${moveId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting civil movement:', error);
      throw new Error(`Ошибка удаления движения: ${error.message}`);
    }
  }

  // === Административные дела ===
  
  static async getAllAdminMove(cardId) {
    try {
      const response = await baseService.get(`${ADMIN_BASE_URL}${cardId}/movements/`);
      return response;
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllAdminMove:', error);
      throw error;
    }
  }

  static async getAdminMovement(cardId, moveId) {
    try {
      const response = await baseService.get(`${ADMIN_BASE_URL}${cardId}/movements/${moveId}/`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении движения по административному делу:', error);
      throw error;
    }
  }

  static async createAdminMovement(cardId, movementData) {
    try {
      const response = await baseService.post(
        `${ADMIN_BASE_URL}${cardId}/movements/`,
        movementData
      );
      return response;
    } catch (error) {
      console.error('Ошибка при создании движения по административному делу:', error);
      throw error;
    }
  }

  static async updateAdminMovement(cardId, moveId, updatedData) {
    try {
      const response = await baseService.patch(
        `${ADMIN_BASE_URL}${cardId}/movements/${moveId}/`,
        updatedData
      );
      return response;
    } catch (error) {
      console.error('Error updating admin movement:', error);
      throw error;
    }
  }

  static async deleteAdminMovement(cardId, moveId) {
    try {
      const response = await baseService.delete(`${ADMIN_BASE_URL}${cardId}/movements/${moveId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting admin movement:', error);
      throw new Error(`Ошибка удаления движения: ${error.message}`);
    }
  }

  // === Универсальные методы ===
  
  static async getAllMove(cardId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.getAllAdminMove(cardId);
    }
    return this.getAllCivilMove(cardId);
  }

  static async getMovement(cardId, moveId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.getAdminMovement(cardId, moveId);
    }
    return this.getCivilMovement(cardId, moveId);
  }

  static async createMovement(cardId, movementData, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.createAdminMovement(cardId, movementData);
    }
    return this.createCivilMovement(cardId, movementData);
  }

  static async updateMovement(cardId, moveId, updatedData, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.updateAdminMovement(cardId, moveId, updatedData);
    }
    return this.updateCivilMovement(cardId, moveId, updatedData);
  }

  static async deleteMovement(cardId, moveId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.deleteAdminMovement(cardId, moveId);
    }
    return this.deleteCivilMovement(cardId, moveId);
  }

  // === Общие методы (не зависят от типа дела) ===
  
  static async getDecisionCases() {
    try {
      const response = await baseService.get('/business_card/decisions/');
      return response;
    } catch (error) {
      console.error('Ошибка при выполнении запроса decisions:', error);
      throw error;
    }
  }
}

export default MovementService;