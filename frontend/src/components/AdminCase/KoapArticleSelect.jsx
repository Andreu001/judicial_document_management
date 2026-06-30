// src/components/Administrative/KoapArticleSelect.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import PropTypes from 'prop-types';

const KoapArticleSelect = ({
  value,
  onChange,
  placeholder = 'Поиск статьи КоАП РФ...',
  isDisabled = false,
  isClearable = true,
  className = '',
  onPartSelect,
  onClauseSelect
}) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedClause, setSelectedClause] = useState(null);

  // Загрузка статей при поиске
  const loadArticles = useCallback(async (search = '') => {
    if (!search || search.length < 2) {
      setOptions([]);
      return;
    }

    try {
      setIsLoading(true);
      const articles = await AdministrativeCaseService.getKoapArticles(search);
      
      const formattedOptions = articles.map(article => ({
        value: article.id,
        label: `${article.display_name || `Ст. ${article.full_number}`} - ${article.title?.substring(0, 80)}${article.title?.length > 80 ? '...' : ''}`,
        article: article,
        full_number: article.full_number,
        title: article.title,
        structure: article.structure || { parts: [] }
      }));
      
      setOptions(formattedOptions);
    } catch (error) {
      console.error('Ошибка загрузки статей КоАП:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Обработка выбора статьи
  const handleArticleSelect = (selectedOption) => {
    setSelectedArticle(selectedOption);
    setSelectedPart(null);
    setSelectedClause(null);
    
    if (selectedOption) {
      // Возвращаем только ID статьи
      onChange(selectedOption.value);
      
      // Если передана функция для частей
      if (onPartSelect) {
        onPartSelect(selectedOption.article);
      }
    } else {
      onChange(null);
      if (onPartSelect) {
        onPartSelect(null);
      }
    }
  };

  // Обработка поиска при вводе
  const handleInputChange = (newValue) => {
    setInputValue(newValue);
    if (newValue.length >= 2) {
      const timeoutId = setTimeout(() => {
        loadArticles(newValue);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setOptions([]);
    }
  };

  // Загрузка статьи по ID при инициализации
  useEffect(() => {
    if (value && !selectedArticle) {
      const loadArticleById = async () => {
        try {
          const article = await AdministrativeCaseService.getKoapArticleById(value);
          if (article) {
            const formattedOption = {
              value: article.id,
              label: `${article.display_name || `Ст. ${article.full_number}`} - ${article.title?.substring(0, 80)}${article.title?.length > 80 ? '...' : ''}`,
              article: article,
              full_number: article.full_number,
              title: article.title,
              structure: article.structure || { parts: [] }
            };
            setSelectedArticle(formattedOption);
            if (onPartSelect) {
              onPartSelect(article);
            }
          }
        } catch (error) {
          console.error('Ошибка загрузки статьи по ID:', error);
        }
      };
      loadArticleById();
    }
  }, [value]);

  // Кастомный формат отображения выбранного значения
  const formatOptionLabel = (option) => (
    <div>
      <div style={{ fontWeight: 'bold' }}>
        {option.full_number}
      </div>
      <div style={{ fontSize: '0.85em', color: '#555' }}>
        {option.title}
      </div>
    </div>
  );

  // Кастомный стиль для Select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#2c3e50' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(44, 62, 80, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#a0aec0'
      },
      minHeight: '42px'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#2c3e50' : state.isFocused ? '#e9ecef' : 'white',
      color: state.isSelected ? 'white' : '#2c3e50',
      padding: '10px 12px',
      borderBottom: '1px solid #f0f0f0'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 999
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d'
    })
  };

  // Компонент для отображения частей статьи (если выбрана)
  const renderParts = () => {
    if (!selectedArticle) return null;
    
    const parts = selectedArticle.article?.structure?.parts || [];
    if (parts.length === 0) return null;

    return (
      <div style={{ marginTop: '12px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '13px', 
          fontWeight: '500', 
          color: '#6c757d', 
          marginBottom: '6px' 
        }}>
          Часть статьи
        </label>
        <Select
          value={selectedPart}
          onChange={(option) => {
            setSelectedPart(option);
            setSelectedClause(null);
            if (onClauseSelect) {
              onClauseSelect(option ? option.value : null);
            }
          }}
          options={parts.map(part => ({
            value: part.number,
            label: `Часть ${part.number}${part.clauses?.length ? ` (${part.clauses.length} пунктов)` : ''}`
          }))}
          placeholder="Выберите часть..."
          isClearable={isClearable}
          isDisabled={isDisabled}
          styles={customStyles}
        />
        
        {selectedPart && renderClauses()}
      </div>
    );
  };

  // Компонент для отображения пунктов части
  const renderClauses = () => {
    if (!selectedArticle || !selectedPart) return null;
    
    const parts = selectedArticle.article?.structure?.parts || [];
    const part = parts.find(p => String(p.number) === String(selectedPart.value));
    if (!part || !part.clauses || part.clauses.length === 0) return null;

    return (
      <div style={{ marginTop: '12px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '13px', 
          fontWeight: '500', 
          color: '#6c757d', 
          marginBottom: '6px' 
        }}>
          Пункт
        </label>
        <Select
          value={selectedClause}
          onChange={(option) => {
            setSelectedClause(option);
            if (onClauseSelect) {
              onClauseSelect(option ? option.value : null);
            }
          }}
          options={part.clauses.map(clause => ({
            value: clause,
            label: `п. ${clause}`
          }))}
          placeholder="Выберите пункт..."
          isClearable={isClearable}
          isDisabled={isDisabled}
          styles={customStyles}
        />
      </div>
    );
  };

  // Отображение выбранной статьи в компактном виде
  const renderSelectedInfo = () => {
    if (!selectedArticle) return null;
    
    let info = `${selectedArticle.full_number}`;
    if (selectedPart) {
      info += `, ч. ${selectedPart.value}`;
      if (selectedClause) {
        info += `, п. ${selectedClause.value}`;
      }
    }
    
    return (
      <div style={{ 
        marginTop: '8px', 
        fontSize: '13px', 
        color: '#2c3e50',
        background: '#f8f9fa',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #e9ecef'
      }}>
        <strong>Выбрано:</strong> {info}
      </div>
    );
  };

  return (
    <div className={className}>
      <Select
        value={selectedArticle}
        onChange={handleArticleSelect}
        onInputChange={handleInputChange}
        options={options}
        isLoading={isLoading}
        isDisabled={isDisabled}
        isClearable={isClearable}
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }) => {
          if (!inputValue || inputValue.length < 2) {
            return 'Введите минимум 2 символа для поиска';
          }
          return 'Статьи не найдены';
        }}
        loadingMessage={() => 'Поиск статей...'}
        formatOptionLabel={formatOptionLabel}
        styles={customStyles}
        menuPortalTarget={document.body}
      />
      
      {renderSelectedInfo()}
      {renderParts()}
    </div>
  );
};

KoapArticleSelect.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  isDisabled: PropTypes.bool,
  isClearable: PropTypes.bool,
  className: PropTypes.string,
  onPartSelect: PropTypes.func,
  onClauseSelect: PropTypes.func
};

export default KoapArticleSelect;