import baseService from './baseService';

class LawyerService {
  static async createLawyer(cardId, lawyerData) {
    try {
      const response = await baseService.post(
        `/business_card/businesscard/${cardId}/lawyers/`,
        lawyerData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating lawyer:', error);
      throw error;
    }
  }

  static async updateLawyer(cardId, lawyerId, lawyerData) {
    try {
      const response = await baseService.patch(
        `/business_card/businesscard/${cardId}/lawyers/${lawyerId}/`,
        lawyerData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating lawyer:', error);
      throw error;
    }
  }

  static async deleteLawyer(cardId, lawyerId) {
    try {
      const response = await baseService.delete(
        `/business_card/businesscard/${cardId}/lawyers/${lawyerId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      throw error;
    }
  }

  static async getLawyer(cardId, lawyerId) {
    try {
      const response = await baseService.get(
        `/business_card/businesscard/${cardId}/lawyers/${lawyerId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting lawyer:', error);
      throw error;
    }
  }

  static async getAllLawyers(cardId) {
    try {
      const response = await baseService.get(
        `/business_card/businesscard/${cardId}/lawyers/`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting lawyers:', error);
      throw error;
    }
  }
}

export default LawyerService;