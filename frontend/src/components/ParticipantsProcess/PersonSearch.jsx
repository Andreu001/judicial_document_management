import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import baseService from '../../API/baseService';
import styles from './PersonSearch.module.css';

const PersonSearch = () => {
  const [activeTab, setActiveTab] = useState('physical');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searchCount, setSearchCount] = useState(0);
  
  // Состояния для физических лиц
  const [physicalFilters, setPhysicalFilters] = useState({
    name: '',
    birthDateFrom: '',
    birthDateTo: '',
    gender: '',
    documentType: '',
    documentNumber: '',
    documentSeries: '',
    address: '',
    phone: '',
    email: ''
  });
  
  // Состояния для юридических лиц
  const [legalFilters, setLegalFilters] = useState({
    name: '',
    inn: '',
    kpp: '',
    ogrn: '',
    directorName: '',
    legalAddress: '',
    phone: '',
    email: ''
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1
  });

  // Опции для выбора
  const [genderOptions] = useState([
    { value: '', label: 'Все' },
    { value: 'male', label: 'Мужской' },
    { value: 'female', label: 'Женский' }
  ]);
  
  const [documentTypeOptions] = useState([
    { value: '', label: 'Все' },
    { value: 'passport', label: 'Паспорт РФ' },
    { value: 'foreign_passport', label: 'Загранпаспорт' },
    { value: 'birth_certificate', label: 'Свидетельство о рождении' },
    { value: 'driver_license', label: 'Водительское удостоверение' },
    { value: 'military_id', label: 'Военный билет' }
  ]);

  // Обработчики изменения фильтров для физических лиц
  const handlePhysicalFilterChange = (e) => {
    const { name, value } = e.target;
    setPhysicalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Обработчики изменения фильтров для юридических лиц
  const handleLegalFilterChange = (e) => {
    const { name, value } = e.target;
    setLegalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    if (activeTab === 'physical') {
      setPhysicalFilters({
        name: '',
        birthDateFrom: '',
        birthDateTo: '',
        gender: '',
        documentType: '',
        documentNumber: '',
        documentSeries: '',
        address: '',
        phone: '',
        email: ''
      });
    } else {
      setLegalFilters({
        name: '',
        inn: '',
        kpp: '',
        ogrn: '',
        directorName: '',
        legalAddress: '',
        phone: '',
        email: ''
      });
    }
  };

  // Выполнение поиска
  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    try {
        const endpoint = activeTab === 'physical' 
        ? '/businesscard/sidescaseincase/search/physical/'
        : '/businesscard/sidescaseincase/search/legal/';
      
      const filters = activeTab === 'physical' ? physicalFilters : legalFilters;
      
      // Очищаем пустые значения
      const cleanFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '') {
          cleanFilters[key] = filters[key];
        }
      });
      
      const params = {
        ...cleanFilters,
        page: pagination.currentPage,
        page_size: pagination.pageSize
      };
      
      const response = await baseService.get(endpoint, { params });
      
      if (response.data) {
        setResults(response.data.results || response.data);
        setSearchCount(response.data.count || response.data.length || 0);
        
        if (response.data.total_pages) {
          setPagination(prev => ({
            ...prev,
            totalPages: response.data.total_pages
          }));
        }
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setResults([]);
      setSearchCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Смена страницы
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  // Экспорт результатов
  const handleExport = async () => {
    try {
      const endpoint = activeTab === 'physical' 
        ? '/sidescaseincase/export/physical/' 
        : '/sidescaseincase/export/legal/';
      
      const filters = activeTab === 'physical' ? physicalFilters : legalFilters;
      
      const cleanFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '') {
          cleanFilters[key] = filters[key];
        }
      });
      
      const response = await baseService.get(endpoint, {
        params: cleanFilters,
        responseType: 'blob'
      });
      
      // Создаем ссылку для скачивания файла
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_persons_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Не удалось экспортировать данные');
    }
  };

  // Выполняем поиск при смене страницы
  useEffect(() => {
    if (pagination.currentPage > 1) {
      handleSearch();
    }
  }, [pagination.currentPage]);

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch (e) {
      return dateString;
    }
  };

  // Форматирование статуса лица
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'individual': return 'Физическое лицо';
      case 'legal': return 'Юридическое лицо';
      case 'government': return 'Орган власти';
      case 'other': return 'Иное';
      default: return status;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Поиск лиц</h1>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'physical' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('physical')}
          >
            Физические лица
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'legal' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('legal')}
          >
            Юридические лица
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* Форма поиска */}
          <div className={styles.searchSection}>
            <h2 className={styles.searchTitle}>
              {activeTab === 'physical' ? 'Поиск физических лиц' : 'Поиск юридических лиц'}
            </h2>
            
            <form onSubmit={handleSearch} className={styles.searchForm}>
              {activeTab === 'physical' ? (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>ФИО</label>
                      <input
                        type="text"
                        name="name"
                        value={physicalFilters.name}
                        onChange={handlePhysicalFilterChange}
                        placeholder="Введите ФИО"
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Дата рождения (с)</label>
                      <input
                        type="date"
                        name="birthDateFrom"
                        value={physicalFilters.birthDateFrom}
                        onChange={handlePhysicalFilterChange}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Дата рождения (по)</label>
                      <input
                        type="date"
                        name="birthDateTo"
                        value={physicalFilters.birthDateTo}
                        onChange={handlePhysicalFilterChange}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    
                    <div className={styles.formGroup}>
                      <label>Телефон</label>
                      <input
                        type="tel"
                        name="phone"
                        value={physicalFilters.phone}
                        onChange={handlePhysicalFilterChange}
                        placeholder="Введите номер телефона"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={physicalFilters.email}
                        onChange={handlePhysicalFilterChange}
                        placeholder="Введите email"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Наименование организации</label>
                      <input
                        type="text"
                        name="name"
                        value={legalFilters.name}
                        onChange={handleLegalFilterChange}
                        placeholder="Введите наименование"
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>ИНН</label>
                      <input
                        type="text"
                        name="inn"
                        value={legalFilters.inn}
                        onChange={handleLegalFilterChange}
                        placeholder="Введите ИНН"
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Юридический адрес</label>
                      <input
                        type="text"
                        name="legalAddress"
                        value={legalFilters.legalAddress}
                        onChange={handleLegalFilterChange}
                        placeholder="Введите юридический адрес"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Телефон</label>
                      <input
                        type="tel"
                        name="phone"
                        value={legalFilters.phone}
                        onChange={handleLegalFilterChange}
                        placeholder="Введите номер телефона"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className={styles.searchButtons}>
                <button 
                  type="submit" 
                  className={styles.searchButton}
                  disabled={loading}
                >
                  {loading ? 'Поиск...' : 'Найти'}
                </button>
                <button 
                  type="button" 
                  className={styles.resetButton}
                  onClick={handleResetFilters}
                >
                  Сбросить фильтры
                </button>
              </div>
            </form>
          </div>

          {/* Результаты поиска */}
          {loading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : results.length > 0 ? (
            <div className={styles.resultsSection}>
              <div className={styles.resultsHeader}>
                <div className={styles.resultsCount}>
                  Найдено записей: {searchCount}
                </div>
                <button 
                  onClick={handleExport}
                  className={styles.exportButton}
                >
                  Экспорт в Excel
                </button>
              </div>
              
              <div className={styles.resultsTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {activeTab === 'physical' ? (
                        <>
                          <th>ФИО</th>
                          <th>Дата рождения</th>
                          <th>Пол</th>
                          <th>Документ</th>
                          <th>Адрес</th>
                          <th>Телефон</th>
                          <th>Действия</th>
                        </>
                      ) : (
                        <>
                          <th>Наименование</th>
                          <th>ИНН/КПП</th>
                          <th>ОГРН</th>
                          <th>Руководитель</th>
                          <th>Адрес</th>
                          <th>Телефон</th>
                          <th>Действия</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((person) => (
                      <tr key={person.id}>
                        {activeTab === 'physical' ? (
                          <>
                            <td>
                              <span className={styles.personName}>
                                {person.name || 'Не указано'}
                              </span>
                            </td>
                            <td>{formatDate(person.birth_date)}</td>
                            <td>
                              {person.gender === 'male' ? 'Мужской' : 
                               person.gender === 'female' ? 'Женский' : 'Не указан'}
                            </td>
                            <td>
                              {person.document_type ? 
                                `${person.document_type} ${person.document_series || ''} ${person.document_number || ''}`.trim() 
                                : 'Не указано'
                              }
                            </td>
                            <td className={styles.personDetails}>
                              {person.address || 'Не указано'}
                            </td>
                            <td>{person.phone || 'Не указан'}</td>
                            <td>
                              <Link 
                                to={`/businesscard/${person.business_card}/sides/${person.id}`}
                                className={styles.viewButton}
                              >
                                Просмотр
                              </Link>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <span className={styles.personName}>
                                {person.name || 'Не указано'}
                              </span>
                            </td>
                            <td>
                              {person.inn ? `ИНН: ${person.inn}` : ''}
                              {person.kpp ? <br /> : ''}
                              {person.kpp ? `КПП: ${person.kpp}` : ''}
                            </td>
                            <td>{person.ogrn || 'Не указан'}</td>
                            <td>{person.director_name || 'Не указан'}</td>
                            <td className={styles.personDetails}>
                              {person.legal_address || person.address || 'Не указано'}
                            </td>
                            <td>{person.phone || 'Не указан'}</td>
                            <td>
                              <Link 
                                to={`/businesscard/${person.business_card}/sides/${person.id}`}
                                className={styles.viewButton}
                              >
                                Просмотр
                              </Link>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Пагинация */}
              {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    Назад
                  </button>
                  
                  <span className={styles.paginationInfo}>
                    Страница {pagination.currentPage} из {pagination.totalPages}
                  </span>
                  
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Вперед
                  </button>
                </div>
              )}
            </div>
          ) : searchCount === 0 && !loading ? (
            <div className={styles.noResults}>
              {searchCount === 0 && Object.values(activeTab === 'physical' ? physicalFilters : legalFilters).some(v => v !== '')
                ? 'По вашему запросу ничего не найдено'
                : 'Введите параметры поиска и нажмите "Найти"'}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PersonSearch;