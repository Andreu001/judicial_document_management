// CriminalCaseService.jsx - исправленная версия

import baseService from './baseService';

const BASE_URL = '/criminal_proceedings/';

class CriminalCaseService {
  static cleanData(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // === Уголовные производства (CriminalProceedings) ===
  
  static async getAllCriminalProceedings() {
    try {
      const response = await baseService.get(`${BASE_URL}criminal-proceedings/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all criminal proceedings:', error);
      return [];
    }
  }

  static async getCriminalProceedingById(id) {
    try {
      const response = await baseService.get(`${BASE_URL}criminal-proceedings/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching criminal proceeding by ID:', error);
      throw error;
    }
  }

  static async createCriminalProceedings(proceedingsData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/`,
        proceedingsData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating criminal proceedings:', error);
      throw error;
    }
  }

  static async updateCriminalProceedings(proceedingsId, proceedingsData) {
    try {
      const cleanedData = this.cleanData(proceedingsData);
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingsId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating criminal proceedings:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  static async deleteCriminalProceedings(proceedingsId) {
    try {
      await baseService.delete(`${BASE_URL}criminal-proceedings/${proceedingsId}/`);
      return { success: true };
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('Received 404 but proceeding might be deleted:', proceedingsId);
        return { success: true };
      }
      console.error('Error deleting criminal proceedings:', error);
      throw error;
    }
  }

  // === Обвиняемые (Defendants) ===
  
  static async getDefendants(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/defendants/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching defendants:', error);
      return [];
    }
  }

  static async getDefendantById(proceedingId, defendantId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/defendants/${defendantId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Обвиняемый не найден');
      }
      console.error('Error fetching defendant:', error);
      throw error;
    }
  }

  static async createDefendant(proceedingId, defendantData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/defendants/`,
        defendantData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating defendant:', error);
      throw error;
    }
  }

  static async updateDefendant(proceedingId, defendantId, defendantData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/defendants/${defendantId}/`,
        defendantData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating defendant:', error);
      throw error;
    }
  }

  static async deleteDefendant(proceedingId, defendantId) {
    try {
      await baseService.delete(
        `${BASE_URL}criminal-proceedings/${proceedingId}/defendants/${defendantId}/`
      );
    } catch (error) {
      console.error('Error deleting defendant:', error);
      throw error;
    }
  }

  // === Решения по делу (CriminalDecision) ===
  
  static async getDecisions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-decisions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching criminal decisions:', error);
      return [];
    }
  }
  
  static async getDecisionById(proceedingId, decisionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-decisions/${decisionId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Решение не найдено');
      }
      console.error('Error fetching criminal decision:', error);
      throw error;
    }
  }
  
  static async createDecision(proceedingId, decisionData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-decisions/`,
        decisionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating criminal decision:', error);
      throw error;
    }
  }
  
  static async updateDecision(proceedingId, decisionId, decisionData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-decisions/${decisionId}/`,
        decisionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating criminal decision:', error);
      throw error;
    }
  }
  
  static async deleteDecision(proceedingId, decisionId) {
    try {
      await baseService.delete(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-decisions/${decisionId}/`
      );
    } catch (error) {
      console.error('Error deleting criminal decision:', error);
      throw error;
    }
  }

  // === Движение дела (CriminalCaseMovement) ===
  
  static async getCaseMovements(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-case-movement/`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching case movements:', error);
      return [];
    }
  }

  static async getCaseMovementById(proceedingId, movementId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-case-movement/${movementId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching case movement by ID:', error);
      throw error;
    }
  }

  static async createCaseMovement(proceedingId, movementData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-case-movement/`, 
        movementData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating case movement:', error);
      throw error;
    }
  }

  static async updateCaseMovement(proceedingId, movementId, movementData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-case-movement/${movementId}/`, 
        movementData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating case movement:', error);
      throw error;
    }
  }

  static async deleteCaseMovement(proceedingId, movementId) {
    try {
      await baseService.delete(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-case-movement/${movementId}/`
      );
    } catch (error) {
      console.error('Error deleting case movement:', error);
      throw error;
    }
  }

  // === Адвокаты (LawyerCriminal) - ИСПРАВЛЕНО URL ===
  // Теперь URL: /criminal_proceedings/criminal-proceedings/{id}/lawyers/

  static async getLawyers(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers/`
      );
      return response.data.map(lawyer => ({
        id: lawyer.id,
        lawyer_detail: lawyer.lawyer_detail,
        sides_case_role: lawyer.sides_case_role,
        sides_case_role_detail: lawyer.sides_case_role_detail,
        name: lawyer.lawyer_detail?.law_firm_name || 'Адвокат'
      }));
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      return [];
    }
  }

  static async getLawyerById(proceedingId, lawyerId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers/${lawyerId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Адвокат не найден');
      }
      console.error('Error fetching lawyer:', error);
      throw error;
    }
  }

  static async createLawyer(proceedingId, lawyerData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers/`,
        lawyerData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating lawyer:', error);
      throw error;
    }
  }

  static async updateLawyer(proceedingId, lawyerId, lawyerData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers/${lawyerId}/`,
        lawyerData
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers/${lawyerId}/`
      );
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      throw error;
    }
  }

  // === Стороны (SidesCaseInCase) ===
  
  static async getSides(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/sides-case-in-case/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching sides:', error);
      return [];
    }
  }

  static async getSideById(proceedingId, sideId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/sides-case-in-case/${sideId}/`
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
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/sides-case-in-case/`,
        sideData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating side:', error);
      throw error;
    }
  }

  static async updateSide(proceedingId, sideId, sideData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/sides-case-in-case/${sideId}/`,
        sideData
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/sides-case-in-case/${sideId}/`
      );
    } catch (error) {
      console.error('Error deleting side:', error);
      throw error;
    }
  }

  // === Постановления (CriminalRuling) ===
  
  static async getRulings(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/rulings/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching rulings:', error);
      throw error;
    }
  }

  static async getRulingById(proceedingId, rulingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/rulings/${rulingId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Постановление не найдено');
      }
      console.error('Error fetching ruling:', error);
      throw error;
    }
  }

  static async createRuling(proceedingId, rulingData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/rulings/`, 
        rulingData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating ruling:', error);
      throw error;
    }
  }

  static async updateRuling(proceedingId, rulingId, rulingData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/rulings/${rulingId}/`, 
        rulingData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating ruling:', error);
      throw error;
    }
  }

  static async deleteRuling(proceedingId, rulingId) {
    try {
      await baseService.delete(
        `${BASE_URL}criminal-proceedings/${proceedingId}/rulings/${rulingId}/`
      );
    } catch (error) {
      console.error('Error deleting ruling:', error);
      throw error;
    }
  }

  // === Ходатайства (PetitionCriminal) - ИСПРАВЛЕНО URL ===
  // Теперь URL: /criminal_proceedings/criminal-proceedings/{id}/petitions/

  static async getPetitions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions/`
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions/${petitionId}/`
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
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions/`,
        petitionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating petition:', error);
      throw error;
    }
  }

  static async updatePetition(proceedingId, petitionId, petitionData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions/${petitionId}/`,
        petitionData
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions/${petitionId}/`
      );
    } catch (error) {
      console.error('Error deleting petition:', error);
      throw error;
    }
  }

  // === Вспомогательные методы ===
  
  static async getReferringAuthorities() {
    try {
      const response = await baseService.get(`${BASE_URL}referring-authorities/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referring authorities:', error);
      return [];
    }
  }

  static async getJudges() {
    try {
      const response = await baseService.get(`${BASE_URL}judges/`);
      return response.data.map(judge => ({
        id: judge.id,
        full_name: `${judge.last_name || ''} ${judge.first_name || ''} ${judge.middle_name || ''}`.trim(),
        name: `${judge.last_name || ''} ${judge.first_name || ''} ${judge.middle_name || ''}`.trim(),
        last_name: judge.last_name,
        first_name: judge.first_name,
        middle_name: judge.middle_name,
        role: judge.role,
        judge_code: judge.judge_code || ''
      }));
    } catch (error) {
      console.error('Error fetching judges:', error);
      return [];
    }
  }

  static async getCriminalOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}criminal-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching criminal options:', error);
      return {};
    }
  }

  static async getDefendantOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}defendant-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching defendant options:', error);
      return {};
    }
  }

  static async getCriminalDecisionOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}criminal-decision-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching criminal decision options:', error);
      return {};
    }
  }

  static async getCaseMovementOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}criminal-case-movement-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching case movement options:', error);
      return {};
    }
  }

  static async getPetitionCriminalOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}petition-criminal-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petition criminal options:', error);
      return {};
    }
  }

  // === Архивные операции ===

  static async archiveCriminalProceeding(proceedingId) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/archive/`
      );
      return response.data;
    } catch (error) {
      console.error('Error archiving criminal proceeding:', error);
      throw error;
    }
  }

  static async unarchiveCriminalProceeding(proceedingId) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/unarchive/`
      );
      return response.data;
    } catch (error) {
      console.error('Error unarchiving criminal proceeding:', error);
      throw error;
    }
  }

  static async getArchivedProceedings() {
    try {
      const response = await baseService.get(`${BASE_URL}archived-criminal-proceedings/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching archived proceedings:', error);
      return [];
    }
  }

  static async getAllSides(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/all-sides/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching all sides:', error);
      return [];
    }
  }

  // === Исполнения (CriminalExecution) ===

  static async getExecutions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/executions/`
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/executions/${executionId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Запись об исполнении не найдена');
      }
      console.error('Error fetching execution:', error);
      throw error;
    }
  }

  static async createExecution(proceedingId, executionData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/executions/`,
        executionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating execution:', error);
      throw error;
    }
  }

  static async updateExecution(proceedingId, executionId, executionData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/executions/${executionId}/`,
        executionData
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/executions/${executionId}/`
      );
    } catch (error) {
      console.error('Error deleting execution:', error);
      throw error;
    }
  }

  // === Карточка на подсудимого (CriminalPersonCard) ===
  
  static async getPersonCards(proceedingId = null, defendantId = null) {
    try {
      let url = `${BASE_URL}person-cards/`;
      const params = [];
      if (proceedingId) params.push(`proceeding_id=${proceedingId}`);
      if (defendantId) params.push(`defendant_id=${defendantId}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const response = await baseService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching person cards:', error);
      return [];
    }
  }
  
  static async getPersonCardById(id) {
    try {
      const response = await baseService.get(`${BASE_URL}person-cards/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching person card:', error);
      throw error;
    }
  }
  
  static async createPersonCard(cardData) {
    try {
      const response = await baseService.post(`${BASE_URL}person-cards/`, cardData);
      return response.data;
    } catch (error) {
      console.error('Error creating person card:', error);
      throw error;
    }
  }
  
  static async updatePersonCard(cardId, cardData) {
    try {
      const cleanedData = this.cleanData(cardData);
      const response = await baseService.patch(`${BASE_URL}person-cards/${cardId}/`, cleanedData);
      return response.data;
    } catch (error) {
      console.error('Error updating person card:', error);
      throw error;
    }
  }
  
  static async deletePersonCard(cardId) {
    try {
      await baseService.delete(`${BASE_URL}person-cards/${cardId}/`);
    } catch (error) {
      console.error('Error deleting person card:', error);
      throw error;
    }
  }
  
  static async getPersonCardByDefendant(defendantId) {
    try {
      const response = await baseService.get(`${BASE_URL}person-cards/by-defendant/${defendantId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching person card by defendant:', error);
      throw error;
    }
  }

  // === Апелляционное рассмотрение (CriminalAppealInstance) ===
  
  static async getAppealInstances(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/appeal-instances/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching appeal instances:', error);
      return [];
    }
  }

  static async getAppealInstanceById(proceedingId, appealId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/appeal-instances/${appealId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Апелляционное рассмотрение не найдено');
      }
      console.error('Error fetching appeal instance:', error);
      throw error;
    }
  }

  static async createAppealInstance(proceedingId, appealData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/appeal-instances/`,
        appealData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating appeal instance:', error);
      throw error;
    }
  }

  static async updateAppealInstance(proceedingId, appealId, appealData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/appeal-instances/${appealId}/`,
        appealData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating appeal instance:', error);
      throw error;
    }
  }

  static async deleteAppealInstance(proceedingId, appealId) {
    try {
      await baseService.delete(
        `${BASE_URL}criminal-proceedings/${proceedingId}/appeal-instances/${appealId}/`
      );
    } catch (error) {
      console.error('Error deleting appeal instance:', error);
      throw error;
    }
  }

  // === Кассационное рассмотрение (CriminalCassationInstance) ===
  
  static async getCassationInstances(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/cassation-instances/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching cassation instances:', error);
      return [];
    }
  }

  static async getCassationInstanceById(proceedingId, cassationId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/cassation-instances/${cassationId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Кассационное рассмотрение не найдено');
      }
      console.error('Error fetching cassation instance:', error);
      throw error;
    }
  }

  static async createCassationInstance(proceedingId, cassationData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/cassation-instances/`,
        cassationData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating cassation instance:', error);
      throw error;
    }
  }

  static async updateCassationInstance(proceedingId, cassationId, cassationData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/cassation-instances/${cassationId}/`,
        cassationData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating cassation instance:', error);
      throw error;
    }
  }

  static async deleteCassationInstance(proceedingId, cassationId) {
    try {
      await baseService.delete(
        `${BASE_URL}criminal-proceedings/${proceedingId}/cassation-instances/${cassationId}/`
      );
    } catch (error) {
      console.error('Error deleting cassation instance:', error);
      throw error;
    }
  }

  // === Гражданские иски (CriminalCivilClaim) ===
  
  static async getCivilClaims(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/civil-claims/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching civil claims:', error);
      return [];
    }
  }

  static async getCivilClaimById(proceedingId, claimId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/civil-claims/${claimId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Гражданский иск не найден');
      }
      console.error('Error fetching civil claim:', error);
      throw error;
    }
  }

  static async createCivilClaim(proceedingId, claimData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}criminal-proceedings/${proceedingId}/civil-claims/`,
        claimData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating civil claim:', error);
      throw error;
    }
  }

  static async updateCivilClaim(proceedingId, claimId, claimData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}criminal-proceedings/${proceedingId}/civil-claims/${claimId}/`,
        claimData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating civil claim:', error);
      throw error;
    }
  }

  static async deleteCivilClaim(proceedingId, claimId) {
    try {
      await baseService.delete(
        `${BASE_URL}criminal-proceedings/${proceedingId}/civil-claims/${claimId}/`
      );
    } catch (error) {
      console.error('Error deleting civil claim:', error);
      throw error;
    }
  }

  // === Справочники для апелляции и кассации ===
  
  static async getAppealApplicantStatuses() {
    try {
      const response = await baseService.get(`${BASE_URL}appeal-applicant-statuses/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appeal applicant statuses:', error);
      return [];
    }
  }

  static async getCassationResults() {
    try {
      const response = await baseService.get(`${BASE_URL}cassation-results/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cassation results:', error);
      return [];
    }
  }

  static async getSupervisoryResults() {
    try {
      const response = await baseService.get(`${BASE_URL}supervisory-results/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching supervisory results:', error);
      return [];
    }
  }
}

export default CriminalCaseService;