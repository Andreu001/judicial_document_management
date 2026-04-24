// src/pages/Citizen/ArchivePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import citizenCaseService from '../../API/citizenCaseService';
import styles from './CitizenCaseListView.module.css';

const ArchivePage = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedCases();
  }, []);

  const loadArchivedCases = async () => {
    setLoading(true);
    try {
      const allCases = await citizenCaseService.getCases();
      // Фильтруем только архивные дела
      const archived = allCases.filter(c => c.case_status === 'archived');
      setCases(archived);
    } catch (error) {
      console.error('Error loading archived cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
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
    return <div className={styles.loading}>Загрузка архивных дел...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📦 Архив дел</h1>
        <div className={styles.stats}>
          Всего в архиве: {cases.length}
        </div>
      </div>

      {cases.length === 0 ? (
        <div className={styles.emptyState}>
          <p>У вас нет дел в архиве</p>
          <p className={styles.emptyHint}>
            Завершённые дела автоматически попадают в архив
          </p>
        </div>
      ) : (
        <div className={styles.casesList}>
          {cases.map(caseItem => (
            <div key={caseItem.id} className={styles.caseCard}>
              <div className={styles.caseHeader}>
                <div className={styles.caseNumber}>
                  {caseItem.case_number}
                </div>
                <span className={styles.statusArchived}>
                  {getStatusText(caseItem.case_status)}
                </span>
              </div>
              
              <div className={styles.caseInfo}>
                <div className={styles.caseType}>
                  {caseItem.case_type === 'criminalproceedings' && '⚖️ Уголовное дело'}
                  {caseItem.case_type === 'civilproceedings' && '📋 Гражданское дело'}
                  {caseItem.case_type === 'administrativeproceedings' && '📜 Административное дело (КоАП)'}
                  {caseItem.case_type === 'kasproceedings' && '🏛 Административное дело (КАС)'}
                </div>
                <div className={styles.caseRole}>
                  Ваша роль: <strong>{caseItem.role_in_case || 'Участник'}</strong>
                </div>
                {caseItem.judge_name && (
                  <div className={styles.caseJudge}>
                    Судья: {caseItem.judge_name}
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
                <button 
                  onClick={() => citizenCaseService.downloadDecision(caseItem.id)}
                  className={styles.downloadButton}
                >
                  Скачать решение
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivePage;