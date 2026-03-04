import baseService from './baseService';

const BASE_URL = '/administrative_code/';

class AdministrativeCaseService {
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

  // === Органы, составившие протокол (ReferringAuthorityAdmin) ===
  
  static async getReferringAuthorities() {
    try {
      const response = await baseService.get(`${BASE_URL}referring-authorities-admin/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referring authorities:', error);
      return [];
    }
  }

  static async createReferringAuthority(authorityData) {
    try {
      const cleanedData = this.cleanData(authorityData);
      const response = await baseService.post(
        `${BASE_URL}referring-authorities-admin/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating referring authority:', error);
      throw error;
    }
  }

  static async updateReferringAuthority(authorityId, authorityData) {
    try {
      const cleanedData = this.cleanData(authorityData);
      const response = await baseService.patch(
        `${BASE_URL}referring-authorities-admin/${authorityId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating referring authority:', error);
      throw error;
    }
  }

  static async deleteReferringAuthority(authorityId) {
    try {
      await baseService.delete(`${BASE_URL}referring-authorities-admin/${authorityId}/`);
      return { success: true };
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('Received 404 but authority might be deleted:', authorityId);
        return { success: true };
      }
      console.error('Error deleting referring authority:', error);
      throw error;
    }
  }

  // === Административные производства (AdministrativeProceedings) ===
  
  static async getAllAdministrativeProceedings() {
    try {
      const response = await baseService.get(`${BASE_URL}administrative-proceedings/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all administrative proceedings:', error);
      return [];
    }
  }

  static async getAdministrativeProceedingById(id) {
    try {
      const response = await baseService.get(`${BASE_URL}administrative-proceedings/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching administrative proceeding by ID:', error);
      throw error;
    }
  }

  static async createAdministrativeProceedings(proceedingsData) {
    try {
      const cleanedData = this.cleanData(proceedingsData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating administrative proceedings:', error);
      throw error;
    }
  }

  static async updateAdministrativeProceedings(proceedingsId, proceedingsData) {
    try {
      const cleanedData = this.cleanData(proceedingsData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingsId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating administrative proceedings:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  static async deleteAdministrativeProceedings(proceedingsId) {
    try {
      await baseService.delete(`${BASE_URL}administrative-proceedings/${proceedingsId}/`);
      return { success: true };
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('Received 404 but proceeding might be deleted:', proceedingsId);
        return { success: true };
      }
      console.error('Error deleting administrative proceedings:', error);
      throw error;
    }
  }

  // === Решения по делу (AdministrativeDecision) ===
  
  static async getDecisions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/decisions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching administrative decisions:', error);
      return [];
    }
  }
  
  static async getDecisionById(proceedingId, decisionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/decisions/${decisionId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Решение не найдено');
      }
      console.error('Error fetching administrative decision:', error);
      throw error;
    }
  }
  
  static async createDecision(proceedingId, decisionData) {
    try {
      const cleanedData = this.cleanData(decisionData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/decisions/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating administrative decision:', error);
      throw error;
    }
  }
  
  static async updateDecision(proceedingId, decisionId, decisionData) {
    try {
      const cleanedData = this.cleanData(decisionData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/decisions/${decisionId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating administrative decision:', error);
      throw error;
    }
  }
  
  static async deleteDecision(proceedingId, decisionId) {
    try {
      await baseService.delete(
        `${BASE_URL}administrative-proceedings/${proceedingId}/decisions/${decisionId}/`
      );
    } catch (error) {
      console.error('Error deleting administrative decision:', error);
      throw error;
    }
  }

  // === Стороны (AdministrativeSidesCaseInCase) ===
  
  static async getSides(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/sides/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching administrative sides:', error);
      return [];
    }
  }

  static async getSideById(proceedingId, sideId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/sides/${sideId}/`
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

  static async createSide(proceedingId, sideData) {
    try {
      const cleanedData = this.cleanData(sideData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/sides/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating side:', error);
      throw error;
    }
  }

  static async updateSide(proceedingId, sideId, sideData) {
    try {
      const cleanedData = this.cleanData(sideData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/sides/${sideId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating side:', error);
      throw error;
    }
  }

  static async deleteSide(proceedingId, sideId) {
    try {
      await baseService.delete(
        `${BASE_URL}administrative-proceedings/${proceedingId}/sides/${sideId}/`
      );
    } catch (error) {
      console.error('Error deleting side:', error);
      throw error;
    }
  }

  // === Защитники (AdministrativeLawyer) ===
  
  static async getLawyers(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/lawyers/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      return [];
    }
  }

  static async getLawyerById(proceedingId, lawyerId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/lawyers/${lawyerId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Защитник не найден');
      }
      console.error('Error fetching lawyer:', error);
      throw error;
    }
  }

  static async createLawyer(proceedingId, lawyerData) {
    try {
      const cleanedData = this.cleanData(lawyerData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/lawyers/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating lawyer:', error);
      throw error;
    }
  }

  static async updateLawyer(proceedingId, lawyerId, lawyerData) {
    try {
      const cleanedData = this.cleanData(lawyerData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/lawyers/${lawyerId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating lawyer:', error);
      throw error;
    }
  }

  static async deleteLawyer(proceedingId, lawyerId) {
    try {
      await baseService.delete(
        `${BASE_URL}administrative-proceedings/${proceedingId}/lawyers/${lawyerId}/`
      );
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      throw error;
    }
  }

  // === Движение дела (AdministrativeCaseMovement) ===
  
  static async getMovements(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/movements/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching movements:', error);
      return [];
    }
  }

  static async getMovementById(proceedingId, movementId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/movements/${movementId}/`
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

  static async createMovement(proceedingId, movementData) {
    try {
      const cleanedData = this.cleanData(movementData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/movements/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating movement:', error);
      throw error;
    }
  }

  static async updateMovement(proceedingId, movementId, movementData) {
    try {
      const cleanedData = this.cleanData(movementData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/movements/${movementId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating movement:', error);
      throw error;
    }
  }

  static async deleteMovement(proceedingId, movementId) {
    try {
      await baseService.delete(
        `${BASE_URL}administrative-proceedings/${proceedingId}/movements/${movementId}/`
      );
    } catch (error) {
      console.error('Error deleting movement:', error);
      throw error;
    }
  }

  // === Ходатайства (AdministrativePetition) ===
  
  static async getPetitions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/petitions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching petitions:', error);
      return [];
    }
  }

  static async getPetitionById(proceedingId, petitionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/petitions/${petitionId}/`
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

  static async createPetition(proceedingId, petitionData) {
    try {
      const cleanedData = this.cleanData(petitionData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/petitions/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating petition:', error);
      throw error;
    }
  }

  static async updatePetition(proceedingId, petitionId, petitionData) {
    try {
      const cleanedData = this.cleanData(petitionData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/petitions/${petitionId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating petition:', error);
      throw error;
    }
  }

  static async deletePetition(proceedingId, petitionId) {
    try {
      await baseService.delete(
        `${BASE_URL}administrative-proceedings/${proceedingId}/petitions/${petitionId}/`
      );
    } catch (error) {
      console.error('Error deleting petition:', error);
      throw error;
    }
  }

  // === Исполнение (AdministrativeExecution) ===
  
  static async getExecutions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/executions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching executions:', error);
      return [];
    }
  }

  static async getExecutionById(proceedingId, executionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}administrative-proceedings/${proceedingId}/executions/${executionId}/`
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

  static async createExecution(proceedingId, executionData) {
    try {
      const cleanedData = this.cleanData(executionData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/executions/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating execution:', error);
      throw error;
    }
  }

  static async updateExecution(proceedingId, executionId, executionData) {
    try {
      const cleanedData = this.cleanData(executionData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/executions/${executionId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating execution:', error);
      throw error;
    }
  }

  static async deleteExecution(proceedingId, executionId) {
    try {
      await baseService.delete(
        `${BASE_URL}administrative-proceedings/${proceedingId}/executions/${executionId}/`
      );
    } catch (error) {
      console.error('Error deleting execution:', error);
      throw error;
    }
  }

  // === Вспомогательные методы ===
  
  static async getAdminOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}admin-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin options:', error);
      return {
        considerationType: [],
        outcome: [],
        punishmentType: [],
        executionResult: [],
        suspensionReason: []
      };
    }
  }

  static async getAdminDecisionOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}admin-decision-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin decision options:', error);
      return {
        outcome: [],
        punishment_type: [],
        complaint_result: []
      };
    }
  }

  // === Архивные операции ===

  static async archiveAdministrativeProceeding(proceedingId) {
      try {
          const response = await baseService.post(
              `${BASE_URL}administrative-proceedings/${proceedingId}/archive/`
          );
          return response.data;
      } catch (error) {
          console.error('Error archiving administrative proceeding:', error);
          throw error;
      }
  }

  static async unarchiveAdministrativeProceeding(proceedingId) {
      try {
          const response = await baseService.post(
              `${BASE_URL}administrative-proceedings/${proceedingId}/unarchive/`
          );
          return response.data;
      } catch (error) {
          console.error('Error unarchiving administrative proceeding:', error);
          throw error;
      }
  }

  static async getArchivedProceedings() {
      try {
          const response = await baseService.get(`${BASE_URL}administrative-proceedings/?archive=true`);
          return response.data;
      } catch (error) {
          console.error('Error fetching archived proceedings:', error);
          return [];
      }
  }

  static async getJudges() {
    try {
      const response = await baseService.get('/administrative_code/judges/');
      
      if (Array.isArray(response.data)) {
        if (response.data.length > 0 && response.data[0].full_name) {
          return response.data;
        } else {
          return response.data.map(judge => ({
            id: judge.id,
            full_name: judge.full_name || 
                      `${judge.last_name || ''} ${judge.first_name || ''} ${judge.middle_name || ''}`.trim() || 
                      judge.username || `Судья ${judge.id}`,
            judge_code: judge.judge_code || judge.username || ''
          }));
        }
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching judges:', error);
      return [];
    }
  }

  // === Методы для административных правонарушений (индексы 5 и 12) ===

  static async getAdministrativeOffenseTypes() {
    try {
      // Возвращаем статические данные о типах административных правонарушений
      return [
        { value: '5', label: 'Дело об административном правонарушении' },
        { value: '12', label: 'Дело по жалобе на постановление по делу об административном правонарушении' },
      ];
    } catch (error) {
      console.error('Error fetching administrative offense types:', error);
      return [];
    }
  }

  static async getProceedingsByType(type) {
    try {
      // Фильтрация производств по типу (индексу)
      const allProceedings = await this.getAllAdministrativeProceedings();
      if (type === '5' || type === '12') {
        return allProceedings.filter(p => p.registry_index === type || p.offense_type === type);
      }
      return allProceedings;
    } catch (error) {
      console.error('Error fetching proceedings by type:', error);
      return [];
    }
  }

  static async getStatisticsByType() {
    try {
      const allProceedings = await this.getAllAdministrativeProceedings();
      
      const stats = {
        offense5: allProceedings.filter(p => p.registry_index === '5' || p.offense_type === '5').length,
        offense12: allProceedings.filter(p => p.registry_index === '12' || p.offense_type === '12').length,
        total: allProceedings.length
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching statistics by type:', error);
      return { offense5: 0, offense12: 0, total: 0 };
    }
  }

  static async getComplaintProceedings() {
    try {
      // Получение только дел по жалобам (индекс 12)
      const allProceedings = await this.getAllAdministrativeProceedings();
      return allProceedings.filter(p => p.registry_index === '12' || p.offense_type === '12');
    } catch (error) {
      console.error('Error fetching complaint proceedings:', error);
      return [];
    }
  }

  static async getOriginalOffenseProceedings() {
    try {
      // Получение только дел об АП (индекс 5)
      const allProceedings = await this.getAllAdministrativeProceedings();
      return allProceedings.filter(p => p.registry_index === '5' || p.offense_type === '5');
    } catch (error) {
      console.error('Error fetching original offense proceedings:', error);
      return [];
    }
  }
}

export default AdministrativeCaseService;