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

  // Порядок поступления дела
  static async getCaseOrderOptions() {
    try {
      const response = await baseService.get('/administrative_code/case-order-options/');
      return response.data;
    } catch (error) {
      console.error('Error fetching case order options:', error);
      return [];
    }
  }

  // Категория дела
  static async getCaseCategoryOptions() {
    try {
      const response = await baseService.get('/administrative_code/case-category-options/');
      return response.data;
    } catch (error) {
      console.error('Error fetching case category options:', error);
      return [];
    }
  }

  // Стадии исполнения
  static async getExecutionStageOptions() {
    try {
      const response = await baseService.get('/administrative_code/execution-stage-options/');
      return response.data;
    } catch (error) {
      console.error('Error fetching execution stage options:', error);
      return [];
    }
  }

  // Соблюдение сроков
  static async getTermComplianceOptions() {
    try {
      const response = await baseService.get('/administrative_code/term-compliance-options/');
      return response.data;
    } catch (error) {
      console.error('Error fetching term compliance options:', error);
      return [];
    }
  }

  // Причины отложения (из PostponementReasonAdmin)
  static async getPostponementReasons() {
    try {
      const response = await baseService.get('/administrative_code/postponement-reasons-admin/');
      return response.data;
    } catch (error) {
      console.error('Error fetching postponement reasons:', error);
      return [];
    }
  }

  // Причины приостановления (из SuspensionReasonAdmin)
  static async getSuspensionReasons() {
    try {
      const response = await baseService.get('/administrative_code/suspension-reasons-admin/');
      return response.data;
    } catch (error) {
      console.error('Error fetching suspension reasons:', error);
      return [];
    }
  }

  // ===== АПЕЛЛЯЦИЯ =====
  static async getAppeal(proceedingId) {
    try {
      const response = await baseService.get(`${BASE_URL}administrative-proceedings/${proceedingId}/appeal/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching appeal:', error);
      return null;
    }
  }

  static async createAppeal(proceedingId, appealData) {
    try {
      const cleanedData = this.cleanData(appealData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/appeal/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating appeal:', error);
      throw error;
    }
  }

  static async updateAppeal(proceedingId, appealData) {
    try {
      const cleanedData = this.cleanData(appealData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/appeal/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating appeal:', error);
      throw error;
    }
  }

  // ===== КАССАЦИЯ =====
  static async getCassation(proceedingId) {
    try {
      const response = await baseService.get(`${BASE_URL}administrative-proceedings/${proceedingId}/cassation/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching cassation:', error);
      return null;
    }
  }

  static async createCassation(proceedingId, cassationData) {
    try {
      const cleanedData = this.cleanData(cassationData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/cassation/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating cassation:', error);
      throw error;
    }
  }

  static async updateCassation(proceedingId, cassationData) {
    try {
      const cleanedData = this.cleanData(cassationData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/cassation/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating cassation:', error);
      throw error;
    }
  }

  // ===== СУБЪЕКТЫ ПРАВОНАРУШЕНИЯ =====
  static async getSubjects(proceedingId) {
    try {
      const response = await baseService.get(`${BASE_URL}administrative-proceedings/${proceedingId}/subjects/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  }

  static async createSubject(proceedingId, subjectData) {
    try {
      const cleanedData = this.cleanData(subjectData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/subjects/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  }

  static async updateSubject(proceedingId, subjectId, subjectData) {
    try {
      const cleanedData = this.cleanData(subjectData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/subjects/${subjectId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  }

  static async deleteSubject(proceedingId, subjectId) {
    try {
      await baseService.delete(`${BASE_URL}administrative-proceedings/${proceedingId}/subjects/${subjectId}/`);
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }

  // Типы субъектов (статический справочник)
  static getSubjectTypes() {
    return [
      { value: 'legal_entity', label: 'Юридическое лицо' },
      { value: 'official', label: 'Должностное лицо' },
      { value: 'entrepreneur', label: 'Лицо, осуществляющее предпринимательскую деятельность' },
      { value: 'military', label: 'Военнослужащий' },
      { value: 'foreign', label: 'Иностранный гражданин/лицо без гражданства' },
      { value: 'federal_civil_servant', label: 'Федеральный государственный гражданский служащий' },
      { value: 'regional_civil_servant', label: 'Государственный гражданский служащий субъекта РФ' },
      { value: 'municipal_servant', label: 'Служащий органа местного самоуправления' },
      { value: 'other_physical', label: 'Иное физическое лицо' },
    ];
  }

  // ===== МЕРЫ ОБЕСПЕЧЕНИЯ =====
  static async getSecurityMeasures(proceedingId) {
    try {
      const response = await baseService.get(`${BASE_URL}administrative-proceedings/${proceedingId}/security-measures/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching security measures:', error);
      return [];
    }
  }

  static async createSecurityMeasure(proceedingId, measureData) {
    try {
      const cleanedData = this.cleanData(measureData);
      const response = await baseService.post(
        `${BASE_URL}administrative-proceedings/${proceedingId}/security-measures/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating security measure:', error);
      throw error;
    }
  }

  static async updateSecurityMeasure(proceedingId, measureId, measureData) {
    try {
      const cleanedData = this.cleanData(measureData);
      const response = await baseService.patch(
        `${BASE_URL}administrative-proceedings/${proceedingId}/security-measures/${measureId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating security measure:', error);
      throw error;
    }
  }

  static async deleteSecurityMeasure(proceedingId, measureId) {
    try {
      await baseService.delete(`${BASE_URL}administrative-proceedings/${proceedingId}/security-measures/${measureId}/`);
    } catch (error) {
      console.error('Error deleting security measure:', error);
      throw error;
    }
  }

  // Типы мер обеспечения (статический справочник)
  static getSecurityMeasureTypes() {
    return [
      { value: 'delivery', label: 'Доставление' },
      { value: 'detention', label: 'Административное задержание' },
      { value: 'drive', label: 'Привод' },
      { value: 'personal_search', label: 'Личный досмотр' },
      { value: 'search_of_items', label: 'Досмотр вещей' },
      { value: 'vehicle_search', label: 'Досмотр транспортного средства' },
      { value: 'examination', label: 'Осмотр помещений' },
      { value: 'removal_from_driving', label: 'Отстранение от управления ТС' },
      { value: 'alcohol_examination', label: 'Освидетельствование на состояние алкогольного опьянения' },
      { value: 'medical_examination', label: 'Медицинское освидетельствование на состояние опьянения' },
      { value: 'seizure_of_items', label: 'Изъятие вещей и документов' },
      { value: 'detention_of_vehicle', label: 'Задержание транспортного средства' },
      { value: 'arrest_of_goods', label: 'Арест товаров, транспортных средств и иных вещей' },
      { value: 'pledge_for_vessel', label: 'Залог за арестованное судно' },
      { value: 'temporary_ban', label: 'Временный запрет деятельности' },
      { value: 'arrest_of_property', label: 'Арест имущества (ст. 19.28 КоАП РФ)' },
      { value: 'placement_in_special_institution', label: 'Помещение в специальное учреждение (иностранных граждан)' },
    ];
  }

  // Результаты апелляционного обжалования (из CSV)
  static getAppealResultOptions() {
    return [
      { value: '1', label: 'Постановление оставлено без изменения' },
      { value: '2', label: 'Постановление изменено' },
      { value: '3', label: 'Постановление отменено, производство по делу прекращено' },
      { value: '4', label: 'Постановление отменено, дело возвращено на новое рассмотрение' },
      { value: '5', label: 'Постановление отменено, дело направлено по подведомственности' },
      { value: '6', label: 'Вынесено новое постановление' },
      { value: '7', label: 'Производство по жалобе прекращено' },
    ];
  }

  // Результаты кассационного обжалования (из CSV)
  static getCassationResultOptions() {
    return [
      { value: '1', label: 'Оставлен без изменения' },
      { value: '2', label: 'Отменен с передачей на новое судебное рассмотрение' },
      { value: '3', label: 'Отменен с прекращением дела' },
      { value: '4', label: 'Изменен' },
      { value: '5', label: 'Отменен с вынесением нового приговора' },
      { value: '6', label: 'Отменен с возвращением дела прокурору' },
      { value: '7', label: 'Отменен с оставлением в силе приговора суда I инстанции' },
    ];
  }

  static async getSecurityMeasureById(proceedingId, measureId) {
    try {
      const response = await baseService.get(`${BASE_URL}administrative-proceedings/${proceedingId}/security-measures/${measureId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Мера обеспечения не найдена');
      }
      console.error('Error fetching security measure:', error);
      throw error;
    }
  }
  static async getSubjectById(proceedingId, subjectId) {
    try {
      const response = await baseService.get(`${BASE_URL}administrative-proceedings/${proceedingId}/subjects/${subjectId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Субъект не найден');
      }
      console.error('Error fetching subject:', error);
      throw error;
    }
  }
}

export default AdministrativeCaseService;