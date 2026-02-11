import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CriminalCaseService from '../API/CriminalCaseService';
import PetitionService from '../API/PetitionService';
import styles from './UI/Card/CriminalBusinessCard.module.css';
import baseService from '../API/baseService';

const CriminalBusinessCard = ({ card, remove }) => {
  const router = useNavigate();
  const [defendants, setDefendants] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [otherSides, setOtherSides] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [criminalCase, setCriminalCase] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  const [quickStats, setQuickStats] = useState({
    allSides: 0,
    defendants: 0,
    lawyers: 0,
    otherSides: 0,
    decisions: 0,
    petitions: 0,
    movements: 0,
    lastActivity: null
  });
  const BASE_URL = '/criminal-proceedings';

  useEffect(() => {
    if (card.is_criminal && card.criminal_proceedings_id) {
      loadCriminalCaseData();
      loadRelatedData();
    }
  }, [card]);

  const loadCriminalCaseData = async () => {
    try {
      const response = await CriminalCaseService.getCriminalProceedingById(card.criminal_proceedings_id);
      setCriminalCase(response);

      if (response) {
        setQuickStats(prev => ({
          ...prev,
          lastActivity: response.updated_at
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки уголовного дела:', error);
    }
  };

  const loadRelatedData = async () => {
    if (!card.criminal_proceedings_id) return;
    
    try {
      // Загрузка всех типов сторон
      const defendantsData = await CriminalCaseService.getDefendants(card.criminal_proceedings_id);
      setDefendants(defendantsData);
      
      const lawyersData = await CriminalCaseService.getLawyers(card.criminal_proceedings_id);
      setLawyers(lawyersData);
      
      const otherSidesData = await CriminalCaseService.getSides(card.criminal_proceedings_id);
      setOtherSides(otherSidesData);
      
      // Обновляем статистику
      setQuickStats(prev => ({
        ...prev,
        defendants: defendantsData.length,
        lawyers: lawyersData.length,
        otherSides: otherSidesData.length,
        allSides: defendantsData.length + lawyersData.length + otherSidesData.length
      }));
      
      // ДОБАВЛЯЕМ ЗАГРУЗКУ ДВИЖЕНИЙ ДЕЛА
      const movementsData = await CriminalCaseService.getCaseMovements(card.criminal_proceedings_id);
      setMovements(movementsData);
      setQuickStats(prev => ({ ...prev, movements: movementsData.length }));

      // ДОБАВЛЯЕМ ЗАГРУЗКУ ХОДАТАЙСТВ
      const petitionsData = await CriminalCaseService.getPetitions(card.criminal_proceedings_id);
      setPetitions(petitionsData);
      setQuickStats(prev => ({ ...prev, petitions: petitionsData.length }));

      const decisionsData = await CriminalCaseService.getDecisions(card.criminal_proceedings_id);
      setDecisions(decisionsData);
      setQuickStats(prev => ({ ...prev, decisions: decisionsData.length }));

    } catch (error) {
      console.error('Ошибка загрузки связанных данных:', error);
    }
  };

  const handleShowDetails = () => {
    if (card.criminal_proceedings_id) {
      router(`/criminal-proceedings/${card.criminal_proceedings_id}`);
    } else if (card.id) {
      // Если есть обычный ID карточки
      router(`/criminal-proceedings/${card.id}`);
    } else {
      console.error('Нет ID уголовного производства для перехода');
      // Попробуем использовать ID из card.id
      if (card.id) {
        router(`/criminal-proceedings/${card.id}`);
      }
    }
  };

  const handleDeleteCriminalCard = async () => {
    if (window.confirm('Удалить уголовное дело?')) {
      try {
        if (card.criminal_proceedings_id) {
          await CriminalCaseService.deleteCriminalProceedings(card.criminal_proceedings_id);
          remove(card.id);
        } else {
          console.error('Нет criminal_proceedings_id для удаления');
        }
      } catch (error) {
        console.error('Ошибка удаления уголовного дела:', error);
        alert('Не удалось удалить уголовное дело');
      }
    }
  };

  const handleAddDefendant = () => {
    if (card.criminal_proceedings_id) {
      router(`/criminal-proceedings/${card.criminal_proceedings_id}/defendants/create`);
    }
  };

  const handleAddLawyer = () => {
    if (card.criminal_proceedings_id) {
      router(`/criminal-proceedings/${card.criminal_proceedings_id}/lawyers-criminal/create`);
    }
  };

  const handleAddParty = () => {
    if (card.criminal_proceedings_id) {
      router(`/criminal-proceedings/${card.criminal_proceedings_id}/sides-case-in-case/create`);
    }
  };
  
  const handleAddDecision = () => {
    if (card.criminal_proceedings_id) {
      router(`/criminal-proceedings/${card.criminal_proceedings_id}/criminal-decisions/create`);
    }
  };
  
  const handleAddMovement = () => {
    if (card.criminal_proceedings_id) {
      router(`/criminal-proceedings/${card.criminal_proceedings_id}/criminal-case-movement/create`);
    }
  };
  
  const handleAddPetition = () => {
    if (card.criminal_proceedings_id) {
      router(`/criminal-proceedings/${card.criminal_proceedings_id}/petitions/create`);
    }
  };

  const handleShowSides = () => {
    setActiveTab('sides');
  };
  
  const handleShowDecisions = () => {
    setActiveTab('decisions');
  };
  
  const handleShowMovements = () => {
    setActiveTab('movements');
  };
  
  const handleShowPetitions = () => {
    setActiveTab('petitions');
  };
  
  const handleDeleteDefendant = async (defendantId) => {
    try {
      await CriminalCaseService.deleteDefendant(card.criminal_proceedings_id, defendantId);
      setDefendants(defendants.filter(d => d.id !== defendantId));
      setQuickStats(prev => ({ 
        ...prev, 
        defendants: prev.defendants - 1,
        allSides: prev.allSides - 1
      }));
    } catch (error) {
      console.error('Ошибка удаления подсудимого:', error);
    }
  };
  
  const handleDeleteLawyer = async (proceedingId, lawyerId) => {
    if (!lawyerId || lawyerId === 'undefined' || lawyerId === 'null') {
      console.error('Invalid lawyer ID for deletion:', lawyerId);
      alert('Неверный ID адвоката');
      return;
    }
    
    try {
      const lawyerData = await CriminalCaseService.getLawyerById(proceedingId, lawyerId);
      const lawyerCriminalId = lawyerData.sides_case_lawyer_criminal?.id;
      
      await CriminalCaseService.deleteLawyer(proceedingId, lawyerId);
      
      if (lawyerCriminalId) {
        try {
          await baseService.delete(`/business_card/lawyers/${lawyerCriminalId}/`);
        } catch (error) {
          console.warn('Не удалось удалить связанные данные адвоката:', error);
        }
      }
      
      setLawyers(lawyers.filter(l => l.id !== lawyerId));
      setQuickStats(prev => ({ 
        ...prev, 
        lawyers: prev.lawyers - 1,
        allSides: prev.allSides - 1
      }));
    } catch (error) {
      console.error('Ошибка удаления адвоката:', error);
      alert('Не удалось удалить адвоката. Проверьте подключение к серверу.');
    }
  };

  const handleDeleteSide = async (proceedingId, sideId) => {
    if (!sideId || sideId === 'undefined' || sideId === 'null') {
      console.error('Invalid side ID for deletion:', sideId);
      alert('Неверный ID стороны');
      return;
    }
    
    try {
      const sideData = await CriminalCaseService.getSideById(proceedingId, sideId);
      const sideInCaseId = sideData.criminal_side_case?.id;
      
      await CriminalCaseService.deleteSide(proceedingId, sideId);
      
      if (sideInCaseId) {
        try {
          await baseService.delete(`/business_card/sides-case-in-case/${sideInCaseId}/`);
        } catch (error) {
          console.warn('Не удалось удалить связанные данные стороны:', error);
        }
      }
      
      setOtherSides(otherSides.filter(s => s.id !== sideId));
      setQuickStats(prev => ({ 
        ...prev, 
        otherSides: prev.otherSides - 1,
        allSides: prev.allSides - 1
      }));
    } catch (error) {
      console.error('Ошибка удаления стороны:', error);
      alert('Не удалось удалить сторону. Проверьте подключение к серверу.');
    }
  };
  
  const handleDeleteDecision = async (decisionId) => {
    try {
      await CriminalCaseService.deleteDecision(card.criminal_proceedings_id, decisionId);
      setDecisions(decisions.filter(d => d.id !== decisionId));
      setQuickStats(prev => ({ ...prev, decisions: prev.decisions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления решения:', error);
    }
  };

  const handleDeletePetition = async (petitionId) => {
    try {
      await CriminalCaseService.deletePetition(card.criminal_proceedings_id, petitionId);
      setPetitions(petitions.filter(p => p.id !== petitionId));
      setQuickStats(prev => ({ ...prev, petitions: prev.petitions - 1 }));
    } catch (error) {
      console.error('Ошибка удаления ходатайства:', error);
    }
  };

  const handleDeleteMovement = async (proceedingId, movementId) => {
    try {
      await CriminalCaseService.deleteCaseMovement(proceedingId, movementId);
      setMovements(movements.filter(m => m.id !== movementId));
      setQuickStats(prev => ({ ...prev, movements: prev.movements - 1 }));
    } catch (error) {
      console.error('Ошибка удаления движения дела:', error);
    }
  };
  
  // Форматирование дат
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
  
  const SideItem = ({ side, type }) => {
    // Проверка валидности ID
    if (!side.id || side.id === 'undefined' || side.id === 'null') {
      console.error(`Invalid ${type} ID:`, side.id);
      return null;
    }
    
    let sideData = {};
    let deleteHandler = null;
    let viewPath = '';
    
    switch (type) {
      case 'defendant':
        sideData = {
          id: side.id,
          name: side.full_name_criminal || side.name || 'Не указано',
          sideType: side.sides_case_defendant_name || 'Подсудимый',
          birthDate: side.birth_date,
          type: 'defendant'
        };
        deleteHandler = () => handleDeleteDefendant(side.id);
        // Для подсудимого путь правильный
        viewPath = `/criminal-proceedings/${card.criminal_proceedings_id}/defendants/${side.id}`;
        break;
        
      case 'lawyer':
        sideData = {
          id: side.id,
          name: side.lawyer_detail?.law_firm_name || 
                side.sides_case_lawyer_detail?.sides_case || 
                'Адвокат',
          sideType: 'Адвокат',
          birthDate: null,
          type: 'lawyer'
        };
        // Исправлено: передаем proceedingId и lawyerId для удаления
        deleteHandler = () => handleDeleteLawyer(card.criminal_proceedings_id, side.id);
        // Исправлено: используем ID адвоката для редактирования, а не создания
        viewPath = `/criminal-proceedings/${card.criminal_proceedings_id}/lawyers-criminal/${side.id}`;
        break;
        
      case 'other':
        sideData = {
          id: side.id,
          name: side.criminal_side_case_detail?.name || 
                side.sides_case_criminal_detail?.sides_case || 
                'Сторона',
          sideType: side.sides_case_criminal_detail?.sides_case || 'Сторона',
          birthDate: null,
          type: 'other'
        };
        // Исправлено: передаем proceedingId и sideId для удаления
        deleteHandler = () => handleDeleteSide(card.criminal_proceedings_id, side.id);
        // Исправлено: используем ID стороны для редактирования, а не создания
        viewPath = `/criminal-proceedings/${card.criminal_proceedings_id}/sides-case-in-case/${side.id}`;
        break;
        
      default:
        return null;
    }
    
    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {sideData.name}
            <div className={styles.sideType}>
              {sideData.sideType}
            </div>
          </div>
          {sideData.birthDate && (
            <div className={styles.compactItemSubtitle}>
              {formatDate(sideData.birthDate)}
            </div>
          )}
        </div>
        <div className={styles.compactItemActions}>
          <button 
            onClick={() => router(viewPath)}
            className={styles.actionButton}
            title="Просмотреть"
          >
            →
          </button>
          <button 
            onClick={deleteHandler}
            className={styles.deleteButton}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  
  const DecisionItem = ({ decision }) => (
    <div className={styles.compactItem}>
      <div className={styles.compactItemContent}>
        <div className={styles.compactItemTitle}>
          Решение #{decision.id}
        </div>
        {decision.court_consideration_date && (
          <div className={styles.compactItemSubtitle}>
            {formatDate(decision.court_consideration_date)}
          </div>
        )}
      </div>
      <div className={styles.compactItemActions}>
        <button 
          onClick={() => router(`/criminal-proceedings/${card.criminal_proceedings_id}/criminal-decisions/${decision.id}`)}
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
  
  const PetitionItem = ({ petition }) => (
    <div className={styles.compactItem}>
      <div className={styles.compactItemContent}>
        <div className={styles.compactItemTitle}>
          Ходатайство #{petition.id}
        </div>
        {petition.date_of_petition && (
          <div className={styles.compactItemSubtitle}>
            {formatDate(petition.date_of_petition)}
          </div>
        )}
      </div>
      <div className={styles.compactItemActions}>
        <button 
          onClick={() => router(`/criminal-proceedings/${card.criminal_proceedings_id}/petitions/${petition.id}`)}
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
  
  const MovementItem = ({ movement }) => (
    <div className={styles.compactItem}>
      <div className={styles.compactItemContent}>
        <div className={styles.compactItemTitle}>        
          {movement.first_hearing_date && (
            <div className={styles.compactItemSubtitle}>
              {(movement.first_hearing_date)}
            </div>
          )}
          {movement.meeting_time && (
            <div className={styles.compactItemSubtitle}>
              {(movement.meeting_time)}
            </div>
          )}
        </div>
      </div>
      <div className={styles.compactItemActions}>
        <button 
          onClick={() => router(`/criminal-proceedings/${card.criminal_proceedings_id}/criminal-case-movement/${movement.id}`)}
          className={styles.actionButton}
          title="Просмотреть"
        >
          →
        </button>
        <button 
          onClick={() => handleDeleteMovement(card.criminal_proceedings_id, movement.id)}
          className={styles.deleteButton}
          title="Удалить"
        >
          ×
        </button>
      </div>
    </div>
  );
  
  // Объединяем все стороны в один массив для отображения
  const allSides = [
    ...defendants.map(d => ({ ...d, _type: 'defendant' })),
    ...lawyers.map(l => ({ ...l, _type: 'lawyer' })),
    ...otherSides.map(s => ({ ...s, _type: 'other' }))
  ];
  
  return (
    <div className={styles.cardContainer}>
      {/* Заголовок карточки */}
      <div className={styles.cardHeader}>
        <div className={styles.headerMain}>
          <div className={styles.caseType}>УГОЛОВНОЕ</div>
          <div className={styles.caseNumber}>
            {criminalCase?.case_number_criminal || card.original_name || card.case_number}
          </div>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.caseArticle}>
            {criminalCase?.article_criminal ? `ст. ${criminalCase.article_criminal}` : 'Статья не указана'}
          </div>
          <div className={styles.caseDate}>
            {formatDate(criminalCase?.initiation_date || card.pub_date)}
          </div>
        </div>
      </div>
      
      {/* Быстрые действия */}
      <div className={styles.quickActions}>
        <button 
          className={`${styles.quickAction} ${activeTab === 'sides' ? styles.active : ''}`}
          onClick={handleShowSides}
          title="Все стороны"
        >
          <span className={styles.quickActionCount}>{quickStats.allSides}</span>
          Стороны
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'movements' ? styles.active : ''}`}
          onClick={handleShowMovements}
          title="Движение дела"
        >
          <span className={styles.quickActionCount}>{quickStats.movements}</span>
          Движение
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'petitions' ? styles.active : ''}`}
          onClick={handleShowPetitions}
          title="Ходатайства"
        >
          <span className={styles.quickActionCount}>{quickStats.petitions}</span>
          Ходатайства
        </button>
        <button 
          className={`${styles.quickAction} ${activeTab === 'decisions' ? styles.active : ''}`}
          onClick={handleShowDecisions}
          title="Решения"
        >
          <span className={styles.quickActionCount}>{quickStats.decisions}</span>
          Решения
        </button>
      </div>
      
      {/* Контент в зависимости от активной вкладки */}
      <div className={styles.cardContent}>
        {activeTab === 'summary' && (
          <div className={styles.summaryContent}>
            
            <div className={styles.summaryDetails}>
              {criminalCase?.court_name && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Суд:</div>
                  <div className={styles.detailValue}>{criminalCase.court_name}</div>
                </div>
              )}
              {criminalCase?.judge_name && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Судья:</div>
                  <div className={styles.detailValue}>{criminalCase.judge_name}</div>
                </div>
              )}
            </div>
            
            <div className={styles.lastActivity}>
              Обновлено: {formatDateTime(quickStats.lastActivity)}
            </div>
          </div>
        )}
        
        {activeTab === 'sides' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <div className={styles.addButtonsGroup}>
                <button 
                  onClick={handleAddDefendant}
                  className={styles.addButton}
                  title="Добавить подсудимого/обвиняемого"
                >
                  + Подсудимый
                </button>
                <button 
                  onClick={handleAddLawyer}
                  className={styles.addButton}
                  title="Добавить адвоката"
                >
                  + Адвокат
                </button>
                <button 
                  onClick={handleAddParty}
                  className={styles.addButton}
                  title="Добавить сторону по делу"
                >
                  + Сторона
                </button>
              </div>
            </div>
            <div className={styles.compactList}>
              {allSides.length > 0 ? (
                allSides.map(side => (
                  <SideItem 
                    key={`${side._type}-${side.id}`} 
                    side={side} 
                    type={side._type} 
                  />
                ))
              ) : (
                <p className={styles.noData}>Стороны не добавлены</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'movements' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <h3>Движение дела ({movements.length})</h3>
              <button 
                onClick={handleAddMovement}
                className={styles.addButton}
              >
                + Добавить
              </button>
            </div>
            <div className={styles.compactList}>
              {movements.length > 0 ? (
                movements.map(movement => (
                  <MovementItem key={movement.id} movement={movement} />
                ))
              ) : (
                <p className={styles.noData}>Нет данных о движении дела</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'petitions' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <h3>Ходатайства ({petitions.length})</h3>
              <button 
                onClick={handleAddPetition}
                className={styles.addButton}
              >
                + Добавить
              </button>
            </div>
            <div className={styles.compactList}>
              {petitions.length > 0 ? (
                petitions.map(petition => (
                  <PetitionItem key={petition.id} petition={petition} />
                ))
              ) : (
                <p className={styles.noData}>Нет данных о ходатайствах</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'decisions' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <h3>Решения ({decisions.length})</h3>
              <button 
                onClick={handleAddDecision}
                className={styles.addButton}
              >
                + Добавить
              </button>
            </div>
            <div className={styles.compactList}>
              {decisions.length > 0 ? (
                decisions.map(decision => (
                  <DecisionItem key={decision.id} decision={decision} />
                ))
              ) : (
                <p className={styles.noData}>Нет данных о решениях</p>
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
          Подробнее
        </button>
          <div className={styles.footerActions}>
            <button 
              onClick={handleDeleteCriminalCard}
              className={styles.dangerButton}
              title="Удалить уголовное дело"
            >
              Удалить дело
            </button>
          </div>
      </div>
    </div>
  );
};

export default CriminalBusinessCard;