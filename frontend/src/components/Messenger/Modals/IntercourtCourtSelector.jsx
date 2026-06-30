// communication-frontend/src/components/Messenger/Modals/IntercourtCourtSelector.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useMessenger } from '../context/MessengerContext';
import styles from './IntercourtCourtSelector.module.css';

const IntercourtCourtSelector = ({ onSelect, onClose }) => {
  const { searchIntercourtCourts, loadChats } = useMessenger();
  const [query, setQuery] = useState('');
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);

  const searchCourts = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setCourts([]);
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchIntercourtCourts(searchQuery);
      setCourts(results);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  }, [searchIntercourtCourts]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.length >= 2) {
        searchCourts(query);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query, searchCourts]);

  const handleSelect = (court) => {
    setSelectedCourt(court);
    onSelect(court);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Выберите суд для межсудебного чата</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите название суда или код..."
            autoFocus
          />
        </div>

        {loading && (
          <div className={styles.loading}>Поиск...</div>
        )}

        <div className={styles.courtList}>
          {courts.length === 0 && query.length >= 2 && !loading ? (
            <div className={styles.empty}>Суды не найдены</div>
          ) : (
            courts.map((court) => (
              <div
                key={court.id}
                className={`${styles.courtItem} ${selectedCourt?.id === court.id ? styles.selected : ''}`}
                onClick={() => handleSelect(court)}
              >
                <div className={styles.courtName}>{court.name_short || court.name}</div>
                <div className={styles.courtDetails}>
                  <span className={styles.courtCode}>Код: {court.code}</span>
                  <span className={styles.courtRegion}>Регион: {court.region || '—'}</span>
                  <span className={styles.courtLevel}>Уровень: {court.level || '—'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedCourt && (
          <div className={styles.footer}>
            <button 
              className={styles.selectBtn}
              onClick={() => onSelect(selectedCourt)}
            >
              Создать чат с {selectedCourt.name_short || selectedCourt.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntercourtCourtSelector;