// API/NotificationService.js
import baseService from './baseService';

class NotificationService {
  static async getNotifications() {
    try {
      const response = await baseService.get('/notifications/notifications/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId) {
    try {
      await baseService.post(`/notifications/notifications/${notificationId}/mark_read/`);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAsCompleted(notificationId) {
    try {
      await baseService.post(`/notifications/notifications/${notificationId}/mark_completed/`);
      return true;
    } catch (error) {
      console.error('Error marking notification as completed:', error);
      return false;
    }
  }

  static async getStats() {
    try {
      const response = await baseService.get('/notifications/notifications/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { total: 0, unread: 0, high_priority: 0 };
    }
  }

  static async checkJurisdiction(proceedingId) {
    try {
      const response = await baseService.post('/notifications/jurisdiction-checks/check_jurisdiction/', {
        proceeding_id: proceedingId
      });
      return response.data;
    } catch (error) {
      console.error('Error checking jurisdiction:', error);
      throw error;
    }
  }
}

export default NotificationService;