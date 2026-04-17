import baseService from './baseService';

const BASE_URL = '/case-management/';

class CaseManagementService {
  static cleanData(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // === Типы уведомлений ===
  static async getNotificationTypes() {
    try {
      const response = await baseService.get(`${BASE_URL}notification-types/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification types:', error);
      return [];
    }
  }

  // === Шаблоны повесток ===
  static async getNotificationTemplates(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${BASE_URL}notification-templates/${queryParams ? `?${queryParams}` : ''}`;
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      return [];
    }
  }

  static async previewNotificationTemplate(templateId, caseId, participantType, participantId, hearingDate, hearingRoom) {
    try {
      const response = await baseService.post(`${BASE_URL}notification-templates/${templateId}/preview/`, {
        case_id: caseId,
        participant_type: participantType,
        participant_id: participantId,
        hearing_date: hearingDate,
        hearing_room: hearingRoom
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  }

  // === Типы действий для хода дела ===
  static async getProgressActionTypes() {
    try {
      const response = await baseService.get(`${BASE_URL}progress-action-types/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress action types:', error);
      return [];
    }
  }

  // === Записи хода дела (Progress Entries) - универсально ===
  static async getProgressEntries(caseType, caseId) {
    try {
      const url = `${BASE_URL}${caseType}/${caseId}/progress-entries/`;
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress entries:', error);
      return [];
    }
  }

  static async createProgressEntry(caseType, caseId, entryData) {
    try {
      const cleanedData = this.cleanData(entryData);
      const response = await baseService.post(`${BASE_URL}${caseType}/${caseId}/progress-entries/`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error creating progress entry:', error);
      throw error;
    }
  }

  static async updateProgressEntry(caseType, caseId, entryId, entryData) {
    try {
      const cleanedData = this.cleanData(entryData);
      const response = await baseService.patch(`${BASE_URL}${caseType}/${caseId}/progress-entries/${entryId}/`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error updating progress entry:', error);
      throw error;
    }
  }

  static async deleteProgressEntry(caseType, caseId, entryId) {
    try {
      await baseService.delete(`${BASE_URL}${caseType}/${caseId}/progress-entries/${entryId}/`);
    } catch (error) {
      console.error('Error deleting progress entry:', error);
      throw error;
    }
  }

  // === Уведомления (Notifications) - универсально ===
  static async getNotifications(caseId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${BASE_URL}notifications/${queryParams ? `?${queryParams}` : ''}`;
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async createNotification(caseId, notificationData) {
    try {
      const cleanedData = this.cleanData(notificationData);
      console.log('Sending notification data:', cleanedData);
      // Используем универсальный эндпоинт с case_id в query параметре
      const response = await baseService.post(`${BASE_URL}notifications/?case_id=${caseId}`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  static async updateNotification(notificationId, notificationData) {
    try {
      const cleanedData = this.cleanData(notificationData);
      const response = await baseService.patch(`${BASE_URL}notifications/${notificationId}/`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  static async deleteNotification(caseId, notificationId) {
    try {
      await baseService.delete(`${BASE_URL}notifications/${notificationId}/`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export default CaseManagementService;