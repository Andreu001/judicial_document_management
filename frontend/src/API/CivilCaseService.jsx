import baseService from './baseService';

const BASE_URL = '/civil_proceedings/';

class CivilCaseService {
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

  // === Гражданские производства (CivilProceedings) ===
  
  static async getAllCivilProceedings() {
    try {
      const response = await baseService.get(`${BASE_URL}civil-proceedings/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all civil proceedings:', error);
      return [];
    }
  }

  static async getCivilProceedingById(id) {
    try {
      const response = await baseService.get(`${BASE_URL}civil-proceedings/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching civil proceeding by ID:', error);
      throw error;
    }
  }

  static async createCivilProceedings(proceedingsData) {
    try {
      const cleanedData = this.cleanData(proceedingsData);
      const response = await baseService.post(
        `${BASE_URL}civil-proceedings/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating civil proceedings:', error);
      throw error;
    }
  }

  static async updateCivilProceedings(proceedingsId, proceedingsData) {
    try {
      const cleanedData = this.cleanData(proceedingsData);
      const response = await baseService.patch(
        `${BASE_URL}civil-proceedings/${proceedingsId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating civil proceedings:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  static async deleteCivilProceedings(proceedingsId) {
    try {
      await baseService.delete(`${BASE_URL}civil-proceedings/${proceedingsId}/`);
      // Возвращаем успешный результат, даже если сервер вернул 204
      return { success: true };
    } catch (error) {
      // Проверяем, является ли ошибка 404, но при этом объект мог быть удален
      if (error.response?.status === 404) {
        console.warn('Received 404 but proceeding might be deleted:', proceedingsId);
        // Все равно считаем это успехом, так как объект не найден (удален)
        return { success: true };
      }
      console.error('Error deleting civil proceedings:', error);
      throw error;
    }
  }

  // === Решения по делу (CivilDecision) ===
  
  static async getDecisions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}civil-proceedings/${proceedingId}/decisions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching civil decisions:', error);
      return [];
    }
  }
  
  static async getDecisionById(proceedingId, decisionId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}civil-proceedings/${proceedingId}/decisions/${decisionId}/`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Решение не найдено');
      }
      console.error('Error fetching civil decision:', error);
      throw error;
    }
  }
  
  static async createDecision(proceedingId, decisionData) {
    try {
      const cleanedData = this.cleanData(decisionData);
      const response = await baseService.post(
        `${BASE_URL}civil-proceedings/${proceedingId}/decisions/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating civil decision:', error);
      throw error;
    }
  }
  
  static async updateDecision(proceedingId, decisionId, decisionData) {
    try {
      const cleanedData = this.cleanData(decisionData);
      const response = await baseService.patch(
        `${BASE_URL}civil-proceedings/${proceedingId}/decisions/${decisionId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating civil decision:', error);
      throw error;
    }
  }
  
  static async deleteDecision(proceedingId, decisionId) {
    try {
      await baseService.delete(
        `${BASE_URL}civil-proceedings/${proceedingId}/decisions/${decisionId}/`
      );
    } catch (error) {
      console.error('Error deleting civil decision:', error);
      throw error;
    }
  }

  // === Стороны (CivilSide) ===
  
  static async getSides(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}civil-proceedings/${proceedingId}/sides/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching civil sides:', error);
      return [];
    }
  }

  static async getSideById(proceedingId, sideId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}civil-proceedings/${proceedingId}/sides/${sideId}/`
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
        `${BASE_URL}civil-proceedings/${proceedingId}/sides/`,
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
        `${BASE_URL}civil-proceedings/${proceedingId}/sides/${sideId}/`,
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
        `${BASE_URL}civil-proceedings/${proceedingId}/sides/${sideId}/`
      );
    } catch (error) {
      console.error('Error deleting side:', error);
      throw error;
    }
  }

  // === Адвокаты (CivilLawyer) ===
  
  static async getLawyers(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}civil-proceedings/${proceedingId}/lawyers/`
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
        `${BASE_URL}civil-proceedings/${proceedingId}/lawyers/${lawyerId}/`
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
        `${BASE_URL}civil-proceedings/${proceedingId}/lawyers/`,
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
        `${BASE_URL}civil-proceedings/${proceedingId}/lawyers/${lawyerId}/`,
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
        `${BASE_URL}civil-proceedings/${proceedingId}/lawyers/${lawyerId}/`
      );
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      throw error;
    }
  }

  // === Движение дела (CivilCaseMovement) ===
  
  static async getMovements(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}civil-proceedings/${proceedingId}/movements/`
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
        `${BASE_URL}civil-proceedings/${proceedingId}/movements/${movementId}/`
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
        `${BASE_URL}civil-proceedings/${proceedingId}/movements/`,
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
        `${BASE_URL}civil-proceedings/${proceedingId}/movements/${movementId}/`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating movement:', error);
      throw error;
    }
  }

  // === Исполнение (CivilExecution) ===
  
  static async getExecutions(proceedingId) {
    try {
      const response = await baseService.get(
        `${BASE_URL}civil-proceedings/${proceedingId}/executions/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching executions:', error);
      return [];
    }
  }

  // === Вспомогательные методы ===
  
  static async getCivilOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}civil-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching civil options:', error);
      return {
        admission_order: [],
        postponed_reason: [],
        compliance_with_deadlines: [],
        ruling_type: [],
        consideration_result_main: [],
        consideration_result_additional: [],
        consideration_result_counter: [],
        second_instance_result: [],
        court_composition: []
      };
    }
  }

  static async getCivilDecisionOptions() {
    try {
      const response = await baseService.get(`${BASE_URL}civil-decision-options/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching civil decision options:', error);
      return {
        ruling_type: [],
        consideration_result_main: [],
        consideration_result_additional: [],
        consideration_result_counter: [],
        second_instance_result: [],
        court_composition: []
      };
    }
  }

  static async getCivilProceedingByCardId(cardId) {
    try {
      const proceedings = await this.getAllCivilProceedings();
      const filtered = proceedings.filter(p => p.business_card === cardId);
      return filtered.length > 0 ? filtered[0] : null;
    } catch (error) {
      console.error('Error fetching civil proceeding by card ID:', error);
      return null;
    }
  }

  // === Архивные операции ===

  static async archiveCivilProceeding(proceedingId) {
      try {
          const response = await baseService.post(
              `${BASE_URL}civil-proceedings/${proceedingId}/archive/`
          );
          return response.data;
      } catch (error) {
          console.error('Error archiving civil proceeding:', error);
          throw error;
      }
  }

  static async unarchiveCivilProceeding(proceedingId) {
      try {
          const response = await baseService.post(
              `${BASE_URL}civil-proceedings/${proceedingId}/unarchive/`
          );
          return response.data;
      } catch (error) {
          console.error('Error unarchiving civil proceeding:', error);
          throw error;
      }
  }

  static async getArchivedProceedings() {
      try {
          // Используем параметр archive=true для фильтрации на сервере
          const response = await baseService.get(`${BASE_URL}civil-proceedings/?archive=true`);
          return response.data;
      } catch (error) {
          console.error('Error fetching archived proceedings:', error);
          return [];
      }
  }

  static async getJudges() {
    try {
      // Используем эндпоинт из гражданских дел
      const response = await baseService.get('/civil_proceedings/judges/');
      
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
}

export default CivilCaseService;