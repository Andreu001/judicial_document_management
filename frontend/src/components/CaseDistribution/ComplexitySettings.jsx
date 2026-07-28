// src/components/CaseDistribution/ComplexitySettings.jsx
import React, { useState, useEffect } from 'react';
import CaseDistributionService from '../../API/CaseDistributionService';
import styles from './CaseDistribution.module.css';

const ComplexitySettings = ({ cases, onUpdate }) => {
  const [complexityCases, setComplexityCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    case_type: '',
    min_complexity: '',
    max_complexity: ''
  });
  const [editingCase, setEditingCase] = useState(null);
  const [complexityValue, setComplexityValue] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadAllCases();
  }, []);

  const loadAllCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await CaseDistributionService.getAllCases();
      const casesData = Array.isArray(response) ? response : (response.results || []);
      setAllCases(casesData);
      setComplexityCases(casesData);
    } catch (error) {
      console.error('Ошибка загрузки дел:', error);
      setError('Ошибка загрузки дел');
    } finally {
      setLoading(false);
    }
  };

  const handleSetComplexity = async (caseId, complexity) => {
    setError(null);
    setSuccess(null);
    
    try {
      const result = await CaseDistributionService.setCaseComplexity(caseId, complexity);
      
      // Обновляем локальное состояние
      setAllCases(prev => 
        prev.map(c => c.id === caseId ? { ...c, complexity: Number(complexity) } : c)
      );
      setComplexityCases(prev => 
        prev.map(c => c.id === caseId ? { ...c, complexity: Number(complexity) } : c)
      );
      
      setSuccess(`Сложность дела обновлена на ${complexity}`);
      setTimeout(() => setSuccess(null), 3000);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Ошибка установки сложности:', error);
      setError(error.message || 'Не удалось установить сложность');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleBulkComplexity = async () => {
    const selected = document.querySelectorAll('input[name="case-select"]:checked');
    if (selected.length === 0) {
      setError('Выберите хотя бы одно дело');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    const complexity = prompt('Введите сложность для выбранных дел (1-10):', '1');
    if (!complexity || isNaN(complexity) || complexity < 1 || complexity > 10) {
      setError('Некорректное значение сложности');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setError(null);
    setLoading(true);
    let successCount = 0;
    
    try {
      const caseIds = Array.from(selected).map(el => parseInt(el.value));
      for (const caseId of caseIds) {
        await CaseDistributionService.setCaseComplexity(caseId, parseInt(complexity));
        successCount++;
      }
      
      await loadAllCases();
      if (onUpdate) onUpdate();
      
      setSuccess(`Сложность обновлена для ${successCount} дел`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Ошибка массовой установки сложности:', error);
      setError('Ошибка при массовой установке сложности');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const openComplexityEditor = (caseItem) => {
    setEditingCase(caseItem);
    setComplexityValue(Number(caseItem.complexity) || 1);
    setError(null);
    setSuccess(null);
  };

  const saveComplexity = async () => {
    if (editingCase) {
      await handleSetComplexity(editingCase.id, complexityValue);
      setEditingCase(null);
    }
  };

  const getComplexityLabel = (value) => {
    const labels = {
      1: 'Обычное',
      2: 'Повышенное',
      3: 'Сложное',
      4: 'Очень сложное',
      5: 'Особо сложное'
    };
    return labels[value] || `${value}x`;
  };

  // Поиск с debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSearchParams = filters.search || filters.case_type || 
                             filters.min_complexity || filters.max_complexity;
      
      if (!hasSearchParams) {
        setComplexityCases(allCases);
        return;
      }
      
      let filtered = [...allCases];
      
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        filtered = filtered.filter(c => {
          const caseNumber = String(c.case_number || c.original_name || c.id).toLowerCase();
          return caseNumber.includes(query);
        });
      }
      
      if (filters.case_type) {
        filtered = filtered.filter(c => c.case_category === filters.case_type);
      }
      
      if (filters.min_complexity) {
        const min = parseInt(filters.min_complexity);
        if (!isNaN(min)) {
          filtered = filtered.filter(c => (Number(c.complexity) || 1) >= min);
        }
      }
      
      if (filters.max_complexity) {
        const max = parseInt(filters.max_complexity);
        if (!isNaN(max)) {
          filtered = filtered.filter(c => (Number(c.complexity) || 1) <= max);
        }
      }
      
      setComplexityCases(filtered);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters, allCases]);

  return (
    <div className={styles.complexitySettings}>
      <h2>Настройка сложности дел</h2>
      
      {error && (
        <div style={{ 
          color: '#c53030', 
          padding: '10px 16px', 
          background: '#fed7d7', 
          borderRadius: '6px', 
          marginBottom: '16px' 
        }}>
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          color: '#276749', 
          padding: '10px 16px', 
          background: '#c6f6d5', 
          borderRadius: '6px', 
          marginBottom: '16px' 
        }}>
          ✅ {success}
        </div>
      )}
      
      <div className={styles.complexityFilters}>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Поиск по номеру дела..."
          className={styles.searchInput}
        />
        <select
          name="case_type"
          value={filters.case_type}
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="">Все типы</option>
          <option value="criminal">Уголовные</option>
          <option value="civil">Гражданские</option>
          <option value="coap">Административные (КоАП)</option>
          <option value="kas">КАС</option>
          <option value="other">Прочие</option>
        </select>
        <input
          type="number"
          name="min_complexity"
          value={filters.min_complexity}
          onChange={handleFilterChange}
          placeholder="Мин."
          className={styles.complexityFilterInput}
          min="1"
          max="10"
        />
        <span>—</span>
        <input
          type="number"
          name="max_complexity"
          value={filters.max_complexity}
          onChange={handleFilterChange}
          placeholder="Макс."
          className={styles.complexityFilterInput}
          min="1"
          max="10"
        />
        <button 
          onClick={handleBulkComplexity} 
          className={styles.bulkComplexityButton}
          disabled={loading}
        >
          {loading ? 'Обработка...' : 'Массовое изменение'}
        </button>
        <button 
          onClick={() => {
            setFilters({ search: '', case_type: '', min_complexity: '', max_complexity: '' });
            setComplexityCases(allCases);
          }} 
          className={styles.filterButton}
        >
          Сбросить
        </button>
      </div>

      <div className={styles.complexityLegend}>
        <span>Сложность влияет на нагрузку судьи:</span>
        {[1, 2, 3, 4, 5].map(val => (
          <span key={val} className={styles.legendItem}>
            <span className={styles.legendColor} style={{ 
              backgroundColor: `hsl(${220 - val * 30}, 70%, ${60 - val * 5}%)` 
            }} />
            {val} = {getComplexityLabel(val)}
          </span>
        ))}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" onChange={(e) => {
                  document.querySelectorAll('input[name="case-select"]')
                    .forEach(el => el.checked = e.target.checked);
                }} />
              </th>
              <th>№ дела</th>
              <th>Тип</th>
              <th>Категория</th>
              <th>Сложность</th>
              <th>Судья</th>
              <th style={{ width: '120px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className={styles.loadingRow}>Загрузка...</td></tr>
            ) : complexityCases.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyRow}>
                  {filters.search || filters.case_type ? 'Ничего не найдено' : 'Нет дел'}
                </td>
              </tr>
            ) : (
              complexityCases.map(caseItem => (
                <tr key={caseItem.id}>
                  <td>
                    <input type="checkbox" name="case-select" value={caseItem.id} />
                  </td>
                  <td className={styles.caseNumber}>
                    {caseItem.case_number || caseItem.original_name || caseItem.id}
                  </td>
                  <td>
                    <span className={styles.caseTypeBadge}>
                      {caseItem.case_category === 'criminal' ? 'Уголовное' :
                       caseItem.case_category === 'civil' ? 'Гражданское' :
                       caseItem.case_category === 'coap' ? 'КоАП' :
                       caseItem.case_category === 'kas' ? 'КАС' : 'Прочие'}
                    </span>
                  </td>
                  <td>{caseItem.case_category_name || '-'}</td>
                  <td>
                    <div className={styles.complexityDisplay}>
                      <span 
                        className={styles.complexityBadge}
                        style={{ 
                          backgroundColor: `hsl(${220 - ((Number(caseItem.complexity) || 1) - 1) * 30}, 70%, ${60 - ((Number(caseItem.complexity) || 1) - 1) * 5}%)` 
                        }}
                      >
                        {caseItem.complexity || 1} ×
                      </span>
                      <span className={styles.complexityLabel}>
                        {getComplexityLabel(Number(caseItem.complexity) || 1)}
                      </span>
                    </div>
                  </td>
                  <td>
                    {caseItem.assigned_judge_name || caseItem.assigned_judge || '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => openComplexityEditor(caseItem)}
                      className={styles.editButton}
                    >
                      ✎ Изменить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Модалка изменения сложности */}
      {editingCase && (
        <div className={styles.modalOverlay} onClick={() => setEditingCase(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Изменение сложности дела</h2>
            <div className={styles.modalBody}>
              <p><strong>Дело:</strong> {editingCase.case_number || editingCase.original_name || editingCase.id}</p>
              <p><strong>Судья:</strong> {editingCase.assigned_judge_name || editingCase.assigned_judge || 'Не назначен'}</p>
              <div className={styles.field}>
                <label>Сложность (1-10)</label>
                <div className={styles.complexitySlider}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={complexityValue}
                    onChange={(e) => setComplexityValue(parseInt(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.sliderValue}>{complexityValue}</span>
                </div>
                <div className={styles.complexityHint}>
                  {complexityValue === 1 && 'Обычное дело (1x)'}
                  {complexityValue === 2 && 'Повышенная сложность (2x)'}
                  {complexityValue === 3 && 'Сложное дело (3x)'}
                  {complexityValue === 4 && 'Очень сложное дело (4x)'}
                  {complexityValue >= 5 && `Особо сложное дело (${complexityValue}x)`}
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setEditingCase(null)} className={styles.cancelButton}>
                Отмена
              </button>
              <button onClick={saveComplexity} className={styles.confirmButton}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplexitySettings;