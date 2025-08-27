import baseService from './baseService';

class AuthService {
  async login(username, password) {
    try {
      const response = await baseService.post('/auth/token/login/', {
        username,
        password,
      });
      
      if (response.data.auth_token) {
        localStorage.setItem('token', response.data.auth_token);
        return response.data;
      }
    } catch (error) {
      // Попробуйте альтернативный endpoint
      try {
        const response = await baseService.post('/api-token-auth/', {
          username,
          password,
        });
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          return response.data;
        }
      } catch (secondError) {
        throw new Error(secondError.response?.data?.message || 'Ошибка авторизации');
      }
    }
  }

  async getUserById(userId) {
    try {
      const response = await baseService.get(`/auth/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await baseService.post('/auth/token/logout/');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
  }

  async getProfile() {
    try {
      const response = await baseService.get('/auth/users/me/');
      localStorage.setItem('userData', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      // Попробуйте альтернативный endpoint
      try {
        const response = await baseService.get('/api/profile/');
        localStorage.setItem('userData', JSON.stringify(response.data));
        return response.data;
      } catch (secondError) {
        throw new Error('Ошибка получения профиля');
      }
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
}

export default new AuthService();