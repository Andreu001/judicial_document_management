import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KasCaseService from '../API/KasCaseService';
import styles from './UI/Card/KasBusinessCard.module.css';
import ConfirmModal from './UI/Modal/ConfirmModal';

const KasBusinessCard = ({ card, remove }) => {
  const router = useNavigate();
  const [kasCase, setKasCase] = useState(null);
  const [sides, setSides] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [isArchived, setIsArchived] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [quickStats, setQuickStats] = useState({
    sides: 0,
    lawyers: 0,
    decisions: 0,
    executions: 0,
    movements: 0,
    petitions: 0,
    lastActivity: null
  });

  useEffect(() => {
    if (card.kas_proceedings_id) {
      loadKasCaseData();
      loadRelatedData();
    }
  }, [card]);

  const loadKasCaseData = async () => {
    try {
      const response = await KasCaseService.getKasProceedingById(card.kas_proceedings_id);
      setKasCase(response);
      setIsArchived(response?.status === 'archived');

      if (response) {
        setQuickStats(prev => ({
          ...prev,
          lastActivity: response.updated_at
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки административного дела:', error);
    }
  };

  const loadRelatedData = async () => {
    if (!card.kas_proceedings_id) return;
    
    try {
      // Загрузка сторон
      const sidesData = await KasCaseService.getSides(card.kas_proceedings_id);
      setSides(sidesData);
      
      // Загрузка представителей
      const lawyersData = await KasCaseService.getLawyers(card.kas_proceedings_id);
      setLawyers(lawyersData);
      
      // Загрузка решений
      const decisionsData = await KasCaseService.getDecisions(card.kas_proceedings_id);
      setDecisions(decisionsData);
      
      // Загрузка исполнений
      const executionsData = await KasCaseService.getExecutions(card.kas_proceedings_id);
      setExecutions(executionsData);
      
      // Загрузка движений дела
      const movementsData = await KasCaseService.getMovements(card.kas_proceedings_id);
      setMovements(movementsData);
      
      // Загрузка ходатайств
      const petitionsData = await KasCaseService.getPetitions(card.kas_proceedings_id);
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
    if (card.kas_proceedings_id) {
      router(`/kas-proceedings/${card.kas_proceedings_id}`);
    }
  };

  const handleDeleteKasCard = async () => {
    setShowDeleteModal(false);
    try {
      if (card.kas_proceedings_id) {
        if (window.deleteInProgress) return;
        window.deleteInProgress = true;
        
        await KasCaseService.deleteKasProceedings(card.kas_proceedings_id);
        remove(card.id);
      }
    } catch (error) {
      console.error('Ошибка удаления административного дела:', error);
    } finally {
      setTimeout(() => {
        window.deleteInProgress = false;
      }, 1000);
    }
  };

  const handleAddSide = () => {
    if (card.kas_proceedings_id) {
      router(`/kas-proceedings/${card.kas_proceedings_id}/sides/create`);
    }
  };

  const handleAddLawyer = () => {
    if (card.kas_proceedings_id) {
      router(`/kas-proceedings/${card.kas_proceedings_id}/lawyers/create`);
    }
  };

  const handleAddDecision = () => {
    if (card.kas_proceedings_id) {
      router(`/kas-proceedings/${card.kas_proceedings_id}/decisions/create`);
    }
  };

  const handleAddExecution = () => {
    if (card.kas_proceedings_id) {
      router(`/kas-proceedings/${card.kas_proceedings_id}/executions/create`);
    }
  };

  const handleAddMovement = () => {
    if (card.kas_proceedings_id) {
      router(`/kas-proceedings/${card.kas_proceedings_id}/movements/create`);
    }
  };

  const handleAddPetition = () => {
    if (card.kas_proceedings_id) {
      router(`/kas-proceedings/${card.kas_proceedings_id}/petitions/create`);
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
      await KasCaseService.deleteSide(card.kas_proceedings_id, sideId);
      setSides(sides.filter(s => s.id !== sideId));
      setQuickStats(prev => ({ ...prev, sides: prev.sides - 1 }));
    } catch (error) {
      console.error('Ошибка удаления стороны:', error);
      alert('Не удалось удалить сторону');
    }
  };

  const handleDeleteLawyer = async (lawyerId) => {
    try {
      await KasCaseService.deleteLawyer(card.kas_proceedings_id, lawyerId);
      setLawyers(lawyers.filter(l => l.id !== lawyerId));
      setQuickStats(prev => ({ ...prev, lawyers: prev.lawyers - 1 }));
    } catch (error) {
      console.error('Ошибка удаления представителя:', error);
      alert('Не удалось удалить представителя');
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    try {
      await KasCaseService.deleteDecision(card.kas_proceedings_id, decisionId);
      setDecisions(decisions.filter(d => d.id !== decisionId));
      setQuickStats(prev => ({ ...prev, decisions: prev.decisions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления решения:', error);
    }
  };

  const handleDeleteExecution = async (executionId) => {
    try {
      await KasCaseService.deleteExecution(card.kas_proceedings_id, executionId);
      setExecutions(executions.filter(e => e.id !== executionId));
      setQuickStats(prev => ({ ...prev, executions: prev.executions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления исполнения:', error);
    }
  };

  const handleDeleteMovement = async (movementId) => {
    try {
      await KasCaseService.deleteMovement(card.kas_proceedings_id, movementId);
      setMovements(movements.filter(m => m.id !== movementId));
      setQuickStats(prev => ({ ...prev, movements: prev.movements - 1 }));
    } catch (error) {
      console.error('Ошибка удаления движения:', error);
    }
  };

  const handleDeletePetition = async (petitionId) => {
    try {
      await KasCaseService.deletePetition(card.kas_proceedings_id, petitionId);
      setPetitions(petitions.filter(p => p.id !== petitionId));
      setQuickStats(prev => ({ ...prev, petitions: prev.petitions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления ходатайства:', error);
      alert('Не удалось удалить ходатайство');
    }
  };

  const handleViewSide = (sideId) => {
    router(`/kas-proceedings/${card.kas_proceedings_id}/sides/${sideId}`);
  };

  const handleViewLawyer = (lawyerId) => {
    router(`/kas-proceedings/${card.kas_proceedings_id}/lawyers/${lawyerId}`);
  };

  const handleViewDecision = (decisionId) => {
    router(`/kas-proceedings/${card.kas_proceedings_id}/decisions/${decisionId}`);
  };

  const handleViewExecution = (executionId) => {
    router(`/kas-proceedings/${card.kas_proceedings_id}/executions/${executionId}`);
  };

  const handleViewMovement = (movementId) => {
    router(`/kas-proceedings/${card.kas_proceedings_id}/movements/${movementId}`);
  };

  const handleViewPetition = (petitionId) => {
    router(`/kas-proceedings/${card.kas_proceedings_id}/petitions/${petitionId}`);
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

  // Компонент для отображения представителя
  const LawyerItem = ({ lawyer }) => {
    const lawyerDetail = lawyer.lawyer_detail || {};
    const roleDetail = lawyer.sides_case_role_detail || {};

    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {lawyerDetail.law_firm_name || 'Представитель'}
            <span className={styles.sideType}>
              {roleDetail.name || 'Представитель'}
            </span>
          </div>
          {lawyerDetail.law_firm_phone && (
            <div className={styles.compactItemSubtitle}>
              Телефон: {lawyerDetail.law_firm_phone}
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

  // Компонент для отображения решения
  const DecisionItem = ({ decision }) => {
    const getOutcomeText = () => {
      if (decision.get_outcome_display) {
        return decision.get_outcome_display;
      }
      if (decision.outcome_display) {
        return decision.outcome_display;
      }
      
      if (decision.outcome) {
        const outcomeMap = {
          '1': 'Иск удовлетворен',
          '1.1': 'Удовлетворен частично',
          '2': 'Отказано',
          '3': 'Дело прекращено',
          '4': 'Оставлено без рассмотрения',
          '5': 'Передано по подсудности',
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
          Исполнение решения
          {execution.writ_sent_to_bailiff_date && (
            <span className={styles.sideType}>
              {formatDate(execution.writ_sent_to_bailiff_date)}
            </span>
          )}
        </div>
        {execution.execution_amount && (
          <div className={styles.compactItemSubtitle}>
            Сумма: {formatCurrency(execution.execution_amount)}
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

  // Компонент для отображения движения дела
  const MovementItem = ({ movement }) => {
    const getMovementData = () => {
      if (movement.business_movement_detail) {
        return movement.business_movement_detail;
      }
      return movement;
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
          
          {movementData.meeting_time && (
            <div className={styles.compactItemSubtitle}>
              Время: {movementData.meeting_time.slice(0, 5)}
            </div>
          )}
          {movementData.result_court_session && (
            <div className={styles.compactItemSubtitle}>
              Результат: {movementData.result_court_session}
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

  // Компонент для отображения ходатайства
  const PetitionItem = ({ petition }) => {
    const petitionDetail = petition.petitions_incase_detail || {};

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
            КАС
            {isArchived && <span className={styles.archivedBadge}>АРХИВ</span>}
          </div>
          <div className={styles.caseNumber}>
            {kasCase?.case_number_kas || card.original_name || card.case_number || 'Без номера'}
          </div>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.caseJudge}>
            {kasCase?.presiding_judge_full_name ? `Судья: ${kasCase.presiding_judge_full_name}` : 'Судья не назначен'}
          </div>
          <div className={styles.caseDate}>
            {formatDate(kasCase?.incoming_date || card.pub_date)}
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
          Стороны
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'decisions' ? styles.active : ''}`}
          onClick={handleShowDecisions}
          title="Решения по делу"
        >
          Решения
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'executions' ? styles.active : ''}`}
          onClick={handleShowExecutions}
          title="Исполнение по делу"
        >
          Исполнения
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'movements' ? styles.active : ''}`}
          onClick={handleShowMovements}
          title="Движение дела"
        >
          Движения
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'petitions' ? styles.active : ''}`}
          onClick={handleShowPetitions}
          title="Ходатайства по делу"
        >
          Ходатайства
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'documents' ? styles.active : ''}`}
          onClick={() => router(`/kas-proceedings/${card.kas_proceedings_id}/documents`)}
          title="Документы по делу"
        >
          Документы
        </button>
      </div>

      <div className={styles.cardContent}>
        {activeTab === 'summary' && (
          <div className={styles.summaryContent}>
            <div className={styles.summaryDetails}>
              {kasCase?.case_category && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Категория дела:</div>
                  <div className={styles.detailValue}>
                    {kasCase.case_category}
                  </div>
                </div>
              )}
              {kasCase?.legal_relationship_sphere && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Сфера правоотношений:</div>
                  <div className={styles.detailValue}>
                    {kasCase.legal_relationship_sphere}
                  </div>
                </div>
              )}
              {kasCase?.incoming_date && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Дата поступления:</div>
                  <div className={styles.detailValue}>{formatDate(kasCase.incoming_date)}</div>
                </div>
              )}
              {kasCase?.incoming_from && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Откуда поступило:</div>
                  <div className={styles.detailValue}>{kasCase.incoming_from}</div>
                </div>
              )}
              {kasCase?.admission_order && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Порядок поступления:</div>
                  <div className={styles.detailValue}>
                    {kasCase.get_admission_order_display || kasCase.admission_order}
                  </div>
                </div>
              )}
              {kasCase?.hearing_date && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Дата рассмотрения:</div>
                  <div className={styles.detailValue}>{formatDate(kasCase.hearing_date)}</div>
                </div>
              )}
              {kasCase?.status && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Статус:</div>
                  <div className={styles.detailValue}>{kasCase.status_display || kasCase.status}</div>
                </div>
              )}
            </div>
            
            <div className={styles.lastActivity}>
              Обновлено: {formatDateTime(quickStats.lastActivity || kasCase?.updated_at)}
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
                  + Добавить представителя
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
              
              {/* Затем показываем представителей */}
              {lawyers.length > 0 && (
                <>
                  <h4 className={styles.listSubtitle}>Представители</h4>
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
                <div className={styles.emptyState}>
                  <p>Решения не добавлены</p>
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
                  <p>Исполнения не добавлены</p>
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
                  <p>Движения не добавлены</p>
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
            onClick={() => setShowDeleteModal(true)}
            className={styles.dangerButton}
            title="Удалить административное дело"
          >
            Удалить
          </button>
        </div>
      </div>
        <ConfirmModal
          isOpen={showDeleteModal}
          message="Вы уверены, что хотите удалить административное дело (КАС)?"
          onConfirm={handleDeleteKasCard}
          onCancel={() => setShowDeleteModal(false)}
        />
    </div>
  );
};

export default KasBusinessCard;