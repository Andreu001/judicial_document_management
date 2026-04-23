// API/OtherMaterialService.jsx - УДАЛИТЕ старые методы и ЗАМЕНИТЕ на эти

import baseService from './baseService';

const BASE_URL = '/other-materials/';

class OtherMaterialService {
  static cleanData(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

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

  // === Иные материалы (OtherMaterial) ===
  
  static async getAllOtherMaterials(includeArchived = false) {
    try {
      const url = includeArchived 
        ? `${BASE_URL}other-materials/?archive=true`
        : `${BASE_URL}other-materials/`;
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching other materials:', error);
      return [];
    }
  }

  static async getOtherMaterialById(id) {
    try {
      const response = await baseService.get(`${BASE_URL}other-materials/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching other material by ID:', error);
      throw error;
    }
  }

  static async createOtherMaterial(materialData) {
    try {
      const cleanedData = this.cleanData(materialData);
      const response = await baseService.post(
        `${BASE_URL}other-materials/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating other material:', error);
      throw error;
    }
  }

  static async updateOtherMaterial(materialId, materialData) {
    try {
      const cleanedData = this.cleanData(materialData);
      const response = await baseService.patch(
        `${BASE_URL}other-materials/${materialId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating other material:', error);
      throw error;
    }
  }

  static async deleteOtherMaterial(materialId) {
    try {
      await baseService.delete(`${BASE_URL}other-materials/${materialId}/`);
      return { success: true };
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true };
      }
      console.error('Error deleting other material:', error);
      throw error;
    }
  }

  // === Стороны (OtherMaterialSidesCaseInCase) ===
  
  static async getSides(materialId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/sides/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching sides:', error);
      return [];
    }
  }

  static async getSideById(materialId, sideId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/sides/${sideId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Сторона не найдена');
      }
      console.error('Error fetching side:', error);
      throw error;
    }
  }

  static async createSide(materialId, sideData) {
    try {
      const cleanedData = this.cleanData(sideData);
      const response = await baseService.post(
        `${BASE_URL}other-materials/${materialId}/sides/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating side:', error);
      throw error;
    }
  }

  static async updateSide(materialId, sideId, sideData) {
    try {
      const cleanedData = this.cleanData(sideData);
      const response = await baseService.patch(
        `${BASE_URL}other-materials/${materialId}/sides/${sideId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating side:', error);
      throw error;
    }
  }

  static async deleteSide(materialId, sideId) {
    try {
      await baseService.delete(
        `${BASE_URL}other-materials/${materialId}/sides/${sideId}/`
      );
    } catch (error) {
      console.error('Error deleting side:', error);
      throw error;
    }
  }

  // === Представители (OtherMaterialLawyer) ===
  
  static async getLawyers(materialId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/lawyers/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      return [];
    }
  }

  static async getLawyerById(materialId, lawyerId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/lawyers/${lawyerId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Представитель не найден');
      }
      console.error('Error fetching lawyer:', error);
      throw error;
    }
  }

  static async createLawyer(materialId, lawyerData) {
    try {
      const cleanedData = this.cleanData(lawyerData);
      const response = await baseService.post(
        `${BASE_URL}other-materials/${materialId}/lawyers/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating lawyer:', error);
      throw error;
    }
  }

  static async updateLawyer(materialId, lawyerId, lawyerData) {
    try {
      const cleanedData = this.cleanData(lawyerData);
      const response = await baseService.patch(
        `${BASE_URL}other-materials/${materialId}/lawyers/${lawyerId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating lawyer:', error);
      throw error;
    }
  }

  static async deleteLawyer(materialId, lawyerId) {
    try {
      await baseService.delete(
        `${BASE_URL}other-materials/${materialId}/lawyers/${lawyerId}/`
      );
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      throw error;
    }
  }

  // === Решения (OtherMaterialDecision) - ЕДИНСТВЕННАЯ ОСТАВШАЯСЯ СВЯЗАННАЯ МОДЕЛЬ ===
  
  static async getDecisions(materialId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/decisions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching decisions:', error);
      return [];
    }
  }

  static async getDecisionById(materialId, decisionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/decisions/${decisionId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Решение не найдено');
      }
      console.error('Error fetching decision:', error);
      throw error;
    }
  }

  static async createDecision(materialId, decisionData) {
    try {
      const cleanedData = this.cleanData(decisionData);
      const response = await baseService.post(
        `${BASE_URL}other-materials/${materialId}/decisions/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating decision:', error);
      throw error;
    }
  }

  static async updateDecision(materialId, decisionId, decisionData) {
    try {
      const cleanedData = this.cleanData(decisionData);
      const response = await baseService.patch(
        `${BASE_URL}other-materials/${materialId}/decisions/${decisionId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating decision:', error);
      throw error;
    }
  }

  static async deleteDecision(materialId, decisionId) {
    try {
      await baseService.delete(
        `${BASE_URL}other-materials/${materialId}/decisions/${decisionId}/`
      );
    } catch (error) {
      console.error('Error deleting decision:', error);
      throw error;
    }
  }

  // === Вспомогательные методы ===
  
  static async getOtherMaterialOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}other-material-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching options:', error);
      return {
        status: [],
        responsiblePersonRoles: [],
        outcome: []
      };
    }
  }

  static async getResponsiblePersons() {
    try {
      const response = await baseService.get(`${BASE_URL}responsible-persons/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching responsible persons:', error);
      return [];
    }
  }

  // === Архивные операции ===

  static async archiveOtherMaterial(materialId) {
    try {
      const response = await baseService.post(
        `${BASE_URL}other-materials/${materialId}/archive/`
      );
      return response.data;
    } catch (error) {
      console.error('Error archiving material:', error);
      throw error;
    }
  }

  static async unarchiveOtherMaterial(materialId) {
    try {
      const response = await baseService.post(
        `${BASE_URL}other-materials/${materialId}/unarchive/`
      );
      return response.data;
    } catch (error) {
      console.error('Error unarchiving material:', error);
      throw error;
    }
  }

  static async getArchivedMaterials() {
    try {
      const response = await baseService.get(`${BASE_URL}other-materials/?archive=true`);
      return response.data;
    } catch (error) {
      console.error('Error fetching archived materials:', error);
      return [];
    }
  }

  // УДАЛЕНЫ методы: getMovements, getPetitions, getExecutions
  // Они больше не нужны, так как эти модели удалены из бэкенда
}

export default OtherMaterialService;