import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CivilCaseService from '../API/CivilCaseService';
import PetitionService from '../API/PetitionService';
import styles from './UI/Card/CivilBusinessCard.module.css';

const CivilBusinessCard = ({ card, remove }) => {
  const router = useNavigate();
  const [civilCase, setCivilCase] = useState(null);
  const [sides, setSides] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [isArchived, setIsArchived] = useState(false);

  const [quickStats, setQuickStats] = useState({
    sides: 0,
    lawyers: 0,
    decisions: 0,
    executions: 0,
    movements: 0,
    petitions: 0,
    claimAmount: 0,
    lastActivity: null
  });

  useEffect(() => {
    if (card.civil_proceedings_id) {
      loadCivilCaseData();
      loadRelatedData();
    }
  }, [card]);

  const loadCivilCaseData = async () => {
    try {
      const response = await CivilCaseService.getCivilProceedingById(card.civil_proceedings_id);
      setCivilCase(response);
      setIsArchived(response?.status === 'archived');

      if (response) {
        setQuickStats(prev => ({
          ...prev,
          lastActivity: response.updated_at,
          claimAmount: response.claim_amount || 0
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки гражданского дела:', error);
    }
  };

  const loadRelatedData = async () => {
    if (!card.civil_proceedings_id) return;
    
    try {
      // Загрузка сторон
      const sidesData = await CivilCaseService.getSides(card.civil_proceedings_id);
      setSides(sidesData);
      
      // Загрузка адвокатов
      const lawyersData = await CivilCaseService.getLawyers(card.civil_proceedings_id);
      setLawyers(lawyersData);
      
      // Загрузка решений
      const decisionsData = await CivilCaseService.getDecisions(card.civil_proceedings_id);
      setDecisions(decisionsData);
      
      // Загрузка исполнений
      const executionsData = await CivilCaseService.getExecutions(card.civil_proceedings_id);
      setExecutions(executionsData);
      
      // Загрузка движений дела
      const movementsData = await CivilCaseService.getMovements(card.civil_proceedings_id);
      setMovements(movementsData);
      
      // Загрузка ходатайств
      const petitionsData = await PetitionService.getAllPetitions(card.civil_proceedings_id);
      setPetitions(petitionsData);
      
      // Обновляем статистику
      setQuickStats(prev => ({
        ...prev,
        sides: sidesData.length,
        lawyers: lawyersData.length,
        decisions: decisionsData.length,
        executions: executionsData.length,
        movements: movementsData.length,
        petitions: petitionsData.length
      }));

    } catch (error) {
      console.error('Ошибка загрузки связанных данных:', error);
    }
  };

  const handleShowDetails = () => {
    if (card.civil_proceedings_id) {
      router(`/civil-proceedings/${card.civil_proceedings_id}`);
    }
  };

  const handleDeleteCivilCard = async () => {
    try {
      if (card.civil_proceedings_id) {
        // Добавляем флаг, чтобы предотвратить повторное удаление
        if (window.deleteInProgress) return;
        window.deleteInProgress = true;
        
        await CivilCaseService.deleteCivilProceedings(card.civil_proceedings_id);
        remove(card.id);
      }
    } catch (error) {
      console.error('Ошибка удаления гражданского дела:', error);
    } finally {
      // Сбрасываем флаг через небольшую задержку
      setTimeout(() => {
        window.deleteInProgress = false;
      }, 1000);
    }
  };

  const handleAddSide = () => {
    if (card.civil_proceedings_id) {
      router(`/civil-proceedings/${card.civil_proceedings_id}/sides/create`);
    }
  };

  const handleAddLawyer = () => {
    if (card.civil_proceedings_id) {
      router(`/civil-proceedings/${card.civil_proceedings_id}/lawyers/create`);
    }
  };

  const handleAddDecision = () => {
    if (card.civil_proceedings_id) {
      router(`/civil-proceedings/${card.civil_proceedings_id}/decisions/create`);
    }
  };

  const handleAddExecution = () => {
    if (card.civil_proceedings_id) {
      router(`/civil-proceedings/${card.civil_proceedings_id}/executions/create`);
    }
  };

  const handleAddMovement = () => {
    if (card.civil_proceedings_id) {
      router(`/civil-proceedings/${card.civil_proceedings_id}/movements/create`);
    }
  };

  const handleAddPetition = () => {
    if (card.civil_proceedings_id) {
      router(`/civil-proceedings/${card.civil_proceedings_id}/petitions/create`);
    }
  };

  const handleShowSides = () => {
    setActiveTab('sides');
  };

  const handleShowDecisions = () => {
    setActiveTab('decisions');
  };

  const handleShowExecutions = () => {
    setActiveTab('executions');
  };

  const handleShowMovements = () => {
    setActiveTab('movements');
  };

  const handleShowPetitions = () => {
    setActiveTab('petitions');
  };

  const handleDeleteSide = async (sideId) => {
    try {
      await CivilCaseService.deleteSide(card.civil_proceedings_id, sideId);
      setSides(sides.filter(s => s.id !== sideId));
      setQuickStats(prev => ({ ...prev, sides: prev.sides - 1 }));
    } catch (error) {
      console.error('Ошибка удаления стороны:', error);
      alert('Не удалось удалить сторону');
    }
  };

  const handleDeleteLawyer = async (lawyerId) => {
    try {
      await CivilCaseService.deleteLawyer(card.civil_proceedings_id, lawyerId);
      setLawyers(lawyers.filter(l => l.id !== lawyerId));
      setQuickStats(prev => ({ ...prev, lawyers: prev.lawyers - 1 }));
    } catch (error) {
      console.error('Ошибка удаления адвоката:', error);
      alert('Не удалось удалить адвоката');
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    try {
      await CivilCaseService.deleteDecision(card.civil_proceedings_id, decisionId);
      setDecisions(decisions.filter(d => d.id !== decisionId));
      setQuickStats(prev => ({ ...prev, decisions: prev.decisions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления решения:', error);
    }
  };

  const handleDeleteExecution = async (executionId) => {
    try {
      await CivilCaseService.deleteExecution(card.civil_proceedings_id, executionId);
      setExecutions(executions.filter(e => e.id !== executionId));
      setQuickStats(prev => ({ ...prev, executions: prev.executions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления исполнения:', error);
    }
  };

  const handleDeleteMovement = async (movementId) => {
    try {
      await CivilCaseService.deleteMovement(card.civil_proceedings_id, movementId);
      setMovements(movements.filter(m => m.id !== movementId));
      setQuickStats(prev => ({ ...prev, movements: prev.movements - 1 }));
    } catch (error) {
      console.error('Ошибка удаления движения:', error);
    }
  };

  const handleDeletePetition = async (petitionId) => {
    try {
      await PetitionService.deletePetition(card.civil_proceedings_id, petitionId);
      setPetitions(petitions.filter(p => p.id !== petitionId));
      setQuickStats(prev => ({ ...prev, petitions: prev.petitions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления ходатайства:', error);
      alert('Не удалось удалить ходатайство');
    }
  };

  const handleViewSide = (sideId) => {
    router(`/civil-proceedings/${card.civil_proceedings_id}/sides/${sideId}`);
  };

  const handleViewLawyer = (lawyerId) => {
    // Убедитесь, что lawyerId передается корректно
    console.log('Navigating to lawyer with ID:', lawyerId);
    router(`/civil-proceedings/${card.civil_proceedings_id}/lawyers/${lawyerId}`);
  };

  const handleViewDecision = (decisionId) => {
    router(`/civil-proceedings/${card.civil_proceedings_id}/decisions/${decisionId}`);
  };

  const handleViewExecution = (executionId) => {
    router(`/civil-proceedings/${card.civil_proceedings_id}/executions/${executionId}`);
  };

  const handleViewMovement = (movementId) => {
    router(`/civil-proceedings/${card.civil_proceedings_id}/movements/${movementId}`);
  };

  const handleViewPetition = (petitionId) => {
    router(`/civil-proceedings/${card.civil_proceedings_id}/petitions/${petitionId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Компонент для отображения стороны
  const SideItem = ({ side }) => {
    const sideDetail = side.sides_case_incase_detail || {};
    const roleDetail = side.sides_case_role_detail || {};

    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {sideDetail.name || 'Сторона по делу'}
            <span className={styles.sideType}>
              {roleDetail.name || 'Не указана'}
            </span>
          </div>
          {sideDetail.phone && (
            <div className={styles.compactItemSubtitle}>
              Телефон: {sideDetail.phone}
            </div>
          )}
        </div>
        <div className={styles.compactItemActions}>
          <button 
            onClick={() => handleViewSide(side.id)}
            className={styles.actionButton}
            title="Просмотреть"
          >
            →
          </button>
          <button 
            onClick={() => handleDeleteSide(side.id)}
            className={styles.deleteButton}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Компонент для отображения адвоката
  const LawyerItem = ({ lawyer }) => {
    const lawyerDetail = lawyer.lawyer_detail || {};
    const roleDetail = lawyer.sides_case_role_detail || {};

    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {lawyerDetail.law_firm_name || 'Адвокат'}
            <span className={styles.sideType}>
              {roleDetail.law_firm_name || 'Представитель'}
            </span>
          </div>
          {lawyerDetail.phone && (
            <div className={styles.compactItemSubtitle}>
              Телефон: {lawyerDetail.phone}
            </div>
          )}
        </div>
        <div className={styles.compactItemActions}>
          <button 
            onClick={() => handleViewLawyer(lawyer.id)}
            className={styles.actionButton}
            title="Просмотреть"
          >
            →
          </button>
          <button 
            onClick={() => handleDeleteLawyer(lawyer.id)}
            className={styles.deleteButton}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const DecisionItem = ({ decision }) => {
    // Функция для получения текстового значения результата
    const getOutcomeText = () => {
      // Сначала проверяем, есть ли display поле
      if (decision.get_outcome_display) {
        return decision.get_outcome_display;
      }
      if (decision.outcome_display) {
        return decision.outcome_display;
      }
      
      // Если display поля нет, но есть outcome (ID), пробуем получить из choices модели
      if (decision.outcome) {
        const outcomeMap = {
          '1': 'Иск удовлетворён полностью',
          '2': 'Иск удовлетворён частично',
          '3': 'В иске отказано',
          '4': 'Производство прекращено',
          '5': 'Заявление оставлено без рассмотрения',
          '6': 'Передано по подсудности',
          '7': 'Вынесено судебное решение (не иск)',
          '8': 'Судебный приказ',
        };
        return outcomeMap[decision.outcome] || `Результат ${decision.outcome}`;
      }
      
      return 'Результат не указан';
    };

    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {getOutcomeText()}
            {decision.decision_date && (
              <span className={styles.sideType}>
                {formatDate(decision.decision_date)}
              </span>
            )}
          </div>
          {decision.decision_effective_date && (
            <div className={styles.compactItemSubtitle}>
              Вступило в силу: {formatDate(decision.decision_effective_date)}
            </div>
          )}
        </div>
        <div className={styles.compactItemActions}>
          <button 
            onClick={() => handleViewDecision(decision.id)}
            className={styles.actionButton}
            title="Просмотреть"
          >
            →
          </button>
          <button 
            onClick={() => handleDeleteDecision(decision.id)}
            className={styles.deleteButton}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Компонент для отображения исполнения
  const ExecutionItem = ({ execution }) => (
    <div className={styles.compactItem}>
      <div className={styles.compactItemContent}>
        <div className={styles.compactItemTitle}>
          Исполнительный лист
          {execution.writ_execution_date && (
            <span className={styles.sideType}>
              {formatDate(execution.writ_execution_date)}
            </span>
          )}
        </div>
        {execution.execution_result && (
          <div className={styles.compactItemSubtitle}>
            Результат: {execution.get_execution_result_display || execution.execution_result}
          </div>
        )}
        {execution.execution_date && (
          <div className={styles.compactItemSubtitle}>
            Дата исполнения: {formatDate(execution.execution_date)}
          </div>
        )}
      </div>
      <div className={styles.compactItemActions}>
        <button 
          onClick={() => handleViewExecution(execution.id)}
          className={styles.actionButton}
          title="Просмотреть"
        >
          →
        </button>
        <button 
          onClick={() => handleDeleteExecution(execution.id)}
          className={styles.deleteButton}
          title="Удалить"
        >
          ×
        </button>
      </div>
    </div>
  );

  const MovementItem = ({ movement }) => {
    // Функция для безопасного получения данных из движения
    const getMovementData = () => {
      // Если данные приходят напрямую в movement
      if (movement.date_meeting) {
        return movement;
      }
      // Если данные обернуты в business_movement_detail
      else if (movement.business_movement_detail) {
        return movement.business_movement_detail;
      }
      return null;
    };

    const movementData = getMovementData();
    
    if (!movementData) {
      return (
        <div className={styles.compactItem}>
          <div className={styles.compactItemContent}>
            <div className={styles.compactItemTitle}>
              Движение дела (данные не загружены)
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            Заседание суда
            {movementData.date_meeting && (
              <span className={styles.sideType}>
                {formatDate(movementData.date_meeting)}
              </span>
            )}
          </div>
          
          {/* Время заседания */}
          {movementData.meeting_time && (
            <div className={styles.compactItemSubtitle}>
              {movementData.meeting_time.slice(0, 5)}
            </div>
          )}
        </div>
        
        <div className={styles.compactItemActions}>
          <button 
            onClick={() => handleViewMovement(movement.id)}
            className={styles.actionButton}
            title="Просмотреть"
          >
            →
          </button>
          <button 
            onClick={() => handleDeleteMovement(movement.id)}
            className={styles.deleteButton}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const PetitionItem = ({ petition }) => {
      const petitionDetail = petition.petitions_incase_detail || {};
      // Убираем petitioner_info, так как его пока нет

      return (
          <div className={styles.compactItem}>
              <div className={styles.compactItemContent}>
                  <div className={styles.compactItemTitle}>
                      Ходатайство
                      {petitionDetail.date_application && (
                          <span className={styles.sideType}>
                              {formatDate(petitionDetail.date_application)}
                          </span>
                      )}
                  </div>
                  {petitionDetail.petitions_name && petitionDetail.petitions_name.length > 0 && (
                      <div className={styles.compactItemSubtitle}>
                          Тип: {petitionDetail.petitions_name.map(p => p.name).join(', ')}
                      </div>
                  )}
                  {petitionDetail.date_decision && (
                      <div className={styles.compactItemSubtitle}>
                          Решение от: {formatDate(petitionDetail.date_decision)}
                      </div>
                  )}
              </div>
              <div className={styles.compactItemActions}>
                  <button 
                      onClick={() => handleViewPetition(petition.id)}
                      className={styles.actionButton}
                      title="Просмотреть"
                  >
                      →
                  </button>
                  <button 
                      onClick={() => handleDeletePetition(petition.id)}
                      className={styles.deleteButton}
                      title="Удалить"
                  >
                      ×
                  </button>
              </div>
          </div>
      );
  };

  return (
    <div className={styles.cardContainer}>
      {/* Заголовок карточки */}
      <div className={styles.cardHeader}>
        <div className={styles.headerMain}>
          <div className={styles.caseType}>
            ГРАЖДАНСКОЕ
            {isArchived && <span className={styles.archivedBadge}>АРХИВ</span>}
          </div>
          <div className={styles.caseNumber}>
            {civilCase?.case_number_civil || card.original_name || card.case_number || 'Без номера'}
          </div>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.caseJudge}>
            {civilCase?.presiding_judge_full_name ? `Судья: ${civilCase.presiding_judge_full_name}` : 'Судья не назначен'}
          </div>
          <div className={styles.caseDate}>
            {formatDate(civilCase?.incoming_date || card.pub_date)}
          </div>
        </div>
      </div>
      
      {/* Быстрые действия */}
      <div className={styles.quickActions}>
        <button 
          className={`${styles.quickAction} ${activeTab === 'sides' ? styles.active : ''}`}
          onClick={handleShowSides}
          title="Стороны по делу"
        >
          <span className={styles.quickActionCount}>{quickStats.sides}</span>
          Стороны
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'decisions' ? styles.active : ''}`}
          onClick={handleShowDecisions}
          title="Решения по делу"
        >
          <span className={styles.quickActionCount}>{quickStats.decisions}</span>
          Решения
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'executions' ? styles.active : ''}`}
          onClick={handleShowExecutions}
          title="Исполнение по делу"
        >
          <span className={styles.quickActionCount}>{quickStats.executions}</span>
          Исполнения
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'movements' ? styles.active : ''}`}
          onClick={handleShowMovements}
          title="Движение дела"
        >
          <span className={styles.quickActionCount}>{quickStats.movements}</span>
          Движения
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'petitions' ? styles.active : ''}`}
          onClick={handleShowPetitions}
          title="Ходатайства по делу"
        >
          <span className={styles.quickActionCount}>{quickStats.petitions}</span>
          Ходатайства
        </button>
      </div>

      <div className={styles.cardContent}>
        {activeTab === 'summary' && (
          <div className={styles.summaryContent}>
            <div className={styles.summaryDetails}>
              {civilCase?.category && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Категория дела:</div>
                  <div className={styles.detailValue}>
                    {civilCase.get_category_display || civilCase.category}
                  </div>
                </div>
              )}
              {civilCase?.case_type && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Вид производства:</div>
                  <div className={styles.detailValue}>
                    {civilCase.get_case_type_display || civilCase.case_type}
                  </div>
                </div>
              )}
              {civilCase?.incoming_date && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Дата поступления:</div>
                  <div className={styles.detailValue}>{formatDate(civilCase.incoming_date)}</div>
                </div>
              )}
              {civilCase?.incoming_from && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Откуда поступило:</div>
                  <div className={styles.detailValue}>{civilCase.incoming_from}</div>
                </div>
              )}
              {quickStats.claimAmount > 0 && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Цена иска:</div>
                  <div className={styles.detailValue}>{formatCurrency(quickStats.claimAmount)}</div>
                </div>
              )}
              {civilCase?.hearing_date && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Дата рассмотрения:</div>
                  <div className={styles.detailValue}>{formatDate(civilCase.hearing_date)}</div>
                </div>
              )}
              {civilCase?.status && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Статус:</div>
                  <div className={styles.detailValue}>{civilCase.status_display || civilCase.status}</div>
                </div>
              )}
            </div>
            
            <div className={styles.lastActivity}>
              Обновлено: {formatDateTime(quickStats.lastActivity || civilCase?.updated_at)}
            </div>
          </div>
        )}
        
        {activeTab === 'sides' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <div className={styles.tabHeaderActions}>
                <button 
                  onClick={handleAddSide}
                  className={styles.addButton}
                >
                  + Добавить сторону
                </button>
                <button 
                  onClick={handleAddLawyer}
                  className={styles.addButton}
                >
                  + Добавить адвоката
                </button>
              </div>
            </div>
            <div className={styles.compactList}>
              {/* Сначала показываем стороны */}
              {sides.length > 0 && (
                <>
                  <h4 className={styles.listSubtitle}>Стороны</h4>
                  {sides.map(side => (
                    <SideItem key={`side-${side.id}`} side={side} />
                  ))}
                </>
              )}
              
              {/* Затем показываем адвокатов */}
              {lawyers.length > 0 && (
                <>
                  <h4 className={styles.listSubtitle}>Адвокаты-представители</h4>
                  {lawyers.map(lawyer => (
                    <LawyerItem key={`lawyer-${lawyer.id}`} lawyer={lawyer} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'decisions' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <button 
                onClick={handleAddDecision}
                className={styles.addButton}
              >
                + Добавить решение
              </button>
            </div>
            <div className={styles.compactList}>
              {decisions.length > 0 ? (
                decisions.map(decision => (
                  <DecisionItem key={decision.id} decision={decision} />
                ))
              ) : (
                <div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'executions' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <button 
                onClick={handleAddExecution}
                className={styles.addButton}
              >
                + Добавить исполнение
              </button>
            </div>
            <div className={styles.compactList}>
              {executions.length > 0 ? (
                executions.map(execution => (
                  <ExecutionItem key={execution.id} execution={execution} />
                ))
              ) : (
                <div className={styles.emptyState}>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'movements' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <button 
                onClick={handleAddMovement}
                className={styles.addButton}
              >
                + Добавить движение
              </button>
            </div>
            <div className={styles.compactList}>
              {movements.length > 0 ? (
                movements.map(movement => (
                  <MovementItem key={movement.id} movement={movement} />
                ))
              ) : (
                <div className={styles.emptyState}>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'petitions' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <button 
                onClick={handleAddPetition}
                className={styles.addButton}
              >
                + Добавить ходатайство
              </button>
            </div>
            <div className={styles.compactList}>
              {petitions.length > 0 ? (
                petitions.map(petition => (
                  <PetitionItem key={petition.id} petition={petition} />
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>Ходатайства не добавлены</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Футер с основными действиями */}
      <div className={styles.cardFooter}>
        <button 
          onClick={handleShowDetails}
          className={styles.primaryButton}
        >
          Подробнее о деле
        </button>
        <div className={styles.footerActions}>
          <button 
            onClick={handleDeleteCivilCard}
            className={styles.dangerButton}
            title="Удалить гражданское дело"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default CivilBusinessCard;