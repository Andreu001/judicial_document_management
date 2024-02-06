import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';


export const updateSide = async (cardId, sideId, updatedData) => {
  try {
    const response = await axios.patch(`http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/${sideId}/`, updatedData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export default class SideService {
  static async getAllSide(cardId) {
    const response = await axios.get(`http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/`);
    return response;
  } catch (error) {
    console.error('Ошибка при выполнении запроса getAllSide:', error);
    throw error; // Выбрасываем ошибку дальше
  }


  static async remove(cardId, sideId) {
    try {
        const response = await axios.delete(`http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/${sideId}/`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error(`Ошибка удаления стороны: ${error}`);
    }
}
}
