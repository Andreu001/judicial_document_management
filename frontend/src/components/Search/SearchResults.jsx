import React from 'react';
import SearchResultCard from './SearchResultCard';
import styles from './SearchResults.module.css';

const SearchResults = ({ results, query, onClose }) => {
  if (!results || results.length === 0) {
    return (
      <div className={styles.noResults}>
        <div className={styles.noResultsIcon}>🔍</div>
        <h3 className={styles.noResultsTitle}>Ничего не найдено</h3>
        <p className={styles.noResultsText}>
          По запросу «{query}» ничего не найдено.<br />
          Попробуйте изменить поисковый запрос.
        </p>
        <button className={styles.closeButton} onClick={onClose}>
          Закрыть
        </button>
      </div>
    );
  }

  // Группируем результаты по типу
  const groupedResults = results.reduce((acc, result) => {
    const type = result.case_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(result);
    return acc;
  }, {});

  const typeLabels = {
    criminal: 'Уголовные дела',
    civil: 'Гражданские дела',
    administrative: 'Административные правонарушения (КоАП)',
    kas: 'Административные дела (КАС)'
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Результаты поиска по запросу «{query}»
        </h2>
        <span className={styles.count}>Найдено: {results.length}</span>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div className={styles.results}>
        {Object.entries(groupedResults).map(([type, typeResults]) => (
          <div key={type} className={styles.typeGroup}>
            <h3 className={styles.typeTitle}>{typeLabels[type] || type}</h3>
            <div className={styles.typeResults}>
              {typeResults.map(result => (
                <SearchResultCard 
                  key={`${type}-${result.id}`} 
                  result={result} 
                  query={query}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;