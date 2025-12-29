import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import correspondenceService from '../../API/CorrespondenceService';
import styles from './Correspondence.module.css';
import InlineStatusEdit from './InlineStatusEdit';

const CorrespondenceOut = () => {
  const [correspondence, setCorrespondence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCorrespondence();
  }, [filters]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [id]: true }));
      await correspondenceService.updateStatus(id, newStatus);
      
      setCorrespondence(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
            : item
        )
      );
      
      const item = correspondence.find(c => c.id === id);
      console.log(`Статус документа ${item?.registration_number} изменен на: ${newStatus}`);
      
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Не удалось обновить статус');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  const fetchCorrespondence = async () => {
    try {
      setLoading(true);
        const params = {
          type: 'outgoing',
          status: filters.status,
          start_date: filters.startDate,
          end_date: filters.endDate,
          search: filters.search
        };

      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== '' && params[key] !== null) {
          cleanParams[key] = params[key];
        }
      });
      
      console.log('Параметры запроса:', cleanParams);
      
      const data = await correspondenceService.getCorrespondence(cleanParams);
      setCorrespondence(data);
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

  const handleResetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const handleAddNew = () => {
    navigate('/out/new');
  };

  const handleDelete = async (id, registrationNumber) => {
    if (window.confirm(`Вы уверены, что хотите удалить документ № ${registrationNumber}?`)) {
      try {
        await correspondenceService.delete(id);
        fetchCorrespondence();
      } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Не удалось удалить документ');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Исходящая корреспонденция</h1>
        <div className={styles.headerActions}>
          <button onClick={handleAddNew} className={styles.addButtonOut}>
            + Добавить исходящий документ
          </button>
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
                  <td>{item.recipient || 'Не указан'}</td>
                  <td>{item.document_type}</td>
                  <td className={styles.summary}>{item.summary}</td>
                  <td>
                    <InlineStatusEdit
                      currentStatus={item.status}
                      correspondenceType="outgoing"
                      onSave={(newStatus) => handleUpdateStatus(item.id, newStatus)}
                      disabled={updatingStatus[item.id]}
                    />
                  </td>
                  <td>
                    {item.business_card_name ? (
                      <Link to={`/businesscard/${item.business_card}/criminal-details/`}>
                        {item.business_card_name}
                      </Link>
                    ) : (
                      'Не связано'
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link 
                        to={`/out/${item.id}`}
                        className={styles.viewButton}
                      >
                        Просмотр
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.id, item.registration_number)}
                        className={styles.deleteButton}
                      >
                        Удалить
                      </button>
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