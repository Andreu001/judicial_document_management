import baseService from './baseService';

const BASE_URL = '/side_case/';

class SideCaseService {
  
  static getAuthToken() {
    return localStorage.getItem('side_token') || localStorage.getItem('token');
  }
  
  static async socialAuth(provider, socialData) {
    try {
      const response = await baseService.post(`${BASE_URL}auth/callback/`, {
        provider: provider,
        social_id: socialData.id,
        email: socialData.email || '',
        first_name: socialData.first_name || '',
        last_name: socialData.last_name || '',
        full_name: socialData.full_name || '',
        birth_date: socialData.birth_date || null
      });
      
      console.log('Social auth response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('side_token', response.data.token);
        localStorage.setItem('side_user', JSON.stringify(response.data.user));
        this.setupAuthHeader();
        localStorage.setItem('side_login_time', Date.now().toString());
      }
      
      return response.data;
    } catch (error) {
      console.error('Social auth error:', error);
      throw error;
    }
  }
  
  static async getProfile() {
    try {
      const response = await baseService.get(`${BASE_URL}profile/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }
  
  static async updateProfile(profileData) {
    try {
      const response = await baseService.patch(`${BASE_URL}profile/`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
  
  static async syncAccess() {
    try {
      const response = await baseService.post(`${BASE_URL}sync/`);
      return response.data;
    } catch (error) {
      console.error('Error syncing access:', error);
      throw error;
    }
  }
  
  static async getUserCases() {
    try {
      const response = await baseService.get(`${BASE_URL}cases/`);
      console.log('Raw user cases response:', response.data);
      
      const transformed = {};
      
      const typeMapping = {
        'criminal': 'criminal',
        'civil': 'civil',
        'kas': 'kas',
        'administrative': 'administrative',
        'administrativeproceedings': 'administrative',
        'admin_offense': 'administrative',
        'coap': 'administrative',
        'admin': 'administrative',
        'administrative_code': 'administrative'
      };
      
      if (response.data && typeof response.data === 'object') {
        Object.entries(response.data).forEach(([key, value]) => {
          const normalizedKey = key.toLowerCase();
          const mappedKey = typeMapping[normalizedKey] || normalizedKey;
          
          if (Array.isArray(value) && value.length > 0) {
            if (!transformed[mappedKey]) {
              transformed[mappedKey] = [];
            }
            transformed[mappedKey].push(...value);
          }
        });
      }
      
      console.log('Transformed cases:', transformed);
      return transformed;
    } catch (error) {
      console.error('Error fetching user cases:', error);
      return {};
    }
  }
  
  static async getCaseDetail(caseType, caseId) {
    try {
      const response = await baseService.get(`${BASE_URL}cases/${caseType}/${caseId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching case detail:', error);
      throw error;
    }
  }
  
  // ========== ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ ПОЛУЧЕНИЯ РЕШЕНИЙ ==========
  // Используем модель CaseDocument
  static async getCaseDecisions(caseType, caseId) {
    try {
      console.log(`Getting decisions for case type: ${caseType}, ID: ${caseId}`);
      
      // Нормализуем тип дела для получения content_type
      const contentTypeMap = {
        'criminal': 'criminalproceedings',
        'civil': 'civilproceedings',
        'administrative': 'administrativeproceedings',
        'admin': 'administrativeproceedings',
        'coap': 'administrativeproceedings',
        'kas': 'kasproceedings'
      };
      
      const modelName = contentTypeMap[caseType] || contentTypeMap['civil'];
      
      // Получаем content_type для данной модели
      const contentTypesResponse = await baseService.get('/case-documents/content-types/');
      let contentTypeId = null;
      
      if (contentTypesResponse.data) {
        const ct = contentTypesResponse.data.find(ct => ct.model === modelName);
        if (ct) {
          contentTypeId = ct.id;
        }
      }
      
      // Если не нашли через API, используем прямой запрос к документам
      // Получаем документы через API документов
      let documents = [];
      
      if (contentTypeId) {
        const response = await baseService.get(`/case-documents/documents/?content_type=${contentTypeId}&object_id=${caseId}`);
        documents = response.data || [];
      } else {
        // Альтернативный способ - получаем все документы и фильтруем по case
        const response = await baseService.get('/case-documents/documents/');
        const allDocs = response.data || [];
        
        // Фильтруем вручную (неоптимально, но работает)
        documents = allDocs.filter(doc => {
          // Проверяем по object_id и пытаемся определить тип дела
          return doc.object_id === parseInt(caseId);
        });
      }
      
      // Фильтруем только подписанные документы (signed)
      const signedDocuments = documents.filter(doc => doc.status === 'signed');
      
      console.log(`Found ${signedDocuments.length} signed decisions for case ${caseId}`);
      return signedDocuments;
      
    } catch (error) {
      console.error('Error getting case decisions:', error);
      return [];
    }
  }
  
  // ========== ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ СКАЧИВАНИЯ РЕШЕНИЯ ==========
  // Используем эндпоинт CaseDocument
  static async downloadDecision(caseType, caseId, decisionId, title = 'decision') {
    try {
      // Используем прямой эндпоинт скачивания для CaseDocument
      const url = `/case-documents/documents/${decisionId}/download-signed/`;
      
      console.log('Downloading decision from URL:', url);
      
      const response = await baseService.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${title}_${decisionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading decision:', error);
      throw error;
    }
  }
  
  // Альтернативный метод - получение решений через вложенный маршрут производства
  static async getCaseDecisionsViaProceeding(caseType, caseId) {
    try {
      let url = '';
      
      switch (caseType) {
        case 'criminal':
          url = `/criminal_proceedings/criminal-proceedings/${caseId}/documents/`;
          break;
        case 'civil':
          url = `/civil_proceedings/civil-proceedings/${caseId}/documents/`;
          break;
        case 'administrative':
        case 'admin':
          url = `/administrative_code/administrative-proceedings/${caseId}/documents/`;
          break;
        case 'kas':
          url = `/administrative_proceedings/kas-proceedings/${caseId}/documents/`;
          break;
        default:
          return [];
      }
      
      console.log('Getting documents from URL:', url);
      const response = await baseService.get(url);
      const documents = response.data || [];
      
      // Фильтруем только подписанные
      const signedDocuments = documents.filter(doc => doc.status === 'signed');
      
      console.log(`Found ${signedDocuments.length} signed decisions via proceeding for case ${caseId}`);
      return signedDocuments;
      
    } catch (error) {
      console.error('Error getting case decisions via proceeding:', error);
      return [];
    }
  }
  
  static async createPetition(caseType, caseId, petitionText, petitionerInfo = '') {
    try {
      const normalizedType = this.normalizeCaseTypeForApi(caseType);
      
      let url = '';
      switch (normalizedType) {
        case 'criminal':
          url = `/criminal_proceedings/criminal-proceedings/${caseId}/petitions/`;
          break;
        case 'civil':
          url = `/civil_proceedings/civil-proceedings/${caseId}/petitions/`;
          break;
        case 'administrative':
          url = `/administrative_code/administrative-proceedings/${caseId}/petitions/`;
          break;
        case 'kas':
          url = `/administrative_proceedings/kas-proceedings/${caseId}/petitions/`;
          break;
        default:
          throw new Error(`Неизвестный тип дела: ${caseType}`);
      }
      
      const petitionData = {
        date_application: new Date().toISOString().split('T')[0],
        notation: petitionText,
        petitioner_info: {
          name: petitionerInfo,
          source: 'side_user'
        }
      };
      
      console.log('Sending petition to URL:', url);
      const response = await baseService.post(url, petitionData);
      return response.data;
    } catch (error) {
      console.error('Error creating petition:', error);
      throw error;
    }
  }
  
  static async getCaseDocuments(caseType, caseId) {
    try {
      const normalizedType = this.normalizeCaseTypeForApi(caseType);
      let url = '';
      
      switch (normalizedType) {
        case 'criminal':
          url = `/criminal_proceedings/criminal-proceedings/${caseId}/documents/`;
          break;
        case 'civil':
          url = `/civil_proceedings/civil-proceedings/${caseId}/documents/`;
          break;
        case 'administrative':
          url = `/administrative_code/administrative-proceedings/${caseId}/documents/`;
          break;
        case 'kas':
          url = `/administrative_proceedings/kas-proceedings/${caseId}/documents/`;
          break;
        default:
          return [];
      }
      
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching case documents:', error);
      return [];
    }
  }

  // ========== ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ СКАЧИВАНИЯ ДОКУМЕНТА ==========
  static async downloadDocument(documentId, filename) {
      try {
          // Используем новый эндпоинт для скачивания подписанных документов
          const url = `/case-documents/documents/${documentId}/download-signed/`;
          
          console.log('Downloading document from URL:', url);
          
          const response = await baseService.get(url, {
              responseType: 'blob'
          });
          
          // Определяем расширение файла из Content-Disposition или Content-Type
          let extension = 'pdf';
          const contentType = response.headers['content-type'] || '';
          
          if (contentType.includes('pdf')) {
              extension = 'pdf';
          } else if (contentType.includes('word') || contentType.includes('docx')) {
              extension = 'docx';
          } else if (contentType.includes('doc')) {
              extension = 'doc';
          } else if (contentType.includes('jpg') || contentType.includes('jpeg')) {
              extension = 'jpg';
          } else if (contentType.includes('png')) {
              extension = 'png';
          }
          
          const blob = new Blob([response.data]);
          const urlBlob = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = urlBlob;
          link.setAttribute('download', `${filename || 'document'}.${extension}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(urlBlob);
          
          return { success: true };
      } catch (error) {
          console.error('Error downloading document:', error);
          throw error;
      }
  }

  // Получение ходатайств по делу
  static async getCasePetitions(caseType, caseId) {
    try {
      const normalizedType = this.normalizeCaseTypeForApi(caseType);
      let url = '';
      
      switch (normalizedType) {
        case 'criminal':
          url = `/criminal_proceedings/criminal-proceedings/${caseId}/petitions/`;
          break;
        case 'civil':
          url = `/civil_proceedings/civil-proceedings/${caseId}/petitions/`;
          break;
        case 'administrative':
          url = `/administrative_code/administrative-proceedings/${caseId}/petitions/`;
          break;
        case 'kas':
          url = `/administrative_proceedings/kas-proceedings/${caseId}/petitions/`;
          break;
        default:
          return [];
      }
      
      const response = await baseService.get(url);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching case petitions:', error);
      return [];
    }
  }

  // Получение истории ходатайств пользователя
  static async getUserPetitionsHistory() {
    try {
      const response = await baseService.get(`${BASE_URL}petitions-history/`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching petitions history:', error);
      return [];
    }
  }
  
  static normalizeCaseTypeForApi(caseType) {
    const apiMapping = {
      'criminal': 'criminal',
      'civil': 'civil',
      'administrative': 'administrative',
      'coap': 'administrative',
      'admin': 'administrative',
      'kas': 'kas',
      'criminal-proceedings': 'criminal',
      'civil-proceedings': 'civil',
      'admin-offenses': 'administrative'
    };
    return apiMapping[caseType] || caseType;
  }
  
  static async uploadDocument(caseType, caseId, documentTitle, documentFile, description = '') {
    const formData = new FormData();
    formData.append('case_type', this.normalizeCaseTypeForApi(caseType));
    formData.append('case_id', caseId);
    formData.append('document_title', documentTitle);
    formData.append('document_file', documentFile);
    if (description) {
      formData.append('description', description);
    }
    
    try {
      const response = await baseService.post(`${BASE_URL}upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }
  
  // ========== ИСПРАВЛЕННЫЙ МЕТОД isAuthenticated ==========
  // Проблема была в вызове this.logout() - в некоторых браузерах this может быть undefined
  static isAuthenticated() {
    const token = localStorage.getItem('side_token');
    const user = localStorage.getItem('side_user');
    const loginTime = localStorage.getItem('side_login_time');
    
    if (token && user && loginTime) {
      const timeDiff = Date.now() - parseInt(loginTime);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (timeDiff > sevenDays) {
        // Используем SideCaseService.logout() вместо this.logout()
        SideCaseService.logout();
        return false;
      }
      return true;
    }
    
    return false;
  }
  
  static getCurrentUser() {
    const userData = localStorage.getItem('side_user');
    return userData ? JSON.parse(userData) : null;
  }
  
  // ========== ИСПРАВЛЕННЫЙ МЕТОД logout ==========
  static logout() {
    localStorage.removeItem('side_token');
    localStorage.removeItem('side_user');
    localStorage.removeItem('side_login_time');
    // Используем SideCaseService вместо this для setupAuthHeader
    SideCaseService.setupAuthHeader();
  }
  
  // ========== ИСПРАВЛЕННЫЙ МЕТОД setupAuthHeader ==========
  static setupAuthHeader() {
    const token = localStorage.getItem('side_token');
    if (token) {
      baseService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete baseService.defaults.headers.common['Authorization'];
    }
  }

  // Получение списка судов, где у пользователя есть дела
  static async getUserCourts() {
      try {
          const response = await baseService.get(`${BASE_URL}user-courts/`);
          return response.data;
      } catch (error) {
          console.error('Error fetching user courts:', error);
          return [];
      }
  }

  // Получение истории документов
  static async getUserDocumentsHistory() {
      try {
          const response = await baseService.get(`${BASE_URL}documents-history/`);
          return response.data;
      } catch (error) {
          console.error('Error fetching documents history:', error);
          return [];
      }
  }

  // Получение истории ходатайств
  static async getUserPetitionsHistory() {
      try {
          const response = await baseService.get(`${BASE_URL}petitions-history/`);
          return response.data;
      } catch (error) {
          console.error('Error fetching petitions history:', error);
          return [];
      }
  }

  // Получение аудио-протоколов для дела
  static async getAudioTranscriptions(caseType, caseId) {
      try {
          const response = await baseService.get(`${BASE_URL}audio-transcriptions/?case_type=${caseType}&case_id=${caseId}`);
          return response.data;
      } catch (error) {
          console.error('Error fetching audio transcriptions:', error);
          return [];
      }
  }

  // Получение деталей конкретного ходатайства
  static async getPetitionDetail(caseType, caseId, petitionId) {
    try {
      const normalizedType = this.normalizeCaseTypeForApi(caseType);
      let url = '';
      
      switch (normalizedType) {
        case 'criminal':
          url = `/criminal_proceedings/criminal-proceedings/${caseId}/petitions/${petitionId}/`;
          break;
        case 'civil':
          url = `/civil_proceedings/civil-proceedings/${caseId}/petitions/${petitionId}/`;
          break;
        case 'administrative':
          url = `/administrative_code/administrative-proceedings/${caseId}/petitions/${petitionId}/`;
          break;
        case 'kas':
          url = `/administrative_proceedings/kas-proceedings/${caseId}/petitions/${petitionId}/`;
          break;
        default:
          return null;
      }
      
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching petition detail:', error);
      return null;
    }
  }

  // Получение списка регионов
  static async getRegions() {
    try {
      const response = await baseService.get(`${BASE_URL}regions/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching regions:', error);
      return [];
    }
  }

  // Получение судов по региону
  static async getCourtsByRegion(regionId) {
    try {
      const response = await baseService.get(`${BASE_URL}courts-by-region/?region_id=${regionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching courts by region:', error);
      return [];
    }
  }
}

SideCaseService.setupAuthHeader();

export default SideCaseService;