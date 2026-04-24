// src/API/baseService.jsx
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const baseService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
baseService.interceptors.request.use(
  (config) => {
    // 🔧 Единый токен для всех запросов
    let token = localStorage.getItem('token');
    
    // Если нет, пробуем citizen_token (для обратной совместимости)
    if (!token) {
      token = localStorage.getItem('citizen_token');
    }
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // CSRF токен
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default baseService;