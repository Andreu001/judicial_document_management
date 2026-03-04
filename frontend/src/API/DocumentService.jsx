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

  static async deleteCriminalDocument(proceedingId, documentId) {
    try {
      await baseService.delete(
        `/criminal_proceedings/criminal-proceedings/${proceedingId}/documents/${documentId}/`
      );
    } catch (error) {
      console.error('Error deleting criminal document:', error);
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

  static async deleteCivilDocument(proceedingId, documentId) {
    try {
      await baseService.delete(
        `/civil_proceedings/civil-proceedings/${proceedingId}/documents/${documentId}/`
      );
    } catch (error) {
      console.error('Error deleting civil document:', error);
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

  static async deleteAdminDocument(proceedingId, documentId) {
    try {
      await baseService.delete(
        `/administrative_code/administrative-proceedings/${proceedingId}/documents/${documentId}/`
      );
    } catch (error) {
      console.error('Error deleting admin document:', error);
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

  static async deleteKasDocument(proceedingId, documentId) {
    try {
      await baseService.delete(
        `/administrative_proceedings/kas-proceedings/${proceedingId}/documents/${documentId}/`
      );
    } catch (error) {
      console.error('Error deleting kas document:', error);
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
}

export default DocumentService;