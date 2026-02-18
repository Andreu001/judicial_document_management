import baseService from './baseService';

const CIVIL_BASE_URL = '/civil_proceedings/civil-proceedings/';

class MovementService {
  static async getAllMove(cardId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${cardId}/movements/`);
      return response;
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllMove:', error);
      throw error;
    }
  }

  static async getMovement(cardId, moveId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${cardId}/movements/${moveId}/`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении движения:', error);
      throw error;
    }
  }

  static async createMovement(cardId, movementData) {
    try {
      const response = await baseService.post(
        `${CIVIL_BASE_URL}${cardId}/movements/`,
        movementData
      );
      return response;
    } catch (error) {
      console.error('Ошибка при создании движения:', error);
      throw error;
    }
  }

  static async updateMovement(cardId, moveId, updatedData) {
    try {
      const response = await baseService.patch(
        `${CIVIL_BASE_URL}${cardId}/movements/${moveId}/`,
        updatedData
      );
      return response;
    } catch (error) {
      console.error('Error updating movement:', error);
      throw error;
    }
  }

  static async getDecisionCases() {
    try {
      const response = await baseService.get('/business_card/decisions/');
      return response;
    } catch (error) {
      console.error('Ошибка при выполнении запроса decisions:', error);
      throw error;
    }
  }

  static async remove(cardId, moveId) {
    try {
      const response = await baseService.delete(`${CIVIL_BASE_URL}${cardId}/movements/${moveId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting movement:', error);
      throw new Error(`Ошибка удаления движения: ${error.message}`);
    }
  }
}

export default MovementService;