// src/components/SideAuth/CasePetitionsView.jsx
// Полностью переработанная версия - строгий судебный стиль

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SideCaseService from '../../API/SideCaseService';
import styles from './CasePetitionsView.module.css';

const CasePetitionsView = () => {
  const { caseType, caseId } = useParams();
  const navigate = useNavigate();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseNumber, setCaseNumber] = useState('');

  useEffect(() => {
    loadPetitions();
    loadCaseInfo();
  }, [caseType, caseId]);

  const loadPetitions = async () => {
    setLoading(true);
    try {
      const pets = await SideCaseService.getCasePetitions(caseType, caseId);
      
      const petsWithDetails = await Promise.all(
        pets.map(async (petition) => {
          if (petition.id) {
            try {
              const detail = await SideCaseService.getPetitionDetail(caseType, caseId, petition.id);
              if (detail) {
                return { ...petition, ...detail };
              }
            } catch (e) {
              console.warn('Could not load detail for petition', petition.id, e);
            }
          }
          return petition;
        })
      );
      
      setPetitions(petsWithDetails || []);
    } catch (err) {
      console.error('Error loading petitions:', err);
      setError('Не удалось загрузить ходатайства');
    } finally {
      setLoading(false);
    }
  };

  const loadCaseInfo = async () => {
    try {
      const cases = await SideCaseService.getUserCases();
      const typeMapping = {
        criminal: 'criminal',
        civil: 'civil',
        kas: 'kas',
        administrative: 'administrative'
      };
      const mappedType = typeMapping[caseType] || caseType;
      
      if (cases[mappedType]) {
        const found = cases[mappedType].find(c => c.case_id === parseInt(caseId));
        if (found) {
          setCaseNumber(found.case_number);
        }
      }
    } catch (err) {
      console.error('Error loading case info:', err);
    }
  };

  const getCaseTypeName = () => {
    const names = {
      criminal: 'Уголовное дело',
      civil: 'Гражданское дело',
      kas: 'Административное дело (КАС РФ)',
      administrative: 'Дело об административном правонарушении'
    };
    return names[caseType] || 'Дело';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPetitionerName = (petition) => {
    const petitionerInfo = petition.petitioner_info || petition.petitions_incase_detail?.petitioner_info;
    if (!petitionerInfo) return 'Не указан';
    if (typeof petitionerInfo === 'object') {
      return petitionerInfo.name || petitionerInfo.full_name || 'Не указан';
    }
    return String(petitionerInfo);
  };

  const getPetitionTypes = (petition) => {
    const detail = petition.petitions_incase_detail || petition;
    if (detail.petitions_name && Array.isArray(detail.petitions_name)) {
      return detail.petitions_name.map(p => p.name || p.petitions).join(', ');
    }
    return '—';
  };

  const getPetitionStatus = (petition) => {
    const detail = petition.petitions_incase_detail || petition;
    
    if (detail.date_decision) {
      let decisionText = 'Рассмотрено';
      if (detail.decision_rendered) {
        if (typeof detail.decision_rendered === 'object') {
          decisionText = detail.decision_rendered.name_case || 'Рассмотрено';
        } else if (detail.decision_rendered_name) {
          decisionText = detail.decision_rendered_name;
        }
      }
      return {
        resolved: true,
        text: 'Рассмотрено',
        decision: decisionText,
        date: detail.date_decision
      };
    }
    
    return {
      resolved: false,
      text: 'На рассмотрении',
      decision: null,
      date: null
    };
  };

  if (loading) {
    return (
      <div className={`${styles.pageContainer} ${styles.petitionsContainer}`}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Загрузка ходатайств...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.pageContainer} ${styles.petitionsContainer}`}>
        <div className={styles.pageHeader}>
          <button onClick={() => navigate(-1)} className={styles.btnBack}>
            ← Назад
          </button>
          <h1>Ходатайства по делу</h1>
        </div>
        <div className={styles.alertError}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.pageContainer} ${styles.petitionsContainer}`}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <div>
            <button onClick={() => navigate(-1)} className={styles.btnBack}>
              ← Назад
            </button>
            <h1>Ходатайства по делу</h1>
            {caseNumber && (
              <div className={styles.caseRef}>Дело № {caseNumber}</div>
            )}
            <div className={styles.caseTypeLabel}>{getCaseTypeName()}</div>
          </div>
          <div className={styles.headerCount}>
            Всего: <span className={styles.countNumber}>{petitions.length}</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          {petitions.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Нет ходатайств</h3>
              <p>По данному делу ходатайства не подавались</p>
            </div>
          ) : (
            <div className={styles.petitionsList}>
              {petitions.map((petition) => {
                const status = getPetitionStatus(petition);
                const detail = petition.petitions_incase_detail || petition;
                
                return (
                  <div key={petition.id} className={styles.petitionCard}>
                    <div className={styles.petitionHeader}>
                      <div className={styles.petitionHeaderLeft}>
                        <span className={styles.petitionDate}>
                          {formatDate(detail.date_application)}
                        </span>
                        <span className={styles.petitionType}>
                          {getPetitionTypes(petition)}
                        </span>
                      </div>
                      <span className={status.resolved ? styles.petitionStatusResolved : styles.petitionStatusPending}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className={styles.petitionBody}>
                      <div className={styles.petitionField}>
                        <span className={styles.petitionFieldLabel}>Заявитель</span>
                        <span className={styles.petitionFieldValue}>{getPetitionerName(petition)}</span>
                      </div>
                      
                      {detail.notation && (
                        <div className={styles.petitionText}>
                          {detail.notation}
                        </div>
                      )}
                      
                      {status.resolved && status.decision && (
                        <div className={styles.petitionDecision}>
                          <span className={styles.petitionDecisionLabel}>Решение суда</span>
                          <span className={styles.petitionDecisionText}>
                            {status.decision}
                            {status.date && (
                              <span className={styles.petitionDecisionDate}>
                                от {formatDate(status.date)}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className={styles.noteBox}>
            <p>Для подачи нового ходатайства перейдите в личный кабинет и выберите соответствующее действие по делу</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasePetitionsView;