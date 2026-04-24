import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './CasesPages.module.css';

const CriminalCasesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, archived

  useEffect(() => {
    fetchCases();
  }, [filterStatus]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      let data;
      if (filterStatus === 'archived') {
        data = await CriminalCaseService.getArchivedProceedings();
      } else {
        data = await CriminalCaseService.getAllCriminalProceedings();
        if (filterStatus === 'active') {
          data = data.filter(c => !c.is_archived);
        }
      }
      setCases(data);
    } catch (error) {
      console.error('Error fetching criminal cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (id) => {
    navigate(`/criminal-proceedings/${id}`);
  };

  const filteredCases = cases.filter(criminalCase => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (criminalCase.case_number_criminal?.toLowerCase().includes(searchLower) ||
       criminalCase.defendants?.some(d => d.full_name?.toLowerCase().includes(searchLower)) ||
       criminalCase.judge?.full_name?.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadge = (criminalCase) => {
    if (criminalCase.is_archived) return <span className={styles.badgeArchived}>В архиве</span>;
    if (criminalCase.status === 'completed') return <span className={styles.badgeCompleted}>Завершено</span>;
    if (criminalCase.status === 'in_progress') return <span className={styles.badgeInProgress}>В производстве</span>;
    return <span className={styles.badgePending}>На рассмотрении</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Уголовные дела</h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Поиск по номеру дела, обвиняемому, судье..."
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
          <p>Нет уголовных дел</p>
          <button onClick={() => navigate('/criminal-proceedings/create')}>
            Создать первое дело
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Номер дела</th>
                <th>Обвиняемые</th>
                <th>Судья</th>
                <th>Дата поступления</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(criminalCase => (
                <tr key={criminalCase.id} onClick={() => handleCaseClick(criminalCase.id)}>
                  <td className={styles.caseNumber}>
                    {criminalCase.case_number_criminal || '—'}
                  </td>
                  <td>
                    {criminalCase.defendants?.map(d => d.full_name).join(', ') || '—'}
                  </td>
                  <td>{criminalCase.judge?.full_name || '—'}</td>
                  <td>{criminalCase.incoming_date || '—'}</td>
                  <td>{getStatusBadge(criminalCase)}</td>
                  <td>
                    <button 
                      className={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCaseClick(criminalCase.id);
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

export default CriminalCasesPage;