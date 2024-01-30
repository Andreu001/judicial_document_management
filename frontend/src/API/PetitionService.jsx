import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';


export const updatedPetition = async (cardId, petitionsId, updatedData) => {
  try {
    const response = await axios.patch(`http://localhost:8000/business_card/businesscard/${cardId}/petitionsincase/${petitionsId}/`, updatedData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export default class PetitionService {
  static async getAllPetitions(cardId) {
    const response = await axios.get(`http://localhost:8000/business_card/businesscard/${cardId}/petitionsincase/`);
    return response;
  } catch (error) {
    console.error('Ошибка при выполнении запроса getAllPetitions:', error);
    throw error; // Выбрасываем ошибку дальше
  }


  static async remove(cardId, petitionsId) {
    try {
        const response = await axios.delete(`http://localhost:8000/business_card/businesscard/${cardId}/petitionsincase/${petitionsId}/`, {
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
