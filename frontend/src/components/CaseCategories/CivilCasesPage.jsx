import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CasesPages.module.css';

const CivilCasesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCases();
  }, [filterStatus]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      let data;
      if (filterStatus === 'archived') {
        data = await CivilCaseService.getArchivedProceedings();
      } else {
        data = await CivilCaseService.getAllCivilProceedings();
        if (filterStatus === 'active') {
          data = data.filter(c => !c.is_archived);
        }
      }
      setCases(data);
    } catch (error) {
      console.error('Error fetching civil cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (id) => {
    navigate(`/civil-proceedings/${id}`);
  };

  const filteredCases = cases.filter(civilCase => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (civilCase.case_number_civil?.toLowerCase().includes(searchLower) ||
       civilCase.case_name?.toLowerCase().includes(searchLower) ||
       civilCase.judge?.full_name?.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadge = (civilCase) => {
    if (civilCase.is_archived) return <span className={styles.badgeArchived}>В архиве</span>;
    if (civilCase.status === 'completed') return <span className={styles.badgeCompleted}>Завершено</span>;
    if (civilCase.status === 'in_progress') return <span className={styles.badgeInProgress}>В производстве</span>;
    return <span className={styles.badgePending}>На рассмотрении</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Гражданские дела</h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Поиск по номеру дела, наименованию, судье..."
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
          <p>Нет гражданских дел</p>
          <button onClick={() => navigate('/civil-proceedings/create')}>
            Создать первое дело
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Номер дела</th>
                <th>Наименование дела</th>
                <th>Истец</th>
                <th>Ответчик</th>
                <th>Судья</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(civilCase => (
                <tr key={civilCase.id} onClick={() => handleCaseClick(civilCase.id)}>
                  <td className={styles.caseNumber}>
                    {civilCase.case_number_civil || '—'}
                  </td>
                  <td>{civilCase.case_name || '—'}</td>
                  <td>
                    {civilCase.sides?.filter(s => s.role?.code === 'plaintiff').map(s => s.full_name).join(', ') || '—'}
                  </td>
                  <td>
                    {civilCase.sides?.filter(s => s.role?.code === 'defendant').map(s => s.full_name).join(', ') || '—'}
                  </td>
                  <td>{civilCase.judge?.full_name || '—'}</td>
                  <td>{getStatusBadge(civilCase)}</td>
                  <td>
                    <button 
                      className={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCaseClick(civilCase.id);
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

export default CivilCasesPage;