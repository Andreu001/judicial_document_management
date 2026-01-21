// src/API/NotificationService.js
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
}

export default NotificationService;