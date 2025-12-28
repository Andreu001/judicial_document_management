import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import correspondenceService from '../../API/CorrespondenceService';
import styles from './Correspondence.module.css';

const CorrespondenceIn = () => {
  const [correspondence, setCorrespondence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  
  const navigate = useNavigate();
  const type = 'incoming';

  // Функция загрузки данных с мемоизацией
  const fetchCorrespondence = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      const params = {
        type: 'incoming',
        ...currentFilters
      };
      
      const data = await correspondenceService.getCorrespondence(params);
      setCorrespondence(data);
    } catch (error) {
      console.error('Ошибка загрузки входящей корреспонденции:', error);
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

  const handleAddNew = () => {
    navigate('/in/new');
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

  // Форматирование даты документа отправителя
  const formatSenderDocumentDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Входящая корреспонденция</h1>
        <div className={styles.headerActions}>
          <button onClick={handleAddNew} className={styles.addButtonIn}>
            + Добавить входящий документ
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          name="search"
          placeholder="Поиск по отправителю, номеру или содержанию..."
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
          <option value="received">Получено</option>
          <option value="registered">Зарегистрировано</option>
          <option value="processed">Обработано</option>
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

        {/* Добавляем кнопку применения фильтров */}
        <button onClick={handleApplyFilters} className={styles.applyButton}>
          Применить
        </button>

        <button onClick={handleResetFilters} className={styles.resetButton}>
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
                <th>Отправитель</th>
                <th>Исх. № отправителя</th>
                <th>Исх. дата отправителя</th>
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
                  <td>{item.sender}</td>
                  <td>
                    {item.number_sender_document ? (
                      <span className={styles.senderDocNumber}>
                        {item.number_sender_document}
                      </span>
                    ) : (
                      <span className={styles.emptyField}>-</span>
                    )}
                  </td>
                  <td>
                    {item.outgoing_date_document ? (
                      <span className={styles.senderDocDate}>
                        {formatSenderDocumentDate(item.outgoing_date_document)}
                      </span>
                    ) : (
                      <span className={styles.emptyField}>-</span>
                    )}
                  </td>
                  <td>{item.document_type}</td>
                  <td className={styles.summary}>{item.summary}</td>
                  <td>
                    <span className={`${styles.status} ${styles[item.status]}`}>
                      {item.status === 'received' ? 'Получено' : 
                       item.status === 'registered' ? 'Зарегистрировано' : 
                       item.status === 'processed' ? 'Обработано' : 'В архиве'}
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
          
          {correspondence.length === 0 && (
            <div className={styles.noData}>
              Нет данных о входящей корреспонденции
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CorrespondenceIn;
