import baseService from './baseService';

const BASE_URL = '/legal-codes/';

class LegalCodesService {
  // Получить все статьи УК РФ
  static async getAllArticles() {
    try {
      const response = await baseService.get(`${BASE_URL}articles/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  }

  // Поиск статей
  static async searchArticles(query, limit = 20) {
    try {
      const response = await baseService.get(`${BASE_URL}search/?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  }

  // Получить статью по ID
  static async getArticleById(id) {
    try {
      const response = await baseService.get(`${BASE_URL}articles/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  }

  // Получить структуру статьи (части и пункты)
  static async getArticleStructure(id) {
    try {
      const response = await baseService.get(`${BASE_URL}articles/${id}/structure/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching article structure:', error);
      return { parts: [] };
    }
  }

  // Получить все части статьи
  static async getArticleParts(articleId) {
    try {
      const response = await baseService.get(`${BASE_URL}articles/${articleId}/parts/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching article parts:', error);
      return [];
    }
  }

  // Получить пункты части
  static async getPartClauses(partId) {
    try {
      const response = await baseService.get(`${BASE_URL}parts/${partId}/clauses/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching part clauses:', error);
      return [];
    }
  }
}

export default LegalCodesService;