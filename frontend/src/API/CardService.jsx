import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';


const BASE_URL = 'http://localhost:8000/business_card/businesscard/';

export const updateCard = async (id, updatedData) => {
  try {
    const response = await axios.patch(`${BASE_URL}${id}/`, updatedData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default class CardService {
  static async getAll(limit = 6, page = 1) {
    const response = await axios.get('http://127.0.0.1:8000/business_card/businesscard/', {
      params: {
        _limit: limit,
        _page: page
      }
    });
    return response;
  }

  static async remove(id) {
    try {
        const response = await axios.delete(`http://localhost:8000/business_card/businesscard/${id}/`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        console.log(response); // Логируем ответ для проверки
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error(`Ошибка удаления карточки: ${error}`);
    }
}

  static async getById(id) {
    const response = await axios.get(`http://127.0.0.1:8000/business_card/businesscard/${id}`);
    return response;
  }

  static async getCommentsByCardId(id) {
    const response = await axios.get(`${id}`);
    return response;
  }
}
