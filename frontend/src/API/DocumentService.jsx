// src/API/DocumentService.jsx
import baseService from './baseService';

const BASE_URL = '/case-documents/';

class DocumentService {
  static cleanData(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // === Шаблоны документов ===
  
  static async getTemplates(caseCategory = null) {
    try {
      let url = `${BASE_URL}templates/`;
      if (caseCategory) {
        url += `?case_category=${caseCategory}`;
      }
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching document templates:', error);
      return [];
    }
  }

  // === Документы для конкретного дела ===
  
  static async getDocuments(contentType, objectId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}documents/?content_type=${contentType}&object_id=${objectId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  static async getDocumentById(documentId) {
    try {
      const response = await baseService.get(`${BASE_URL}documents/${documentId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching document by ID:', error);
      throw error;
    }
  }

  static async createDocument(documentData) {
    try {
      const cleanedData = this.cleanData(documentData);
      const response = await baseService.post(`${BASE_URL}documents/`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  static async updateDocument(documentId, documentData) {
    try {
      const cleanedData = this.cleanData(documentData);
      const response = await baseService.patch(`${BASE_URL}documents/${documentId}/`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  static async deleteDocument(documentId) {
    try {
      await baseService.delete(`${BASE_URL}documents/${documentId}/`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // === Подписание документа ===
  
  static async signDocument(documentId) {
    try {
      const response = await baseService.post(`${BASE_URL}documents/${documentId}/sign/`);
      return response.data;
    } catch (error) {
      console.error('Error signing document:', error);
      throw error;
    }
  }

  // === Методы для работы с документами через вложенные маршруты производств ===
  
  // Для уголовных дел
  static async getCriminalDocuments(proceedingId) {
    try {
      const response = await baseService.get(
        `/criminal_proceedings/criminal-proceedings/${proceedingId}/documents/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching criminal documents:', error);
      return [];
    }
  }

  static async createCriminalDocument(proceedingId, documentData) {
    try {
      const { content_type, object_id, ...cleanedData } = this.cleanData(documentData);
      
      console.log('Sending criminal document data:', cleanedData);
      
      const response = await baseService.post(
        `/criminal_proceedings/criminal-proceedings/${proceedingId}/documents/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating criminal document:', error);
      if (error.response) {
        console.error('Server response data:', error.response.data);
        alert(`Ошибка: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  static async getCriminalDocument(proceedingId, documentId) {
    try {
      const response = await baseService.get(
        `/criminal_proceedings/criminal-proceedings/${proceedingId}/documents/${documentId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching criminal document:', error);
      throw error;
    }
  }

  static async updateCriminalDocument(proceedingId, documentId, documentData) {
    try {
      const cleanedData = this.cleanData(documentData);
      const response = await baseService.patch(
        `/criminal_proceedings/criminal-proceedings/${proceedingId}/documents/${documentId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating criminal document:', error);
      throw error;
    }
  }

  static async signCriminalDocument(proceedingId, documentId) {
    try {
      console.log(`Signing document: /criminal_proceedings/criminal-proceedings/${proceedingId}/documents/${documentId}/sign/`);
      const response = await baseService.post(
        `/criminal_proceedings/criminal-proceedings/${proceedingId}/documents/${documentId}/sign/`
      );
      return response.data;
    } catch (error) {
      console.error('Error signing criminal document:', error);
      if (error.response) {
        console.error('Server response data:', error.response.data);
        console.error('Server response status:', error.response.status);
        alert(`Ошибка при подписании: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  static async getCriminalDocumentTemplates(proceedingId) {
    try {
      const response = await baseService.get(
        `/criminal_proceedings/criminal-proceedings/${proceedingId}/document-templates/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching criminal document templates:', error);
      return [];
    }
  }

  // Для гражданских дел
  static async getCivilDocuments(proceedingId) {
    try {
      const response = await baseService.get(
        `/civil_proceedings/civil-proceedings/${proceedingId}/documents/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching civil documents:', error);
      return [];
    }
  }

  static async createCivilDocument(proceedingId, documentData) {
    try {
      const { content_type, object_id, ...cleanedData } = this.cleanData(documentData);
      const response = await baseService.post(
        `/civil_proceedings/civil-proceedings/${proceedingId}/documents/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating civil document:', error);
      throw error;
    }
  }

  static async getCivilDocument(proceedingId, documentId) {
    try {
      const response = await baseService.get(
        `/civil_proceedings/civil-proceedings/${proceedingId}/documents/${documentId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching civil document:', error);
      throw error;
    }
  }

  static async updateCivilDocument(proceedingId, documentId, documentData) {
    try {
      const cleanedData = this.cleanData(documentData);
      const response = await baseService.patch(
        `/civil_proceedings/civil-proceedings/${proceedingId}/documents/${documentId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating civil document:', error);
      throw error;
    }
  }


  static async signCivilDocument(proceedingId, documentId) {
    try {
      const response = await baseService.post(
        `/civil_proceedings/civil-proceedings/${proceedingId}/documents/${documentId}/sign/`
      );
      return response.data;
    } catch (error) {
      console.error('Error signing civil document:', error);
      throw error;
    }
  }

  static async getCivilDocumentTemplates(proceedingId) {
    try {
      const response = await baseService.get(
        `/civil_proceedings/civil-proceedings/${proceedingId}/document-templates/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching civil document templates:', error);
      return [];
    }
  }

  // Для административных правонарушений (КОАП)
  static async getAdminDocuments(proceedingId) {
    try {
      const response = await baseService.get(
        `/administrative_code/administrative-proceedings/${proceedingId}/documents/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching admin documents:', error);
      return [];
    }
  }

  static async createAdminDocument(proceedingId, documentData) {
    try {
      const { content_type, object_id, ...cleanedData } = this.cleanData(documentData);
      const response = await baseService.post(
        `/administrative_code/administrative-proceedings/${proceedingId}/documents/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating admin document:', error);
      throw error;
    }
  }

  static async getAdminDocument(proceedingId, documentId) {
    try {
      const response = await baseService.get(
        `/administrative_code/administrative-proceedings/${proceedingId}/documents/${documentId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching admin document:', error);
      throw error;
    }
  }

  static async updateAdminDocument(proceedingId, documentId, documentData) {
    try {
      const cleanedData = this.cleanData(documentData);
      const response = await baseService.patch(
        `/administrative_code/administrative-proceedings/${proceedingId}/documents/${documentId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating admin document:', error);
      throw error;
    }
  }

  static async signAdminDocument(proceedingId, documentId) {
    try {
      const response = await baseService.post(
        `/administrative_code/administrative-proceedings/${proceedingId}/documents/${documentId}/sign/`
      );
      return response.data;
    } catch (error) {
      console.error('Error signing admin document:', error);
      throw error;
    }
  }

  static async getAdminDocumentTemplates(proceedingId) {
    try {
      const response = await baseService.get(
        `/administrative_code/administrative-proceedings/${proceedingId}/document-templates/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching admin document templates:', error);
      return [];
    }
  }

  // Для КАС
  static async getKasDocuments(proceedingId) {
    try {
      const response = await baseService.get(
        `/administrative_proceedings/kas-proceedings/${proceedingId}/documents/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching kas documents:', error);
      return [];
    }
  }

  static async createKasDocument(proceedingId, documentData) {
    try {
      const { content_type, object_id, ...cleanedData } = this.cleanData(documentData);
      const response = await baseService.post(
        `/administrative_proceedings/kas-proceedings/${proceedingId}/documents/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating kas document:', error);
      throw error;
    }
  }

  static async getKasDocument(proceedingId, documentId) {
    try {
      const response = await baseService.get(
        `/administrative_proceedings/kas-proceedings/${proceedingId}/documents/${documentId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching kas document:', error);
      throw error;
    }
  }

  static async updateKasDocument(proceedingId, documentId, documentData) {
    try {
      const cleanedData = this.cleanData(documentData);
      const response = await baseService.patch(
        `/administrative_proceedings/kas-proceedings/${proceedingId}/documents/${documentId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating kas document:', error);
      throw error;
    }
  }

  static async signKasDocument(proceedingId, documentId) {
    try {
      const response = await baseService.post(
        `/administrative_proceedings/kas-proceedings/${proceedingId}/documents/${documentId}/sign/`
      );
      return response.data;
    } catch (error) {
      console.error('Error signing kas document:', error);
      throw error;
    }
  }

  static async getKasDocumentTemplates(proceedingId) {
    try {
      const response = await baseService.get(
        `/administrative_proceedings/kas-proceedings/${proceedingId}/document-templates/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching kas document templates:', error);
      return [];
    }
  }
  // src/API/DocumentService.jsx

  static async deleteCriminalDocument(proceedingId, documentId) {
    try {
      // Изменяем URL на прямой путь к документу
      await baseService.delete(`${BASE_URL}documents/${documentId}/`);
    } catch (error) {
      console.error('Error deleting criminal document:', error);
      throw error;
    }
  }

  static async deleteCivilDocument(proceedingId, documentId) {
    try {
      await baseService.delete(`${BASE_URL}documents/${documentId}/`);
    } catch (error) {
      console.error('Error deleting civil document:', error);
      throw error;
    }
  }

  static async deleteAdminDocument(proceedingId, documentId) {
    try {
      await baseService.delete(`${BASE_URL}documents/${documentId}/`);
    } catch (error) {
      console.error('Error deleting admin document:', error);
      throw error;
    }
  }

  static async deleteKasDocument(proceedingId, documentId) {
    try {
      await baseService.delete(`${BASE_URL}documents/${documentId}/`);
    } catch (error) {
      console.error('Error deleting kas document:', error);
      throw error;
    }
  }
  // === Для иных материалов (Other Materials) ===
  
  static async getOtherMaterialDocuments(materialId) {
    try {
      const response = await baseService.get(
        `/other-materials/other-materials/${materialId}/documents/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching other material documents:', error);
      return [];
    }
  }

  static async createOtherMaterialDocument(materialId, documentData) {
    try {
      const { content_type, object_id, ...cleanedData } = this.cleanData(documentData);
      const response = await baseService.post(
        `/other-materials/other-materials/${materialId}/documents/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating other material document:', error);
      throw error;
    }
  }

  static async getOtherMaterialDocument(materialId, documentId) {
    try {
      const response = await baseService.get(
        `/other-materials/other-materials/${materialId}/documents/${documentId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching other material document:', error);
      throw error;
    }
  }

  static async updateOtherMaterialDocument(materialId, documentId, documentData) {
    try {
      const cleanedData = this.cleanData(documentData);
      const response = await baseService.patch(
        `/other-materials/other-materials/${materialId}/documents/${documentId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating other material document:', error);
      throw error;
    }
  }

  static async deleteOtherMaterialDocument(materialId, documentId) {
    try {
      await baseService.delete(`${BASE_URL}documents/${documentId}/`);
    } catch (error) {
      console.error('Error deleting other material document:', error);
      throw error;
    }
  }

  static async signOtherMaterialDocument(materialId, documentId) {
    try {
      const response = await baseService.post(
        `/other-materials/other-materials/${materialId}/documents/${documentId}/sign/`
      );
      return response.data;
    } catch (error) {
      console.error('Error signing other material document:', error);
      throw error;
    }
  }

  static async getOtherMaterialDocumentTemplates(materialId) {
    try {
      const response = await baseService.get(
        `/other-materials/other-materials/${materialId}/document-templates/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching other material document templates:', error);
      return [];
    }
  }

  // ========== НОВЫЕ МЕТОДЫ ДЛЯ ДОКУМЕНТОВ СТОРОН (PartyDocument) ==========

  static async getPartyDocuments(caseType, caseId) {
    try {
      const typeMapping = {
        criminal: 'criminal',
        civil: 'civil',
        admin: 'admin',
        kas: 'kas'
      };
      
      const mappedType = typeMapping[caseType];
      if (!mappedType) {
        console.error('Unknown case type:', caseType);
        return [];
      }
      
      // ПРАВИЛЬНЫЙ URL - используем существующий эндпоинт by-case
      const response = await baseService.get(
        `/case-documents/party-documents/by-case/?case_type=${mappedType}&case_id=${caseId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching party documents:', error);
      return [];
    }
  }

  static async getPartyDocumentById(documentId) {
    try {
      const response = await baseService.get(`/case-documents/party-documents/${documentId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching party document:', error);
      throw error;
    }
  }

  static async createPartyDocument(documentData) {
    try {
      // Если documentData уже является FormData, используем его как есть
      let formData;
      if (documentData instanceof FormData) {
        formData = documentData;
      } else {
        // Если это обычный объект, создаём FormData и заполняем
        const cleanedData = this.cleanData(documentData);
        formData = new FormData();
        for (const [key, value] of Object.entries(cleanedData)) {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value);
          }
        }
      }
      
      const response = await baseService.post(
        `/case-documents/party-documents/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating party document:', error);
      throw error;
    }
  }

  static async updatePartyDocument(documentId, documentData) {
    try {
      let formData;
      if (documentData instanceof FormData) {
        formData = documentData;
      } else {
        const cleanedData = this.cleanData(documentData);
        formData = new FormData();
        for (const [key, value] of Object.entries(cleanedData)) {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value);
          }
        }
      }
      
      const response = await baseService.patch(
        `/case-documents/party-documents/${documentId}/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating party document:', error);
      throw error;
    }
  }

  static async deletePartyDocument(documentId) {
    try {
      await baseService.delete(`/case-documents/party-documents/${documentId}/`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting party document:', error);
      throw error;
    }
  }

  static async registerPartyDocument(documentId, registrationNumber = null) {
    try {
      const response = await baseService.post(
        `/case-documents/party-documents/${documentId}/register/`,
        { registration_number: registrationNumber }
      );
      return response.data;
    } catch (error) {
      console.error('Error registering party document:', error);
      throw error;
    }
  }

  static async reviewPartyDocument(documentId, action, decisionText = '') {
    try {
      console.log(`[DEBUG] reviewPartyDocument: ${documentId}, ${action}`);
      const response = await baseService.post(
        `/case-documents/party-documents/${documentId}/review/`,
        { action, decision_text: decisionText }
      );
      return response.data;
    } catch (error) {
      console.error('Error in reviewPartyDocument:', error);
      // Прокидываем полную информацию об ошибке
      throw {
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }

  static async attachPartyDocumentToCase(documentId, decisionText = '') {
    try {
      const response = await baseService.post(
        `/case-documents/party-documents/${documentId}/attach-to-case/`,
        { decision_text: decisionText }
      );
      return response.data;
    } catch (error) {
      console.error('Error attaching party document to case:', error);
      throw error;
    }
  }

  static async rejectPartyDocument(documentId, reason) {
    try {
      const response = await baseService.post(
        `/case-documents/party-documents/${documentId}/reject/`,
        { reason: reason }
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting party document:', error);
      throw error;
    }
  }

  static async returnPartyDocument(documentId, reason) {
    try {
      const response = await baseService.post(
        `/case-documents/party-documents/${documentId}/return-doc/`,
        { reason: reason }
      );
      return response.data;
    } catch (error) {
      console.error('Error returning party document:', error);
      throw error;
    }
  }

  static async downloadPartyDocument(documentId) {
    try {
      const response = await baseService.get(
        `/case-documents/party-documents/${documentId}/download/`,
        { responseType: 'blob' }
      );
      return response;
    } catch (error) {
      console.error('Error downloading party document:', error);
      throw error;
    }
  }

  static async getPartyDocumentHistory(documentId) {
    try {
      const response = await baseService.get(`/case-documents/party-documents/${documentId}/history/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching party document history:', error);
      return [];
    }
  }

  static async getPartyDocumentsByCase(caseType, caseId) {
    try {
      // Преобразуем admin в administrative для бэкенда
      let mappedType = caseType;
      if (caseType === 'admin') {
        mappedType = 'administrative';
      }
      
      const response = await baseService.get(
        `/case-documents/party-documents/by-case/?case_type=${mappedType}&case_id=${caseId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching party documents by case:', error);
      return [];
    }
  }

  // Получение списка типов документов для выбора
  static getPartyDocumentTypes() {
    return [
      { value: 'statement_of_claim', label: 'Исковое заявление' },
      { value: 'statement_of_claim_amended', label: 'Уточненное исковое заявление' },
      { value: 'counterclaim', label: 'Встречное исковое заявление' },
      { value: 'petition', label: 'Ходатайство' },
      { value: 'motion', label: 'Заявление' },
      { value: 'objection', label: 'Возражение' },
      { value: 'appeal', label: 'Апелляционная жалоба' },
      { value: 'appeal_response', label: 'Отзыв на апелляционную жалобу' },
      { value: 'cassation', label: 'Кассационная жалоба' },
      { value: 'cassation_response', label: 'Отзыв на кассационную жалобу' },
      { value: 'supervisory', label: 'Надзорная жалоба' },
      { value: 'evidence', label: 'Доказательство' },
      { value: 'expert_opinion', label: 'Заключение эксперта' },
      { value: 'response', label: 'Отзыв на иск' },
      { value: 'explanation', label: 'Пояснение' },
      { value: 'reconciliation', label: 'Мировое соглашение' },
      { value: 'other', label: 'Иной документ' },
    ];
  }

  // Получение статусов рассмотрения для отображения
  static getReviewStatuses() {
    return {
      'pending': { label: 'Ожидает регистрации', color: '#ffc107', class: 'statusPending' },
      'registered': { label: 'Зарегистрирован', color: '#17a2b8', class: 'statusRegistered' },
      'under_review': { label: 'На рассмотрении', color: '#007bff', class: 'statusUnderReview' },
      'accepted': { label: 'Приобщен к делу', color: '#28a745', class: 'statusAccepted' },
      'rejected': { label: 'Отказано', color: '#dc3545', class: 'statusRejected' },
      'returned': { label: 'Возвращен', color: '#fd7e14', class: 'statusReturned' },
      'attached_to_case': { label: 'Приобщен к материалам', color: '#20c997', class: 'statusAttached' }
    };
  }

  static getSubmissionMethods() {
    return [
      { value: 'online', label: 'Через портал (онлайн)' },
      { value: 'paper', label: 'На бумажном носителе' },
      { value: 'email', label: 'По электронной почте' },
      { value: 'mail', label: 'Почтовым отправлением' },
      { value: 'through_court', label: 'Через канцелярию суда' }
    ];
  }

  static async markDocumentAsReadByObject(caseType, caseId, documentId) {
    try {
      // Преобразуем caseType для API
      let apiCaseType = caseType;
      if (caseType === 'admin') {
        apiCaseType = 'administrative';
      }
      
      const response = await baseService.post('/notifications/case-activities/mark-by-object/', {
        case_type: apiCaseType,
        case_id: caseId,
        object_type: 'partydocument',
        object_id: documentId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking document as read:', error);
      throw error;
    }
  }
  static async getTemplateContent(templateId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}templates/${templateId}/content/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching template content:', error);
      throw error;
    }
  }
}

export default DocumentService;