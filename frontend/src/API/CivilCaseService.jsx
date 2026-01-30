import baseService from './baseService';

const BASE_URL = '/civil_proceedings/';

class CivilCaseService {
  static cleanData(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // Основные операции по гражданскому делу
  static async getByBusinessCardId(businesscardId) {
    try {
      const response = await baseService.get(`${BASE_URL}businesscard/${businesscardId}/civil/`);
      
      if (response.data && response.data.length > 0) {
        const proceeding = response.data[0];
        
        // Дополнительно загружаем связанные данные
        if (proceeding.business_card) {
          try {
            const cardResponse = await baseService.get(`/business_card/businesscard/${proceeding.business_card}/`);
            proceeding.business_card_data = cardResponse.data;
          } catch (error) {
            console.error('Error loading business card:', error);
          }
        }
        
        return proceeding;
      }
      
      if (response.data === null) {
        console.log('Гражданское дело не найдено, возвращаем null');
        return null;
      }
      
      if (Array.isArray(response.data) && response.data.length === 0) {
        console.log('Гражданское дело не найдено (пустой массив), возвращаем null');
        return null;
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Гражданское дело не найдено (404), возвращаем null');
        return null;
      }
      console.error('Error fetching civil case:', error);
      throw error;
    }
  }

  static async create(businesscardId, civilData) {
    try {
      const dataToSend = {
        ...civilData,
        business_card: businesscardId
      };
      
      const response = await baseService.post(`${BASE_URL}businesscard/${businesscardId}/civil/`, dataToSend);
      return response.data;
    } catch (error) {
      console.error('Error creating civil case:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  static async update(civilId, civilData) {
    try {
      // Используем правильный URL для обновления
      const response = await baseService.patch(
        `${BASE_URL}businesscard/${civilData.business_card || 'unknown'}/civil/${civilId}/`,
        civilData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating civil case:', error);
      
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      
      throw error;
    }
  }

  static async updateByBusinessCard(businesscardId, civilData) {
    try {
      const existingData = await this.getByBusinessCardId(businesscardId);
      
      if (!existingData) {
        console.log('Создание новой записи гражданского дела');
        return await this.create(businesscardId, civilData);
      }

      if (!existingData.id) {
        throw new Error('ID гражданского дела не найден в существующих данных');
      }

      console.log('Обновление существующей записи с ID:', existingData.id);
      
      const cleanedData = this.cleanData(civilData);
      
      return await this.update(existingData.id, {
        ...cleanedData,
        business_card: businesscardId
      });
    } catch (error) {
      console.error('Error updating civil case:', error);
      throw error;
    }
  }

  // Решения по гражданским делам
  static async getDecisions(businesscardId) {
    try {
      const response = await baseService.get(`${BASE_URL}businesscard/${businesscardId}/civil-decisions/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching civil decisions:', error);
      throw error;
    }
  }

  static async getDecisionById(businesscardId, decisionId) {
    try {
      const response = await baseService.get(`${BASE_URL}businesscard/${businesscardId}/civil-decisions/${decisionId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Решение не найдено');
      }
      console.error('Error fetching civil decision:', error);
      throw error;
    }
  }

  static async createDecision(businesscardId, decisionData) {
    try {
      const response = await baseService.post(
        `${BASE_URL}businesscard/${businesscardId}/civil-decisions/`, 
        decisionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating civil decision:', error);
      throw error;
    }
  }

  static async updateDecision(businesscardId, decisionId, decisionData) {
    try {
      const response = await baseService.patch(
        `${BASE_URL}businesscard/${businesscardId}/civil-decisions/${decisionId}/`, 
        decisionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating civil decision:', error);
      throw error;
    }
  }

  static async deleteDecision(businesscardId, decisionId) {
    try {
      await baseService.delete(`${BASE_URL}businesscard/${businesscardId}/civil-decisions/${decisionId}/`);
    } catch (error) {
      console.error('Error deleting civil decision:', error);
      throw error;
    }
  }

  // Стороны по делу - ИСПРАВЛЕНО: используем businesscardId вместо civilId
  static async getSides(businesscardId) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        return [];
      }
      
      const response = await baseService.get(`${BASE_URL}${civilCase.id}/sides/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching civil sides:', error);
      throw error;
    }
  }

  static async getSideById(businesscardId, sideId) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      const response = await baseService.get(`${BASE_URL}${civilCase.id}/sides/${sideId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Сторона не найдена');
      }
      console.error('Error fetching civil side:', error);
      throw error;
    }
  }

  static async createSide(businesscardId, sideData) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      const response = await baseService.post(
        `${BASE_URL}${civilCase.id}/sides/`, 
        sideData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating civil side:', error);
      throw error;
    }
  }

  static async updateSide(businesscardId, sideId, sideData) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      const response = await baseService.patch(
        `${BASE_URL}${civilCase.id}/sides/${sideId}/`, 
        sideData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating civil side:', error);
      throw error;
    }
  }

  static async deleteSide(businesscardId, sideId) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      await baseService.delete(`${BASE_URL}${civilCase.id}/sides/${sideId}/`);
    } catch (error) {
      console.error('Error deleting civil side:', error);
      throw error;
    }
  }

  // Действия по подготовке дела - ИСПРАВЛЕНО: используем businesscardId вместо civilId
  static async getProcedureActions(businesscardId) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        return [];
      }
      
      const response = await baseService.get(`${BASE_URL}${civilCase.id}/procedure_actions/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching procedure actions:', error);
      throw error;
    }
  }

  static async getProcedureActionById(businesscardId, actionId) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      const response = await baseService.get(`${BASE_URL}${civilCase.id}/procedure_actions/${actionId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Действие не найдено');
      }
      console.error('Error fetching procedure action:', error);
      throw error;
    }
  }

  static async createProcedureAction(businesscardId, actionData) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      const response = await baseService.post(
        `${BASE_URL}${civilCase.id}/procedure_actions/`, 
        actionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating procedure action:', error);
      throw error;
    }
  }

  static async updateProcedureAction(businesscardId, actionId, actionData) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      const response = await baseService.patch(
        `${BASE_URL}${civilCase.id}/procedure_actions/${actionId}/`, 
        actionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating procedure action:', error);
      throw error;
    }
  }

  static async deleteProcedureAction(businesscardId, actionId) {
    try {
      // Сначала получаем гражданское дело, чтобы узнать его ID
      const civilCase = await this.getByBusinessCardId(businesscardId);
      if (!civilCase || !civilCase.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      await baseService.delete(`${BASE_URL}${civilCase.id}/procedure_actions/${actionId}/`);
    } catch (error) {
      console.error('Error deleting procedure action:', error);
      throw error;
    }
  }

  // Опции для выпадающих списков
  static async getCivilOptions() {
    try {
      // Проверяем разные возможные варианты URL
      const urls = [
        '/civil_proceedings/civil-options/',
        '/civil_proceedings/options/',
        '/options/civil/'
      ];
      
      let lastError = null;
      
      for (const url of urls) {
        try {
          const response = await baseService.get(url);
          console.log('Options loaded from:', url);
          return response.data;
        } catch (error) {
          lastError = error;
          console.log(`Failed to load from ${url}:`, error.response?.status);
        }
      }
      
      // Если все URL не сработали, возвращаем пустой объект
      console.error('All options URLs failed:', lastError);
      return {};
      
    } catch (error) {
      console.error('Error fetching civil options:', error);
      return {};
    }
  }

  static async getDecisionOptions() {
    try {
      const response = await baseService.get('/civil_proceedings/decision-options/');
      return response.data;
    } catch (error) {
      console.error('Error fetching decision options:', error);
      return {};
    }
  }

  // Список судей
  static async getJudges() {
    try {
      const response = await baseService.get('auth/users/');
      
      const judges = response.data.filter(user => 
        user.role === 'judge' || user.role === 'судья' || user.role?.toLowerCase().includes('judge')
      );
      
      return judges.map(judge => ({
        id: judge.id,
        name: `${judge.last_name || ''} ${judge.first_name || ''} ${judge.middle_name || ''}`.trim(),
        role: judge.role,
        judge_code: judge.judge_code || ''
      }));
    } catch (error) {
      console.error('Error fetching judges:', error);
      return [];
    }
  }
}

export default CivilCaseService;