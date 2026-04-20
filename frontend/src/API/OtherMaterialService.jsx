// API/OtherMaterialService.js - ПОЛНОСТЬЮ ЗАМЕНИТЕ ФАЙЛ

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
  
  static async getAllOtherMaterials() {
    try {
      const response = await baseService.get(`${BASE_URL}other-materials/`);
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

  // === Движение (OtherMaterialMovement) ===
  
  static async getMovements(materialId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/movements/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching movements:', error);
      return [];
    }
  }

  static async getMovementById(materialId, movementId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/movements/${movementId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Движение не найдено');
      }
      console.error('Error fetching movement:', error);
      throw error;
    }
  }

  static async createMovement(materialId, movementData) {
    try {
      const cleanedData = this.cleanData(movementData);
      const response = await baseService.post(
        `${BASE_URL}other-materials/${materialId}/movements/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating movement:', error);
      throw error;
    }
  }

  static async updateMovement(materialId, movementId, movementData) {
    try {
      const cleanedData = this.cleanData(movementData);
      const response = await baseService.patch(
        `${BASE_URL}other-materials/${materialId}/movements/${movementId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating movement:', error);
      throw error;
    }
  }

  static async deleteMovement(materialId, movementId) {
    try {
      await baseService.delete(
        `${BASE_URL}other-materials/${materialId}/movements/${movementId}/`
      );
    } catch (error) {
      console.error('Error deleting movement:', error);
      throw error;
    }
  }

  // === Ходатайства/заявления (OtherMaterialPetition) ===
  
  static async getPetitions(materialId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/petitions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching petitions:', error);
      return [];
    }
  }

  static async getPetitionById(materialId, petitionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/petitions/${petitionId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Ходатайство не найдено');
      }
      console.error('Error fetching petition:', error);
      throw error;
    }
  }

  static async createPetition(materialId, petitionData) {
    try {
      const cleanedData = this.cleanData(petitionData);
      const response = await baseService.post(
        `${BASE_URL}other-materials/${materialId}/petitions/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating petition:', error);
      throw error;
    }
  }

  static async updatePetition(materialId, petitionId, petitionData) {
    try {
      const cleanedData = this.cleanData(petitionData);
      const response = await baseService.patch(
        `${BASE_URL}other-materials/${materialId}/petitions/${petitionId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating petition:', error);
      throw error;
    }
  }

  static async deletePetition(materialId, petitionId) {
    try {
      await baseService.delete(
        `${BASE_URL}other-materials/${materialId}/petitions/${petitionId}/`
      );
    } catch (error) {
      console.error('Error deleting petition:', error);
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
        responsiblePersonRoles: []
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

  static async getPetitionTypes() {
    try {
      const response = await baseService.get('/business_card/petitions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching petition types:', error);
      return [];
    }
  }

  static async getDecisions() {
    try {
      const response = await baseService.get('/business_card/decisions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching decisions:', error);
      return [];
    }
  }
  
  // === Решения (OtherMaterialDecision) ===
  
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

  // === Исполнения (OtherMaterialExecution) ===
  
  static async getExecutions(materialId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/executions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching executions:', error);
      return [];
    }
  }

  static async getExecutionById(materialId, executionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}other-materials/${materialId}/executions/${executionId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Исполнение не найдено');
      }
      console.error('Error fetching execution:', error);
      throw error;
    }
  }

  static async createExecution(materialId, executionData) {
    try {
      const cleanedData = this.cleanData(executionData);
      const response = await baseService.post(
        `${BASE_URL}other-materials/${materialId}/executions/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating execution:', error);
      throw error;
    }
  }

  static async updateExecution(materialId, executionId, executionData) {
    try {
      const cleanedData = this.cleanData(executionData);
      const response = await baseService.patch(
        `${BASE_URL}other-materials/${materialId}/executions/${executionId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating execution:', error);
      throw error;
    }
  }

  static async deleteExecution(materialId, executionId) {
    try {
      await baseService.delete(
        `${BASE_URL}other-materials/${materialId}/executions/${executionId}/`
      );
    } catch (error) {
      console.error('Error deleting execution:', error);
      throw error;
    }
  }
}

export default OtherMaterialService;