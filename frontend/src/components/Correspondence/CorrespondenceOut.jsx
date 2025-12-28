import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import correspondenceService from '../../API/CorrespondenceService';
import styles from './Correspondence.module.css';

const CorrespondenceOut = () => {
  const [correspondence, setCorrespondence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  
  const type = 'outgoing';
  // Функция загрузки данных с мемоизацией
  const fetchCorrespondence = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        type: 'outgoing',
        ...currentFilters
      };
      
      // Используем метод getCorrespondence из CorrespondenceService
      const data = await correspondenceService.getCorrespondence(params);
      setCorrespondence(data || []); // Добавляем fallback на пустой массив
    } catch (error) {
      console.error('Ошибка загрузки исходящей корреспонденции:', error);
      setError('Не удалось загрузить данные');
      setCorrespondence([]); // Устанавливаем пустой массив при ошибке
    } finally {
      setLoading(false);
    }
  }, []);

    const handleDelete = async (id) => {
      if (!window.confirm('Вы уверены, что хотите удалить этот документ?')) {
        return;
      }
    
      try {
        setDeletingId(id);
        await correspondenceService.deleteCorrespondence(id);
        // Обновляем список после удаления
        fetchCorrespondence(filters);
        alert('Документ успешно удален');
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Не удалось удалить документ');
      } finally {
        setDeletingId(null);
      }
    };

  // Основной эффект для загрузки данных при монтировании
  useEffect(() => {
    fetchCorrespondence(filters);
  }, [fetchCorrespondence]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Кнопка для применения фильтров
  const handleApplyFilters = () => {
    fetchCorrespondence(filters);
  };

  // Сброс фильтров с обновлением данных
  const handleResetFilters = () => {
    const resetFilters = {
      status: '',
      start_date: '',
      end_date: '',
      search: ''
    };
    setFilters(resetFilters);
    fetchCorrespondence(resetFilters);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Исходящая корреспонденция</h1>
        <div className={styles.headerActions}>
          <Link to="/out/new" className={styles.addButtonOut}>
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
          name="start_date"
          value={filters.start_date}
          onChange={handleFilterChange}
          className={styles.dateInput}
          placeholder="С даты"
        />

        <input
          type="date"
          name="end_date"
          value={filters.end_date}
          onChange={handleFilterChange}
          className={styles.dateInput}
          placeholder="По дату"
        />

        <button onClick={handleApplyFilters} className={styles.applyButton}>
          Применить фильтры
        </button>

        <button onClick={handleResetFilters} className={styles.resetButton}>
          Сбросить фильтры
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

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
              {Array.isArray(correspondence) && correspondence.map((item) => (
                <tr key={item.id}>
                  <td className={styles.regNumber}>
                    <strong>{item.registration_number}</strong>
                  </td>
                  <td>{item.registration_date ? new Date(item.registration_date).toLocaleDateString('ru-RU') : ''}</td>
                  <td>{item.recipient || ''}</td>
                  <td>{item.document_type || ''}</td>
                  <td className={styles.summary}>{item.summary || ''}</td>
                  <td>
                    <span className={`${styles.status} ${styles[item.status] || ''}`}>
                      {item.status === 'registered' ? 'Зарегистрировано' : 
                       item.status === 'sent' ? 'Отправлено' : 'В архиве'}
                    </span>
                  </td>
                  <td>
                    {item.business_card && item.business_card_name ? (
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
                        to={`/correspondence/${type === 'incoming' ? 'in' : 'out'}/${item.id}`}
                        className={styles.viewButton}
                      >
                        Просмотр
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className={styles.deleteButton}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? 'Удаление...' : 'Удалить'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!Array.isArray(correspondence) || correspondence.length === 0) && !loading && (
            <div className={styles.noData}>
              {error ? 'Произошла ошибка при загрузке данных' : 'Нет данных об исходящей корреспонденции'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CorrespondenceOut;
