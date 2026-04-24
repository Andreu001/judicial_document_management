// src/pages/Citizen/CitizenCaseListView.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import citizenCaseService from '../../API/citizenCaseService';
import styles from './CitizenCaseListView.module.css';

const CitizenCaseListView = ({ caseType, title }) => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed, archived

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      // Получаем ВСЕ дела, к которым у пользователя есть доступ
      const allCases = await citizenCaseService.getCases();
      
      // Фильтруем по типу дела
      const filtered = allCases.filter(c => {
        if (caseType === 'criminal') return c.case_type === 'criminalproceedings';
        if (caseType === 'civil') return c.case_type === 'civilproceedings';
        if (caseType === 'coap') return c.case_type === 'administrativeproceedings';
        if (caseType === 'kas') return c.case_type === 'kasproceedings';
        return true;
      });
      
      setCases(filtered);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCases = () => {
    if (filter === 'all') return cases;
    return cases.filter(c => c.case_status === filter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'completed': return styles.statusCompleted;
      case 'execution': return styles.statusExecution;
      case 'archived': return styles.statusArchived;
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'В производстве';
      case 'completed': return 'Рассмотрено';
      case 'execution': return 'На исполнении';
      case 'archived': return 'В архиве';
      default: return status;
    }
  };

  if (!user?.is_verified) {
    return (
      <div className={styles.verificationContainer}>
        <div className={styles.verificationCard}>
          <h2>🔐 Требуется верификация</h2>
          <p>Для просмотра дел необходимо подтвердить свою личность</p>
          <Link to="/citizen/verify" className={styles.verifyButton}>
            Пройти верификацию
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка ваших дел...</div>;
  }

  const filteredCases = getFilteredCases();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{title}</h1>
        <div className={styles.stats}>
          Всего дел: {cases.length}
        </div>
      </div>

      <div className={styles.filters}>
        <button 
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          Все ({cases.length})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
          onClick={() => setFilter('active')}
        >
          В работе ({cases.filter(c => c.case_status === 'active').length})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
          onClick={() => setFilter('completed')}
        >
          Рассмотренные ({cases.filter(c => c.case_status === 'completed').length})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'archived' ? styles.active : ''}`}
          onClick={() => setFilter('archived')}
        >
          В архиве ({cases.filter(c => c.case_status === 'archived').length})
        </button>
      </div>

      {filteredCases.length === 0 ? (
        <div className={styles.emptyState}>
          <p>У вас нет дел в этой категории</p>
          <p className={styles.emptyHint}>
            Если вы считаете, что это ошибка, обратитесь в канцелярию суда
          </p>
        </div>
      ) : (
        <div className={styles.casesList}>
          {filteredCases.map(caseItem => (
            <div key={caseItem.id} className={styles.caseCard}>
              <div className={styles.caseHeader}>
                <div className={styles.caseNumber}>
                  {caseItem.case_number}
                </div>
                <span className={`${styles.statusBadge} ${getStatusColor(caseItem.case_status)}`}>
                  {getStatusText(caseItem.case_status)}
                </span>
              </div>
              
              <div className={styles.caseInfo}>
                <div className={styles.caseRole}>
                  Ваша роль: <strong>{caseItem.role_in_case || 'Участник'}</strong>
                </div>
                {caseItem.judge_name && (
                  <div className={styles.caseJudge}>
                    Судья: {caseItem.judge_name}
                  </div>
                )}
                {caseItem.hearing_date && (
                  <div className={styles.caseDate}>
                    Дата заседания: {caseItem.hearing_date}
                  </div>
                )}
              </div>

              <div className={styles.caseActions}>
                <Link 
                  to={`/citizen/case/${caseItem.id}`} 
                  className={styles.viewButton}
                >
                  Подробнее
                </Link>
                {caseItem.access_type !== 'view' && (
                  <>
                    <Link 
                      to={`/citizen/case/${caseItem.id}/petition/new`}
                      className={styles.petitionButton}
                    >
                      Подать ходатайство
                    </Link>
                    <Link 
                      to={`/citizen/case/${caseItem.id}/documents/upload`}
                      className={styles.uploadButton}
                    >
                      Загрузить документы
                    </Link>
                  </>
                )}
                {caseItem.case_status !== 'active' && (
                  <button 
                    onClick={() => citizenCaseService.downloadDecision(caseItem.id)}
                    className={styles.downloadButton}
                  >
                    Скачать решение
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenCaseListView;