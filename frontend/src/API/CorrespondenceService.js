import baseService from './baseService';

class CorrespondenceService {
  // Получить список корреспонденции
  async getCorrespondence(params = {}) {
    try {
      const response = await baseService.get('/case_registry/correspondence/', { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки корреспонденции:', error);
      throw error;
    }
  }

  // Получить конкретную корреспонденцию
  async getCorrespondenceById(id) {
    try {
      const response = await baseService.get(`/case_registry/correspondence/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка загрузки корреспонденции ${id}:`, error);
      throw error;
    }
  }

  // Создать новую корреспонденцию
  async createCorrespondence(data) {
    try {
      const formData = new FormData();
      
      // Добавляем все поля в FormData
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (key === 'attached_files' && data[key] instanceof File) {
            formData.append(key, data[key]);
          } else {
            formData.append(key, data[key]);
          }
        }
      });

      const response = await baseService.post(
        '/case_registry/correspondence/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка создания корреспонденции:', error);
      throw error;
    }
  }

  // Обновить корреспонденцию
  async updateCorrespondence(id, data) {
    try {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (key === 'attached_files' && data[key] instanceof File) {
            formData.append(key, data[key]);
          } else {
            formData.append(key, data[key]);
          }
        }
      });

      const response = await baseService.patch(
        `/case_registry/correspondence/${id}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Ошибка обновления корреспонденции ${id}:`, error);
      throw error;
    }
  }

  // Удалить корреспонденцию
  async deleteCorrespondence(id) {
    try {
      const response = await baseService.delete(`/case_registry/correspondence/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка удаления корреспонденции ${id}:`, error);
      throw error;
    }
  }

  // Статистика корреспонденции
  async getStatistics() {
    try {
      const response = await baseService.get('/case_registry/correspondence/statistics/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      throw error;
    }
  }

  // Получить следующий номер (если нужно)
  async getNextNumber(indexCode) {
    try {
      const response = await baseService.get(`/case_registry/next-number/${indexCode}/`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка получения номера для индекса ${indexCode}:`, error);
      throw error;
    }
  }
}

export default new CorrespondenceService();