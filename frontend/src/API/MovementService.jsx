import baseService from './baseService';

export const updateMove = async (cardId, moveId, updatedData) => {
  try {
    const response = await baseService.patch(`/business_card/businesscard/${cardId}/businessmovement/${moveId}/`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating movement:', error);
    throw error;
  }
};

class MovementService {
  static async getAllMove(cardId) {
    try {
      const response = await baseService.get(`/business_card/businesscard/${cardId}/businessmovement/`);
      return response;
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllMove:', error);
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
      const response = await baseService.delete(`/business_card/businesscard/${cardId}/businessmovement/${moveId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting movement:', error);
      throw new Error(`Ошибка удаления движения: ${error.message}`);
    }
  }
}

export default MovementService;