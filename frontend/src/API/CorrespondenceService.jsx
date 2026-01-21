import baseService from './baseService';

class CorrespondenceService {
  // Получить список корреспонденции
  async getCorrespondence(params = {}) {
    try {
      const response = await baseService.get('/case-registry/correspondence/', { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки корреспонденции:', error);
      throw error;
    }
  }

  // Получить конкретную корреспонденцию
  async getCorrespondenceById(id) {
    try {
      const response = await baseService.get(`/case-registry/correspondence/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка загрузки корреспонденции ${id}:`, error);
      throw error;
    }
  }

  // Обновить только статус корреспонденции
  async updateStatus(id, status) {
    try {
      console.log('Обновление статуса ID:', id, 'новый статус:', status);
      
      const response = await baseService.patch(
        `/case-registry/correspondence/${id}/`,
        { status: status }
      );
      
      console.log('Ответ от сервера:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Ошибка обновления статуса ${id}:`, error);
      if (error.response) {
        console.error('Ответ ошибки:', error.response.data);
      }
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
        '/case-registry/correspondence/',
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
      console.log('Обновление корреспонденции ID:', id);
      console.log('Данные для отправки:', data);
      
      // Создаем FormData
      const formData = new FormData();
      
      // Добавляем все поля, включая статус
      Object.keys(data).forEach(key => {
        // Особенно важно отправлять status
        if (data[key] !== null && data[key] !== undefined) {
          if (key === 'attached_files' && data[key] instanceof File) {
            formData.append(key, data[key]);
          } else if (key === 'status') {
            // Отправляем статус даже если он пустой
            formData.append(key, data[key] || '');
          } else {
            formData.append(key, data[key]);
          }
        }
      });

      // Для отладки - выведем содержимое FormData
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await baseService.patch(
        `/case-registry/correspondence/${id}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Ответ от сервера:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Ошибка обновления корреспонденции ${id}:`, error);
      if (error.response) {
        console.error('Ответ ошибки:', error.response.data);
      }
      throw error;
    }
  }

  // Удалить корреспонденцию
  async deleteCorrespondence(id) {
    try {
      const response = await baseService.delete(`/case-registry/correspondence/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка удаления корреспонденции ${id}:`, error);
      throw error;
    }
  }

  async getStatistics() {
    try {
      const response = await baseService.get('/case-registry/correspondence/statistics/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const response = await baseService.get(`/case-registry/correspondence/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения корреспонденции по ID:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      await baseService.delete(`/case-registry/correspondence/${id}/`);
    } catch (error) {
      console.error('Ошибка удаления корреспонденции:', error);
      throw error;
    }
  }

  // Получить следующий номер (если нужно)
  async getNextNumber(indexCode) {
    try {
      const response = await baseService.get(`/case-registry/next-number/${indexCode}/`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка получения номера для индекса ${indexCode}:`, error);
      throw error;
    }
  }
}

export default new CorrespondenceService();