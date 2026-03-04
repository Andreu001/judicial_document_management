import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchService from '../../API/SearchService'; // Импортируем SearchService
import PersonDetailsModal from './PersonDetailsModal';
import styles from './PersonSearch.module.css';

const PersonSearch = () => {
  const [activeTab, setActiveTab] = useState('physical'); // physical или legal
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Состояния для модального окна
  const [showPersonDetails, setShowPersonDetails] = useState(false);
  const [personDetails, setPersonDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Выполнение поиска
  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) {
      alert('Введите поисковый запрос');
      return;
    }
    
    setLoading(true);
    
    try {
      // Используем SearchService для поиска
      const persons = await SearchService.searchPersons(searchQuery, activeTab);
      setResults(persons);
      
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка подробной информации об участнике
  const handleViewPersonDetails = async (person) => {
    try {
      setLoadingDetails(true);
      
      // Здесь нужно получить реальные данные участника
      // Пока создаем заглушку на основе данных из поиска
      const mockPersonData = {
        person: {
          id: person.id,
          name: person.name,
          person_type: activeTab === 'physical' ? 'individual' : 'legal',
          phone: 'Не указан',
          address: 'Не указан',
          email: 'Не указан',
          ...(activeTab === 'physical' ? {
            birth_date: null,
            gender: 'Не указан',
            document_type: 'Не указан',
          } : {
            inn: 'Не указан',
            kpp: 'Не указан',
            ogrn: 'Не указан',
            director_name: 'Не указан',
            legal_address: 'Не указан',
          })
        },
        cases: [{
          id: person.case_id,
          case_type: person.case_type,
          case_number: person.case_number,
          role: person.role,
          status: 'active',
          incoming_date: null
        }]
      };
      
      setPersonDetails(mockPersonData);
      setShowPersonDetails(true);
    } catch (error) {
      console.error('Ошибка загрузки данных участника:', error);
      alert('Не удалось загрузить данные участника');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Поиск участников процессов</h1>
      </div>

      <div className={styles.searchSection}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchRow}>
            <input
              type="text"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите ФИО или название организации..."
              disabled={loading}
            />
            <button 
              type="submit" 
              className={styles.searchButton}
              disabled={loading}
            >
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </div>
          
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'physical' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('physical')}
            >
              Физические лица
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'legal' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('legal')}
            >
              Юридические лица
            </button>
          </div>
        </form>
      </div>

      {/* Результаты поиска */}
      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : results.length > 0 ? (
        <div className={styles.resultsSection}>
          <div className={styles.resultsCount}>
            Найдено участников: {results.length}
          </div>
          
          <div className={styles.resultsGrid}>
            {results.map((person, index) => (
              <div key={index} className={styles.personCard}>
                <div className={styles.personHeader}>
                  <h3 className={styles.personName}>{person.name}</h3>
                  <span className={`${styles.personType} ${styles[person.case_type]}`}>
                    {person.case_type === 'criminal' ? 'Уголовное' :
                     person.case_type === 'civil' ? 'Гражданское' :
                     person.case_type === 'administrative' ? 'КоАП' : 'КАС'}
                  </span>
                </div>
                
                <div className={styles.personInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Роль в деле:</span>
                    <span className={styles.infoValue}>{person.role}</span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Номер дела:</span>
                    <span className={styles.infoValue}>{person.case_number}</span>
                  </div>
                </div>
                
                <div className={styles.personActions}>
                  <button
                    className={styles.detailsButton}
                    onClick={() => handleViewPersonDetails(person)}
                    disabled={loadingDetails}
                  >
                    {loadingDetails ? '...' : 'Подробнее'}
                  </button>
                  
                 </div>
              </div>
            ))}
          </div>
        </div>
      ) : searchQuery && (
        <div className={styles.noResults}>
          По запросу «{searchQuery}» ничего не найдено
        </div>
      )}

      {/* Модальное окно с деталями участника */}
      {showPersonDetails && (
        <PersonDetailsModal 
          personData={personDetails}
          onClose={() => {
            setShowPersonDetails(false);
            setPersonDetails(null);
          }}
        />
      )}
    </div>
  );
};

export default PersonSearch;