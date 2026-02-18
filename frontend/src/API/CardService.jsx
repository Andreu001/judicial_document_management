import baseService from './baseService';

const BASE_URL = '/business_card/businesscard/';

export const updateCard = async (id, updatedData) => {
  try {
    const response = await baseService.patch(`${BASE_URL}${id}/`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating card:', error);
    throw error;
  }
};

class CardService {
  static async getAll(limit = 6, page = 1) {
    try {
      const response = await baseService.get(BASE_URL, {
        params: {
          _limit: limit,
          _page: page
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching cards:', error);
      throw error;
    }
  }

  static async remove(id) {
    try {
      const response = await baseService.delete(`${BASE_URL}${id}/`);
      console.log('Delete response:', response);
      return response.data;
    } catch (error) {
      console.error('Error deleting card:', error);
      throw new Error(`Ошибка удаления карточки: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const response = await baseService.get(`${BASE_URL}${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching card by id:', error);
      throw error;
    }
  }

  static async getCategories() {
    try {
      const response = await baseService.get('/business_card/category/');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async searchCards(query, searchBy = 'name') {
    try {
      const response = await baseService.get(BASE_URL, {
        params: {
          search: query,
          search_fields: searchBy
        }
      });
      return response;
    } catch (error) {
      console.error('Error searching cards:', error);
      throw error;
    }
  }
}

export default CardService;