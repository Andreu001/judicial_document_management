// src/API/CaseDistributionService.js
import baseService from './baseService';

const CaseDistributionService = {
  // ==================== ОСНОВНЫЕ ====================

  getCasesForDistribution: async (params = {}) => {
    try {
      const response = await baseService.get('/case-distribution/cases/pending/', { 
        params: params
      });
      
      const data = response.data;
      let cases = data.results || data || [];
      
      if (Array.isArray(cases)) {
        cases = cases.map(item => ({
          ...item,
          has_judge: !!item.assigned_judge,
        }));
      }
      
      return Array.isArray(cases) ? cases : [];
      
    } catch (error) {
      console.error('Ошибка загрузки дел для распределения:', error);
      throw error;
    }
  },

  /**
   * Получить ВСЕ дела (с судьей и без) для поиска и управления
   */
  getAllCases: async (params = {}) => {
    try {
      const response = await baseService.get('/case-distribution/cases/', { 
        params: {
          show_all: true,
          ...params
        }
      });
      
      const data = response.data;
      let cases = data.results || data || [];
      
      if (Array.isArray(cases)) {
        cases = cases.map(item => ({
          ...item,
          has_judge: !!item.assigned_judge,
        }));
      }
      
      return Array.isArray(cases) ? cases : [];
      
    } catch (error) {
      console.error('Ошибка загрузки всех дел:', error);
      return [];
    }
  },

  /**
   * Расширенный поиск дел с фильтрацией
   */
  searchCases: async (params = {}) => {
    try {
      const response = await baseService.get('/case-distribution/cases/', { 
        params: {
          show_all: true,
          search: params.search || '',
          case_type: params.case_type || '',
          status: params.status || '',
          judge_id: params.judge_id || '',
          date_from: params.date_from || '',
          date_to: params.date_to || '',
          complexity_min: params.complexity_min || '',
          complexity_max: params.complexity_max || '',
          page: params.page || 1,
          page_size: params.page_size || 50
        }
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Ошибка поиска дел:', error);
      return { results: [], count: 0 };
    }
  },

  getAvailableJudges: async (params = {}) => {
    try {
      const response = await baseService.get('/case-distribution/cases/available_judges/', { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки доступных судей:', error);
      throw error;
    }
  },

  autoDistribute: async (data = {}) => {
    try {
      if (!data.case_ids || !Array.isArray(data.case_ids) || data.case_ids.length === 0) {
        throw new Error('Не указаны дела для распределения');
      }
      
      const response = await baseService.post('/case-distribution/cases/auto_distribute/', data);
      return response.data;
    } catch (error) {
      console.error('Ошибка автоматического распределения:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.error || 'Ошибка распределения');
      }
      throw error;
    }
  },

  distributeWithRules: async (data = {}) => {
    try {
      const response = await baseService.post('/case-distribution/cases/distribute_with_rules/', data);
      return response.data;
    } catch (error) {
      console.error('Ошибка распределения с правилами:', error);
      throw error;
    }
  },

  distributeByCollegium: async (data = {}) => {
    try {
      const response = await baseService.post('/case-distribution/cases/distribute_by_collegium/', data);
      return response.data;
    } catch (error) {
      console.error('Ошибка распределения по коллегии:', error);
      throw error;
    }
  },

  assignJudgeManually: async (caseId, data) => {
    try {
      const response = await baseService.post('/case-distribution/cases/manual_distribute/', {
        case_id: caseId,
        judge_id: data.judge_id,
        reason: data.reason || 'Ручное назначение'
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка ручного назначения:', error);
      throw error;
    }
  },

  reassignCase: async (caseId, data) => {
    try {
      const response = await baseService.post(`/case-distribution/cases/${caseId}/reassign/`, {
        new_judge_id: data.new_judge_id,
        reason: data.reason,
        reason_type: data.reason_type || 'other'
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка перераспределения:', error);
      throw error;
    }
  },

  getCaseDetails: async (caseId) => {
    try {
      const response = await baseService.get(`/case-distribution/cases/${caseId}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки деталей дела:', error);
      throw error;
    }
  },

  /**
   * Установить сложность дела
   * @param {string|number} caseId - ID дела
   * @param {number} complexity - сложность (1-10)
   * @returns {Promise} результат
   */
  setCaseComplexity: async (caseId, complexity) => {
    try {
      // Используем стандартный PATCH эндпоинт
      // Он гарантированно работает, т.к. ModelViewSet имеет метод update
      const response = await baseService.patch(
        `/case-distribution/cases/${caseId}/`,
        { complexity: Number(complexity) }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка установки сложности:', error);
      throw new Error(error.response?.data?.error || error.message || 'Не удалось установить сложность');
    }
  },

  /**
   * Получить детали дела для просмотра
   */
  getCaseView: async (caseId) => {
    try {
      const response = await baseService.get(`/case-distribution/cases/${caseId}/view/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки данных дела:', error);
      throw error;
    }
  },

  // ==================== СТАТИСТИКА ====================

  getDistributionStats: async (params = {}) => {
    try {
      const response = await baseService.get('/case-distribution/cases/stats/', { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      throw error;
    }
  },

  getJudgeLoad: async (params = {}) => {
    try {
      const response = await baseService.get('/case-distribution/loads/current/', { params });
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        return data.results || data.judges || data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Ошибка загрузки нагрузки судей:', error);
      return [];
    }
  },

  getJudgeStats: async (judgeId, params = {}) => {
    try {
      const response = await baseService.get(`/case-distribution/loads/${judgeId}/`, { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки статистики судьи:', error);
      throw error;
    }
  },

  // ==================== ЖУРНАЛ ====================

  getDistributionLog: async (params = {}) => {
    try {
      const response = await baseService.get('/case-distribution/logs/', { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки журнала:', error);
      return { results: [], count: 0 };
    }
  },

  exportLogToWord: async (params = {}) => {
    try {
      const exportParams = {};
      if (params.start_date) exportParams.start_date = params.start_date;
      if (params.end_date) exportParams.end_date = params.end_date;
      if (params.action_type) exportParams.action_type = params.action_type;
      
      const response = await baseService.get('/case-distribution/logs/export/', {
        params: exportParams,
        responseType: 'blob'
      });
      return response.data;
      
    } catch (error) {
      console.error('Ошибка массового экспорта журнала:', error);
      if (params.log_id) {
        return await CaseDistributionService.exportProtocol(params.log_id);
      }
      throw new Error('Функция экспорта временно недоступна');
    }
  },

  exportProtocol: async (logId) => {
    try {
      const response = await baseService.get(`/case-distribution/logs/${logId}/export/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка экспорта протокола:', error);
      throw new Error('Функция экспорта временно недоступна');
    }
  },

  // ==================== ПРАВИЛА ====================

  getRules: async () => {
    try {
      const response = await baseService.get('/case-distribution/rules/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки правил:', error);
      throw error;
    }
  },

  createRule: async (data) => {
    try {
      const response = await baseService.post('/case-distribution/rules/', data);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания правила:', error);
      throw error;
    }
  },

  updateRule: async (ruleId, data) => {
    try {
      const response = await baseService.patch(`/case-distribution/rules/${ruleId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления правила:', error);
      throw error;
    }
  },

  deleteRule: async (ruleId) => {
    try {
      const response = await baseService.delete(`/case-distribution/rules/${ruleId}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления правила:', error);
      throw error;
    }
  },

  // ==================== КОЛЛЕГИИ ====================

  getCollegiums: async () => {
    try {
      const response = await baseService.get('/case-distribution/departments/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки коллегий:', error);
      throw error;
    }
  },

  createCollegium: async (data) => {
    try {
      const payload = {
        name: data.name,
        department_type: data.case_types && data.case_types.length > 0 ? data.case_types[0] : 'mixed',
        judges: data.judge_ids || [],
        description: data.description || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        priority: data.priority || 0
      };
      
      const response = await baseService.post('/case-distribution/departments/', payload);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания коллегии:', error);
      throw error;
    }
  },

  updateCollegium: async (collegiumId, data) => {
    try {
      const payload = {
        name: data.name,
        department_type: data.case_types && data.case_types.length > 0 ? data.case_types[0] : 'mixed',
        judges: data.judge_ids || [],
        description: data.description || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        priority: data.priority || 0
      };
      
      const response = await baseService.patch(`/case-distribution/departments/${collegiumId}/`, payload);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления коллегии:', error);
      throw error;
    }
  },

  deleteCollegium: async (collegiumId) => {
    try {
      const response = await baseService.delete(`/case-distribution/departments/${collegiumId}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления коллегии:', error);
      throw error;
    }
  },

  addJudgeToCollegium: async (collegiumId, judgeId) => {
    try {
      const response = await baseService.post(`/case-distribution/departments/${collegiumId}/add-judge/`, { 
        judge_id: judgeId 
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка добавления судьи в коллегию:', error);
      throw error;
    }
  },

  removeJudgeFromCollegium: async (collegiumId, judgeId) => {
    try {
      const response = await baseService.post(`/case-distribution/departments/${collegiumId}/remove-judge/`, { 
        judge_id: judgeId 
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления судьи из коллегии:', error);
      throw error;
    }
  },

  // ==================== ДОСТУПНОСТЬ СУДЕЙ ====================

  getJudgeAvailabilities: async (params = {}) => {
    try {
      const response = await baseService.get('/case-distribution/exclusions/', { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки доступности судей:', error);
      throw error;
    }
  },

  updateJudgeAvailability: async (judgeId, data) => {
    try {
      const response = await baseService.patch(`/case-distribution/exclusions/${judgeId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления доступности судьи:', error);
      throw error;
    }
  },

  // ==================== САНКЦИИ ====================

  getSanctionJudge: async () => {
    try {
      const response = await baseService.get('/case-distribution/sanctions/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки судьи по санкциям:', error);
      throw error;
    }
  },

  setSanctionJudge: async (judgeId) => {
    try {
      const response = await baseService.post('/case-distribution/sanctions/', { judge_id: judgeId });
      return response.data;
    } catch (error) {
      console.error('Ошибка установки судьи по санкциям:', error);
      throw error;
    }
  },

  // ==================== НАСТРОЙКИ ====================

  getSettings: async () => {
    try {
      const response = await baseService.get('/case-distribution/settings/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      throw error;
    }
  },

  updateSettings: async (data) => {
    try {
      const response = await baseService.patch('/case-distribution/settings/', data);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления настроек:', error);
      throw error;
    }
  }
};

export default CaseDistributionService;