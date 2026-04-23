import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import citizenCaseService from '../../API/citizenCaseService';
import styles from './CitizenDashboard.module.css';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    const data = await citizenCaseService.getCases();
    setCases(data);
    setLoading(false);
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

  const filteredCases = cases.filter(c => {
    if (activeTab === 'active') return c.case_status === 'active';
    if (activeTab === 'completed') return c.case_status === 'completed';
    if (activeTab === 'archived') return c.case_status === 'archived';
    return true;
  });

  if (!user?.is_verified) {
    return (
      <div className={styles.verificationContainer}>
        <div className={styles.verificationCard}>
          <h2>🔐 Подтверждение личности</h2>
          <p>Для доступа к делам необходимо подтвердить свою личность</p>
          <Link to="/citizen/verify" className={styles.verifyButton}>
            Пройти верификацию
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Мои дела</h1>
        <div className={styles.userInfo}>
          <span>{user?.last_name} {user?.first_name} {user?.middle_name}</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
          onClick={() => setActiveTab('active')}
        >
          В производстве ({cases.filter(c => c.case_status === 'active').length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Рассмотренные ({cases.filter(c => c.case_status === 'completed').length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'archived' ? styles.active : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          В архиве ({cases.filter(c => c.case_status === 'archived').length})
        </button>
      </div>

      {filteredCases.length === 0 ? (
        <div className={styles.emptyState}>
          <p>У вас нет дел в этом разделе</p>
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
                <div className={styles.caseType}>
                  {caseItem.case_type === 'criminalproceedings' && '⚖️ Уголовное дело'}
                  {caseItem.case_type === 'civilproceedings' && '📋 Гражданское дело'}
                  {caseItem.case_type === 'administrativeproceedings' && '📜 Административное дело (КоАП)'}
                  {caseItem.case_type === 'kasproceedings' && '🏛 Административное дело (КАС)'}
                </div>
                <div className={styles.caseRole}>
                  Роль: <strong>{caseItem.role_in_case}</strong>
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

export default CitizenDashboard;