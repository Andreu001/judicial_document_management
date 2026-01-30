import baseService from './baseService';

class SideService {
  static async updateSide(cardId, sideId, updatedData) {
    try {
      const response = await baseService.patch(`/business_card/businesscard/${cardId}/sidescaseincase/${sideId}/`, updatedData);
      return response.data;
    } catch (error) {
      console.error('Error updating side:', error);
      throw error;
    }
  }

  static async getAllSide(cardId) {
    try {
      const response = await baseService.get(`/business_card/businesscard/${cardId}/sidescaseincase/`);
      return response;
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllSide:', error);
      throw error;
    }
  }

  static async getSideById(cardId, sideId) {
    try {
      const response = await baseService.get(`/business_card/businesscard/${cardId}/sidescaseincase/${sideId}/`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении конкретной стороны:', error);
      throw error;
    }
  }

  static async remove(cardId, sideId) {
    try {
      const response = await baseService.delete(`/business_card/businesscard/${cardId}/sidescaseincase/${sideId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting side:', error);
      throw new Error(`Ошибка удаления стороны: ${error.message}`);
    }
  }

  
}

export default SideService;