import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';


export const updateMove = async (cardId, moveId, updatedData) => {
  try {
    const response = await axios.patch(`http://localhost:8000/business_card/businesscard/${cardId}/businessmovement/${moveId}/`, updatedData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export default class MovementService {
  static async getAllMove(cardId) {
    const response = await axios.get(`http://localhost:8000/business_card/businesscard/${cardId}/businessmovement/`);
    return response;
  } catch (error) {
    console.error('Ошибка при выполнении запроса getAllSide:', error);
    throw error; // Выбрасываем ошибку дальше
  }


  static async remove(cardId, moveId) {
    try {
        const response = await axios.delete(`http://localhost:8000/business_card/businesscard/${cardId}/businessmovement/${moveId}/`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error(`Ошибка удаления движения: ${error}`);
    }
}
}
