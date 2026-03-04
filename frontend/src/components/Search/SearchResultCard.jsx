import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchResultCard.module.css';

const SearchResultCard = ({ result, query }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Перенаправляем на соответствующую страницу деталей дела
    if (result.case_type === 'criminal') {
      navigate(`/criminal-proceedings/${result.id}`);
    } else if (result.case_type === 'civil') {
      navigate(`/civil-proceedings/${result.id}`);
    } else if (result.case_type === 'administrative') {
      navigate(`/admin-proceedings/${result.id}`);
    } else if (result.case_type === 'kas') {
      navigate(`/kas-proceedings/${result.id}`);
    }
  };

  // Функция для подсветки текста
  const highlightText = (text, query) => {
    if (!text || !query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={index} className={styles.highlight}>{part}</mark> : 
        part
    );
  };

  // Получаем статус на русском
  const getStatusText = (status) => {
    const statusMap = {
      'active': 'Активное',
      'completed': 'Рассмотрено',
      'execution': 'На исполнении',
      'archived': 'В архиве'
    };
    return statusMap[status] || status;
  };

  // Получаем цвет статуса
  const getStatusColor = (status) => {
    const colorMap = {
      'active': '#2f855a',
      'completed': '#3182ce',
      'execution': '#dd6b20',
      'archived': '#718096'
    };
    return colorMap[status] || '#718096';
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.cardHeader}>
        <span className={styles.cardType} data-type={result.case_type}>
          {result.case_type_label}
        </span>
        <span 
          className={styles.cardStatus}
          style={{ backgroundColor: getStatusColor(result.status) }}
        >
          {getStatusText(result.status)}
        </span>
      </div>
      
      <div className={styles.cardBody}>
        <div className={styles.caseNumber}>
          {highlightText(result.case_number, query)}
        </div>
        
        {result.sides && result.sides.length > 0 && (
          <div className={styles.sides}>
            <div className={styles.sidesTitle}>Стороны:</div>
            <div className={styles.sidesList}>
              {result.sides.map((side, index) => (
                <div key={index} className={styles.sideItem}>
                  <span className={styles.sideRole}>{side.role}:</span>
                  <span className={styles.sideName}>
                    {highlightText(side.name, query)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className={styles.cardFooter}>
          <div className={styles.cardDate}>
            {result.incoming_date ? 
              new Date(result.incoming_date).toLocaleDateString('ru-RU') : 
              'Дата не указана'}
          </div>
          {result.highlight?.sides && (
            <div className={styles.matchBadge}>
              Совпадение по сторонам
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultCard;