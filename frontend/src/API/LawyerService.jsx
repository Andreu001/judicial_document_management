import baseService from './baseService';

const CIVIL_BASE_URL = '/civil_proceedings/civil-proceedings/';

class LawyerService {

    // === Роли сторон (из business_card) ===
  
  static async getSideRoles() {
    try {
      const response = await baseService.get('/business_card/sides/');
      return response.data;
    } catch (error) {
      console.error('Error fetching side roles:', error);
      return [];
    }
  }

  static async getLawyers(proceedingId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${proceedingId}/lawyers/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching civil lawyers:', error);
      throw error;
    }
  }

  static async getLawyerById(proceedingId, lawyerId) {
    try {
      const response = await baseService.get(`${CIVIL_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching civil lawyer:', error);
      throw error;
    }
  }

  static async createLawyer(proceedingId, data) {
    try {
      const response = await baseService.post(`${CIVIL_BASE_URL}${proceedingId}/lawyers/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating civil lawyer:', error);
      throw error;
    }
  }

  static async attachExistingLawyer(proceedingId, data) {
    try {
      const response = await baseService.post(`${CIVIL_BASE_URL}${proceedingId}/lawyers/`, data);
      return response.data;
    } catch (error) {
      console.error('Error attaching existing lawyer:', error);
      throw error;
    }
  }

static async updateLawyer(proceedingId, lawyerId, data) {
  try {
    const response = await baseService.put(`${CIVIL_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating civil lawyer:', error);
    throw error;
  }
}

  static async deleteLawyer(proceedingId, lawyerId) {
    try {
      const response = await baseService.delete(`${CIVIL_BASE_URL}${proceedingId}/lawyers/${lawyerId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting civil lawyer:', error);
      throw error;
    }
  }
}

export default LawyerService;