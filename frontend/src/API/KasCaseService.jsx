import baseService from './baseService';

const BASE_URL = '/administrative_proceedings/';

class KasCaseService {
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

  // === Органы, составившие протокол (ReferringAuthorityKas) ===
  
  static async getReferringAuthorities() {
    try {
      const response = await baseService.get(`${BASE_URL}referring-authorities-kas/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referring authorities:', error);
      return [];
    }
  }

  // === Административные производства (KasProceedings) ===
  
  static async getAllKasProceedings() {
    try {
      const response = await baseService.get(`${BASE_URL}kas-proceedings/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all kas proceedings:', error);
      return [];
    }
  }

  static async getKasProceedingById(id) {
    try {
      const response = await baseService.get(`${BASE_URL}kas-proceedings/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching kas proceeding by ID:', error);
      throw error;
    }
  }

  static async createKasProceedings(proceedingsData) {
    try {
      const cleanedData = this.cleanData(proceedingsData);
      const response = await baseService.post(
        `${BASE_URL}kas-proceedings/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating kas proceedings:', error);
      throw error;
    }
  }

  static async updateKasProceedings(proceedingsId, proceedingsData) {
    try {
      const cleanedData = this.cleanData(proceedingsData);
      const response = await baseService.patch(
        `${BASE_URL}kas-proceedings/${proceedingsId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating kas proceedings:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  static async deleteKasProceedings(proceedingsId) {
    try {
      await baseService.delete(`${BASE_URL}kas-proceedings/${proceedingsId}/`);
      // Возвращаем успешный результат, даже если сервер вернул 204
      return { success: true };
    } catch (error) {
      // Проверяем, является ли ошибка 404, но при этом объект мог быть удален
      if (error.response?.status === 404) {
        console.warn('Received 404 but proceeding might be deleted:', proceedingsId);
        // Все равно считаем это успехом, так как объект не найден (удален)
        return { success: true };
      }
      console.error('Error deleting kas proceedings:', error);
      throw error;
    }
  }

  // === Решения по делу (KasDecision) ===
  
  static async getDecisions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}kas-proceedings/${proceedingId}/decisions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching kas decisions:', error);
      return [];
    }
  }
  
  static async getDecisionById(proceedingId, decisionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}kas-proceedings/${proceedingId}/decisions/${decisionId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Решение не найдено');
      }
      console.error('Error fetching kas decision:', error);
      throw error;
    }
  }
  
  static async createDecision(proceedingId, decisionData) {
    try {
      const cleanedData = this.cleanData(decisionData);
      const response = await baseService.post(
        `${BASE_URL}kas-proceedings/${proceedingId}/decisions/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating kas decision:', error);
      throw error;
    }
  }
  
  static async updateDecision(proceedingId, decisionId, decisionData) {
    try {
      const cleanedData = this.cleanData(decisionData);
      const response = await baseService.patch(
        `${BASE_URL}kas-proceedings/${proceedingId}/decisions/${decisionId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating kas decision:', error);
      throw error;
    }
  }
  
  static async deleteDecision(proceedingId, decisionId) {
    try {
      await baseService.delete(
        `${BASE_URL}kas-proceedings/${proceedingId}/decisions/${decisionId}/`
      );
    } catch (error) {
      console.error('Error deleting kas decision:', error);
      throw error;
    }
  }

  // === Стороны (KasSidesCaseInCase) ===
  
  static async getSides(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}kas-proceedings/${proceedingId}/sides/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching kas sides:', error);
      return [];
    }
  }

  static async getSideById(proceedingId, sideId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}kas-proceedings/${proceedingId}/sides/${sideId}/`
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
        `${BASE_URL}kas-proceedings/${proceedingId}/sides/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/sides/${sideId}/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/sides/${sideId}/`
      );
    } catch (error) {
      console.error('Error deleting side:', error);
      throw error;
    }
  }

  // === Адвокаты (KasLawyer) ===
  
  static async getLawyers(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}kas-proceedings/${proceedingId}/lawyers/`
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
        `${BASE_URL}kas-proceedings/${proceedingId}/lawyers/${lawyerId}/`
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
      const cleanedData = this.cleanData(lawyerData);
      const response = await baseService.post(
        `${BASE_URL}kas-proceedings/${proceedingId}/lawyers/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/lawyers/${lawyerId}/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/lawyers/${lawyerId}/`
      );
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      throw error;
    }
  }

  // === Движение дела (KasCaseMovement) ===
  
  static async getMovements(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}kas-proceedings/${proceedingId}/movements/`
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
        `${BASE_URL}kas-proceedings/${proceedingId}/movements/${movementId}/`
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
        `${BASE_URL}kas-proceedings/${proceedingId}/movements/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/movements/${movementId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating movement:', error);
      throw error;
    }
  }

  // === Ходатайства (KasPetition) ===
  
  static async getPetitions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}kas-proceedings/${proceedingId}/petitions/`
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
        `${BASE_URL}kas-proceedings/${proceedingId}/petitions/${petitionId}/`
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
        `${BASE_URL}kas-proceedings/${proceedingId}/petitions/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/petitions/${petitionId}/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/petitions/${petitionId}/`
      );
    } catch (error) {
      console.error('Error deleting petition:', error);
      throw error;
    }
  }

  // === Исполнение (KasExecution) ===
  
  static async getExecutions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}kas-proceedings/${proceedingId}/executions/`
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
        `${BASE_URL}kas-proceedings/${proceedingId}/executions/${executionId}/`
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
        `${BASE_URL}kas-proceedings/${proceedingId}/executions/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/executions/${executionId}/`,
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
        `${BASE_URL}kas-proceedings/${proceedingId}/executions/${executionId}/`
      );
    } catch (error) {
      console.error('Error deleting execution:', error);
      throw error;
    }
  }

  // === Вспомогательные методы ===
  
  static async getKasOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}kas-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching kas options:', error);
      return {
        admissionOrder: [],
        postponementReason: [],
        outcome: [],
        appealResult: []
      };
    }
  }

  static async getKasDecisionOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}kas-decision-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching kas decision options:', error);
      return {};
    }
  }

  // === Архивные операции ===

  static async archiveKasProceeding(proceedingId) {
      try {
          const response = await baseService.post(
              `${BASE_URL}kas-proceedings/${proceedingId}/archive/`
          );
          return response.data;
      } catch (error) {
          console.error('Error archiving kas proceeding:', error);
          throw error;
      }
  }

  static async unarchiveKasProceeding(proceedingId) {
      try {
          const response = await baseService.post(
              `${BASE_URL}kas-proceedings/${proceedingId}/unarchive/`
          );
          return response.data;
      } catch (error) {
          console.error('Error unarchiving kas proceeding:', error);
          throw error;
      }
  }

  static async getArchivedProceedings() {
      try {
          // Используем параметр archive=true для фильтрации на сервере
          const response = await baseService.get(`${BASE_URL}kas-proceedings/?archive=true`);
          return response.data;
      } catch (error) {
          console.error('Error fetching archived proceedings:', error);
          return [];
      }
  }

  static async getJudges() {
    try {
      // Используем эндпоинт из административных дел
      const response = await baseService.get('/administrative_proceedings/judges/');
      
      // Если ответ уже в нужном формате, просто возвращаем его
      if (Array.isArray(response.data)) {
        // Проверяем, в каком формате приходят данные
        if (response.data.length > 0 && response.data[0].full_name) {
          // Уже в нужном формате
          return response.data;
        } else {
          // Преобразуем в нужный формат
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
  
  static async getAllOptions() {
    try {
      // Новый эндпоинт, который возвращает ВСЕ справочники одним запросом
      const response = await baseService.get('/administrative_proceedings/kas-all-options/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all options:', error);
      // Возвращаем структуру с пустыми массивами, чтобы избежать ошибок
      return {
        admissionOrder: [],
        postponementReason: [],
        suspensionReason: [],
        preliminaryProtection: [],
        expertiseTypes: [],
        appealResults: [],
        cassationResults: [],
        termCompliance: [],
        outcomes: [],
        statuses: [],
        appealTypes: [],
        cassationTypes: []
      };
    }
  }

  // === Получение списка решений суда (Decisions) для движения дела ===
  static async getCourtDecisions() {
    try {
      const response = await baseService.get('/business_card/decisions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching court decisions:', error);
      return [];
    }
  }

  // === Получение списка ходатайств (Petitions) ===
  static async getPetitionTypes() {
    try {
      const response = await baseService.get('/business_card/petitions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching petition types:', error);
      return [];
    }
  }

  // === Получение списка сторон (SidesCase) для ролей ===
  static async getSidesCaseRoles() {
    try {
      const response = await baseService.get('/business_card/sides/');
      return response.data;
    } catch (error) {
      console.error('Error fetching side roles:', error);
      return [];
    }
  }
}

export default KasCaseService;