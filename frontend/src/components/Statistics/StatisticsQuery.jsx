import React, { useState, useMemo } from 'react';
import styles from './Statistics.module.css';

const StatisticsQuery = ({
  availableModels,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedModel,
  setSelectedModel,
  currentFields,
  fieldsByCategory,
  selectedFields,
  setSelectedFields,
  filters,
  setFilters,
  dateRange,
  setDateRange,
  ordering,
  setOrdering,
  viewMode,
  setViewMode,
  pivotConfig,
  setPivotConfig,
  currentModel,
  getFieldFilterOptions,
}) => {
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  const [selectedFieldCategory, setSelectedFieldCategory] = useState('all');
  const [fieldOptionsCache, setFieldOptionsCache] = useState({});
  const [loadingOptions, setLoadingOptions] = useState({});
  
  // Функции для управления порядком полей в таблице
  const moveFieldLeft = (index) => {
    if (index === 0) return;
    const newSelectedFields = [...selectedFields];
    [newSelectedFields[index - 1], newSelectedFields[index]] = 
    [newSelectedFields[index], newSelectedFields[index - 1]];
    setSelectedFields(newSelectedFields);
  };
  
  const moveFieldRight = (index) => {
    if (index === selectedFields.length - 1) return;
    const newSelectedFields = [...selectedFields];
    [newSelectedFields[index], newSelectedFields[index + 1]] = 
    [newSelectedFields[index + 1], newSelectedFields[index]];
    setSelectedFields(newSelectedFields);
  };
  
  const moveFieldToFirst = (index) => {
    const field = selectedFields[index];
    const newSelectedFields = [field, ...selectedFields.filter((_, i) => i !== index)];
    setSelectedFields(newSelectedFields);
  };
  
  const moveFieldToLast = (index) => {
    const field = selectedFields[index];
    const newSelectedFields = [...selectedFields.filter((_, i) => i !== index), field];
    setSelectedFields(newSelectedFields);
  };
  
  // Прямое получение choices из поля
  const getFieldChoices = (fieldName) => {
    const field = currentFields.find(f => f.name === fieldName);
    if (field && field.choices && field.choices.length > 0) {
      return field.choices;
    }
    return null;
  };
  
  // Проверка, есть ли у поля choices
  const hasFieldChoices = (fieldName) => {
    const field = currentFields.find(f => f.name === fieldName);
    return field && field.choices && field.choices.length > 0;
  };
  
  // Категории для выбора
  const categoryOptions = [
    { id: 'all', label: 'Все категории' },
    { id: 'criminal', label: 'Уголовные дела' },
    { id: 'civil', label: 'Гражданские дела' },
    { id: 'admin', label: 'Дела об АП (КоАП)' },
    { id: 'kas', label: 'Дела КАС' },
    { id: 'other', label: 'Иные материалы' },
    { id: 'common', label: 'Общие справочники' },
  ];
  
  // Получение списка моделей для выбранной категории
  const getModelOptions = useMemo(() => {
    if (selectedCategory === 'all') {
      return Object.entries(availableModels).map(([key, model]) => ({
        key,
        verbose_name: model.verbose_name,
        count: model.count || 0,
        category: model.category
      }));
    }
    
    const filtered = Object.entries(availableModels)
      .filter(([_, model]) => model.category === selectedCategory)
      .map(([key, model]) => ({
        key,
        verbose_name: model.verbose_name,
        count: model.count || 0,
        category: model.category
      }));
    
    return filtered;
  }, [availableModels, selectedCategory]);
  
  // Фильтрация полей по поиску и категории
  const getFilteredFields = () => {
    let fields = currentFields;
    
    if (selectedFieldCategory !== 'all') {
      if (selectedFieldCategory === 'choices') {
        fields = fieldsByCategory.choices || [];
      } else {
        fields = fieldsByCategory[selectedFieldCategory] || [];
      }
    }
    
    if (fieldSearchTerm.trim()) {
      fields = fields.filter(field => 
        field.verbose_name?.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
        field.name.toLowerCase().includes(fieldSearchTerm.toLowerCase())
      );
    }
    
    return fields;
  };
  
  // Переключение выбора поля
  const toggleField = (fieldName) => {
    if (selectedFields.includes(fieldName)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldName));
    } else {
      setSelectedFields([...selectedFields, fieldName]);
    }
  };
  
  // Выбор всех полей
  const selectAllFields = () => {
    setSelectedFields(currentFields.map(f => f.name));
  };
  
  // Очистка всех полей
  const clearFields = () => {
    setSelectedFields([]);
  };
  
  // Добавление фильтра
  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'exact', value: '' }]);
  };
  
  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };
  
  const updateFilter = (index, field, value) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };
  
  // Загрузка вариантов значений для поля (только для полей БЕЗ choices)
  const loadFieldOptions = async (fieldName, filterIndex) => {
    if (fieldOptionsCache[fieldName]) return;
    
    setLoadingOptions(prev => ({ ...prev, [fieldName]: true }));
    try {
      const options = await getFieldFilterOptions(fieldName);
      setFieldOptionsCache(prev => ({ ...prev, [fieldName]: options }));
    } catch (error) {
      console.error('Error loading field options:', error);
    } finally {
      setLoadingOptions(prev => ({ ...prev, [fieldName]: false }));
    }
  };
  
  // Добавление сортировки
  const addOrdering = () => {
    setOrdering([...ordering, { field: '', direction: 'asc' }]);
  };
  
  const removeOrdering = (index) => {
    setOrdering(ordering.filter((_, i) => i !== index));
  };
  
  const updateOrdering = (index, field, value) => {
    const newOrdering = [...ordering];
    newOrdering[index][field] = value;
    setOrdering(newOrdering);
  };
  
  // Настройка сводной таблицы
  const updatePivotRows = (fieldName, checked) => {
    if (checked) {
      setPivotConfig({ ...pivotConfig, rows: [...pivotConfig.rows, fieldName] });
    } else {
      setPivotConfig({ ...pivotConfig, rows: pivotConfig.rows.filter(r => r !== fieldName) });
    }
  };
  
  const updatePivotColumns = (fieldName, checked) => {
    if (checked) {
      setPivotConfig({ ...pivotConfig, columns: [...pivotConfig.columns, fieldName] });
    } else {
      setPivotConfig({ ...pivotConfig, columns: pivotConfig.columns.filter(c => c !== fieldName) });
    }
  };
  
  const updatePivotValue = (fieldName, aggregation) => {
    if (aggregation) {
      const existingIndex = pivotConfig.values.findIndex(v => v.field === fieldName);
      if (existingIndex >= 0) {
        const newValues = [...pivotConfig.values];
        newValues[existingIndex] = { field: fieldName, aggregation };
        setPivotConfig({ ...pivotConfig, values: newValues });
      } else {
        setPivotConfig({
          ...pivotConfig,
          values: [...pivotConfig.values, { field: fieldName, aggregation }]
        });
      }
    } else {
      setPivotConfig({
        ...pivotConfig,
        values: pivotConfig.values.filter(v => v.field !== fieldName)
      });
    }
  };
  
  // Операторы фильтрации
  const operators = [
    { value: 'exact', label: 'равно' },
    { value: 'contains', label: 'содержит' },
    { value: 'icontains', label: 'содержит (без учета регистра)' },
    { value: 'gt', label: 'больше' },
    { value: 'gte', label: 'больше или равно' },
    { value: 'lt', label: 'меньше' },
    { value: 'lte', label: 'меньше или равно' },
    { value: 'in', label: 'в списке' },
    { value: 'isnull', label: 'пустое' },
  ];
  
  // Получение категории модели для отображения
  const getModelCategoryName = (categoryId) => {
    const categoryMap = {
      criminal: 'Уголовные',
      civil: 'Гражданские',
      admin: 'Административные (КоАП)',
      kas: 'КАС',
      other: 'Иные материалы',
      common: 'Общие справочники'
    };
    return categoryMap[categoryId] || categoryId;
  };
  
  const hasModels = getModelOptions.length > 0;
  
  return (
    <>
      {/* Категория дел */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Категория дел</h3>
        <div className={styles.categorySelect}>
          {categoryOptions.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoryButton} ${selectedCategory === cat.id ? styles.activeCategory : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Источник данных */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Источник данных</h3>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className={styles.select}
        >
          <option value="">-- Выберите модель --</option>
          {!hasModels ? (
            <option value="" disabled>Нет доступных моделей для выбранной категории</option>
          ) : (
            getModelOptions.map((model) => {
              const categoryName = getModelCategoryName(model.category);
              return (
                <option key={model.key} value={model.key}>
                  {model.verbose_name} ({categoryName}) - {model.count} записей
                </option>
              );
            })
          )}
        </select>
        {currentModel && (
          <div className={styles.modelInfo}>
            <span className={styles.modelBadge}>{getModelCategoryName(currentModel.category)}</span>
            <span className={styles.modelCount}>Всего записей: {currentModel.count || 0}</span>
          </div>
        )}
      </div>
      
      {/* Поля для отображения */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Поля для отображения
          <div className={styles.sectionActions}>
            <button onClick={selectAllFields} className={styles.iconButton}>Выбрать все</button>
            <button onClick={clearFields} className={styles.iconButton}>Очистить</button>
          </div>
        </h3>
        
        <div className={styles.fieldSearch}>
          <input
            type="text"
            value={fieldSearchTerm}
            onChange={(e) => setFieldSearchTerm(e.target.value)}
            placeholder="Поиск полей..."
            className={styles.fieldSearchInput}
          />
        </div>
        
        <div className={styles.fieldTabs}>
          <button 
            className={`${styles.fieldTab} ${selectedFieldCategory === 'all' ? styles.activeFieldTab : ''}`}
            onClick={() => setSelectedFieldCategory('all')}
          >
            Все ({currentFields.length})
          </button>
          {fieldsByCategory.dates?.length > 0 && (
            <button 
              className={`${styles.fieldTab} ${selectedFieldCategory === 'dates' ? styles.activeFieldTab : ''}`}
              onClick={() => setSelectedFieldCategory('dates')}
            >
              Даты ({fieldsByCategory.dates.length})
            </button>
          )}
          {fieldsByCategory.numbers?.length > 0 && (
            <button 
              className={`${styles.fieldTab} ${selectedFieldCategory === 'numbers' ? styles.activeFieldTab : ''}`}
              onClick={() => setSelectedFieldCategory('numbers')}
            >
              Числовые ({fieldsByCategory.numbers.length})
            </button>
          )}
          {fieldsByCategory.text?.length > 0 && (
            <button 
              className={`${styles.fieldTab} ${selectedFieldCategory === 'text' ? styles.activeFieldTab : ''}`}
              onClick={() => setSelectedFieldCategory('text')}
            >
              Текстовые ({fieldsByCategory.text.length})
            </button>
          )}
          {fieldsByCategory.status?.length > 0 && (
            <button 
              className={`${styles.fieldTab} ${selectedFieldCategory === 'status' ? styles.activeFieldTab : ''}`}
              onClick={() => setSelectedFieldCategory('status')}
            >
              Статусы ({fieldsByCategory.status.length})
            </button>
          )}
          {fieldsByCategory.results?.length > 0 && (
            <button 
              className={`${styles.fieldTab} ${selectedFieldCategory === 'results' ? styles.activeFieldTab : ''}`}
              onClick={() => setSelectedFieldCategory('results')}
            >
              Результаты ({fieldsByCategory.results.length})
            </button>
          )}
          {fieldsByCategory.judges?.length > 0 && (
            <button 
              className={`${styles.fieldTab} ${selectedFieldCategory === 'judges' ? styles.activeFieldTab : ''}`}
              onClick={() => setSelectedFieldCategory('judges')}
            >
              Судьи ({fieldsByCategory.judges.length})
            </button>
          )}
          {fieldsByCategory.choices?.length > 0 && (
            <button 
              className={`${styles.fieldTab} ${selectedFieldCategory === 'choices' ? styles.activeFieldTab : ''}`}
              onClick={() => setSelectedFieldCategory('choices')}
            >
              📋 Списки ({fieldsByCategory.choices.length})
            </button>
          )}
          {fieldsByCategory.relations?.length > 0 && (
            <button 
              className={`${styles.fieldTab} ${selectedFieldCategory === 'relations' ? styles.activeFieldTab : ''}`}
              onClick={() => setSelectedFieldCategory('relations')}
            >
              Связи ({fieldsByCategory.relations.length})
            </button>
          )}
        </div>
        
        <div className={styles.fieldsList}>
          {getFilteredFields().map(field => (
            <label key={field.name} className={styles.fieldCheckbox}>
              <input
                type="checkbox"
                checked={selectedFields.includes(field.name)}
                onChange={() => toggleField(field.name)}
              />
              <span className={styles.fieldName}>
                {field.verbose_name}
                {field.choices && field.choices.length > 0 && (
                  <span className={styles.hasChoices}>(список)</span>
                )}
              </span>
              <span className={styles.fieldType}>
                {field.type === 'CharField' && field.choices ? 'choice' : field.type}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Фильтр по дате */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Фильтр по дате</h3>
        <div className={styles.dateRange}>
          <select
            value={dateRange.field}
            onChange={(e) => setDateRange({ ...dateRange, field: e.target.value })}
            className={styles.select}
          >
            <option value="">Выберите поле даты</option>
            {fieldsByCategory.dates?.map(field => (
              <option key={field.name} value={field.name}>{field.verbose_name}</option>
            ))}
          </select>
          <div className={styles.dateInputs}>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className={styles.input}
              placeholder="С"
            />
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className={styles.input}
              placeholder="По"
            />
          </div>
        </div>
      </div>
      
      {/* Условия фильтрации */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Условия фильтрации
          <button onClick={addFilter} className={styles.addButton}>Добавить</button>
        </h3>
        {filters.map((filter, index) => {
          const hasChoices = filter.field && hasFieldChoices(filter.field);
          const choices = filter.field ? getFieldChoices(filter.field) : [];
          
          return (
            <div key={index} className={styles.filterRow}>
              <select
                value={filter.field}
                onChange={(e) => updateFilter(index, 'field', e.target.value)}
                className={styles.select}
              >
                <option value="">Выберите поле</option>
                {currentFields.map(field => (
                  <option key={field.name} value={field.name}>
                    {field.verbose_name}
                    {field.choices && field.choices.length > 0 && ' [список]'}
                  </option>
                ))}
              </select>
              
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                className={styles.selectSmall}
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              
              {filter.operator === 'in' ? (
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className={styles.input}
                  placeholder="Значения через запятую"
                />
              ) : filter.operator === 'isnull' ? (
                <select
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="true">Да (пустое)</option>
                  <option value="false">Нет (не пустое)</option>
                </select>
              ) : hasChoices ? (
                <select
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className={styles.input}
                >
                  <option value="">-- Выберите значение --</option>
                  {choices.map((choice, idx) => (
                    <option key={idx} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    className={styles.input}
                    placeholder="Значение"
                    list={`field-values-${filter.field}-${index}`}
                    onFocus={() => {
                      if (filter.field && !fieldOptionsCache[filter.field] && !hasChoices) {
                        loadFieldOptions(filter.field, index);
                      }
                    }}
                  />
                  {filter.field && fieldOptionsCache[filter.field] && fieldOptionsCache[filter.field].length > 0 && (
                    <datalist id={`field-values-${filter.field}-${index}`}>
                      {fieldOptionsCache[filter.field].map((opt, idx) => (
                        <option key={idx} value={opt.value}>{opt.label}</option>
                      ))}
                    </datalist>
                  )}
                  {loadingOptions[filter.field] && (
                    <span className={styles.loadingIcon}>...</span>
                  )}
                </>
              )}
              
              <button onClick={() => removeFilter(index)} className={styles.removeButton} title="Удалить">X</button>
            </div>
          );
        })}
        {filters.length === 0 && (
          <div className={styles.noData}>Нет условий фильтрации</div>
        )}
      </div>
      
      {/* Сортировка */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Сортировка
          <button onClick={addOrdering} className={styles.addButton}>Добавить</button>
        </h3>
        {ordering.map((order, index) => (
          <div key={index} className={styles.orderRow}>
            <select
              value={order.field}
              onChange={(e) => updateOrdering(index, 'field', e.target.value)}
              className={styles.select}
            >
              <option value="">Выберите поле</option>
              {currentFields.map(field => (
                <option key={field.name} value={field.name}>{field.verbose_name}</option>
              ))}
            </select>
            <select
              value={order.direction}
              onChange={(e) => updateOrdering(index, 'direction', e.target.value)}
              className={styles.selectSmall}
            >
              <option value="asc">По возрастанию</option>
              <option value="desc">По убыванию</option>
            </select>
            <button onClick={() => removeOrdering(index)} className={styles.removeButton}>X</button>
          </div>
        ))}
        {ordering.length === 0 && (
          <div className={styles.noData}>Нет сортировки</div>
        )}
      </div>
      
      {/* Режим отображения */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Режим отображения</h3>
        <div className={styles.viewModes}>
          <button
            className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={() => setViewMode('table')}
          >
            Таблица
          </button>
          <button
            className={`${styles.viewModeButton} ${viewMode === 'pivot' ? styles.active : ''}`}
            onClick={() => setViewMode('pivot')}
          >
            Сводная таблица
          </button>
        </div>
      </div>
      
      {/* Настройка сводной таблицы */}
      {viewMode === 'pivot' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Настройка сводной таблицы</h3>
          <div className={styles.pivotConfig}>
            <div className={styles.pivotConfigGroup}>
              <label>Строки (группировка):</label>
              <div className={styles.pivotSelectContainer}>
                {currentFields.map(field => (
                  <label key={field.name} className={styles.pivotCheckbox}>
                    <input
                      type="checkbox"
                      checked={pivotConfig.rows.includes(field.name)}
                      onChange={(e) => updatePivotRows(field.name, e.target.checked)}
                    />
                    <span>
                      {field.verbose_name}
                      {field.choices && field.choices.length > 0 && (
                        <span className={styles.hasChoices}>список</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.pivotConfigGroup}>
              <label>Столбцы:</label>
              <div className={styles.pivotSelectContainer}>
                <label className={styles.pivotCheckbox}>
                  <input
                    type="checkbox"
                    checked={pivotConfig.columns.length === 0}
                    onChange={() => setPivotConfig({ ...pivotConfig, columns: [] })}
                  />
                  <span>Без группировки по столбцам</span>
                </label>
                {currentFields.map(field => (
                  <label key={field.name} className={styles.pivotCheckbox}>
                    <input
                      type="checkbox"
                      checked={pivotConfig.columns.includes(field.name)}
                      onChange={(e) => updatePivotColumns(field.name, e.target.checked)}
                    />
                    <span>
                      {field.verbose_name}
                      {field.choices && field.choices.length > 0 && (
                        <span className={styles.hasChoices}>список</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.pivotConfigGroup}>
              <label>Значения (агрегация):</label>
              <div className={styles.pivotValuesContainer}>
                <div className={styles.pivotValueRow}>
                  <span className={styles.pivotValueLabel}>Количество записей:</span>
                  <select
                    value={pivotConfig.countEnabled ? 'count' : ''}
                    onChange={(e) => setPivotConfig({ ...pivotConfig, countEnabled: e.target.value === 'count' })}
                    className={styles.selectSmall}
                  >
                    <option value="">Не использовать</option>
                    <option value="count">Показывать количество</option>
                  </select>
                </div>
                
                {currentFields.filter(f => 
                  f.type === 'IntegerField' || f.type === 'DecimalField' || 
                  f.type === 'FloatField' || f.type === 'PositiveIntegerField' ||
                  (f.choices && f.choices.length > 0)
                ).map(field => {
                  const currentValue = pivotConfig.values.find(v => v.field === field.name);
                  const isChoiceField = field.choices && field.choices.length > 0;
                  return (
                    <div key={field.name} className={styles.pivotValueRow}>
                      <span className={styles.pivotValueLabel}>
                        {field.verbose_name}:
                        {isChoiceField && <span className={styles.hasChoices}> (счетчик)</span>}
                      </span>
                      <select
                        value={currentValue?.aggregation || ''}
                        onChange={(e) => updatePivotValue(field.name, e.target.value)}
                        className={styles.selectSmall}
                      >
                        <option value="">Не использовать</option>
                        <option value="count">Количество</option>
                        {!isChoiceField && (
                          <>
                            <option value="sum">Сумма</option>
                            <option value="avg">Среднее</option>
                            <option value="min">Минимум</option>
                            <option value="max">Максимум</option>
                          </>
                        )}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatisticsQuery;