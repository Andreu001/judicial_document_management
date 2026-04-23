import baseService from './baseService';

class CitizenAuthService {
  // Логин через стандартную форму
  async login(username, password) {
    try {
      const response = await baseService.post('/citizen/api/login/', {
        username,
        password,
      });
      
      if (response.data.token) {
        localStorage.setItem('citizen_token', response.data.token);
        return response.data;
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка авторизации');
    }
  }

  // Логин через VK
  getVkAuthUrl() {
    return `${baseService.defaults.baseURL}/auth/login/vk-oauth2/?next=/citizen/dashboard/`;
  }

  // Логин через Яндекс
  getYandexAuthUrl() {
    return `${baseService.defaults.baseURL}/auth/login/yandex-oauth2/?next=/citizen/dashboard/`;
  }

  async logout() {
    try {
      await baseService.post('/citizen/api/logout/');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  }

  async getProfile() {
    try {
      const response = await baseService.get('/citizen/api/profile/');
      return response.data;
    } catch (error) {
      throw new Error('Ошибка получения профиля');
    }
  }

  async verifyPassport(passportData) {
    try {
      const response = await baseService.post('/citizen/api/verify/', passportData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка верификации');
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await baseService.patch('/citizen/api/profile/', profileData);
      return response.data;
    } catch (error) {
      throw new Error('Ошибка обновления профиля');
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem('citizen_token');
  }

  getToken() {
    return localStorage.getItem('citizen_token');
  }
}

export default new CitizenAuthService();