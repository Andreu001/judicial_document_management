import axios from 'axios';

const API_URL = 'http://localhost:8000/business_card';

const CategoryService = {
  // ... другие методы

  getCategoryById: async (categoryId) => {
    try {
      const response = await axios.get(`${API_URL}/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  },
};

export default CategoryService;
