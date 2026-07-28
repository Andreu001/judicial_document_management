// src/components/AdminCase/KoapArticleSelector.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import styles from './KoapArticleSelector.module.css';

const KoapArticleSelector = ({ 
  value, 
  onChange, 
  onPartChange, 
  partValue,
  onClausesChange,
  clausesValue,
  label = "Статья КоАП РФ",
  required = false,
  disabled = false,
  showPartSelector = true,
  showClausesSelector = true,
  onClear = null
}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [availableParts, setAvailableParts] = useState([]);
  const [availableClauses, setAvailableClauses] = useState([]);
  const dropdownRef = useRef(null);
  const isInternalUpdate = useRef(false);

  // Загрузка списка статей
  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdministrativeCaseService.getKoapArticles();
      setArticles(data);
    } catch (error) {
      console.error('Error loading KoAP articles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Поиск статей
  const searchArticles = useCallback(async () => {
    if (!searchTerm.trim()) {
      loadArticles();
      return;
    }
    setLoading(true);
    try {
      const data = await AdministrativeCaseService.getKoapArticles(searchTerm);
      setArticles(data);
    } catch (error) {
      console.error('Error searching KoAP articles:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, loadArticles]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchArticles();
      } else {
        loadArticles();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchArticles, loadArticles]);

  // Закрытие дропдауна при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // При изменении выбранной статьи обновляем части
  useEffect(() => {
    if (value && articles.length > 0) {
      const article = articles.find(a => a.id === Number(value));
      setSelectedArticle(article);
      if (article && article.structure && article.structure.parts) {
        setAvailableParts(article.structure.parts);
      } else {
        setAvailableParts([]);
      }
    } else {
      setSelectedArticle(null);
      setAvailableParts([]);
      setAvailableClauses([]);
    }
  }, [value, articles]);

  // При изменении части обновляем пункты
  useEffect(() => {
    if (partValue && selectedArticle && selectedArticle.structure && selectedArticle.structure.parts) {
      const part = selectedArticle.structure.parts.find(p => String(p.number) === String(partValue));
      if (part && part.clauses && part.clauses.length > 0) {
        setAvailableClauses(part.clauses);
      } else {
        setAvailableClauses([]);
      }
    } else {
      setAvailableClauses([]);
    }
  }, [partValue, selectedArticle]);

  const handleArticleSelect = (article) => {
    if (!article) {
      isInternalUpdate.current = true;
      setSelectedArticle(null);
      onChange(null);
      if (onPartChange) onPartChange('');
      if (onClausesChange) onClausesChange([]);
      setIsDropdownOpen(false);
      setSearchTerm('');
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 100);
      return;
    }
    
    isInternalUpdate.current = true;
    setSelectedArticle(article);
    // Передаем ТОЛЬКО ID, а не весь объект
    onChange(article.id);
    if (onPartChange) onPartChange('');
    if (onClausesChange) onClausesChange([]);
    setIsDropdownOpen(false);
    setSearchTerm('');
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 100);
  };

  const handleClearArticle = () => {
    isInternalUpdate.current = true;
    setSelectedArticle(null);
    onChange(null);
    if (onPartChange) onPartChange('');
    if (onClausesChange) onClausesChange([]);
    if (onClear) onClear();
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 100);
  };

  const getDisplayText = () => {
    if (selectedArticle) {
      return `Ст. ${selectedArticle.full_number} - ${selectedArticle.title?.slice(0, 60) || ''}`;
    }
    return '';
  };

  // Обработчик выбора пунктов (множественный выбор)
  const handleClauseToggle = (clause) => {
    if (!onClausesChange) return;
    let currentClauses = [];
    if (Array.isArray(clausesValue)) {
      currentClauses = [...clausesValue];
    } else if (clausesValue && typeof clausesValue === 'string') {
      currentClauses = clausesValue.split(',').map(c => c.trim()).filter(c => c);
    }
    if (currentClauses.includes(clause)) {
      onClausesChange(currentClauses.filter(c => c !== clause));
    } else {
      onClausesChange([...currentClauses, clause]);
    }
  };

  const getClausesDisplayText = () => {
    if (!clausesValue) return '';
    if (Array.isArray(clausesValue) && clausesValue.length > 0) {
      return `Выбраны пункты: ${clausesValue.join(', ')}`;
    }
    if (typeof clausesValue === 'string' && clausesValue) {
      return `Выбраны пункты: ${clausesValue}`;
    }
    return '';
  };

  const getClausesArray = () => {
    if (!clausesValue) return [];
    if (Array.isArray(clausesValue)) return clausesValue;
    if (typeof clausesValue === 'string') {
      return clausesValue.split(',').map(c => c.trim()).filter(c => c);
    }
    return [];
  };

  return (
    <div className={styles.articleSelector} ref={dropdownRef}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      
      <div className={styles.selectContainer}>
        <div 
          className={`${styles.selectedValue} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className={getDisplayText() ? styles.selectedText : styles.placeholderText}>
            {getDisplayText() || 'Выберите статью'}
          </span>
          <div className={styles.rightButtons}>
            {selectedArticle && !disabled && (
              <button 
                type="button" 
                className={styles.clearButton}
                onClick={(e) => { e.stopPropagation(); handleClearArticle(); }}
                title="Очистить"
              >
                ×
              </button>
            )}
            <span className={styles.arrow}>{isDropdownOpen ? '▲' : '▼'}</span>
          </div>
        </div>
        
        {isDropdownOpen && !disabled && (
          <div className={styles.dropdown}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Поиск по номеру или названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                autoFocus
              />
            </div>
            <div className={styles.dropdownList}>
              {loading ? (
                <div className={styles.loadingItem}>Загрузка...</div>
              ) : articles.length === 0 ? (
                <div className={styles.emptyItem}>Ничего не найдено</div>
              ) : (
                articles.map(article => (
                  <div
                    key={article.id}
                    className={`${styles.dropdownItem} ${Number(value) === article.id ? styles.selected : ''}`}
                    onClick={() => handleArticleSelect(article)}
                  >
                    <span className={styles.articleNumber}>Ст. {article.full_number}</span>
                    <span className={styles.articleTitle}>
                      {article.title?.slice(0, 60) || ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {showPartSelector && availableParts.length > 0 && selectedArticle && (
        <div className={styles.partSelector}>
          <label className={styles.subLabel}>Часть статьи</label>
          <select
            value={partValue || ''}
            onChange={(e) => onPartChange && onPartChange(e.target.value)}
            className={styles.select}
            disabled={disabled}
          >
            <option value="">Выберите часть</option>
            {availableParts.map((part, idx) => (
              <option key={`${selectedArticle?.id || 'article'}-part-${part.number}-${idx}`} value={part.number}>
                Часть {part.number}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {showClausesSelector && availableClauses.length > 0 && partValue && (
        <div className={styles.clausesSelector}>
          <label className={styles.subLabel}>Пункты</label>
          <div className={styles.clausesGrid}>
            {availableClauses.map((clause, idx) => {
              const clausesArray = getClausesArray();
              const isSelected = clausesArray.includes(clause);
              const uniqueKey = `${selectedArticle?.id || 'article'}-part-${partValue}-clause-${clause}-${idx}`;
              return (
                <label key={uniqueKey} className={styles.clauseCheckbox}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleClauseToggle(clause)}
                    disabled={disabled}
                  />
                  <span className={styles.clauseLabel}>{clause}</span>
                </label>
              );
            })}
          </div>
          {getClausesDisplayText() && (
            <div className={styles.selectedClausesInfo}>{getClausesDisplayText()}</div>
          )}
          <input
            type="text"
            placeholder="Или введите вручную через запятую"
            value={getClausesArray().join(',')}
            onChange={(e) => {
              const val = e.target.value;
              if (onClausesChange) {
                if (val.trim() === '') {
                  onClausesChange([]);
                } else {
                  const clauses = val.split(',').map(c => c.trim()).filter(c => c);
                  onClausesChange(clauses);
                }
              }
            }}
            className={styles.clausesInput}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

export default KoapArticleSelector;