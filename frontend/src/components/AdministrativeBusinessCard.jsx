import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdministrativeCaseService from '../API/AdministrativeCaseService';
import styles from './UI/Card/AdministrativeBusinessCard.module.css';
import ConfirmModal from './UI/Modal/ConfirmModal';

const AdministrativeBusinessCard = ({ card, remove }) => {
  const router = useNavigate();
  const [adminCase, setAdminCase] = useState(null);
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
    fineAmount: 0,
    lastActivity: null
  });

  useEffect(() => {
    if (card.administrative_proceedings_id) {
      loadAdminCaseData();
      loadRelatedData();
    }
  }, [card]);

  const loadAdminCaseData = async () => {
    try {
      const response = await AdministrativeCaseService.getAdministrativeProceedingById(card.administrative_proceedings_id);
      setAdminCase(response);
      setIsArchived(response?.status === 'archived');

      if (response) {
        setQuickStats(prev => ({
          ...prev,
          lastActivity: response.updated_at,
          fineAmount: response.fine_amount || 0
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки административного дела:', error);
    }
  };

  const loadRelatedData = async () => {
    if (!card.administrative_proceedings_id) return;
    
    try {
      const sidesData = await AdministrativeCaseService.getSides(card.administrative_proceedings_id);
      setSides(sidesData);
      
      const lawyersData = await AdministrativeCaseService.getLawyers(card.administrative_proceedings_id);
      setLawyers(lawyersData);
      
      const decisionsData = await AdministrativeCaseService.getDecisions(card.administrative_proceedings_id);
      setDecisions(decisionsData);
      
      const executionsData = await AdministrativeCaseService.getExecutions(card.administrative_proceedings_id);
      setExecutions(executionsData);
      
      const movementsData = await AdministrativeCaseService.getMovements(card.administrative_proceedings_id);
      setMovements(movementsData);
      
      const petitionsData = await AdministrativeCaseService.getPetitions(card.administrative_proceedings_id);
      setPetitions(petitionsData);
      
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
    if (card.administrative_proceedings_id) {
      router(`/admin-proceedings/${card.administrative_proceedings_id}`);
    }
  };

  const handleDeleteAdminCard = async () => {
    setShowDeleteModal(false);
    try {
      if (card.administrative_proceedings_id) {
        if (window.deleteInProgress) return;
        window.deleteInProgress = true;
        
        await AdministrativeCaseService.deleteAdministrativeProceedings(card.administrative_proceedings_id);
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
    if (card.administrative_proceedings_id) {
      router(`/admin-proceedings/${card.administrative_proceedings_id}/sides/create`);
    }
  };

  const handleAddLawyer = () => {
    if (card.administrative_proceedings_id) {
      router(`/admin-proceedings/${card.administrative_proceedings_id}/lawyers/create`);
    }
  };

  const handleAddDecision = () => {
    if (card.administrative_proceedings_id) {
      router(`/admin-proceedings/${card.administrative_proceedings_id}/decisions/create`);
    }
  };

  const handleAddExecution = () => {
    if (card.administrative_proceedings_id) {
      router(`/admin-proceedings/${card.administrative_proceedings_id}/executions/create`);
    }
  };

  const handleAddMovement = () => {
    if (card.administrative_proceedings_id) {
      router(`/admin-proceedings/${card.administrative_proceedings_id}/movements/create`);
    }
  };

  const handleAddPetition = () => {
    if (card.administrative_proceedings_id) {
      router(`/admin-proceedings/${card.administrative_proceedings_id}/petitions/create`);
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
      await AdministrativeCaseService.deleteSide(card.administrative_proceedings_id, sideId);
      setSides(sides.filter(s => s.id !== sideId));
      setQuickStats(prev => ({ ...prev, sides: prev.sides - 1 }));
    } catch (error) {
      console.error('Ошибка удаления стороны:', error);
      alert('Не удалось удалить сторону');
    }
  };

  const handleDeleteLawyer = async (lawyerId) => {
    try {
      await AdministrativeCaseService.deleteLawyer(card.administrative_proceedings_id, lawyerId);
      setLawyers(lawyers.filter(l => l.id !== lawyerId));
      setQuickStats(prev => ({ ...prev, lawyers: prev.lawyers - 1 }));
    } catch (error) {
      console.error('Ошибка удаления защитника:', error);
      alert('Не удалось удалить защитника');
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    try {
      await AdministrativeCaseService.deleteDecision(card.administrative_proceedings_id, decisionId);
      setDecisions(decisions.filter(d => d.id !== decisionId));
      setQuickStats(prev => ({ ...prev, decisions: prev.decisions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления постановления:', error);
    }
  };

  const handleDeleteExecution = async (executionId) => {
    try {
      await AdministrativeCaseService.deleteExecution(card.administrative_proceedings_id, executionId);
      setExecutions(executions.filter(e => e.id !== executionId));
      setQuickStats(prev => ({ ...prev, executions: prev.executions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления исполнения:', error);
    }
  };

  const handleDeleteMovement = async (movementId) => {
    try {
      await AdministrativeCaseService.deleteMovement(card.administrative_proceedings_id, movementId);
      setMovements(movements.filter(m => m.id !== movementId));
      setQuickStats(prev => ({ ...prev, movements: prev.movements - 1 }));
    } catch (error) {
      console.error('Ошибка удаления движения:', error);
    }
  };

  const handleDeletePetition = async (petitionId) => {
    try {
      await AdministrativeCaseService.deletePetition(card.administrative_proceedings_id, petitionId);
      setPetitions(petitions.filter(p => p.id !== petitionId));
      setQuickStats(prev => ({ ...prev, petitions: prev.petitions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления ходатайства:', error);
      alert('Не удалось удалить ходатайство');
    }
  };

  const handleViewSide = (sideId) => {
    router(`/admin-proceedings/${card.administrative_proceedings_id}/sides/${sideId}`);
  };

  const handleViewLawyer = (lawyerId) => {
    router(`/admin-proceedings/${card.administrative_proceedings_id}/lawyers/${lawyerId}`);
  };

  const handleViewDecision = (decisionId) => {
    router(`/admin-proceedings/${card.administrative_proceedings_id}/decisions/${decisionId}`);
  };

  const handleViewExecution = (executionId) => {
    router(`/admin-proceedings/${card.administrative_proceedings_id}/executions/${executionId}`);
  };

  const handleViewMovement = (movementId) => {
    router(`/admin-proceedings/${card.administrative_proceedings_id}/movements/${movementId}`);
  };

  const handleViewPetition = (petitionId) => {
    router(`/admin-proceedings/${card.administrative_proceedings_id}/petitions/${petitionId}`);
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

  const getOffenseTypeInfo = () => {
    const index = adminCase?.registry_index || adminCase?.offense_type;
    
    if (index === '5') {
      return {
        label: 'Дело об административном правонарушении',
        badgeClass: styles.offenseBadge,
        icon: '📋'
      };
    } else if (index === '12') {
      return {
        label: 'Жалоба на постановление по делу об АП',
        badgeClass: styles.complaintBadge,
        icon: '⚖️'
      };
    }
    return {
      label: 'Административное дело',
      badgeClass: '',
      icon: '📁'
    };
  };

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

  const LawyerItem = ({ lawyer }) => {
    const lawyerDetail = lawyer.lawyer_detail || {};
    const roleDetail = lawyer.sides_case_role_detail || {};

    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {lawyerDetail.law_firm_name || 'Защитник'}
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
          '1': 'Назначено административное наказание',
          '2': 'Прекращено производство по делу',
          '3': 'Возвращено для устранения недостатков',
          '4': 'Передано по подведомственности',
          '5': 'Вынесено предупреждение',
        };
        return outcomeMap[decision.outcome] || `Результат ${decision.outcome}`;
      }
      
      return 'Результат не указан';
    };

    const getPunishmentText = () => {
      if (!decision.punishment_type) return null;
      
      const punishmentMap = {
        '1': 'Предупреждение',
        '2': 'Административный штраф',
        '3': 'Конфискация',
        '4': 'Лишение спецправа',
        '5': 'Адм. арест',
        '6': 'Дисквалификация',
        '7': 'Приостановление деятельности',
        '8': 'Обязательные работы',
        '9': 'Адм. выдворение',
      };
      return punishmentMap[decision.punishment_type];
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
          {getPunishmentText() && (
            <div className={styles.compactItemSubtitle}>
              Наказание: {getPunishmentText()}
              {decision.fine_amount > 0 && ` (${formatCurrency(decision.fine_amount)})`}
            </div>
          )}
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

  const ExecutionItem = ({ execution }) => (
    <div className={styles.compactItem}>
      <div className={styles.compactItemContent}>
        <div className={styles.compactItemTitle}>
          Исполнительное производство
          {execution.execution_document_date && (
            <span className={styles.sideType}>
              {formatDate(execution.execution_document_date)}
            </span>
          )}
        </div>
        {execution.execution_result && (
          <div className={styles.compactItemSubtitle}>
            Результат: {execution.get_execution_result_display || execution.execution_result}
          </div>
        )}
        {execution.fine_paid && (
          <div className={styles.compactItemSubtitle}>
            Штраф уплачен: {execution.fine_paid_date ? formatDate(execution.fine_paid_date) : 'Да'}
          </div>
        )}
        {execution.arrest_executed && (
          <div className={styles.compactItemSubtitle}>
            Арест исполнен
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
    const getMovementData = () => {
      if (movement.date_meeting) {
        return movement;
      }
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
            Судебное заседание
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

  const offenseTypeInfo = getOffenseTypeInfo();

  return (
    <>
      <div className={styles.cardContainer}>
        <div className={styles.cardHeader}>
          <div className={styles.headerMain}>
            <div className={styles.caseType}>
              КРФоАП
              {adminCase?.registry_index && (
                <span className={`${styles.indexBadge} ${offenseTypeInfo.badgeClass}`}>
                  {offenseTypeInfo.icon} {offenseTypeInfo.label} (индекс {adminCase.registry_index})
                </span>
              )}
              {isArchived && <span className={styles.archivedBadge}>АРХИВ</span>}
            </div>
            <div className={styles.caseNumber}>
              {adminCase?.case_number_admin || card.original_name || card.case_number || 'Без номера'}
            </div>
          </div>
          <div className={styles.headerMeta}>
            <div className={styles.caseJudge}>
              {adminCase?.presiding_judge_full_name ? `Судья: ${adminCase.presiding_judge_full_name}` : 'Судья не назначен'}
            </div>
            <div className={styles.caseDate}>
              {formatDate(adminCase?.incoming_date || card.pub_date)}
            </div>
          </div>
        </div>
        
        <div className={styles.quickActionsWrapper}>
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
              title="Постановления по делу"
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
            <button 
              className={`${styles.quickAction} ${activeTab === 'documents' ? styles.active : ''}`}
              onClick={() => router(`/admin-proceedings/${card.administrative_proceedings_id}/documents`)}
              title="Документы по делу"
            >
              <span className={styles.quickActionCount}>0</span>
              Документы
            </button>
          </div>
        </div>

        <div className={styles.cardContent}>
          {activeTab === 'summary' && (
            <div className={styles.summaryContent}>
              <div className={styles.summaryDetails}>
                {adminCase?.registry_index && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Тип дела:</div>
                    <div className={styles.detailValue}>
                      <span className={`${styles.typeBadge} ${offenseTypeInfo.badgeClass}`}>
                        {offenseTypeInfo.icon} {offenseTypeInfo.label}
                      </span>
                    </div>
                  </div>
                )}
                
                {adminCase?.article_number && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Статья КоАП РФ:</div>
                    <div className={styles.detailValue}>
                      Ст. {adminCase.article_number}
                      {adminCase.article_part && ` ч. ${adminCase.article_part}`}
                    </div>
                  </div>
                )}
                {adminCase?.referring_authority_detail && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Орган, составивший протокол:</div>
                    <div className={styles.detailValue}>
                      {adminCase.referring_authority_detail.name}
                    </div>
                  </div>
                )}
                {adminCase?.protocol_number && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Протокол №:</div>
                    <div className={styles.detailValue}>{adminCase.protocol_number}</div>
                  </div>
                )}
                {adminCase?.incoming_date && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Дата поступления:</div>
                    <div className={styles.detailValue}>{formatDate(adminCase.incoming_date)}</div>
                  </div>
                )}
                {adminCase?.offense_date && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Дата правонарушения:</div>
                    <div className={styles.detailValue}>
                      {formatDate(adminCase.offense_date)}
                      {adminCase.offense_time && ` ${adminCase.offense_time.slice(0,5)}`}
                    </div>
                  </div>
                )}
                {adminCase?.consideration_type && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Вид рассмотрения:</div>
                    <div className={styles.detailValue}>
                      {adminCase.get_consideration_type_display || adminCase.consideration_type}
                    </div>
                  </div>
                )}
                {adminCase?.hearing_date && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Дата рассмотрения:</div>
                    <div className={styles.detailValue}>{formatDate(adminCase.hearing_date)}</div>
                  </div>
                )}
                {quickStats.fineAmount > 0 && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Сумма штрафа:</div>
                    <div className={styles.detailValue}>{formatCurrency(quickStats.fineAmount)}</div>
                  </div>
                )}
                {adminCase?.status && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Статус:</div>
                    <div className={styles.detailValue}>{adminCase.status_display || adminCase.status}</div>
                  </div>
                )}
              </div>
              
              <div className={styles.lastActivity}>
                Обновлено: {formatDateTime(quickStats.lastActivity || adminCase?.updated_at)}
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
                    + Добавить защитника
                  </button>
                </div>
              </div>
              <div className={styles.compactList}>
                {sides.length > 0 && (
                  <>
                    <h4 className={styles.listSubtitle}>Стороны</h4>
                    {sides.map(side => (
                      <SideItem key={`side-${side.id}`} side={side} />
                    ))}
                  </>
                )}
                
                {lawyers.length > 0 && (
                  <>
                    <h4 className={styles.listSubtitle}>Защитники</h4>
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
                  + Добавить постановление
                </button>
              </div>
              <div className={styles.compactList}>
                {decisions.length > 0 ? (
                  decisions.map(decision => (
                    <DecisionItem key={decision.id} decision={decision} />
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <p>Постановления не добавлены</p>
                    <button 
                      onClick={handleAddDecision}
                      className={styles.emptyStateButton}
                    >
                      Добавить постановление
                    </button>
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
                    <button 
                      onClick={handleAddExecution}
                      className={styles.emptyStateButton}
                    >
                      Добавить исполнение
                    </button>
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
                    <button 
                      onClick={handleAddMovement}
                      className={styles.emptyStateButton}
                    >
                      Добавить движение
                    </button>
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
                    <button 
                      onClick={handleAddPetition}
                      className={styles.emptyStateButton}
                    >
                      Добавить ходатайство
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
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
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        message="Вы уверены, что хотите удалить административное дело?"
        onConfirm={handleDeleteAdminCard}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default AdministrativeBusinessCard;