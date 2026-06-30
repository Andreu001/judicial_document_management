// src/components/SideAuth/CaseDetailView.jsx
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
  
  // Основные данные дела
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseNumber, setCaseNumber] = useState('');
  
  // Связанные данные (как в карточках)
  const [sides, setSides] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [civilClaims, setCivilClaims] = useState([]);
  const [defendants, setDefendants] = useState([]);
  const [otherSides, setOtherSides] = useState([]);
  
  const [activeTab, setActiveTab] = useState('summary');
  const [judges, setJudges] = useState([]);
  const [quickStats, setQuickStats] = useState({
    sides: 0, lawyers: 0, decisions: 0, executions: 0,
    movements: 0, petitions: 0, defendants: 0, otherSides: 0, allSides: 0
  });

  useEffect(() => {
    loadCaseData();
  }, [caseType, caseId]);

  // Нормализация типа дела для API
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

  const loadCaseData = async () => {
    setLoading(true);
    try {
      const normalizedType = normalizeCaseType(caseType);
      let data = null;
      
      // Загружаем основное дело и связанные данные
      switch (normalizedType) {
        case 'criminal':
          data = await CriminalCaseService.getCriminalProceedingById(caseId);
          if (data) {
            setCaseNumber(data.case_number_criminal);
            // Загружаем связанные данные как в CriminalBusinessCard
            const defendantsData = await CriminalCaseService.getDefendants(caseId);
            setDefendants(defendantsData);
            const lawyersData = await CriminalCaseService.getLawyers(caseId);
            setLawyers(lawyersData);
            const otherSidesData = await CriminalCaseService.getSides(caseId);
            setOtherSides(otherSidesData);
            const decisionsData = await CriminalCaseService.getDecisions(caseId);
            setDecisions(decisionsData);
            const executionsData = await CriminalCaseService.getExecutions(caseId);
            setExecutions(executionsData);
            const movementsData = await CriminalCaseService.getCaseMovements(caseId);
            setMovements(movementsData);
            const petitionsData = await CriminalCaseService.getPetitions(caseId);
            setPetitions(petitionsData);
            const civilClaimsData = await CriminalCaseService.getCivilClaims(caseId);
            setCivilClaims(civilClaimsData);
            
            setQuickStats({
              defendants: defendantsData.length,
              lawyers: lawyersData.length,
              otherSides: otherSidesData.length,
              allSides: defendantsData.length + lawyersData.length + otherSidesData.length,
              decisions: decisionsData.length,
              executions: executionsData.length,
              movements: movementsData.length,
              petitions: petitionsData.length,
              civilClaims: civilClaimsData.length
            });
          }
          break;
          
        case 'civil':
          data = await CivilCaseService.getCivilProceedingById(caseId);
          if (data) {
            setCaseNumber(data.case_number_civil);
            const sidesData = await CivilCaseService.getSides(caseId);
            setSides(sidesData);
            const lawyersData = await CivilCaseService.getLawyers(caseId);
            setLawyers(lawyersData);
            const decisionsData = await CivilCaseService.getDecisions(caseId);
            setDecisions(decisionsData);
            const executionsData = await CivilCaseService.getExecutions(caseId);
            setExecutions(executionsData);
            const movementsData = await CivilCaseService.getMovements(caseId);
            setMovements(movementsData);
            const petitionsData = await CivilCaseService.getPetitions?.(caseId) || [];
            setPetitions(petitionsData);
            
            setQuickStats({
              sides: sidesData.length,
              lawyers: lawyersData.length,
              decisions: decisionsData.length,
              executions: executionsData.length,
              movements: movementsData.length,
              petitions: petitionsData.length
            });
          }
          break;
          
        case 'administrative':
          data = await AdministrativeCaseService.getAdministrativeProceedingById(caseId);
          if (data) {
            setCaseNumber(data.case_number_admin);
            const sidesData = await AdministrativeCaseService.getSides(caseId);
            setSides(sidesData);
            const lawyersData = await AdministrativeCaseService.getLawyers(caseId);
            setLawyers(lawyersData);
            const decisionsData = await AdministrativeCaseService.getDecisions(caseId);
            setDecisions(decisionsData);
            const executionsData = await AdministrativeCaseService.getExecutions(caseId);
            setExecutions(executionsData);
            const movementsData = await AdministrativeCaseService.getMovements(caseId);
            setMovements(movementsData);
            const petitionsData = await AdministrativeCaseService.getPetitions(caseId);
            setPetitions(petitionsData);
            
            setQuickStats({
              sides: sidesData.length,
              lawyers: lawyersData.length,
              decisions: decisionsData.length,
              executions: executionsData.length,
              movements: movementsData.length,
              petitions: petitionsData.length
            });
          }
          break;
          
        case 'kas':
          data = await KasCaseService.getKasProceedingById(caseId);
          if (data) {
            setCaseNumber(data.case_number_kas);
            const sidesData = await KasCaseService.getSides(caseId);
            setSides(sidesData);
            const lawyersData = await KasCaseService.getLawyers(caseId);
            setLawyers(lawyersData);
            const decisionsData = await KasCaseService.getDecisions(caseId);
            setDecisions(decisionsData);
            const executionsData = await KasCaseService.getExecutions(caseId);
            setExecutions(executionsData);
            const movementsData = await KasCaseService.getMovements(caseId);
            setMovements(movementsData);
            const petitionsData = await KasCaseService.getPetitions(caseId);
            setPetitions(petitionsData);
            
            setQuickStats({
              sides: sidesData.length,
              lawyers: lawyersData.length,
              decisions: decisionsData.length,
              executions: executionsData.length,
              movements: movementsData.length,
              petitions: petitionsData.length
            });
          }
          break;
          
        default:
          setError('Неизвестный тип дела');
      }
      
      setCaseData(data);
    } catch (err) {
      console.error('Error loading case:', err);
      setError('Ошибка загрузки дела');
    } finally {
      setLoading(false);
    }
  };

  // Скачивание решения по делу
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
      'pending': 'На рассмотрении',
      'in_progress': 'В производстве',
      'completed': 'Завершено',
      'archived': 'В архиве',
      'suspended': 'Приостановлено'
    };
    return statusMap[status] || status || 'Не указан';
  };

  const getCaseTypeName = () => {
    const normalizedType = normalizeCaseType(caseType);
    const names = {
      criminal: 'Уголовное дело',
      civil: 'Гражданское дело',
      administrative: 'Дело об административном правонарушении (КоАП РФ)',
      kas: 'Административное дело (КАС РФ)'
    };
    return names[normalizedType] || 'Дело';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка дела...</div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Дело не найдено'}</div>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          Вернуться к моим делам
        </button>
      </div>
    );
  }

  const normalizedType = normalizeCaseType(caseType);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          ← Назад к моим делам
        </button>
        <h1>{getCaseTypeName()} №{caseNumber}</h1>
      </div>

      {/* Быстрые действия (вкладки как в карточках) */}
      <div className={styles.quickActions}>
        <button 
          className={`${styles.quickAction} ${activeTab === 'summary' ? styles.active : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Основное
        </button>
        
        {(normalizedType === 'criminal' || sides.length > 0 || lawyers.length > 0) && (
          <button 
            className={`${styles.quickAction} ${activeTab === 'sides' ? styles.active : ''}`}
            onClick={() => setActiveTab('sides')}
          >
            <span className={styles.quickActionCount}>
              {normalizedType === 'criminal' ? quickStats.allSides : quickStats.sides + quickStats.lawyers}
            </span>
            Стороны
          </button>
        )}
        
        {decisions.length > 0 && (
          <button 
            className={`${styles.quickAction} ${activeTab === 'decisions' ? styles.active : ''}`}
            onClick={() => setActiveTab('decisions')}
          >
            <span className={styles.quickActionCount}>{decisions.length}</span>
            Решения
          </button>
        )}
        
        {executions.length > 0 && (
          <button 
            className={`${styles.quickAction} ${activeTab === 'executions' ? styles.active : ''}`}
            onClick={() => setActiveTab('executions')}
          >
            <span className={styles.quickActionCount}>{executions.length}</span>
            Исполнения
          </button>
        )}
        
        {movements.length > 0 && (
          <button 
            className={`${styles.quickAction} ${activeTab === 'movements' ? styles.active : ''}`}
            onClick={() => setActiveTab('movements')}
          >
            <span className={styles.quickActionCount}>{movements.length}</span>
            Движение
          </button>
        )}
        
        {petitions.length > 0 && (
          <button 
            className={`${styles.quickAction} ${activeTab === 'petitions' ? styles.active : ''}`}
            onClick={() => setActiveTab('petitions')}
          >
            <span className={styles.quickActionCount}>{petitions.length}</span>
            Ходатайства
          </button>
        )}
        
        {civilClaims.length > 0 && normalizedType === 'criminal' && (
          <button 
            className={`${styles.quickAction} ${activeTab === 'civilClaims' ? styles.active : ''}`}
            onClick={() => setActiveTab('civilClaims')}
          >
            <span className={styles.quickActionCount}>{civilClaims.length}</span>
            Иски
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* Вкладка: Основная информация */}
        {activeTab === 'summary' && (
          <div className={styles.summaryContent}>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Номер дела:</span>
                <span className={styles.value}>{caseNumber}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Статус:</span>
                <span className={styles.value}>{getStatusText(caseData.status)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Судья:</span>
                <span className={styles.value}>
                  {caseData.presiding_judge_full_name || caseData.judge?.full_name || 'Не назначен'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Дата поступления:</span>
                <span className={styles.value}>{formatDate(caseData.incoming_date)}</span>
              </div>
              {caseData.case_name && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Наименование дела:</span>
                  <span className={styles.value}>{caseData.case_name}</span>
                </div>
              )}
              {caseData.article_criminal && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Статья УК РФ:</span>
                  <span className={styles.value}>{caseData.article_criminal}</span>
                </div>
              )}
              {caseData.offense_description && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Описание правонарушения:</span>
                  <span className={styles.value}>{caseData.offense_description}</span>
                </div>
              )}
              {caseData.claim_amount > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Цена иска:</span>
                  <span className={styles.value}>{formatCurrency(caseData.claim_amount)}</span>
                </div>
              )}
            </div>
            <div className={styles.lastActivity}>
              Обновлено: {formatDateTime(caseData.updated_at)}
            </div>
          </div>
        )}

        {/* Вкладка: Стороны по делу */}
        {activeTab === 'sides' && (
          <div className={styles.sidesContent}>
            {normalizedType === 'criminal' ? (
              <>
                {defendants.length > 0 && (
                  <>
                    <h3>Подсудимые/Обвиняемые</h3>
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
                    <h3>Адвокаты</h3>
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
                    <h3>Другие стороны</h3>
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
            {quickStats.allSides === 0 && quickStats.sides === 0 && quickStats.lawyers === 0 && (
              <p className={styles.noData}>Нет данных о сторонах</p>
            )}
          </div>
        )}

        {/* Вкладка: Решения по делу */}
        {activeTab === 'decisions' && (
          <div className={styles.decisionsContent}>
            {decisions.map(decision => (
              <div key={decision.id} className={styles.decisionCard}>
                <div className={styles.decisionHeader}>
                  <span className={styles.decisionDate}>
                    {formatDate(decision.decision_date || decision.court_consideration_date)}
                  </span>
                  <button 
                    className={styles.downloadButton}
                    onClick={() => handleDownloadDecision(decision.id, `Решение_${caseNumber}`)}
                  >
                    📄 Скачать решение
                  </button>
                </div>
                <div className={styles.decisionResult}>
                  <strong>Результат:</strong> {decision.outcome || decision.case_result || 'Решение вынесено'}
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
              <p className={styles.noData}>Нет решений по делу</p>
            )}
          </div>
        )}

        {/* Вкладка: Ходатайства */}
        {activeTab === 'petitions' && (
          <div className={styles.petitionsContent}>
            {petitions.map(petition => {
              const petitionDetail = petition.petitions_incase_detail || {};
              return (
                <div key={petition.id} className={styles.petitionCard}>
                  <div className={styles.petitionHeader}>
                    <span className={styles.petitionDate}>
                      {formatDate(petitionDetail.date_application)}
                    </span>
                  </div>
                  {petitionDetail.petitions_name?.length > 0 && (
                    <div className={styles.petitionTypes}>
                      Тип: {petitionDetail.petitions_name.map(p => p.name).join(', ')}
                    </div>
                  )}
                  {petition.petitioner_info && (
                    <div className={styles.petitionPetitioner}>
                      Заявитель: {petition.petitioner_info.name || petition.petitioner_info}
                    </div>
                  )}
                  {petitionDetail.date_decision && (
                    <div className={styles.petitionDecision}>
                      Решение от: {formatDate(petitionDetail.date_decision)}
                      {petitionDetail.decision_rendered?.name_case && 
                        ` — ${petitionDetail.decision_rendered.name_case}`
                      }
                    </div>
                  )}
                </div>
              );
            })}
            {petitions.length === 0 && (
              <p className={styles.noData}>Нет ходатайств по делу</p>
            )}
          </div>
        )}

        {/* Вкладка: Исполнения */}
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
              <p className={styles.noData}>Нет данных об исполнении</p>
            )}
          </div>
        )}

        {/* Вкладка: Движение дела */}
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
              <p className={styles.noData}>Нет данных о движении дела</p>
            )}
          </div>
        )}

        {/* Вкладка: Гражданские иски (только для уголовных дел) */}
        {activeTab === 'civilClaims' && normalizedType === 'criminal' && (
          <div className={styles.civilClaimsContent}>
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
              <p className={styles.noData}>Нет гражданских исков</p>
            )}
          </div>
        )}
      </div>

      <div className={styles.note}>
        <p>📌 Это страница предназначена только для просмотра. 
           Для подачи ходатайств или загрузки документов вернитесь в личный кабинет.</p>
      </div>
    </div>
  );
};

export default CaseDetailView;