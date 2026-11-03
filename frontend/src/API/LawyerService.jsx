import baseService from './baseService';

const CIVIL_BASE_URL = '/civil_proceedings/civil-proceedings/';
const ADMIN_BASE_URL = '/administrative_code/administrative-proceedings/';

class LawyerService {
  
  // === Реестр адвокатов ===

  static async getLawyerRoles() {
    try {
      const response = await baseService.get('/business_card/sides/?lawyer=1');
      return response.data;
    } catch (error) {
      console.error('Error fetching lawyer roles:', error);
      return [];
    }
  }

  static async searchLawyerProfiles(query) {
    try {
      const response = await baseService.get(
        `/business_card/lawyer-profiles/?search=${encodeURIComponent(query)}`
      );
      // DRF SearchFilter возвращает либо массив, либо {results: [...]}
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    } catch (error) {
      console.error('Error searching lawyer profiles:', error);
      return [];
    }
  }

  static async createLawyerProfile(data) {
    try {
      const response = await baseService.post('/business_card/lawyer-profiles/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating lawyer profile:', error);
      throw error;
    }
  }

    static async updateLawyerProfile(id, data) {
    try {
      const response = await baseService.put(`/business_card/lawyer-profiles/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating lawyer profile:', error);
      throw error;
    }
  }

  static async deleteLawyerProfile(id) {
    try {
      const response = await baseService.delete(`/business_card/lawyer-profiles/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting lawyer profile:', error);
      throw error;
    }
  }

  static async getAllLawyerProfiles() {
    try {
      const response = await baseService.get('/business_card/lawyer-profiles/');
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    } catch (error) {
      console.error('Error fetching lawyer profiles:', error);
      return [];
    }
  }

  // === Гражданские дела (Civil) ===
  
  static async getCivilLawyers(proceedingId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${proceedingId}/lawyers/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching civil lawyers:', error);
      throw error;
    }
  }

  static async getCivilLawyerById(proceedingId, lawyerId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching civil lawyer:', error);
      throw error;
    }
  }

  static async createCivilLawyer(proceedingId, data) {
    try {
      const response = await baseService.post(`${CIVIL_BASE_URL}${proceedingId}/lawyers/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating civil lawyer:', error);
      throw error;
    }
  }

  static async attachExistingCivilLawyer(proceedingId, data) {
    try {
      const response = await baseService.post(`${CIVIL_BASE_URL}${proceedingId}/lawyers/`, data);
      return response.data;
    } catch (error) {
      console.error('Error attaching existing civil lawyer:', error);
      throw error;
    }
  }

  static async updateCivilLawyer(proceedingId, lawyerId, data) {
    try {
      const response = await baseService.put(`${CIVIL_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating civil lawyer:', error);
      throw error;
    }
  }

  static async deleteCivilLawyer(proceedingId, lawyerId) {
    try {
      const response = await baseService.delete(`${CIVIL_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting civil lawyer:', error);
      throw error;
    }
  }

  // === Административные дела (Administrative) ===
  
  static async getAdminLawyers(proceedingId) {
    try {
      const response = await baseService.get(`${ADMIN_BASE_URL}${proceedingId}/lawyers/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin lawyers:', error);
      throw error;
    }
  }

  static async getAdminLawyerById(proceedingId, lawyerId) {
    try {
      const response = await baseService.get(`${ADMIN_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin lawyer:', error);
      throw error;
    }
  }

  static async createAdminLawyer(proceedingId, data) {
    try {
      const response = await baseService.post(`${ADMIN_BASE_URL}${proceedingId}/lawyers/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating admin lawyer:', error);
      throw error;
    }
  }

  static async attachExistingAdminLawyer(proceedingId, data) {
    try {
      const response = await baseService.post(`${ADMIN_BASE_URL}${proceedingId}/lawyers/`, data);
      return response.data;
    } catch (error) {
      console.error('Error attaching existing admin lawyer:', error);
      throw error;
    }
  }

  static async updateAdminLawyer(proceedingId, lawyerId, data) {
    try {
      const response = await baseService.put(`${ADMIN_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating admin lawyer:', error);
      throw error;
    }
  }

  static async deleteAdminLawyer(proceedingId, lawyerId) {
    try {
      const response = await baseService.delete(`${ADMIN_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting admin lawyer:', error);
      throw error;
    }
  }

  // === Универсальные методы (определяют тип дела по URL или параметру) ===
  
  static async getLawyers(proceedingId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.getAdminLawyers(proceedingId);
    }
    return this.getCivilLawyers(proceedingId);
  }

  static async getLawyerById(proceedingId, lawyerId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.getAdminLawyerById(proceedingId, lawyerId);
    }
    return this.getCivilLawyerById(proceedingId, lawyerId);
  }

  static async createLawyer(proceedingId, data, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.createAdminLawyer(proceedingId, data);
    }
    return this.createCivilLawyer(proceedingId, data);
  }

  static async attachExistingLawyer(proceedingId, data, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.attachExistingAdminLawyer(proceedingId, data);
    }
    return this.attachExistingCivilLawyer(proceedingId, data);
  }

  static async updateLawyer(proceedingId, lawyerId, data, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.updateAdminLawyer(proceedingId, lawyerId, data);
    }
    return this.updateCivilLawyer(proceedingId, lawyerId, data);
  }

  static async deleteLawyer(proceedingId, lawyerId, caseType = 'civil') {
    if (caseType === 'admin') {
      return this.deleteAdminLawyer(proceedingId, lawyerId);
    }
    return this.deleteCivilLawyer(proceedingId, lawyerId);
  }
}

export default LawyerService;