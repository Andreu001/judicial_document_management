import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import baseService from '../../API/baseService';
import styles from './Correspondence.module.css';

const CorrespondenceOut = () => {
  const [correspondence, setCorrespondence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchCorrespondence();
  }, [filters]);

  const fetchCorrespondence = async () => {
    try {
      setLoading(true);
      const params = {
        type: 'outgoing',
        ...filters
      };
      
      const response = await baseService.get('/case_registry/correspondence/', { params });
      setCorrespondence(response.data);
    } catch (error) {
      console.error('Ошибка загрузки исходящей корреспонденции:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Исходящая корреспонденция</h1>
        <div className={styles.headerActions}>
          <Link to="/correspondence/out/new" className={styles.addButton}>
            + Создать исходящий документ
          </Link>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          name="search"
          placeholder="Поиск по получателю, номеру или содержанию..."
          value={filters.search}
          onChange={handleFilterChange}
          className={styles.searchInput}
        />
        
        <select 
          name="status" 
          value={filters.status} 
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="">Все статусы</option>
          <option value="registered">Зарегистрировано</option>
          <option value="sent">Отправлено</option>
          <option value="archived">В архиве</option>
        </select>

        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          className={styles.dateInput}
          placeholder="С даты"
        />

        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className={styles.dateInput}
          placeholder="По дату"
        />

        <button onClick={() => setFilters({})} className={styles.resetButton}>
          Сбросить фильтры
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Рег. номер</th>
                <th>Дата</th>
                <th>Получатель</th>
                <th>Тип документа</th>
                <th>Краткое содержание</th>
                <th>Статус</th>
                <th>Связанное дело</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {correspondence.map((item) => (
                <tr key={item.id}>
                  <td className={styles.regNumber}>
                    <strong>{item.registration_number}</strong>
                  </td>
                  <td>{new Date(item.registration_date).toLocaleDateString('ru-RU')}</td>
                  <td>{item.recipient}</td>
                  <td>{item.document_type}</td>
                  <td className={styles.summary}>{item.summary}</td>
                  <td>
                    <span className={`${styles.status} ${styles[item.status]}`}>
                      {item.status === 'registered' ? 'Зарегистрировано' : 
                       item.status === 'sent' ? 'Отправлено' : 'В архиве'}
                    </span>
                  </td>
                  <td>
                    {item.business_card_name ? (
                      <Link to={`/cards/${item.business_card}`}>
                        {item.business_card_name}
                      </Link>
                    ) : (
                      'Не связано'
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link 
                        to={`/correspondence/out/${item.id}`}
                        className={styles.viewButton}
                      >
                        Просмотр
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {correspondence.length === 0 && (
            <div className={styles.noData}>
              Нет данных об исходящей корреспонденции
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CorrespondenceOut;