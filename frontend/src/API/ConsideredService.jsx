import baseService from './baseService';

export const updateConsidered = async (cardId, consideredId, updatedData) => {
  try {
    const response = await baseService.patch(`/business_card/businesscard/${cardId}/considered/${consideredId}/`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating considered:', error);
    throw error;
  }
};

class ConsideredService {
  static async getAllConsidereds(cardId) {
    try {
      const response = await baseService.get(`/business_card/businesscard/${cardId}/considered/`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении рассмотренных дел:', error);
      throw error;
    }
  }

  static async remove(cardId, consideredId) {
    try {
      const response = await baseService.delete(`/business_card/businesscard/${cardId}/considered/${consideredId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting considered:', error);
      throw new Error(`Ошибка удаления решения: ${error.message}`);
    }
  }
}

export default ConsideredService;