// CaseManagementService.jsx - исправленный

import baseService from './baseService';
import CriminalCaseService from './CriminalCaseService';
import CivilCaseService from './CivilCaseService';
import AdministrativeCaseService from './AdministrativeCaseService';
import KasCaseService from './KasCaseService';
import OtherMaterialService from './OtherMaterialService';

const BASE_URL = '/case-management/';

class CaseManagementService {
  static cleanData(data) {
    if (!data || typeof data !== 'object') return {};
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  static async getProgressActionTypes() {
    try {
      const response = await baseService.get(`${BASE_URL}progress-action-types/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress action types:', error);
      return [];
    }
  }

  static async getProgressEntries(caseType, caseId) {
    try {
      if (!caseType || !caseId) {
        console.error('getProgressEntries: missing caseType or caseId', { caseType, caseId });
        return [];
      }
      
      // Маппинг типов дел для URL
      const caseTypeMap = {
        'criminal': 'criminal',
        'civil': 'civil', 
        'coap': 'coap',
        'kas': 'kas',
        'other': 'other'
      };
      
      const mappedType = caseTypeMap[caseType];
      if (!mappedType) {
        console.error('Unknown case type for progress entries:', caseType);
        return [];
      }
      
      const response = await baseService.get(`${BASE_URL}${mappedType}/${caseId}/progress-entries/`);
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

  // === Каналы уведомлений ===
  static async getNotificationChannels() {
    try {
      const response = await baseService.get(`${BASE_URL}notification-channels/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification channels:', error);
      return [];
    }
  }

  // === Статусы уведомлений ===
  static async getNotificationStatuses() {
    try {
      const response = await baseService.get(`${BASE_URL}notification-statuses/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification statuses:', error);
      return [];
    }
  }

  // === Шаблоны уведомлений ===
  static async getNotificationTemplates(caseCategory, participantType) {
    try {
      let url = `${BASE_URL}notification-templates/`;
      const params = [];
      if (caseCategory) params.push(`case_category=${caseCategory}`);
      if (participantType) params.push(`participant_type=${participantType}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      return [];
    }
  }

  // === Уведомления ===
  static async getNotifications(caseType, caseId) {
    try {
      const response = await baseService.get(`${BASE_URL}notifications/?case_type=${caseType}&case_id=${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async getNotificationById(notificationId) {
    try {
      const response = await baseService.get(`${BASE_URL}notifications/${notificationId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching notification:', error);
      throw error;
    }
  }

  static async createNotification(notificationData) {
    try {
      console.log('createNotification called with:', notificationData);
      const cleanedData = this.cleanData(notificationData);
      console.log('Cleaned data:', cleanedData);
      const response = await baseService.post(`${BASE_URL}notifications/`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
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

  static async deleteNotification(notificationId) {
    try {
      await baseService.delete(`${BASE_URL}notifications/${notificationId}/`);
      return { success: true };
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true };
      }
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // === Действия с уведомлениями ===
  static async markNotificationAsSent(notificationId, sentDate = null) {
    try {
      const response = await baseService.post(
        `${BASE_URL}notifications/${notificationId}/mark_sent/`,
        sentDate ? { sent_date: sentDate } : {}
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as sent:', error);
      throw error;
    }
  }

  static async markNotificationAsDelivered(notificationId, deliveryDate = null) {
    try {
      const response = await baseService.post(
        `${BASE_URL}notifications/${notificationId}/mark_delivered/`,
        deliveryDate ? { delivery_date: deliveryDate } : {}
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as delivered:', error);
      throw error;
    }
  }

  static async markNotificationAsUndelivered(notificationId, returnReason, returnDate = null) {
    try {
      const response = await baseService.post(
        `${BASE_URL}notifications/${notificationId}/mark_undelivered/`,
        {
          return_reason: returnReason,
          return_date: returnDate || new Date().toISOString().split('T')[0]
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as undelivered:', error);
      throw error;
    }
  }

  // === Предпросмотр уведомления ===
  static async generatePreview(previewData) {
    try {
      console.log('generatePreview called with:', previewData); // Для отладки
      const cleanedData = this.cleanData(previewData);
      const response = await baseService.post(`${BASE_URL}notifications/generate_preview/`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error generating preview:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  }

  // === Участники дела - ИСПРАВЛЕНО ===
  static async getCaseParticipants(caseType, caseId) {
    try {
      console.log('getCaseParticipants called with:', { caseType, caseId });
      
      if (!caseType || !caseId) {
        console.error('Missing caseType or caseId');
        return [];
      }

      let participants = [];
      
      // Прямое сопоставление типов дел без дополнительного маппинга
      // caseType приходит из фронтенда: 'criminal', 'civil', 'coap', 'kas', 'other'
      
      switch (caseType) {
        case 'criminal':
          // Для уголовных дел: подсудимые, адвокаты, иные стороны
          const defendants = await CriminalCaseService.getDefendants(caseId);
          const criminalLawyers = await CriminalCaseService.getLawyers(caseId);
          const criminalOtherSides = await CriminalCaseService.getSides(caseId);
          
          participants = [
            ...defendants.map(d => ({
              id: d.id,
              type: 'defendant',
              name: d.full_name_criminal || d.full_name || 'Не указано',
              role: 'Подсудимый/Обвиняемый',
              phone: '',
              email: '',
              address: d.address || ''
            })),
            ...criminalLawyers.map(l => ({
              id: l.id,
              type: 'lawyer',
              name: l.lawyer_detail?.law_firm_name || 'Адвокат',
              role: 'Адвокат/Защитник',
              phone: l.lawyer_detail?.law_firm_phone || '',
              email: l.lawyer_detail?.law_firm_email || '',
              address: l.lawyer_detail?.law_firm_address || ''
            })),
            ...criminalOtherSides.map(s => ({
              id: s.id,
              type: 'side',
              name: s.criminal_side_case_detail?.name || 'Сторона',
              role: s.sides_case_criminal_detail?.sides_case || 'Сторона',
              phone: s.criminal_side_case_detail?.phone || '',
              email: s.criminal_side_case_detail?.email || '',
              address: s.criminal_side_case_detail?.address || ''
            }))
          ];
          break;
          
        case 'civil':
          // Для гражданских дел: стороны и адвокаты
          const civilSides = await CivilCaseService.getSides(caseId);
          const civilLawyers = await CivilCaseService.getLawyers(caseId);
          
          participants = [
            ...civilSides.map(s => ({
              id: s.id,
              type: 'side',
              name: s.sides_case_incase_detail?.name || 'Сторона',
              role: s.sides_case_role_detail?.name || 'Сторона',
              phone: s.sides_case_incase_detail?.phone || '',
              email: s.sides_case_incase_detail?.email || '',
              address: s.sides_case_incase_detail?.address || ''
            })),
            ...civilLawyers.map(l => ({
              id: l.id,
              type: 'lawyer',
              name: l.lawyer_detail?.law_firm_name || 'Адвокат',
              role: 'Представитель',
              phone: l.lawyer_detail?.law_firm_phone || '',
              email: l.lawyer_detail?.law_firm_email || '',
              address: l.lawyer_detail?.law_firm_address || ''
            }))
          ];
          break;
          
        case 'coap':
          // Для дел об АП (КоАП) - administrative_code
          const adminSides = await AdministrativeCaseService.getSides(caseId);
          const adminLawyers = await AdministrativeCaseService.getLawyers(caseId);
          
          participants = [
            ...adminSides.map(s => ({
              id: s.id,
              type: 'side',
              name: s.sides_case_incase_detail?.name || 'Сторона',
              role: s.sides_case_role_detail?.name || 'Сторона',
              phone: s.sides_case_incase_detail?.phone || '',
              email: s.sides_case_incase_detail?.email || '',
              address: s.sides_case_incase_detail?.address || ''
            })),
            ...adminLawyers.map(l => ({
              id: l.id,
              type: 'lawyer',
              name: l.lawyer_detail?.law_firm_name || 'Защитник',
              role: 'Защитник',
              phone: l.lawyer_detail?.law_firm_phone || '',
              email: l.lawyer_detail?.law_firm_email || '',
              address: l.lawyer_detail?.law_firm_address || ''
            }))
          ];
          break;
          
        case 'kas':
          // Для дел по КАС - administrative_proceedings
          const kasSides = await KasCaseService.getSides(caseId);
          const kasLawyers = await KasCaseService.getLawyers(caseId);
          
          participants = [
            ...kasSides.map(s => ({
              id: s.id,
              type: 'side',
              name: s.sides_case_incase_detail?.name || 'Сторона',
              role: s.sides_case_role_detail?.name || 'Сторона',
              phone: s.sides_case_incase_detail?.phone || '',
              email: s.sides_case_incase_detail?.email || '',
              address: s.sides_case_incase_detail?.address || ''
            })),
            ...kasLawyers.map(l => ({
              id: l.id,
              type: 'lawyer',
              name: l.lawyer_detail?.law_firm_name || 'Представитель',
              role: 'Представитель',
              phone: l.lawyer_detail?.law_firm_phone || '',
              email: l.lawyer_detail?.law_firm_email || '',
              address: l.lawyer_detail?.law_firm_address || ''
            }))
          ];
          break;
          
        case 'other':
          // Для иных материалов
          const otherSides = await OtherMaterialService.getSides(caseId);
          const otherLawyers = await OtherMaterialService.getLawyers(caseId);
          
          participants = [
            ...otherSides.map(s => ({
              id: s.id,
              type: 'side',
              name: s.sides_case_incase_detail?.name || 'Сторона',
              role: s.sides_case_role_detail?.name || 'Сторона',
              phone: s.sides_case_incase_detail?.phone || '',
              email: s.sides_case_incase_detail?.email || '',
              address: s.sides_case_incase_detail?.address || ''
            })),
            ...otherLawyers.map(l => ({
              id: l.id,
              type: 'lawyer',
              name: l.lawyer_detail?.law_firm_name || 'Представитель',
              role: 'Представитель',
              phone: l.lawyer_detail?.law_firm_phone || '',
              email: l.lawyer_detail?.law_firm_email || '',
              address: l.lawyer_detail?.law_firm_address || ''
            }))
          ];
          break;
          
        default:
          console.warn('Unknown case type:', caseType);
          return [];
      }
      
      console.log('Loaded participants:', participants);
      return participants;
      
    } catch (error) {
      console.error('Error fetching case participants:', error);
      return [];
    }
  }
  }

export default CaseManagementService;