import baseService from './baseService';

const BASE_URL = '/criminal_proceedings/';

class CriminalCaseService {
  static cleanData(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
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
      await baseService.delete(`/criminal_proceedings/criminal-proceedings/${proceedingsId}/`);
    } catch (error) {
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

  static async getCaseMovements(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/criminal-case-movement/`
      );
      return response.data || []; // Возвращаем весь массив или пустой массив
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

  // === Адвокаты (LawyerCriminal) ===
  
  static async getLawyers(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers-criminal/`
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers-criminal/${lawyerId}/`
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers-criminal/`,
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers-criminal/${lawyerId}/`,
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/lawyers-criminal/${lawyerId}/`
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
    console.log('Judges API response:', response.data);
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

  static async getLawyerOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}lawyer-criminal-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lawyer options:', error);
      return {};
    }
  }

  // === Устаревшие методы (для обратной совместимости) ===
  
  static async getCriminalProceedingsByCardId(cardId) {
    console.warn('getCriminalProceedingsByCardId is deprecated. Use getAllCriminalProceedings with filtering instead.');
    try {
      const proceedings = await this.getAllCriminalProceedings();
      // Предполагаем, что есть поле business_card_id для фильтрации
      const filtered = proceedings.filter(p => p.business_card_id === cardId);
      return filtered.length > 0 ? filtered[0] : null;
    } catch (error) {
      console.error('Error fetching criminal proceedings by card ID:', error);
      return null;
    }
  }

  static async getDefendantsByProceedingId(proceedingId) {
    console.warn('getDefendantsByProceedingId is deprecated. Use getDefendants instead.');
    return this.getDefendants(proceedingId);
  }

  static async getCaseMovementOldFormat(businesscardId) {
    console.warn('getCaseMovementOldFormat is deprecated. Use getCaseMovement with proceedingId instead.');
    try {
      // Попробуем найти производство по businesscardId
      const proceedings = await this.getAllCriminalProceedings();
      const proceeding = proceedings.find(p => 
        p.business_card_id === businesscardId || 
        p.id == businesscardId // если передан ID производства
      );
      
      if (proceeding) {
        return this.getCaseMovement(proceeding.id);
      }
      return null;
    } catch (error) {
      console.error('Error fetching case movement (old format):', error);
      return null;
    }
  }

    // === Ходатайства (PetitionCriminal) ===

  static async getPetitions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions-criminal/`
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions-criminal/${petitionId}/`
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions-criminal/`,
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions-criminal/${petitionId}/`,
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
        `${BASE_URL}criminal-proceedings/${proceedingId}/petitions-criminal/${petitionId}/`
      );
    } catch (error) {
      console.error('Error deleting petition:', error);
      throw error;
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
      const response = await baseService.get(
        `${BASE_URL}archived-criminal-proceedings/`
      );
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

  static async getJudges() {
    try {
      const response = await baseService.get(`${BASE_URL}judges/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching judges:', error);
    }
  }
}

export default CriminalCaseService;
