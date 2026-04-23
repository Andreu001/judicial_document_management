// Statistics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProtectedFetching } from '../../hooks/useProtectedFetching';
import baseService from '../../API/baseService';
import StatisticsQuery from './StatisticsQuery';
import StatisticsStats from './StatisticsStats';
import StatisticsTable from './StatisticsTable';
import StatisticsPivot from './StatisticsPivot';
import styles from './Statistics.module.css';

const Statistics = () => {
  const { isAuthenticated } = useAuth();
  const [fetchWithAuth] = useProtectedFetching();
  
  // Состояния для метаданных
  const [availableModels, setAvailableModels] = useState({});
  const [categories, setCategories] = useState({});
  const [relations, setRelations] = useState({});
  const [allFieldsMetadata, setAllFieldsMetadata] = useState({});
  
  // Состояния для текущего запроса
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState([]);
  const [dateRange, setDateRange] = useState({ field: '', from: '', to: '' });
  const [ordering, setOrdering] = useState([]);
  const [viewMode, setViewMode] = useState('table');
    const [pivotConfig, setPivotConfig] = useState({ rows: [], columns: [], values: [], countEnabled: true });
  
  // Результаты
  const [results, setResults] = useState([]);
  const [fullResults, setFullResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [queryError, setQueryError] = useState(null);
  
  // Сохраненные запросы
  const [savedQueries, setSavedQueries] = useState([]);
  const [queryName, setQueryName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // Глобальная статистика
  const [globalStats, setGlobalStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  // Расширенные настройки карточек статистики
  const [statsCards, setStatsCards] = useState([
    { id: 'criminal', label: 'Уголовные дела', key: 'criminal_total', enabled: true, expanded: true },
    { id: 'civil', label: 'Гражданские дела', key: 'civil_total', enabled: true, expanded: true },
    { id: 'admin', label: 'Дела об АП (КоАП)', key: 'admin_total', enabled: true, expanded: true },
    { id: 'kas', label: 'Дела КАС', key: 'kas_total', enabled: true, expanded: true },
    { id: 'other', label: 'Иные материалы', key: 'other_total', enabled: false, expanded: false },
  ]);
  const [showStatsConfig, setShowStatsConfig] = useState(false);
  const [statsFilters, setStatsFilters] = useState({
    period: '12months',
    judgeId: '',
    category: '',
    caseType: '',
    result: '',
  });
  
  // Детальная информация для результатов
  const [detailData, setDetailData] = useState({});
  const [detailLoading, setDetailLoading] = useState({});
  
  // Пагинация
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Вкладки в левой панели
  const [leftPanelTab, setLeftPanelTab] = useState('query');
  
  // Загрузка метаданных
  useEffect(() => {
    if (isAuthenticated()) {
      loadMetaData();
      loadSavedQueries();
      loadGlobalStats();
    }
  }, [isAuthenticated]);
  
  // Перезагрузка статистики при изменении фильтров
  useEffect(() => {
    if (isAuthenticated() && statsFilters) {
      loadGlobalStats();
    }
  }, [statsFilters]);
  
  const loadMetaData = async () => {
    try {
      await fetchWithAuth(async () => {
        const response = await baseService.get('/statistics/meta-data/');
        const models = response.data.models || {};
        setAvailableModels(models);
        setCategories(response.data.categories || {});
        setRelations(response.data.relations || {});
        
        // Сохраняем метаданные всех полей
        const fieldsMeta = {};
        Object.entries(models).forEach(([modelKey, modelData]) => {
          (modelData.fields || []).forEach(field => {
            fieldsMeta[`${modelKey}.${field.name}`] = field;
          });
        });
        setAllFieldsMetadata(fieldsMeta);
        
        // Выбираем первую модель по умолчанию, но только если категория не 'all'
        const modelKeys = Object.keys(models);
        if (modelKeys.length > 0 && !selectedModel) {
          // Для категории 'all' выбираем первую модель из первой категории
          const firstCategory = Object.keys(categories)[0];
          const firstModel = modelKeys.find(key => models[key].category === firstCategory);
          setSelectedModel(firstModel || modelKeys[0]);
        }
      });
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };
  
  const loadSavedQueries = async () => {
    try {
      const response = await baseService.get('/statistics/saved-queries/');
      setSavedQueries(response.data);
    } catch (error) {
      console.error('Error loading saved queries:', error);
    }
  };
  
  const loadGlobalStats = async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statsFilters.period) params.append('period', statsFilters.period);
      if (statsFilters.judgeId) params.append('judge_id', statsFilters.judgeId);
      if (statsFilters.category) params.append('category', statsFilters.category);
      if (statsFilters.caseType) params.append('case_type', statsFilters.caseType);
      if (statsFilters.result) params.append('result', statsFilters.result);
      
      const response = await baseService.get(`/statistics/global-stats/?${params.toString()}`);
      setGlobalStats(response.data);
    } catch (error) {
      console.error('Error loading global stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Фильтрация моделей по выбранной категории
  const filteredModels = useMemo(() => {
    if (selectedCategory === 'all') {
      return availableModels;
    }
    const filtered = {};
    Object.entries(availableModels).forEach(([key, model]) => {
      if (model.category === selectedCategory) {
        filtered[key] = model;
      }
    });
    return filtered;
  }, [availableModels, selectedCategory]);
  
  // Получение текущей модели
  const currentModel = useMemo(() => {
    if (!selectedModel || !availableModels[selectedModel]) return null;
    return availableModels[selectedModel];
  }, [selectedModel, availableModels]);
  
  // Получение полей текущей модели
  const currentFields = useMemo(() => {
    if (!currentModel) return [];
    return currentModel.fields || [];
  }, [currentModel]);
  
  // Группировка полей по категориям
    const fieldsByCategory = useMemo(() => {
    const grouped = {
        dates: [],
        numbers: [],
        text: [],
        status: [],
        results: [],
        judges: [],
        relations: [],
        choices: [],  // Дублируем поля с choices сюда для удобства
        other: [],
    };
    
    currentFields.forEach(field => {
        const category = field.category || 'other';
        const hasChoices = field.choices && field.choices.length > 0;
        
        // Всегда добавляем поле в его основную категорию
        if (grouped[category]) {
        grouped[category].push(field);
        } else {
        grouped.other.push(field);
        }
        
        // Дублируем в категорию "Списки" если есть choices
        if (hasChoices) {
        grouped.choices.push(field);
        }
    });
    
    return grouped;
    }, [currentFields]);
  
  // Получение уникальных значений для поля фильтрации
  const getFieldFilterOptions = async (fieldName, searchTerm = '') => {
    if (!selectedModel) return [];
    
    try {
      const [appLabel, modelName] = selectedModel.split('.');
      const response = await baseService.post('/statistics/field-values/', {
        app_label: appLabel,
        model_name: modelName,
        field_name: fieldName,
        search: searchTerm,
        limit: 100
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Error fetching field values:', error);
      return [];
    }
  };
  
  // Получение детальной информации для записи
  const loadDetailData = async (recordId) => {
    if (detailData[recordId]) return;
    
    setDetailLoading(prev => ({ ...prev, [recordId]: true }));
    
    try {
      const [appLabel, modelName] = selectedModel.split('.');
      const response = await baseService.post('/statistics/detail-data/', {
        app_label: appLabel,
        model_name: modelName,
        record_id: recordId,
      });
      
      setDetailData(prev => ({ ...prev, [recordId]: response.data }));
    } catch (error) {
      console.error('Error loading detail data:', error);
      setDetailData(prev => ({ ...prev, [recordId]: { error: true } }));
    } finally {
      setDetailLoading(prev => ({ ...prev, [recordId]: false }));
    }
  };
  
  // Выполнение запроса
  const executeQuery = async (page = 1) => {
    if (!selectedModel) {
      setQueryError('Не выбрана модель данных');
      return;
    }
    
    if (selectedFields.length === 0) {
      setQueryError('Выберите хотя бы одно поле для отображения');
      return;
    }
    
    setLoading(true);
    setQueryError(null);
    setCurrentPage(page);
    setDetailData({});
    
    try {
      const [appLabel, modelName] = selectedModel.split('.');
      
      // Подготавливаем фильтры - удаляем пустые
      const activeFilters = filters.filter(f => f.field && f.value && f.value !== '');
      
      // Подготавливаем сортировку
      const activeOrdering = ordering.filter(o => o.field);
      
      const requestData = {
        app_label: appLabel,
        model_name: modelName,
        selected_fields: selectedFields,
        filters: activeFilters,
        date_range: {
          field: dateRange.field,
          from: dateRange.from,
          to: dateRange.to,
        },
        ordering: activeOrdering,
        page: page,
        page_size: pageSize,
        include_related: true,
        related_depth: 2,
      };
      
      const response = await baseService.post('/statistics/dynamic-data/', requestData);
      
      setResults(response.data.results || []);
      setFullResults(response.data.results || []);
      setMeta(response.data.meta);
      setTotalCount(response.data.meta?.total_count || 0);
      
    } catch (error) {
      console.error('Error executing query:', error);
      setQueryError(error.response?.data?.error || error.message || 'Ошибка выполнения запроса');
    } finally {
      setLoading(false);
    }
  };
  
  // Загрузка всех данных для сводной таблицы
  const loadAllData = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    
    try {
      const [appLabel, modelName] = selectedModel.split('.');
      
      const requestData = {
        app_label: appLabel,
        model_name: modelName,
        selected_fields: selectedFields,
        filters: filters.filter(f => f.field && f.value && f.value !== ''),
        date_range: {
          field: dateRange.field,
          from: dateRange.from,
          to: dateRange.to,
        },
        ordering: ordering.filter(o => o.field),
        page: 1,
        page_size: 10000,
        include_related: true,
        related_depth: 2,
      };
      
      const response = await baseService.post('/statistics/dynamic-data/', requestData);
      setFullResults(response.data.results || []);
      setMeta(response.data.meta);
      setTotalCount(response.data.meta?.total_count || 0);
      
    } catch (error) {
      console.error('Error loading all data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Сохранение запроса
  const saveQuery = async () => {
    if (!queryName.trim()) return;
    
    try {
      const params = {
        app_label: selectedModel.split('.')[0],
        model_name: selectedModel.split('.')[1],
        selected_fields: selectedFields,
        filters: filters,
        date_range: dateRange,
        ordering: ordering,
      };
      
      await baseService.post('/statistics/saved-queries/', {
        name: queryName,
        params: params,
      });
      
      setShowSaveModal(false);
      setQueryName('');
      loadSavedQueries();
    } catch (error) {
      console.error('Error saving query:', error);
    }
  };
  
  // Загрузка сохраненного запроса
  const loadQuery = (query) => {
    const params = query.params;
    setSelectedModel(`${params.app_label}.${params.model_name}`);
    setSelectedFields(params.selected_fields || []);
    setFilters(params.filters || []);
    if (params.date_range) {
      setDateRange(params.date_range);
    }
    setOrdering(params.ordering || []);
    setTimeout(() => executeQuery(1), 100);
  };
  
  // Удаление сохраненного запроса
  const deleteSavedQuery = async (id) => {
    try {
      await baseService.delete(`/statistics/saved-queries/${id}/`);
      loadSavedQueries();
    } catch (error) {
      console.error('Error deleting query:', error);
    }
  };
  
  // Экспорт в Excel
  const exportToExcel = async () => {
    if (results.length === 0) return;
    
    try {
      const XLSX = await import('xlsx');
      
      const headers = selectedFields.map(field => {
        const fieldInfo = currentFields.find(f => f.name === field);
        return fieldInfo?.verbose_name || field;
      });
      
      const data = results.map(row => {
        return selectedFields.map(field => {
          let value = row[field];
          if (value && typeof value === 'object') {
            if (value.id !== undefined) {
              return value.str || value.__str__ || value.id;
            }
            return JSON.stringify(value);
          }
          return value !== null && value !== undefined ? value : '';
        });
      });
      
      const sheetData = [headers, ...data];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Статистика');
      
      XLSX.writeFile(wb, `statistics_${new Date().toISOString().slice(0,19)}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Ошибка экспорта в Excel');
    }
  };
  
  // Экспорт в Word
  const exportToWord = async () => {
    if (results.length === 0) return;
    
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } = await import('docx');
      
      const headers = selectedFields.map(field => {
        const fieldInfo = currentFields.find(f => f.name === field);
        return fieldInfo?.verbose_name || field;
      });
      
      const rows = results.map(row => {
        return new TableRow({
          children: selectedFields.map(field => {
            let value = row[field];
            if (value && typeof value === 'object') {
              if (value.id !== undefined) {
                value = value.str || value.__str__ || value.id;
              } else {
                value = JSON.stringify(value);
              }
            }
            return new TableCell({
              children: [new Paragraph({ children: [new TextRun(String(value !== null && value !== undefined ? value : ''))] })],
            });
          }),
        });
      });
      
      const headerRow = new TableRow({
        children: headers.map(header => 
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })]})],
            shading: { fill: "E6E6E6" },
          })
        ),
      });
      
      const table = new Table({
        rows: [headerRow, ...rows],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
          insideVertical: { style: BorderStyle.SINGLE, size: 1 },
        },
      });
      
      const currentModelName = currentModel?.verbose_name || selectedModel;
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: `Отчет по статистике`, bold: true, size: 32 })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Модель: ${currentModelName}`, size: 24 })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Дата формирования: ${new Date().toLocaleString('ru-RU')}`, size: 24 })],
            }),
            new Paragraph({ children: [] }),
            table,
          ],
        }],
      });
      
      const blob = await Packer.toBlob(doc);
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `statistics_${new Date().toISOString().slice(0,19)}.docx`);
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('Ошибка экспорта в Word');
    }
  };
  
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'pivot' && fullResults.length === 0 && results.length > 0) {
      loadAllData();
    }
  };
  
  // Обновление статистических карточек
  const toggleStatsCard = (cardId) => {
    setStatsCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, enabled: !card.enabled } : card
    ));
  };
  
  // Переключение развернутости секции статистики
  const toggleStatsSection = (cardId) => {
    setStatsCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, expanded: !card.expanded } : card
    ));
  };
  
  return (
    <div className={styles.container}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1 className={styles.title}>Статистика и аналитика</h1>
        <div className={styles.headerActions}>
          <button onClick={exportToExcel} className={styles.excelButton} disabled={results.length === 0}>
            Экспорт в Excel
          </button>
          <button onClick={exportToWord} className={styles.wordButton} disabled={results.length === 0}>
            Экспорт в Word
          </button>
          <button onClick={() => setShowSaveModal(true)} className={styles.saveQueryButton}>
            Сохранить запрос
          </button>
          <button onClick={() => executeQuery(1)} className={styles.executeButton}>
            Выполнить
          </button>
        </div>
      </div>
      
      {/* Основная сетка */}
      <div className={styles.mainLayout}>
        {/* Левая панель */}
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelTabs}>
            <button 
              className={`${styles.leftPanelTab} ${leftPanelTab === 'query' ? styles.active : ''}`}
              onClick={() => setLeftPanelTab('query')}
            >
              Настройка запроса
            </button>
            <button 
              className={`${styles.leftPanelTab} ${leftPanelTab === 'stats' ? styles.active : ''}`}
              onClick={() => setLeftPanelTab('stats')}
            >
              Статистика
            </button>
            <button 
              className={`${styles.leftPanelTab} ${leftPanelTab === 'saved' ? styles.active : ''}`}
              onClick={() => setLeftPanelTab('saved')}
            >
              Сохраненные
            </button>
          </div>
          
          {leftPanelTab === 'query' && (
            <StatisticsQuery
              availableModels={filteredModels}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              currentFields={currentFields}
              fieldsByCategory={fieldsByCategory}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
              filters={filters}
              setFilters={setFilters}
              dateRange={dateRange}
              setDateRange={setDateRange}
              ordering={ordering}
              setOrdering={setOrdering}
              viewMode={viewMode}
              setViewMode={handleViewModeChange}
              pivotConfig={pivotConfig}
              setPivotConfig={setPivotConfig}
              currentModel={currentModel}
              getFieldFilterOptions={getFieldFilterOptions}
            />
          )}
          
          {leftPanelTab === 'stats' && (
            <StatisticsStats
              globalStats={globalStats}
              statsLoading={statsLoading}
              statsCards={statsCards}
              toggleStatsCard={toggleStatsCard}
              toggleStatsSection={toggleStatsSection}
              showStatsConfig={showStatsConfig}
              setShowStatsConfig={setShowStatsConfig}
              statsFilters={statsFilters}
              setStatsFilters={setStatsFilters}
              categories={categories}
              loadGlobalStats={loadGlobalStats}
            />
          )}
          
          {leftPanelTab === 'saved' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Сохраненные запросы</h3>
              <div className={styles.savedQueries}>
                {savedQueries.map(query => (
                  <div key={query.id} className={styles.savedQuery}>
                    <button onClick={() => loadQuery(query)} className={styles.savedQueryName}>
                      {query.name}
                    </button>
                    <button onClick={() => deleteSavedQuery(query.id)} className={styles.removeButton}>✕</button>
                  </div>
                ))}
                {savedQueries.length === 0 && (
                  <p className={styles.noData}>Нет сохраненных запросов</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Правая панель - результаты */}
        <div className={styles.rightPanel}>
          {queryError && (
            <div className={styles.errorMessage}>
              {queryError}
            </div>
          )}
          
          {meta && totalCount > 0 && (
            <div className={styles.resultsInfo}>
              <div className={styles.resultsStats}>
                <span>Найдено записей: {totalCount}</span>
                {viewMode === 'table' && meta.total_pages && (
                  <span>Страница: {meta.current_page || currentPage} из {meta.total_pages}</span>
                )}
                <span>Отображается полей: {selectedFields.length}</span>
              </div>
              {viewMode === 'table' && (
                <div className={styles.resultsActions}>
                  <select 
                    value={pageSize} 
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      executeQuery(1);
                    }}
                    className={styles.pageSizeSelect}
                  >
                    <option value="10">10 строк</option>
                    <option value="25">25 строк</option>
                    <option value="50">50 строк</option>
                    <option value="100">100 строк</option>
                    <option value="200">200 строк</option>
                  </select>
                </div>
              )}
            </div>
          )}
          
            {viewMode === 'table' ? (
            <StatisticsTable
                results={results}
                loading={loading}
                selectedFields={selectedFields}
                setSelectedFields={setSelectedFields}
                currentFields={currentFields}
                meta={meta}
                executeQuery={executeQuery}
                totalCount={totalCount}
                pageSize={pageSize}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLoadDetail={loadDetailData}
                detailData={detailData}
                detailLoading={detailLoading}
            />
            ) : (
            <StatisticsPivot
                fullResults={fullResults.length > 0 ? fullResults : results}
                loading={loading}
                pivotConfig={pivotConfig}
                currentFields={currentFields}
                selectedFields={selectedFields}
            />
            )}
        </div>
      </div>
      
      {/* Модальное окно сохранения запроса */}
      {showSaveModal && (
        <div className={styles.modal} onClick={() => setShowSaveModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Сохранить запрос</h3>
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="Название запроса"
              className={styles.input}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button onClick={saveQuery} className={styles.saveButton}>Сохранить</button>
              <button onClick={() => setShowSaveModal(false)} className={styles.cancelButton}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;