import baseService from './baseService';

export const updatedPetition = async (cardId, petitionsId, updatedData) => {
  try {
    const response = await baseService.patch(`/business_card/businesscard/${cardId}/petitionsincase/${petitionsId}/`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating petition:', error);
    throw error;
  }
};

class PetitionService {
  static async getAllPetitions(cardId) {
    try {
      const response = await baseService.get(`/business_card/businesscard/${cardId}/petitionsincase/`);
      return response;
    } catch (error) {
      console.error('Ошибка при выполнении запроса getAllPetitions:', error);
      throw error;
    }
  }

  // Остальные методы остаются без изменений
  static async getPetition(cardId) {
    try {
      const response = await baseService.get(`/business_card/businesscard/${cardId}/petitionsincase/`);
      return response.data || [];
    } catch (error) {
      console.error('Error getting petitions:', error);
      throw error;
    }
  }

  static async remove(cardId, petitionsId) {
    try {
      const response = await baseService.delete(`/business_card/businesscard/${cardId}/petitionsincase/${petitionsId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting petition:', error);
      throw new Error(`Ошибка удаления ходатайства: ${error.message}`);
    }
  }
}

export default PetitionService;