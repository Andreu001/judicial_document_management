import baseService from './baseService';

class NotificationService {
  static async getNotifications(params = {}) {
    try {
      const response = await baseService.get('/notifications/notifications/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async getNotificationStats() {
    try {
      const response = await baseService.get('/notifications/notifications/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  static async getStats() {
    return this.getNotificationStats();
  }

  static async markAsRead(notificationId) {
    try {
      const response = await baseService.post(`/notifications/notifications/${notificationId}/mark_read/`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead() {
    try {
      const response = await baseService.post('/notifications/notifications/mark_all_read/');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async markAsCompleted(notificationId) {
    try {
      const response = await baseService.post(`/notifications/notifications/${notificationId}/mark_completed/`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as completed:', error);
      throw error;
    }
  }

  static async deleteNotification(id) {
    try {
      const response = await baseService.delete(`/notifications/notifications/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
      throw error;
    }
  }

  static async getCheckpoints(contentTypeId, objectId) {
    try {
      const response = await baseService.get('/notifications/checkpoints/', {
        params: { content_type_id: contentTypeId, object_id: objectId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching checkpoints:', error);
      throw error;
    }
  }

  static async toggleCheckpoint(checkpointId) {
    try {
      const response = await baseService.post(`/notifications/checkpoints/${checkpointId}/toggle_check/`);
      return response.data;
    } catch (error) {
      console.error('Error toggling checkpoint:', error);
      throw error;
    }
  }

  static async getLegalReferences() {
    try {
      const response = await baseService.get('/notifications/legal-references/');
      return response.data;
    } catch (error) {
      console.error('Error fetching legal references:', error);
      throw error;
    }
  }

  static async getNotificationsByCase(caseId) {
    try {
      const response = await baseService.get('/notifications/notifications/', {
        params: { case_id: caseId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications for case:', error);
      throw error;
    }
  }

  // ========== НОВЫЕ МЕТОДЫ ДЛЯ АКТИВНОСТЕЙ ПО ДЕЛУ ==========
  
  /**
   * Получить статус уведомлений по делу (для отображения в карточке)
   * @param {string} caseType - тип дела: criminal, civil, admin, kas
   * @param {number} caseId - ID дела
   * @returns {Promise<Object>} - статус с количеством непрочитанных
   */
  static async getCaseNotificationStatus(caseType, caseId) {
    try {
      let url = '';
      switch (caseType) {
        case 'criminal':
          url = `/criminal_proceedings/criminal-proceedings/${caseId}/notification-status/`;
          break;
        case 'civil':
          url = `/civil_proceedings/civil-proceedings/${caseId}/notification-status/`;
          break;
        case 'admin':
          url = `/administrative_code/administrative-proceedings/${caseId}/notification-status/`;
          break;
        case 'kas':
          url = `/administrative_proceedings/kas-proceedings/${caseId}/notification-status/`;
          break;
        default:
          return { has_unread: false, total_unread: 0 };
      }
      
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching case notification status:', error);
      return { has_unread: false, total_unread: 0 };
    }
  }

  static async markCaseActivityAsRead(caseType, caseId, activityType, objectId) {
    try {
      // caseType должен быть 'administrative', 'criminal', 'civil', 'kas'
      const response = await baseService.post('/notifications/case-activities/mark-read/', {
        case_type: caseType,
        case_id: caseId,
        activity_type: activityType,
        object_id: objectId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking activity as read:', error);
      throw error;
    }
  }

  static async markAllCaseActivitiesAsRead(caseType, caseId, activityType = null) {
    try {
      const response = await baseService.post('/notifications/case-activities/mark-all-case-activities-read/', {
        case_type: caseType,
        case_id: caseId,
        activity_type: activityType
      });
      return response.data;
    } catch (error) {
      console.error('Error marking all case activities as read:', error);
      throw error;
    }
  }
}

export default NotificationService;