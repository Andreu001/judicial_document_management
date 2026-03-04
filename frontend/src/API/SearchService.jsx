import baseService from './baseService';

const SEARCH_URL = '/search/search/';
const UPDATE_STATUS_URL = '/search/update-status/';
const BULK_UPDATE_STATUS_URL = '/search/bulk-update-status/';

class SearchService {
  // Сохраняем последний поисковый запрос
  static lastSearchQuery = '';

  /**
   * Поиск по делам
   * @param {string} query - Поисковый запрос
   * @param {Array} caseTypes - Типы дел для поиска (criminal, civil, administrative, kas)
   * @returns {Promise} - Результаты поиска
   */
  static async searchCases(query, caseTypes = []) {
    try {
      this.lastSearchQuery = query;
      
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (caseTypes && caseTypes.length > 0) {
        caseTypes.forEach(type => params.append('types[]', type));
      }
      
      const response = await baseService.get(`${SEARCH_URL}?${params.toString()}`);
      
      // Добавляем флаги типов к результатам для совместимости с CardList
      const data = response.data;
      Object.keys(data).forEach(caseType => {
        data[caseType] = data[caseType].map(caseData => ({
          ...caseData,
          // Добавляем флаги для совместимости с компонентами карточек
          is_criminal: caseType === 'criminal',
          is_civil: caseType === 'civil',
          is_administrative: caseType === 'administrative',
          is_kas: caseType === 'kas',
          // Сохраняем оригинальный ID для API запросов
          original_id: caseData.id,
          // Добавляем составной ID только для отображения в CardList
          display_id: `${caseType}-${caseData.id}`,
          // Добавляем соответствующий ID для каждого типа (числовые значения)
          criminal_proceedings_id: caseType === 'criminal' ? caseData.id : undefined,
          civil_proceedings_id: caseType === 'civil' ? caseData.id : undefined,
          administrative_proceedings_id: caseType === 'administrative' ? caseData.id : undefined,
          kas_proceedings_id: caseType === 'kas' ? caseData.id : undefined,
        }));
      });
      
      return data;
    } catch (error) {
      console.error('Ошибка поиска:', error);
      throw error;
    }
  }

  /**
   * Форматирование результатов поиска для отображения
   * @param {Object} searchResults - Результаты поиска
   * @returns {Array} - Отформатированный список
   */
  static formatSearchResults(searchResults) {
    if (!searchResults) return [];
    
    const formatted = [];
    
    const caseTypeLabels = {
      'criminal': 'Уголовное',
      'civil': 'Гражданское',
      'administrative': 'Административное (КоАП)',
      'kas': 'Административное (КАС)'
    };
    
    Object.entries(searchResults).forEach(([caseType, cases]) => {
      cases.forEach(caseData => {
        formatted.push({
          ...caseData,
          case_type: caseType,
          case_type_label: caseTypeLabels[caseType] || caseType,
          // Сохраняем оригинальный ID
          original_id: caseData.id,
          // Составной ID только для отображения
          display_id: `${caseType}-${caseData.id}`,
          is_criminal: caseType === 'criminal',
          is_civil: caseType === 'civil',
          is_administrative: caseType === 'administrative',
          is_kas: caseType === 'kas',
          // Добавляем соответствующие ID для каждого типа
          criminal_proceedings_id: caseType === 'criminal' ? caseData.id : undefined,
          civil_proceedings_id: caseType === 'civil' ? caseData.id : undefined,
          administrative_proceedings_id: caseType === 'administrative' ? caseData.id : undefined,
          kas_proceedings_id: caseType === 'kas' ? caseData.id : undefined,
          highlight: {
            case_number: caseData.case_number?.toLowerCase().includes(
              this.lastSearchQuery?.toLowerCase() || ''
            ),
            sides: caseData.sides?.some(side => 
              side.name?.toLowerCase().includes(this.lastSearchQuery?.toLowerCase() || '')
            )
          }
        });
      });
    });
    
    return formatted.sort((a, b) => {
      const dateA = a.incoming_date || a.created_at;
      const dateB = b.incoming_date || b.created_at;
      return new Date(dateB) - new Date(dateA);
    });
  }

  /**
   * Поиск по номеру дела
   * @param {string} caseNumber - Номер дела
   * @returns {Promise} - Результаты поиска
   */
  static async searchByCaseNumber(caseNumber) {
    return this.searchCases(caseNumber);
  }

  /**
   * Поиск по ФИО стороны
   * @param {string} partyName - ФИО стороны
   * @returns {Promise} - Результаты поиска
   */
  static async searchByPartyName(partyName) {
    return this.searchCases(partyName);
  }

  /**
   * Обновление статуса дела
   * @param {number} caseId - ID дела
   * @param {string} caseType - Тип дела
   * @returns {Promise} - Результат обновления
   */
  static async updateCaseStatus(caseId, caseType) {
    try {
      const response = await baseService.post(UPDATE_STATUS_URL, {
        case_id: caseId,
        case_type: caseType
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      throw error;
    }
  }

  /**
   * Массовое обновление статусов дел
   * @param {string} caseType - Тип дела
   * @param {Array} caseIds - Список ID дел (опционально)
   * @returns {Promise} - Результат обновления
   */
  static async bulkUpdateStatuses(caseType, caseIds = []) {
    try {
      const response = await baseService.post(BULK_UPDATE_STATUS_URL, {
        case_type: caseType,
        case_ids: caseIds
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка массового обновления статусов:', error);
      throw error;
    }
  }

  static async getPersonDetails(personId) {
    try {
      const response = await baseService.get(`/search/person/${personId}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения данных участника:', error);
      throw error;
    }
  }

  /**
   * Обновление статуса для всех дел определенного типа
   * @param {string} caseType - Тип дела
   * @returns {Promise} - Результат обновления
   */
  static async updateAllStatusesForType(caseType) {
    return this.bulkUpdateStatuses(caseType);
  }

  static async searchPersons(query, personType = 'physical') {
    try {
      this.lastSearchQuery = query;
      
      const params = new URLSearchParams();
      params.append('q', query);
      
      // Ищем по всем типам дел, чтобы найти участников
      const response = await baseService.get(`${SEARCH_URL}?${params.toString()}`);
      
      // Собираем всех уникальных участников из результатов
      const persons = new Map(); // Используем Map для уникальности по ID
      
      Object.entries(response.data).forEach(([caseType, cases]) => {
        cases.forEach(caseData => {
          if (caseData.sides && Array.isArray(caseData.sides)) {
            caseData.sides.forEach(side => {
              // Для физических лиц ищем по имени (упрощенная фильтрация)
              // В реальности нужно будет добавить фильтрацию по типу лица
              if (side.name && side.name.toLowerCase().includes(query.toLowerCase())) {
                const personId = `${caseType}-${side.name}-${side.role}`; // Временный ID
                if (!persons.has(personId)) {
                  persons.set(personId, {
                    id: personId,
                    name: side.name,
                    role: side.role,
                    case_type: caseType,
                    case_number: caseData.case_number,
                    case_id: caseData.id,
                    // Добавляем ссылку на карточку участника, если есть
                    person_url: `/businesscard/${caseData.business_card_id}/sides/${side.id}`,
                  });
                }
              }
            });
          }
        });
      });
      
      return Array.from(persons.values());
    } catch (error) {
      console.error('Ошибка поиска лиц:', error);
      return [];
    }
  }
}

export default SearchService;