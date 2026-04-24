import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KasCaseService from '../../API/KasCaseService';
import styles from './CasesPages.module.css';

const AdministrativeCasesPage = () => {
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
        data = await KasCaseService.getArchivedProceedings();
      } else {
        data = await KasCaseService.getAllKasProceedings();
        if (filterStatus === 'active') {
          data = data.filter(c => !c.is_archived);
        }
      }
      setCases(data);
    } catch (error) {
      console.error('Error fetching administrative cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (id) => {
    navigate(`/kas-proceedings/${id}`);
  };

  const filteredCases = cases.filter(adminCase => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (adminCase.case_number_kas?.toLowerCase().includes(searchLower) ||
       adminCase.case_name?.toLowerCase().includes(searchLower) ||
       adminCase.administrative_plaintiff?.toLowerCase().includes(searchLower) ||
       adminCase.judge?.full_name?.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadge = (adminCase) => {
    if (adminCase.is_archived) return <span className={styles.badgeArchived}>В архиве</span>;
    if (adminCase.status === 'completed') return <span className={styles.badgeCompleted}>Завершено</span>;
    if (adminCase.status === 'in_progress') return <span className={styles.badgeInProgress}>В производстве</span>;
    return <span className={styles.badgePending}>На рассмотрении</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Административные дела (КАС РФ)</h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Поиск по номеру дела, административному истцу, судье..."
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
          <p>Нет административных дел</p>
          <button onClick={() => navigate('/kas-proceedings/create')}>
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
                <th>Административный истец</th>
                <th>Административный ответчик</th>
                <th>Судья</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(adminCase => (
                <tr key={adminCase.id} onClick={() => handleCaseClick(adminCase.id)}>
                  <td className={styles.caseNumber}>
                    {adminCase.case_number_kas || '—'}
                  </td>
                  <td>{adminCase.case_name || '—'}</td>
                  <td>{adminCase.administrative_plaintiff || '—'}</td>
                  <td>{adminCase.administrative_defendant || '—'}</td>
                  <td>{adminCase.judge?.full_name || '—'}</td>
                  <td>{getStatusBadge(adminCase)}</td>
                  <td>
                    <button 
                      className={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCaseClick(adminCase.id);
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

export default AdministrativeCasesPage;