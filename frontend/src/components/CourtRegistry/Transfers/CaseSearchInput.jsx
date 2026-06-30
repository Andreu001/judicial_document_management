// src/components/CaseSearchInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import baseService from '../../../API/baseService';

const CaseSearchInput = ({ 
  value, 
  onChange, 
  category, 
  placeholder = "Введите номер дела",
  onSelect 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // При изменении value обновляем query
  useEffect(() => {
    if (value && typeof value === 'string') {
      setQuery(value);
    }
  }, [value]);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Поиск дел
  const searchCases = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Определяем URL для поиска по категории
      let url;
      const categoryMap = {
        'criminal': '/criminal_proceedings/criminal-proceedings/',
        'civil': '/civil_proceedings/civil-proceedings/',
        'admin_code': '/administrative_code/administrative-proceedings/',
        'kas': '/administrative_proceedings/kas-proceedings/',
      };

      const baseUrl = categoryMap[category] || '/criminal_proceedings/criminal-proceedings/';
      
      // Поиск по номеру дела
      const response = await baseService.get(baseUrl, {
        params: {
          search: searchQuery,
          page_size: 10,
          status__in: ['active', 'completed'] // только активные и завершённые
        }
      });

      const results = response.data.results || response.data || [];
      
      // Форматируем результаты для отображения
      const formatted = results.map(item => {
        let numberField = '';
        let description = '';
        
        switch(category) {
          case 'criminal':
            numberField = item.case_number_criminal;
            description = `Уголовное дело №${numberField}`;
            break;
          case 'civil':
            numberField = item.case_number_civil;
            description = `Гражданское дело №${numberField}`;
            break;
          case 'admin_code':
            numberField = item.case_number_admin;
            description = `Дело об АП №${numberField}`;
            break;
          case 'kas':
            numberField = item.case_number_kas;
            description = `Дело КАС №${numberField}`;
            break;
          default:
            numberField = item.case_number || item.id;
            description = `Дело №${numberField}`;
        }

        let contentType = '';
        switch(category) {
        case 'criminal':
            contentType = 'criminal_proceedings.criminalproceedings';
            break;
        case 'civil':
            contentType = 'civil_proceedings.civilproceedings';
            break;
        case 'admin_code':
            contentType = 'administrative_code.administrativeproceedings';
            break;
        case 'kas':
            contentType = 'administrative_proceedings.kasproceedings';
            break;
        }

        // ВАЖНО: Проверьте, что ContentType с таким app_label и model существует в БД
        // Можно добавить проверку:
        console.log(`ContentType: ${contentType}, Object ID: ${item.id}`);

        return {
          id: item.id,
          number: numberField,
          description: description,
          content_type: contentType,
          object_id: item.id,
          full_data: item,
        };
      });

      setSuggestions(formatted);
    } catch (error) {
      console.error('Ошибка поиска дел:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    
    // Передаём значение в родительский компонент
    if (onChange) {
      onChange(val);
    }
    
    // Показываем dropdown при вводе
    if (val.length >= 2) {
      setShowDropdown(true);
      // Дебаунс для поиска
      clearTimeout(window._searchTimeout);
      window._searchTimeout = setTimeout(() => {
        searchCases(val);
      }, 300);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }
  };

  const handleSelect = (item) => {
    setQuery(item.number);
    setShowDropdown(false);
    setSuggestions([]);
    
    if (onSelect) {
      onSelect({
        case_number: item.number,
        content_type: item.content_type,
        object_id: item.object_id,
        case_id: item.id,
        description: item.description,
      });
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="cr-input"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        onFocus={() => {
          if (query.length >= 2) {
            setShowDropdown(true);
            searchCases(query);
          }
        }}
        style={{ width: '100%' }}
      />
      
      {loading && (
        <div style={{ 
          position: 'absolute', 
          right: 10, 
          top: '50%', 
          transform: 'translateY(-50%)',
          fontSize: 12,
          color: 'var(--cr-text-muted)'
        }}>
          Поиск...
        </div>
      )}
      
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: 250,
          overflowY: 'auto',
          background: 'white',
          border: '1px solid var(--cr-border)',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          marginTop: 4,
        }}>
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.15s',
                fontSize: 14,
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f7fa'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              <div style={{ fontWeight: 500 }}>{item.number}</div>
              <div style={{ fontSize: 12, color: 'var(--cr-text-muted)' }}>{item.description}</div>
            </div>
          ))}
        </div>
      )}
      
      {showDropdown && !loading && query.length >= 2 && suggestions.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          padding: '12px 14px',
          background: 'white',
          border: '1px solid var(--cr-border)',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          marginTop: 4,
          color: 'var(--cr-text-muted)',
          fontSize: 14,
        }}>
          Дела не найдены
        </div>
      )}
    </div>
  );
};

export default CaseSearchInput;