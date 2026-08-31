// src/components/SideAuth/CaseDetailView.jsx
// Полностью переработанная версия - строгий судебный стиль

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import CivilCaseService from '../../API/CivilCaseService';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import KasCaseService from '../../API/KasCaseService';
import SideCaseService from '../../API/SideCaseService';
import baseService from '../../API/baseService';
import styles from './CaseDetailView.module.css';

const CaseDetailView = () => {
  const { caseType, caseId } = useParams();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('');
  
  const [sides, setSides] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [civilClaims, setCivilClaims] = useState([]);
  const [defendants, setDefendants] = useState([]);
  const [otherSides, setOtherSides] = useState([]);
  const [audioTranscriptions, setAudioTranscriptions] = useState([]);
  
  const [activeTab, setActiveTab] = useState('summary');

  const normalizeCaseType = (type) => {
    const typeMap = {
      'criminal': 'criminal',
      'criminal-proceedings': 'criminal',
      'civil': 'civil',
      'civil-proceedings': 'civil',
      'admin': 'administrative',
      'administrative': 'administrative',
      'coap': 'administrative',
      'kas': 'kas'
    };
    return typeMap[type] || type;
  };

  useEffect(() => {
    loadCaseData();
  }, [caseType, caseId]);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      const normalizedType = normalizeCaseType(caseType);
      let data = null;
      let court = null;
      
      switch (normalizedType) {
        case 'criminal':
          data = await CriminalCaseService.getCriminalProceedingById(caseId);
          if (data) {
            setCaseNumber(data.case_number_criminal);
            if (data.presiding_judge) {
              try {
                const judgeInfo = await baseService.get(`/users/users/${data.presiding_judge}/`);
                if (judgeInfo.data?.court_employee) {
                  court = judgeInfo.data.court_employee.department?.court;
                  setCourtName(court?.name_short || court?.name || '');
                }
              } catch (e) {
                console.warn('Could not fetch judge info:', e);
              }
            }
            
            const [defendantsData, lawyersData, otherSidesData, decisionsData, 
                   executionsData, movementsData, petitionsData, civilClaimsData] = await Promise.all([
              CriminalCaseService.getDefendants(caseId),
              CriminalCaseService.getLawyers(caseId),
              CriminalCaseService.getSides(caseId),
              CriminalCaseService.getDecisions(caseId),
              CriminalCaseService.getExecutions(caseId),
              CriminalCaseService.getCaseMovements(caseId),
              CriminalCaseService.getPetitions(caseId),
              CriminalCaseService.getCivilClaims(caseId)
            ]);
            
            setDefendants(defendantsData || []);
            setLawyers(lawyersData || []);
            setOtherSides(otherSidesData || []);
            setDecisions(decisionsData || []);
            setExecutions(executionsData || []);
            setMovements(movementsData || []);
            setPetitions(petitionsData || []);
            setCivilClaims(civilClaimsData || []);
          }
          break;
          
        case 'civil':
          data = await CivilCaseService.getCivilProceedingById(caseId);
          if (data) {
            setCaseNumber(data.case_number_civil);
            if (data.presiding_judge) {
              try {
                const judgeInfo = await baseService.get(`/users/users/${data.presiding_judge}/`);
                if (judgeInfo.data?.court_employee) {
                  court = judgeInfo.data.court_employee.department?.court;
                  setCourtName(court?.name_short || court?.name || '');
                }
              } catch (e) {
                console.warn('Could not fetch judge info:', e);
              }
            }
            
            const [sidesData, lawyersData, decisionsData, executionsData, movementsData, petitionsData] = await Promise.all([
              CivilCaseService.getSides(caseId),
              CivilCaseService.getLawyers(caseId),
              CivilCaseService.getDecisions(caseId),
              CivilCaseService.getExecutions(caseId),
              CivilCaseService.getMovements(caseId),
              CivilCaseService.getPetitions?.(caseId) || []
            ]);
            
            setSides(sidesData || []);
            setLawyers(lawyersData || []);
            setDecisions(decisionsData || []);
            setExecutions(executionsData || []);
            setMovements(movementsData || []);
            setPetitions(petitionsData || []);
          }
          break;
          
        case 'administrative':
          data = await AdministrativeCaseService.getAdministrativeProceedingById(caseId);
          if (data) {
            setCaseNumber(data.case_number_admin);
            if (data.presiding_judge) {
              try {
                const judgeInfo = await baseService.get(`/users/users/${data.presiding_judge}/`);
                if (judgeInfo.data?.court_employee) {
                  court = judgeInfo.data.court_employee.department?.court;
                  setCourtName(court?.name_short || court?.name || '');
                }
              } catch (e) {
                console.warn('Could not fetch judge info:', e);
              }
            }
            
            const [sidesData, lawyersData, decisionsData, executionsData, movementsData, petitionsData] = await Promise.all([
              AdministrativeCaseService.getSides(caseId),
              AdministrativeCaseService.getLawyers(caseId),
              AdministrativeCaseService.getDecisions(caseId),
              AdministrativeCaseService.getExecutions(caseId),
              AdministrativeCaseService.getMovements(caseId),
              AdministrativeCaseService.getPetitions(caseId)
            ]);
            
            setSides(sidesData || []);
            setLawyers(lawyersData || []);
            setDecisions(decisionsData || []);
            setExecutions(executionsData || []);
            setMovements(movementsData || []);
            setPetitions(petitionsData || []);
          }
          break;
          
        case 'kas':
          data = await KasCaseService.getKasProceedingById(caseId);
          if (data) {
            setCaseNumber(data.case_number_kas);
            if (data.presiding_judge) {
              try {
                const judgeInfo = await baseService.get(`/users/users/${data.presiding_judge}/`);
                if (judgeInfo.data?.court_employee) {
                  court = judgeInfo.data.court_employee.department?.court;
                  setCourtName(court?.name_short || court?.name || '');
                }
              } catch (e) {
                console.warn('Could not fetch judge info:', e);
              }
            }
            
            const [sidesData, lawyersData, decisionsData, executionsData, movementsData, petitionsData] = await Promise.all([
              KasCaseService.getSides(caseId),
              KasCaseService.getLawyers(caseId),
              KasCaseService.getDecisions(caseId),
              KasCaseService.getExecutions(caseId),
              KasCaseService.getMovements(caseId),
              KasCaseService.getPetitions(caseId)
            ]);
            
            setSides(sidesData || []);
            setLawyers(lawyersData || []);
            setDecisions(decisionsData || []);
            setExecutions(executionsData || []);
            setMovements(movementsData || []);
            setPetitions(petitionsData || []);
          }
          break;
          
        default:
          setError('Неизвестный тип дела');
      }
      
      setCaseData(data);
      
      // Загружаем аудио-протоколы
      if (data) {
        try {
          const audioList = await SideCaseService.getAudioTranscriptions(normalizedType, caseId);
          setAudioTranscriptions(audioList || []);
        } catch (e) {
          console.warn('Could not load audio:', e);
        }
      }
      
    } catch (err) {
      console.error('Error loading case:', err);
      setError('Ошибка загрузки дела');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDecision = async (decisionId, title) => {
    try {
      const normalizedType = normalizeCaseType(caseType);
      let url = '';
      
      switch (normalizedType) {
        case 'criminal':
          url = `/criminal_proceedings/criminal-decisions/${decisionId}/download/`;
          break;
        case 'civil':
          url = `/civil_proceedings/decisions/${decisionId}/download/`;
          break;
        case 'administrative':
          url = `/administrative_code/decisions/${decisionId}/download/`;
          break;
        case 'kas':
          url = `/administrative_proceedings/kas-decisions/${decisionId}/download/`;
          break;
        default:
          return;
      }
      
      const response = await baseService.get(url, { responseType: 'blob' });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${title || 'decision'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading decision:', error);
      alert('Ошибка при скачивании решения');
    }
  };

  const handleDownloadAudio = async (transcriptionId, filename) => {
    try {
      const response = await baseService.get(
        `/side_case/audio-transcriptions/${transcriptionId}/download/`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `audio_protocol_${transcriptionId}.wav`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
      alert('Ошибка при скачивании аудио-протокола');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'В производстве',
      'in_progress': 'В производстве',
      'active': 'В производстве',
      'completed': 'Завершено',
      'archived': 'В архиве',
      'archive': 'В архиве',
      'suspended': 'Приостановлено'
    };
    return statusMap[status] || status || 'Не указан';
  };

  const getCaseTypeName = () => {
    const normalizedType = normalizeCaseType(caseType);
    const names = {
      criminal: 'Уголовное дело',
      civil: 'Гражданское дело',
      administrative: 'Дело об административном правонарушении',
      kas: 'Административное дело (КАС РФ)'
    };
    return names[normalizedType] || 'Дело';
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Загрузка дела...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <button onClick={() => navigate('/my-cases')} className={styles.btnBack}>
            ← Назад к моим делам
          </button>
        </div>
        <div className={styles.alertError}>{error || 'Дело не найдено'}</div>
      </div>
    );
  }

  const normalizedType = normalizeCaseType(caseType);
  const allSidesCount = defendants.length + lawyers.length + otherSides.length;
  const totalSides = normalizedType === 'criminal' ? allSidesCount : sides.length + lawyers.length;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <div>
            <button onClick={() => navigate('/my-cases')} className={styles.btnBack}>
              ← Назад к моим делам
            </button>
            <h1>{getCaseTypeName()} № {caseNumber}</h1>
            {courtName && (
              <div className={styles.courtInfo}>Суд: {courtName}</div>
            )}
          </div>
          <div className={styles.headerStatus}>
            <span className={`${styles.badge} ${styles['badge' + (caseData.status || 'pending')]}`}>
              {getStatusText(caseData.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'summary' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Основное
        </button>
        
        {(normalizedType === 'criminal' || sides.length > 0 || lawyers.length > 0) && (
          <button 
            className={`${styles.tabButton} ${activeTab === 'sides' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('sides')}
          >
            Стороны <span className={styles.tabCount}>{totalSides}</span>
          </button>
        )}
        
        {decisions.length > 0 && (
          <button 
            className={`${styles.tabButton} ${activeTab === 'decisions' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('decisions')}
          >
            Решения <span className={styles.tabCount}>{decisions.length}</span>
          </button>
        )}
        
        {executions.length > 0 && (
          <button 
            className={`${styles.tabButton} ${activeTab === 'executions' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('executions')}
          >
            Исполнения <span className={styles.tabCount}>{executions.length}</span>
          </button>
        )}
        
        {movements.length > 0 && (
          <button 
            className={`${styles.tabButton} ${activeTab === 'movements' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('movements')}
          >
            Движение <span className={styles.tabCount}>{movements.length}</span>
          </button>
        )}
        
        {petitions.length > 0 && (
          <button 
            className={`${styles.tabButton} ${activeTab === 'petitions' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('petitions')}
          >
            Ходатайства <span className={styles.tabCount}>{petitions.length}</span>
          </button>
        )}
        
        {civilClaims.length > 0 && normalizedType === 'criminal' && (
          <button 
            className={`${styles.tabButton} ${activeTab === 'civilClaims' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('civilClaims')}
          >
            Иски <span className={styles.tabCount}>{civilClaims.length}</span>
          </button>
        )}
        
        {audioTranscriptions.length > 0 && (
          <button 
            className={`${styles.tabButton} ${activeTab === 'audio' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            Аудио <span className={styles.tabCount}>{audioTranscriptions.length}</span>
          </button>
        )}
      </div>

      {/* Содержимое вкладок */}
      <div className={styles.card}>
        <div className={styles.cardBody}>
          {/* Основное */}
          {activeTab === 'summary' && (
            <div className={styles.summaryContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Номер дела</span>
                  <span className={styles.infoValue}>{caseNumber}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Статус</span>
                  <span className={styles.infoValue}>{getStatusText(caseData.status)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Суд</span>
                  <span className={styles.infoValue}>{courtName || 'Не указан'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Судья</span>
                  <span className={styles.infoValue}>
                    {caseData.presiding_judge_full_name || caseData.judge?.full_name || 'Не назначен'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Дата поступления</span>
                  <span className={styles.infoValue}>{formatDate(caseData.incoming_date)}</span>
                </div>
                {caseData.case_name && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Наименование дела</span>
                    <span className={styles.infoValue}>{caseData.case_name}</span>
                  </div>
                )}
                {caseData.article_criminal && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Статья УК РФ</span>
                    <span className={styles.infoValue}>{caseData.article_criminal}</span>
                  </div>
                )}
                {caseData.offense_description && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Описание правонарушения</span>
                    <span className={styles.infoValue}>{caseData.offense_description}</span>
                  </div>
                )}
                {caseData.claim_amount > 0 && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Цена иска</span>
                    <span className={styles.infoValue}>{formatCurrency(caseData.claim_amount)}</span>
                  </div>
                )}
              </div>
              <div className={styles.lastActivity}>
                Обновлено: {formatDateTime(caseData.updated_at)}
              </div>
            </div>
          )}

          {/* Стороны */}
          {activeTab === 'sides' && (
            <div className={styles.sidesContent}>
              {normalizedType === 'criminal' ? (
                <>
                  {defendants.length > 0 && (
                    <>
                      <h3 className={styles.sectionSubtitle}>Подсудимые</h3>
                      {defendants.map(d => (
                        <div key={d.id} className={styles.sideCard}>
                          <div className={styles.sideName}>{d.full_name_criminal || d.full_name}</div>
                          <div className={styles.sideRole}>Подсудимый</div>
                        </div>
                      ))}
                    </>
                  )}
                  {lawyers.length > 0 && (
                    <>
                      <h3 className={styles.sectionSubtitle}>Адвокаты</h3>
                      {lawyers.map(l => (
                        <div key={l.id} className={styles.sideCard}>
                          <div className={styles.sideName}>
                            {l.lawyer_detail?.law_firm_name || 'Адвокат'}
                          </div>
                          <div className={styles.sideRole}>Защитник</div>
                        </div>
                      ))}
                    </>
                  )}
                  {otherSides.length > 0 && (
                    <>
                      <h3 className={styles.sectionSubtitle}>Другие стороны</h3>
                      {otherSides.map(s => (
                        <div key={s.id} className={styles.sideCard}>
                          <div className={styles.sideName}>
                            {s.criminal_side_case_detail?.name || 'Сторона'}
                          </div>
                          <div className={styles.sideRole}>
                            {s.sides_case_criminal_detail?.sides_case || 'Сторона'}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {sides.map(s => (
                    <div key={s.id} className={styles.sideCard}>
                      <div className={styles.sideName}>
                        {s.sides_case_incase_detail?.name || 'Сторона'}
                      </div>
                      <div className={styles.sideRole}>
                        {s.sides_case_role_detail?.name || 'Сторона'}
                      </div>
                    </div>
                  ))}
                  {lawyers.map(l => (
                    <div key={l.id} className={styles.sideCard}>
                      <div className={styles.sideName}>
                        {l.lawyer_detail?.law_firm_name || 'Представитель'}
                      </div>
                      <div className={styles.sideRole}>Представитель</div>
                    </div>
                  ))}
                </>
              )}
              {totalSides === 0 && (
                <div className={styles.emptyState}>
                  <p>Нет данных о сторонах</p>
                </div>
              )}
            </div>
          )}

          {/* Решения */}
          {activeTab === 'decisions' && (
            <div className={styles.decisionsContent}>
              {decisions.map(decision => (
                <div key={decision.id} className={styles.decisionCard}>
                  <div className={styles.decisionHeader}>
                    <span className={styles.decisionDate}>
                      {formatDate(decision.decision_date || decision.court_consideration_date)}
                    </span>
                    <button 
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => handleDownloadDecision(decision.id, `Решение_${caseNumber}`)}
                    >
                      Скачать решение
                    </button>
                  </div>
                  <div className={styles.decisionResult}>
                    <span className={styles.decisionResultLabel}>Результат</span>
                    {decision.outcome || decision.case_result || 'Решение вынесено'}
                  </div>
                  {decision.decision_effective_date && (
                    <div className={styles.decisionMeta}>
                      Вступило в силу: {formatDate(decision.decision_effective_date)}
                    </div>
                  )}
                  {decision.fine_amount > 0 && (
                    <div className={styles.decisionMeta}>
                      Штраф: {formatCurrency(decision.fine_amount)}
                    </div>
                  )}
                </div>
              ))}
              {decisions.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Нет решений по делу</p>
                </div>
              )}
            </div>
          )}

          {/* Исполнения */}
          {activeTab === 'executions' && (
            <div className={styles.executionsContent}>
              {executions.map(execution => (
                <div key={execution.id} className={styles.executionCard}>
                  <div className={styles.executionDate}>
                    {formatDate(execution.execution_date || execution.execution_sent_date || execution.writ_execution_date)}
                  </div>
                  <div className={styles.executionInfo}>
                    {execution.execution_sent_to && (
                      <div>Направлено: {execution.execution_sent_to}</div>
                    )}
                    {execution.execution_result && (
                      <div>Результат: {execution.execution_result}</div>
                    )}
                    {execution.fine_paid && (
                      <div>Штраф уплачен: {execution.fine_paid_date ? formatDate(execution.fine_paid_date) : 'Да'}</div>
                    )}
                  </div>
                </div>
              ))}
              {executions.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Нет данных об исполнении</p>
                </div>
              )}
            </div>
          )}

          {/* Движение дела */}
          {activeTab === 'movements' && (
            <div className={styles.movementsContent}>
              {movements.map(movement => {
                const movementData = movement.business_movement_detail || movement;
                return (
                  <div key={movement.id} className={styles.movementCard}>
                    <div className={styles.movementDate}>
                      {formatDate(movementData.date_meeting)}
                    </div>
                    {movementData.meeting_time && (
                      <div className={styles.movementTime}>
                        Время: {movementData.meeting_time.slice(0, 5)}
                      </div>
                    )}
                    {movementData.result_court_session && (
                      <div className={styles.movementResult}>
                        Результат: {movementData.result_court_session}
                      </div>
                    )}
                  </div>
                );
              })}
              {movements.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Нет данных о движении дела</p>
                </div>
              )}
            </div>
          )}

          {/* Ходатайства */}
          {activeTab === 'petitions' && (
            <div className={styles.petitionsContent}>
              {petitions.map(petition => {
                const detail = petition.petitions_incase_detail || {};
                const isResolved = !!detail.date_decision;
                const decisionText = detail.decision_rendered?.name_case || 'Рассмотрено';
                
                return (
                  <div key={petition.id} className={styles.petitionCard}>
                    <div className={styles.petitionHeader}>
                      <span className={styles.petitionDate}>
                        {formatDate(detail.date_application)}
                      </span>
                      <span className={isResolved ? styles.petitionStatusResolved : styles.petitionStatusPending}>
                        {isResolved ? 'Рассмотрено' : 'На рассмотрении'}
                      </span>
                    </div>
                    <div className={styles.petitionBody}>
                      <div className={styles.petitionField}>
                        <span className={styles.petitionFieldLabel}>Тип</span>
                        <span className={styles.petitionFieldValue}>
                          {detail.petitions_name?.map(p => p.name || p.petitions).join(', ') || '—'}
                        </span>
                      </div>
                      <div className={styles.petitionField}>
                        <span className={styles.petitionFieldLabel}>Заявитель</span>
                        <span className={styles.petitionFieldValue}>
                          {petition.petitioner_info?.name || petition.petitioner_info || 'Не указан'}
                        </span>
                      </div>
                      {detail.notation && (
                        <div className={styles.petitionText}>
                          {detail.notation}
                        </div>
                      )}
                      {isResolved && (
                        <div className={styles.petitionDecision}>
                          <span className={styles.petitionDecisionLabel}>Решение суда</span>
                          <span className={styles.petitionDecisionText}>
                            {decisionText}
                            {detail.date_decision && (
                              <span className={styles.petitionDecisionDate}>
                                от {formatDate(detail.date_decision)}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {petitions.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Нет ходатайств по делу</p>
                </div>
              )}
            </div>
          )}

          {/* Гражданские иски */}
          {activeTab === 'civilClaims' && normalizedType === 'criminal' && (
            <div className={styles.claimsContent}>
              {civilClaims.map(claim => (
                <div key={claim.id} className={styles.claimCard}>
                  <div className={styles.claimAmount}>
                    {claim.claim_amount ? `${claim.claim_amount.toLocaleString()} руб.` : 'Гражданский иск'}
                  </div>
                  <div className={styles.claimPlaintiff}>
                    Истец: {claim.plaintiff_name || 'Не указан'}
                  </div>
                  {claim.result && (
                    <div className={styles.claimResult}>
                      Результат: {claim.result_display || claim.result}
                    </div>
                  )}
                  {claim.decision_date && (
                    <div className={styles.claimDate}>
                      Решение от: {formatDate(claim.decision_date)}
                    </div>
                  )}
                </div>
              ))}
              {civilClaims.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Нет гражданских исков</p>
                </div>
              )}
            </div>
          )}

          {/* Аудио-протоколы */}
          {activeTab === 'audio' && (
            <div className={styles.audioContent}>
              <h3 className={styles.sectionSubtitle}>Аудио-протоколы заседаний</h3>
              {audioTranscriptions.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Аудио-протоколы к данному делу не прикреплены</p>
                </div>
              ) : (
                <div className={styles.audioList}>
                  {audioTranscriptions.map(audio => (
                    <div key={audio.id} className={styles.audioCard}>
                      <div className={styles.audioInfo}>
                        <span className={styles.audioDate}>
                          {formatDate(audio.created_at)}
                        </span>
                        {audio.duration_seconds && (
                          <span className={styles.audioDuration}>
                            Длительность: {Math.floor(audio.duration_seconds / 60)} мин {audio.duration_seconds % 60} сек
                          </span>
                        )}
                        <span className={audio.status === 'completed' ? styles.audioStatusCompleted : styles.audioStatusProcessing}>
                          {audio.status === 'completed' ? 'Готово' : 'Обработка...'}
                        </span>
                      </div>
                      <button 
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => handleDownloadAudio(
                          audio.id, 
                          `audio_protocol_${caseNumber}_${new Date(audio.created_at).toISOString().slice(0,10)}.wav`
                        )}
                        disabled={audio.status !== 'completed'}
                      >
                        Скачать аудио
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.noteBox}>
        <p>Страница предназначена только для просмотра. Для подачи ходатайств или загрузки документов вернитесь в личный кабинет.</p>
      </div>
    </div>
  );
};

export default CaseDetailView;