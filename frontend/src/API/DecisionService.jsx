import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';


export const updatedDesisions = async (cardId, decisionsId, updatedData) => {
  try {
    const response = await axios.patch(`http://localhost:8000/business_card/businesscard/${cardId}/businessmovement/${decisionsId}/`, updatedData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export default class DecisionService {
  static async getAllDesisions(cardId) {
    const response = await axios.get(`http://localhost:8000/business_card/businesscard/${cardId}/businessmovement/`);
    return response;
  } catch (error) {
    console.error('Ошибка при выполнении запроса getAllDesisions:', error);
    throw error; // Выбрасываем ошибку дальше
  }


  static async remove(cardId, decisionsId) {
    try {
        const response = await axios.delete(`http://localhost:8000/business_card/businesscard/${cardId}/petitionsincase/${decisionsId}/`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error(`Ошибка удаления решения: ${error}`);
    }
}
}
