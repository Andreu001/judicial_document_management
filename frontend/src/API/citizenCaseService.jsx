import baseService from './baseService';

class CitizenCaseService {
  // Получить список дел
  async getCases() {
    try {
      const response = await baseService.get('/citizen/api/cases/');
      return response.data;
    } catch (error) {
      console.error('Error fetching cases:', error);
      return [];
    }
  }

  // Получить детали дела
  async getCaseDetail(caseId) {
    try {
      const response = await baseService.get(`/citizen/api/cases/${caseId}/case_detail/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching case detail:', error);
      throw error;
    }
  }

  // Скачать решение по делу
  async downloadDecision(caseId) {
    try {
      const response = await baseService.get(`/citizen/api/cases/${caseId}/download_decision/`, {
        responseType: 'blob'
      });
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Получаем имя файла из заголовка Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'decision.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading decision:', error);
      throw error;
    }
  }

  // Получить ходатайства по делу
  async getPetitions(caseAccessId) {
    try {
      const response = await baseService.get(`/citizen/api/petitions/?case_access=${caseAccessId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petitions:', error);
      return [];
    }
  }

  // Создать ходатайство
  async createPetition(petitionData) {
    try {
      const response = await baseService.post('/citizen/api/petitions/', petitionData);
      return response.data;
    } catch (error) {
      console.error('Error creating petition:', error);
      throw error;
    }
  }

  // Обновить ходатайство (черновик)
  async updatePetition(petitionId, petitionData) {
    try {
      const response = await baseService.put(`/citizen/api/petitions/${petitionId}/`, petitionData);
      return response.data;
    } catch (error) {
      console.error('Error updating petition:', error);
      throw error;
    }
  }

  // Подать ходатайство
  async submitPetition(petitionId) {
    try {
      const response = await baseService.post(`/citizen/api/petitions/${petitionId}/submit/`);
      return response.data;
    } catch (error) {
      console.error('Error submitting petition:', error);
      throw error;
    }
  }

  // Получить документы по делу
  async getDocuments(caseAccessId) {
    try {
      const response = await baseService.get(`/citizen/api/documents/?case_access=${caseAccessId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  // Загрузить документ
  async uploadDocument(documentData) {
    try {
      const formData = new FormData();
      formData.append('case_access', documentData.case_access);
      formData.append('title', documentData.title);
      formData.append('description', documentData.description || '');
      formData.append('file', documentData.file);
      
      const response = await baseService.post('/citizen/api/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Загрузить несколько файлов
  async uploadMultipleDocuments(caseAccessId, files, title, description) {
    try {
      const formData = new FormData();
      formData.append('case_access_id', caseAccessId);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await baseService.post('/citizen/api/documents/upload_multiple/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading multiple documents:', error);
      throw error;
    }
  }
}

export default new CitizenCaseService();