import baseService from './baseService';

const CategoryService = {
  getCategoryById: async (categoryId) => {
    try {
      const response = await baseService.get(`/business_card/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  },
};

export default CategoryService;