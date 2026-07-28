// src/components/CaseDistribution/DistributionList.jsx - ИСПРАВЛЕННЫЙ

import React, { useState, useEffect } from 'react';
import styles from './CaseDistribution.module.css';
import CaseDistributionService from '../../API/CaseDistributionService';

const DistributionList = ({
  cases,
  judges,
  collegiums,
  rules,
  loading,
  selectedCases,
  setSelectedCases,
  filters,
  setFilters,
  onAutoDistribute,
  onManualAssign,
  onReassign,
  onSetComplexity,
  onCaseClick,
  onDistributeWithRules,
  onDistributeByCollegium
}) => {
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [selectedCollegiumId, setSelectedCollegiumId] = useState('');
  const [selectedJudgeFilter, setSelectedJudgeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Поиск при изменении фильтра поиска с debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 400);
    
    return () => clearTimeout(timer);
  }, [filters.search, filters.case_type, filters.status, selectedJudgeFilter, dateFrom, dateTo]);

  const performSearch = async () => {
    // Если нет поисковых параметров, показываем обычный список
    const hasSearchParams = filters.search || filters.case_type || filters.status || 
                           selectedJudgeFilter || dateFrom || dateTo;
    
    if (!hasSearchParams) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      
      const params = {
        search: filters.search || '',
        case_type: filters.case_type || '',
        status: filters.status || '',
        judge_id: selectedJudgeFilter || '',
        date_from: dateFrom || '',
        date_to: dateTo || '',
        show_all: true
      };
      
      const response = await CaseDistributionService.searchCases(params);
      let results = response.results || response || [];
      
      setSearchResults(results);
      setIsSearching(true);
    } catch (error) {
      console.error('Ошибка поиска:', error);
      // При ошибке API пробуем локальную фильтрацию через getAllCases
      try {
        const allCases = await CaseDistributionService.getAllCases({ show_all: true });
        let filtered = [...allCases];
        
        if (filters.search) {
          const query = filters.search.toLowerCase();
          filtered = filtered.filter(c => 
            c.case_number && c.case_number.toLowerCase().includes(query)
          );
        }
        if (filters.case_type) {
          filtered = filtered.filter(c => c.case_category === filters.case_type);
        }
        if (filters.status === 'pending') {
          filtered = filtered.filter(c => !c.assigned_judge);
        } else if (filters.status === 'distributed') {
          filtered = filtered.filter(c => c.assigned_judge);
        }
        if (selectedJudgeFilter) {
          filtered = filtered.filter(c => c.assigned_judge_id === parseInt(selectedJudgeFilter));
        }
        
        setSearchResults(filtered);
        setIsSearching(true);
      } catch (e) {
        console.error('Локальный поиск не удался:', e);
        setSearchResults([]);
        setIsSearching(false);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    const currentCases = isSearching ? searchResults : cases;
    if (e.target.checked) {
      setSelectedCases(currentCases.map(c => c.id));
    } else {
      setSelectedCases([]);
    }
  };

  const handleSelectCase = (caseId) => {
    if (selectedCases.includes(caseId)) {
      setSelectedCases(selectedCases.filter(id => id !== caseId));
    } else {
      setSelectedCases([...selectedCases, caseId]);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleManualAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJudgeId) {
      alert('Выберите судью');
      return;
    }
    
    setAssignLoading(true);
    try {
      await onManualAssign(selectedCaseId, selectedJudgeId, assignReason);
      setShowManualAssign(false);
      setSelectedCaseId(null);
      setSelectedJudgeId('');
      setAssignReason('');
      performSearch();
    } catch (error) {
      alert('Ошибка назначения судьи');
    } finally {
      setAssignLoading(false);
    }
  };

  const openManualAssign = (caseId) => {
    setSelectedCaseId(caseId);
    setShowManualAssign(true);
  };

  const getCaseTypeLabel = (caseData) => {
    const category = caseData.case_category || '';
    const typeMap = {
      'criminal': 'Уголовное',
      'civil': 'Гражданское',
      'coap': 'Административное',
      'kas': 'КАС РФ',
      'other': 'Прочие',
    };
    if (typeMap[category]) return typeMap[category];
    const number = caseData.case_number || '';
    if (number.includes('угол') || number.includes('Угол')) return 'Уголовное';
    if (number.includes('гражд') || number.includes('Гражд')) return 'Гражданское';
    if (number.includes('АП') || number.includes('админ')) return 'Административное';
    if (number.includes('КАС') || number.includes('кас')) return 'КАС РФ';
    return 'Не определено';
  };

  const getCaseStatusLabel = (caseItem) => {
    const hasJudge = !!caseItem.assigned_judge;
    if (hasJudge) return 'Назначено';
    return 'Ожидает распределения';
  };

  const getCaseStatusColor = (caseItem) => {
    const hasJudge = !!caseItem.assigned_judge;
    if (hasJudge) return '#68d391';
    return '#f6ad55';
  };

  const handleDistributeWithRules = () => {
    if (selectedCases.length === 0) {
      alert('Выберите хотя бы одно дело');
      return;
    }
    if (!selectedRuleId) {
      alert('Выберите правило для распределения');
      return;
    }
    onDistributeWithRules(selectedCases, selectedRuleId);
  };

  const handleDistributeByCollegium = () => {
    if (selectedCases.length === 0) {
      alert('Выберите хотя бы одно дело');
      return;
    }
    if (!selectedCollegiumId) {
      alert('Выберите коллегию для распределения');
      return;
    }
    onDistributeByCollegium(selectedCases, selectedCollegiumId);
  };

  // Определяем, какие дела показывать
  const displayCases = isSearching ? searchResults : cases;

  return (
    <div className={styles.distributionList}>
      {/* Фильтры */}
      <div className={styles.filtersBar}>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Поиск по номеру дела..."
          className={styles.searchInput}
        />
        <button 
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          className={styles.filterButton}
          style={{ background: showAdvancedSearch ? '#2e86ab' : '#718096' }}
        >
          {showAdvancedSearch ? 'Скрыть расширенный поиск' : 'Расширенный поиск'}
        </button>
        <select
          name="case_type"
          value={filters.case_type}
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="">Все типы дел</option>
          <option value="criminal">Уголовные</option>
          <option value="civil">Гражданские</option>
          <option value="coap">Административные (КоАП)</option>
          <option value="kas">КАС</option>
          <option value="other">Прочие</option>
        </select>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидают</option>
          <option value="distributed">Назначены</option>
        </select>
        <button
          onClick={() => {
            if (selectedCases.length === 0) {
              alert('Выберите хотя бы одно дело');
              return;
            }
            onAutoDistribute(selectedCases);
          }}
          className={styles.distributeSelectedButton}
          disabled={loading || selectedCases.length === 0}
        >
          {loading ? 'Распределение...' : `Распределить выбранные (${selectedCases.length})`}
        </button>
        <button
          onClick={() => onAutoDistribute(null)}
          className={styles.distributeButton}
          disabled={loading || cases.length === 0}
        >
          {loading ? 'Распределение...' : 'Распределить все (без судьи)'}
        </button>
        <span className={styles.casesCount}>
          {isSearching ? `Найдено: ${displayCases.length}` : `Всего: ${displayCases.length}`}
        </span>
      </div>

      {/* Расширенный поиск */}
      {showAdvancedSearch && (
        <div className={styles.advancedSearch}>
          <div className={styles.advancedSearchRow}>
            <div className={styles.field}>
              <label>Дата от</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.field}>
              <label>Дата до</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.field}>
              <label>Судья</label>
              <select
                value={selectedJudgeFilter}
                onChange={(e) => setSelectedJudgeFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Все судьи</option>
                {judges.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.full_name || j.username}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={performSearch} className={styles.filterButton}>
              Поиск
            </button>
            <button onClick={() => {
              setDateFrom('');
              setDateTo('');
              setSelectedJudgeFilter('');
              setFilters(prev => ({ ...prev, search: '', case_type: '', status: '' }));
              setIsSearching(false);
              setSearchResults([]);
            }} className={styles.filterButton} style={{ background: '#718096' }}>
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Распределение с правилами и коллегиями */}
      <div className={styles.distributeOptions}>
        <div className={styles.distributeOptionGroup}>
          <label>Распределить с правилом:</label>
          <select
            value={selectedRuleId}
            onChange={(e) => setSelectedRuleId(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Выберите правило</option>
            {rules.map(rule => (
              <option key={rule.id} value={rule.id}>
                {rule.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleDistributeWithRules}
            className={styles.distributeButton}
            disabled={loading || selectedCases.length === 0 || !selectedRuleId}
          >
            Применить
          </button>
        </div>
        <div className={styles.distributeOptionGroup}>
          <label>Распределить по коллегии:</label>
          <select
            value={selectedCollegiumId}
            onChange={(e) => setSelectedCollegiumId(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Выберите коллегию</option>
            {collegiums.map(col => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleDistributeByCollegium}
            className={styles.distributeButton}
            disabled={loading || selectedCases.length === 0 || !selectedCollegiumId}
          >
            Применить
          </button>
        </div>
      </div>

      {/* Таблица */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedCases.length === displayCases.length && displayCases.length > 0}
                />
              </th>
              <th>№ дела</th>
              <th>Тип</th>
              <th>Категория</th>
              <th>Сложность</th>
              <th>Судья</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {searchLoading || loading ? (
              <tr>
                <td colSpan="8" className={styles.loadingRow}>Загрузка...</td>
              </tr>
            ) : displayCases.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.emptyRow}>
                  {isSearching ? 'Ничего не найдено' : 'Нет дел для распределения'}
                </td>
              </tr>
            ) : (
              displayCases.map(caseItem => (
                <tr key={caseItem.id} className={styles.caseRow}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedCases.includes(caseItem.id)}
                      onChange={() => handleSelectCase(caseItem.id)}
                    />
                  </td>
                  <td 
                    className={styles.caseNumber}
                    onClick={() => onCaseClick(caseItem.id)}
                  >
                    {caseItem.case_number || caseItem.original_name || caseItem.id}
                  </td>
                  <td>
                    <span className={styles.caseTypeBadge}>
                      {getCaseTypeLabel(caseItem)}
                    </span>
                  </td>
                  <td>{caseItem.case_category_name || '-'}</td>
                  <td>
                    <div className={styles.complexityControl}>
                      <span className={styles.complexityValue}>
                        {caseItem.complexity || 1}
                      </span>
                      <button
                        onClick={() => {
                          const newVal = prompt('Введите сложность (1-10):', caseItem.complexity || 1);
                          if (newVal && !isNaN(newVal) && newVal >= 1 && newVal <= 10) {
                            onSetComplexity(caseItem.id, parseInt(newVal));
                          }
                        }}
                        className={styles.complexityButton}
                        title="Изменить сложность"
                      >
                        ✎
                      </button>
                    </div>
                  </td>
                  <td>
                    {caseItem.assigned_judge ? (
                      <span className={styles.judgeAssigned}>
                        {caseItem.assigned_judge_name || caseItem.assigned_judge}
                        <button
                          onClick={() => onReassign(caseItem.id)}
                          className={styles.reassignButton}
                          title="Перераспределить"
                        >
                          ↻
                        </button>
                      </span>
                    ) : (
                      <span className={styles.noJudge}>Не назначен</span>
                    )}
                  </td>
                  <td>
                    <span 
                      className={styles.statusBadge}
                      style={{ 
                        backgroundColor: getCaseStatusColor(caseItem)
                      }}
                    >
                      {getCaseStatusLabel(caseItem)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {!caseItem.assigned_judge && (
                        <button
                          onClick={() => openManualAssign(caseItem.id)}
                          className={styles.assignButton}
                          title="Назначить судью"
                        >
                          Назначить
                        </button>
                      )}
                      {caseItem.assigned_judge && (
                        <button
                          onClick={() => onReassign(caseItem.id)}
                          className={styles.reassignButton}
                          title="Перераспределить"
                        >
                          Перераспределить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Модалка ручного назначения */}
      {showManualAssign && (
        <div className={styles.modalOverlay} onClick={() => setShowManualAssign(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Ручное назначение судьи</h2>
            <form onSubmit={handleManualAssignSubmit}>
              <div className={styles.field}>
                <label>Выберите судью *</label>
                <select
                  value={selectedJudgeId}
                  onChange={(e) => setSelectedJudgeId(e.target.value)}
                  required
                >
                  <option value="">Выберите судью</option>
                  {judges.map(judge => (
                    <option key={judge.id} value={judge.id}>
                      {judge.full_name || judge.username}
                      {judge.current_load !== undefined && ` (нагрузка: ${judge.current_load})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Причина назначения</label>
                <input
                  type="text"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="Причина назначения (опционально)"
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowManualAssign(false)} className={styles.cancelButton}>
                  Отмена
                </button>
                <button type="submit" className={styles.confirmButton} disabled={assignLoading}>
                  {assignLoading ? 'Сохранение...' : 'Назначить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionList;