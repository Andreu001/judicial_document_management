import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

export const updateConsidered = async (cardId, consideredId, updatedData) => {
  try {
    const response = await axios.patch(
      `http://localhost:8000/business_card/businesscard/${cardId}/considered/${consideredId}/`, 
      updatedData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default class ConsideredService {
  static async getAllConsidereds(cardId) {
    try {
      const response = await axios.get(
        `http://localhost:8000/business_card/businesscard/${cardId}/considered/`
      );
      return response;
    } catch (error) {
      console.error('Ошибка при получении рассмотренных дел:', error);
      throw error;
    }
  }

  static async remove(cardId, consideredId) {
    try {
      const response = await axios.delete(
        `http://localhost:8000/business_card/businesscard/${cardId}/considered/${consideredId}/`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );
      console.log(response);
      return response.data;
    } catch (error) {
      console.error(`Ошибка удаления решения:`, error);
      throw new Error(`Ошибка удаления решения: ${error}`);
    }
  }
}
