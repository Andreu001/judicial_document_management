// case_registry/frontend/components/CaseSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import baseService from '../../API/baseService';
import styles from './CaseSearch.module.css';

const CaseSearch = ({ value, onChange, onSelect, placeholder = 'Поиск дела по номеру...' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [error, setError] = useState(null);
  
  const searchTimeout = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const isSelectingRef = useRef(false); // Флаг для отслеживания процесса выбора

  // Инициализация при монтировании, если есть начальное значение
  useEffect(() => {
    if (value) {
      // Если есть value, но нет selectedCase, значит нужно загрузить информацию о деле
      // Но мы пока не реализуем эту логику
      console.log('Initial value:', value);
    }
  }, [value]);

  // Закрытие дропдауна при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCaseById = async (id) => {
    try {
      setError(null);
      // Здесь можно реализовать загрузку дела по ID, если нужно
      setSelectedCase(null);
      setQuery('');
    } catch (error) {
      console.error('Ошибка загрузки дела по ID:', error);
      setError('Не удалось загрузить информацию о деле');
    }
  };

  const searchCases = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Поиск дел по запросу:', searchQuery);
      const response = await baseService.get('/case-registry/search-cases/', {
        params: { q: searchQuery }
      });
      console.log('Результаты поиска:', response.data);
      setResults(response.data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Ошибка поиска дел:', error);
      setError('Ошибка при поиске. Попробуйте позже.');
      if (error.response) {
        console.error('Статус ошибки:', error.response.status);
        console.error('Данные ошибки:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Если мы в процессе выбора, не сбрасываем selectedCase и не вызываем onChange
    if (!isSelectingRef.current) {
      setSelectedCase(null);
      // Очищаем значение в родительском компоненте только если это не процесс выбора
      onChange('');
    }

    setError(null);

    // Дебаунс поиска
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (newQuery.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        searchCases(newQuery);
      }, 300);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectCase = (caseItem) => {
    // Устанавливаем флаг, что мы в процессе выбора
    isSelectingRef.current = true;
    
    console.log('Выбрано дело:', caseItem);
    setSelectedCase(caseItem);
    setQuery(caseItem.full_info);
    setShowDropdown(false);
    setError(null);
    
    // Передаем составной ID в формате "тип_дела:ID"
    const compositeId = `${caseItem.case_type}:${caseItem.id}`;
    onChange(compositeId);
    
    if (onSelect) {
      onSelect(caseItem);
    }
    
    // Сбрасываем флаг через небольшой таймаут, чтобы избежать конфликтов
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedCase(null);
    setError(null);
    onChange('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  };

  // Функция для получения цвета/стиля в зависимости от типа дела
  const getCaseTypeStyle = (caseType) => {
    switch(caseType) {
      case 'criminal': return styles.criminalType;
      case 'civil': return styles.civilType;
      case 'administrative': return styles.administrativeType;
      case 'kas': return styles.kasType;
      default: return '';
    }
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`${styles.searchInput} ${error ? styles.error : ''}`}
          autoComplete="off"
        />
        
        {loading && (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
          </div>
        )}
        
        {query && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            title="Очистить"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {results.map((caseItem, index) => (
            <div
              key={`${caseItem.case_type}-${caseItem.id}`}
              className={`${styles.dropdownItem} ${getCaseTypeStyle(caseItem.case_type)}`}
              onClick={() => handleSelectCase(caseItem)}
            >
              <div className={styles.caseNumber}>{caseItem.case_number}</div>
              <div className={styles.caseType}>{caseItem.case_type_label}</div>
            </div>
          ))}
        </div>
      )}

      {showDropdown && results.length === 0 && query.length >= 2 && !loading && !error && (
        <div className={styles.dropdown}>
          <div className={styles.noResults}>
            Ничего не найдено
          </div>
        </div>
      )}

      {selectedCase && (
        <div className={`${styles.selectedInfo} ${getCaseTypeStyle(selectedCase.case_type)}`}>
          <span className={styles.selectedLabel}>Выбрано:</span>
          <span className={styles.selectedValue}>
            {selectedCase.case_type_label} № {selectedCase.case_number}
          </span>
        </div>
      )}
    </div>
  );
};

export default CaseSearch;