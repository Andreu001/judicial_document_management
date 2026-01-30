import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import baseService from '../../API/baseService';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';
import CivilNotifications from './CivilNotifications';
import {
  PreTrialTab,
  CaseMovementTab,
  ReconciliationTab,
  DurationTab,
  OtherMarksTab
} from './CivilTabComponents';

const CivilDetail = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [civilData, setCivilData] = useState(null);
  const [sides, setSides] = useState([]);
  const [procedureActions, setProcedureActions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('pretrial');
  const [options, setOptions] = useState({
    admission_order: [],
    postponed_reason: [],
    compliance_with_deadlines: [],
    ruling_type: [],
    consideration_result_main: [],
    consideration_result_additional: [],
    consideration_result_counter: [],
    second_instance_result: [],
    court_composition: []
  });
  const [card, setCard] = useState(null);
  const [judges, setJudges] = useState([]);

  useEffect(() => {
    const fetchCivilDetails = async () => {
      try {
        setLoading(true);
        
        // Загрузка карточки дела
        const cardResponse = await baseService.get(`/business_card/businesscard/${cardId}/`);
        setCard(cardResponse.data);
        
        // Загрузка гражданского дела
        const civilResponse = await CivilCaseService.getByBusinessCardId(cardId);
        
        if (civilResponse) {
          const civilDataWithCard = {
            ...civilResponse,
            case_number: civilResponse.case_number || cardResponse.data?.original_name || ''
          };
          
          setCivilData(civilDataWithCard);
          setFormData(civilDataWithCard);
          
          // Загрузка сторон
          const sidesResponse = await CivilCaseService.getSides(civilResponse.id);
          setSides(sidesResponse);
          
          // Загрузка действий по подготовке
          const actionsResponse = await CivilCaseService.getProcedureActions(civilResponse.id);
          setProcedureActions(actionsResponse);
        }
        
        // Загрузка опций
        await loadOptions();
        
        // Загрузка списка судей
        await loadJudges();
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных гражданского дела:', err);
        setError('Не удалось загрузить данные гражданского дела');
        setLoading(false);
      }
    };

    fetchCivilDetails();
  }, [cardId]);

  const loadOptions = async () => {
    try {
      const response = await CivilCaseService.getCivilOptions();
      setOptions({
        admission_order: response.admission_order || [],
        postponed_reason: response.postponed_reason || [],
        compliance_with_deadlines: response.compliance_with_deadlines || [],
        ruling_type: response.ruling_type || [],
        consideration_result_main: response.consideration_result_main || [],
        consideration_result_additional: response.consideration_result_additional || [],
        consideration_result_counter: response.consideration_result_counter || [],
        second_instance_result: response.second_instance_result || [],
        court_composition: response.court_composition || []
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      setOptions({});
    }
  };

  const loadJudges = async () => {
    try {
      const judgesList = await CivilCaseService.getJudges();
      setJudges(judgesList);
    } catch (error) {
      console.error('Ошибка загрузки списка судей:', error);
      setJudges([]);
    }
  };

  const handleFieldChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    handleFieldChange(name, type === 'checkbox' ? checked : value);
  }, [handleFieldChange]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend = { ...formData };
      
      // Удаляем лишние поля
      delete dataToSend.sides;
      delete dataToSend.procedure_actions;
      delete dataToSend.decisions;
      delete dataToSend.id;
      delete dataToSend.business_card;
      delete dataToSend.business_card_data;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;
      
      const updatedData = await CivilCaseService.updateByBusinessCard(cardId, dataToSend);
      
      setCivilData(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
    }
  };

  const handleDateChange = useCallback((name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  }, []);

  const handleCancel = () => {
    setFormData(civilData);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatBoolean = (value) => {
    return value ? 'Да' : 'Нет';
  };

  const getOptionLabel = (optionsArray, value) => {
    return optionsArray.find(opt => opt.value === value)?.label || 'Не указано';
  };

  // Функция проверки сроков
  const checkDeadlines = () => {
    if (!civilData) return null;

    const applicationDate = new Date(civilData.application_date);
    const acceptedDate = new Date(civilData.accepted_for_production);
    const consideredDate = civilData.decisions?.[0]?.considered_date ? 
      new Date(civilData.decisions[0].considered_date) : null;

    // Срок принятия к производству
    const acceptanceDays = acceptedDate ? 
      Math.floor((acceptedDate - applicationDate) / (1000 * 60 * 60 * 24)) : null;
    
    // Срок рассмотрения дела
    const considerationDays = consideredDate && acceptedDate ? 
      Math.floor((consideredDate - acceptedDate) / (1000 * 60 * 60 * 24)) : null;

    return {
      acceptance: {
        days: acceptanceDays,
        violation: acceptanceDays > 5 // Стандартный срок 5 дней
      },
      consideration: {
        days: considerationDays,
        statutory: civilData.statutory_period_days || 60,
        violation: considerationDays > (civilData.statutory_period_days || 60)
      }
    };
  };

  // Компонент вкладки сторон
  const SidesTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sidesSection}>
        <div className={styles.tabHeader}>
          <h3 className={styles.subsectionTitle}>А. Стороны по гражданскому делу</h3>
          <button 
            className={styles.addButton}
            onClick={() => navigate(`/civil/cases/${cardId}/sides/new`)}
          >
            + Добавить сторону
          </button>
        </div>
        
        {sides.length > 0 ? (
          <div className={styles.sidesGrid}>
            {sides.map(side => (
              <div key={side.id} className={styles.sideCard}>
                <div className={styles.sideHeader}>
                  <h4>Сторона #{side.id}</h4>
                  <div className={styles.sideActions}>
                    <button 
                      className={styles.editSideButton}
                      onClick={() => navigate(`/civil/cases/${cardId}/sides/${side.id}/edit`)}
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
                
                <div className={styles.sideContent}>
                  <div className={styles.sideColumn}>
                    <h5>Истец:</h5>
                    <p>{side.plaintiff_name || 'Не указан'}</p>
                    
                    <h5>Основное требование:</h5>
                    <p>{side.main_claim || 'Не указано'}</p>
                    <p><strong>Сумма:</strong> {side.main_claim_amount || '0'} руб.</p>
                    
                    <h5>Дополнительное требование:</h5>
                    <p>{side.additional_claim || 'Не указано'}</p>
                    <p><strong>Сумма:</strong> {side.additional_claim_amount || '0'} руб.</p>
                  </div>
                  
                  <div className={styles.sideColumn}>
                    <h5>Ответчик:</h5>
                    <p>{side.defendant_name || 'Не указан'}</p>
                    
                    <h5>Встречное требование:</h5>
                    <p>{side.counter_claim || 'Не указано'}</p>
                    <p><strong>Сумма (осн.):</strong> {side.counter_claim_amount_main || '0'} руб.</p>
                    <p><strong>Сумма (доп.):</strong> {side.counter_claim_amount_additional || '0'} руб.</p>
                  </div>
                  
                  <div className={styles.sideColumn}>
                    <h5>Третьи лица:</h5>
                    <p>{side.third_parties || 'Не указаны'}</p>
                    
                    {side.independent_claims && (
                      <>
                        <h5>Самостоятельные требования:</h5>
                        <p><strong>Сумма:</strong> {side.independent_claims_amount || '0'} руб.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noData}>
            <p>Стороны по делу не добавлены</p>
            <button 
              className={styles.addButton}
              onClick={() => navigate(`/civil/cases/${cardId}/sides/new`)}
            >
              + Добавить первую сторону
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Компонент вкладки действий по подготовке
  const ActionsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.actionsSection}>
        <div className={styles.tabHeader}>
          <h3 className={styles.subsectionTitle}>Действия на стадии подготовки дела</h3>
          <button 
            className={styles.addButton}
            onClick={() => navigate(`/civil/cases/${cardId}/actions/new`)}
          >
            + Добавить действие
          </button>
        </div>
        
        {procedureActions.length > 0 ? (
          <div className={styles.actionsGrid}>
            {procedureActions.map(action => (
              <div key={action.id} className={styles.actionCard}>
                <div className={styles.actionHeader}>
                  <h4>Действие #{action.id}</h4>
                  <span className={styles.actionDate}>
                    Создано: {formatDate(action.created_at)}
                  </span>
                </div>
                
                <div className={styles.actionContent}>
                  {action.preparation_order_date && (
                    <p><strong>Определение о подготовке:</strong> {formatDate(action.preparation_order_date)}</p>
                  )}
                  
                  {action.preliminary_hearing_order_date && (
                    <p><strong>Предварительное заседание:</strong> {formatDate(action.preliminary_hearing_order_date)}</p>
                  )}
                  
                  {action.examination_order_date && (
                    <p><strong>Экспертиза:</strong> {formatDate(action.examination_order_date)} ({action.examination_type})</p>
                  )}
                  
                  {action.claim_security_order_date && (
                    <p><strong>Обеспечение иска:</strong> {formatDate(action.claim_security_order_date)}</p>
                  )}
                  
                  <div className={styles.actionActions}>
                    <button 
                      className={styles.editActionButton}
                      onClick={() => navigate(`/civil/cases/${cardId}/actions/${action.id}/edit`)}
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noData}>
            <p>Действия по подготовке дела не добавлены</p>
            <button 
              className={styles.addButton}
              onClick={() => navigate(`/civil/cases/${cardId}/actions/new`)}
            >
              + Добавить первое действие
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className={styles.loading}>Загрузка данных гражданского дела...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!civilData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Данные гражданского дела не найдены</div>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          Назад
        </button>
      </div>
    );
  }

  const deadlines = checkDeadlines();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(-1)} 
            className={styles.backButton}
          >
            ← Назад
          </button>
          <h1 className={styles.title}>Гражданское дело №{card?.original_name || ''}</h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              className={styles.editButton}
            >
              Редактировать
            </button>
          ) : (
            <div className={styles.editButtons}>
              <button 
                onClick={handleSave} 
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                onClick={handleCancel} 
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Основной контент с вкладками */}
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'pretrial' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('pretrial')}
              >
                Досудебная подготовка
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'movement' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('movement')}
              >
                Движение дела
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'sides' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('sides')}
              >
                Стороны
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'reconciliation' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('reconciliation')}
              >
                Примирение
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'duration' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('duration')}
              >
                Сроки
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'actions' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                Действия
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'other' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('other')}
              >
                Другие отметки
              </button>
            </div>
            
            <div className={styles.tabContentWrapper}>
              {activeTab === 'pretrial' && (
                <PreTrialTab
                  isEditing={isEditing}
                  formData={formData}
                  options={options}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  card={card}
                  handleInputChange={handleInputChange}
                  handleFieldChange={handleFieldChange}
                  getOptionLabel={getOptionLabel}
                  formatBoolean={formatBoolean}
                  judges={judges}
                />
              )}
              
              {activeTab === 'movement' && (
                <CaseMovementTab
                  isEditing={isEditing}
                  formData={formData}
                  options={options}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatBoolean={formatBoolean}
                />
              )}
              
              {activeTab === 'sides' && <SidesTab />}
              
              {activeTab === 'reconciliation' && (
                <ReconciliationTab
                  isEditing={isEditing}
                  formData={formData}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  handleInputChange={handleInputChange}
                  formatBoolean={formatBoolean}
                />
              )}
              
              {activeTab === 'duration' && (
                <DurationTab
                  isEditing={isEditing}
                  formData={formData}
                  options={options}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  deadlines={deadlines}
                />
              )}
              
              {activeTab === 'actions' && <ActionsTab />}
              
              {activeTab === 'other' && (
                <OtherMarksTab
                  isEditing={isEditing}
                  formData={formData}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  handleInputChange={handleInputChange}
                  formatBoolean={formatBoolean}
                />
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - уведомления */}
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Статус дела</h2>
            
            <div className={styles.statusInfo}>
              <div className={styles.statusItem}>
                <strong>Статус:</strong>
                <span className={styles.statusValue}>
                  {civilData.handed_to_office_date ? 'В архиве' : 
                   civilData.effective_date ? 'Исполняется' : 
                   civilData.considered_date ? 'Рассмотрено' : 
                   civilData.accepted_for_production ? 'В производстве' : 
                   'Поступило'}
                </span>
              </div>
              
              <div className={styles.statusItem}>
                <strong>Судья:</strong>
                <span>{civilData.judge_name || 'Не назначен'}</span>
              </div>
              
              <div className={styles.statusItem}>
                <strong>Дата поступления:</strong>
                <span>{formatDate(civilData.application_date)}</span>
              </div>
              
              <div className={styles.statusItem}>
                <strong>Принято к производству:</strong>
                <span>{formatDate(civilData.accepted_for_production)}</span>
              </div>
            </div>
          </div>

          {/* Уведомления по срокам */}
          <CivilNotifications 
            cardId={cardId} 
            civilData={civilData} 
            deadlines={deadlines}
          />

          {/* Быстрые ссылки */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Быстрые действия</h2>
            
            <div className={styles.quickActions}>
              <button 
                className={styles.quickButton}
                onClick={() => navigate(`/civil/cases/${cardId}/decisions`)}
              >
                📄 Решения
              </button>
              
              <button 
                className={styles.quickButton}
                onClick={() => navigate(`/civil/cases/${cardId}/sides`)}
              >
                👥 Стороны
              </button>
              
              <button 
                className={styles.quickButton}
                onClick={() => navigate(`/civil/cases/${cardId}/actions`)}
              >
                ⚙️ Действия
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivilDetail;
