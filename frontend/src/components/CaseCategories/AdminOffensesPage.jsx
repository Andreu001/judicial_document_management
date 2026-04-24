import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import styles from './CasesPages.module.css';

const AdminOffensesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [offenseTypeFilter, setOffenseTypeFilter] = useState('all');

  useEffect(() => {
    fetchCases();
  }, [filterStatus, offenseTypeFilter]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      let data;
      if (filterStatus === 'archived') {
        data = await AdministrativeCaseService.getArchivedProceedings();
      } else {
        data = await AdministrativeCaseService.getAllAdministrativeProceedings();
        if (filterStatus === 'active') {
          data = data.filter(c => !c.is_archived);
        }
      }
      
      // Фильтрация по типу правонарушения (индексы 5 и 12)
      if (offenseTypeFilter === 'original') {
        data = data.filter(c => c.registry_index === '5' || c.offense_type === '5');
      } else if (offenseTypeFilter === 'complaint') {
        data = data.filter(c => c.registry_index === '12' || c.offense_type === '12');
      }
      
      setCases(data);
    } catch (error) {
      console.error('Error fetching admin offenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (id) => {
    navigate(`/admin-proceedings/${id}`);
  };

  const filteredCases = cases.filter(offense => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (offense.case_number_admin?.toLowerCase().includes(searchLower) ||
       offense.offense_description?.toLowerCase().includes(searchLower) ||
       offense.violator_name?.toLowerCase().includes(searchLower) ||
       offense.judge?.full_name?.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadge = (offense) => {
    if (offense.is_archived) return <span className={styles.badgeArchived}>В архиве</span>;
    if (offense.status === 'completed') return <span className={styles.badgeCompleted}>Завершено</span>;
    if (offense.status === 'in_progress') return <span className={styles.badgeInProgress}>В производстве</span>;
    return <span className={styles.badgePending}>На рассмотрении</span>;
  };

  const getOffenseTypeLabel = (offense) => {
    const type = offense.registry_index || offense.offense_type;
    if (type === '5') return <span className={styles.badgeOriginal}>Дело об АП</span>;
    if (type === '12') return <span className={styles.badgeComplaint}>Жалоба на постановление</span>;
    return <span className={styles.badgeOther}>—</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Дела об административных правонарушениях</h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Поиск по номеру дела, нарушителю, описанию правонарушения..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.filterButtons}>
          <button 
            className={`${styles.filterBtn} ${filterStatus === 'active' ? styles.active : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Активные
          </button>
          <button 
            className={`${styles.filterBtn} ${filterStatus === 'archived' ? styles.active : ''}`}
            onClick={() => setFilterStatus('archived')}
          >
            Архивные
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : filteredCases.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Нет дел об административных правонарушениях</p>
          <button onClick={() => navigate('/admin-proceedings/create')}>
            Создать первое дело
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Тип дела</th>
                <th>Номер дела</th>
                <th>Нарушитель</th>
                <th>Описание правонарушения</th>
                <th>Судья</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(offense => (
                <tr key={offense.id} onClick={() => handleCaseClick(offense.id)}>
                  <td>{getOffenseTypeLabel(offense)}</td>
                  <td className={styles.caseNumber}>
                    {offense.case_number_admin || '—'}
                  </td>
                  <td>{offense.violator_name || '—'}</td>
                  <td className={styles.description}>
                    {offense.offense_description?.substring(0, 50) || '—'}
                    {offense.offense_description?.length > 50 ? '...' : ''}
                  </td>
                  <td>{offense.judge?.full_name || '—'}</td>
                  <td>{getStatusBadge(offense)}</td>
                  <td>
                    <button 
                      className={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCaseClick(offense.id);
                      }}
                    >
                      Открыть
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOffensesPage;