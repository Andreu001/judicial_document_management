// src/services/statisticsService.js
import baseService from './baseService';

const STATISTICS_API = '/statistics';

const statisticsService = {
  // Получение доступных моделей
  getAvailableModels: async () => {
    const response = await baseService.get(`${STATISTICS_API}/api/available-models/`);
    return response.data;
  },

  // Получение полей модели
  getModelFields: async (contentTypeId) => {
    const response = await baseService.get(`${STATISTICS_API}/api/model-fields/${contentTypeId}/`);
    return response.data;
  },

  // Выполнение запроса
  executeQuery: async (data) => {
    const response = await baseService.post(`${STATISTICS_API}/api/execute-query/`, data);
    return response.data;
  },

  // Детализация
  drillDown: async (data) => {
    const response = await baseService.post(`${STATISTICS_API}/api/drill-down/`, data);
    return response.data;
  },

  // Получение сохраненных запросов
  getSavedQueries: async () => {
    const response = await baseService.get(`${STATISTICS_API}/api/saved-queries/`);
    return response.data;
  },

  // Сохранение запроса
  saveQuery: async (data) => {
    const response = await baseService.post(`${STATISTICS_API}/api/saved-queries/`, data);
    return response.data;
  },

  // Обновление запроса
  updateSavedQuery: async (id, data) => {
    const response = await baseService.put(`${STATISTICS_API}/api/saved-queries/${id}/`, data);
    return response.data;
  },

  // Удаление запроса
  deleteSavedQuery: async (id) => {
    const response = await baseService.delete(`${STATISTICS_API}/api/saved-queries/${id}/`);
    return response.data;
  },

  // Получение дашбордов
  getDashboards: async () => {
    const response = await baseService.get(`${STATISTICS_API}/api/dashboards/`);
    return response.data;
  },

  // Создание дашборда
  createDashboard: async (data) => {
    const response = await baseService.post(`${STATISTICS_API}/api/dashboards/`, data);
    return response.data;
  },

  // Обновление дашборда
  updateDashboard: async (id, data) => {
    const response = await baseService.put(`${STATISTICS_API}/api/dashboards/${id}/`, data);
    return response.data;
  },

  // Удаление дашборда
  deleteDashboard: async (id) => {
    const response = await baseService.delete(`${STATISTICS_API}/api/dashboards/${id}/`);
    return response.data;
  }
};

export default statisticsService;