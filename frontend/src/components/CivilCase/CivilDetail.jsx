import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';
import ConfirmDialog from '../../pages/ConfirmDialog';
import {
  BasicInfoTab,
  MovementTab,
  DeadlinesTab,
  AdditionalInfoTab
} from './CivilTabComponents';
import NotificationsPanel from '../CaseManagement/NotificationsPanel';

const CivilDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [civilData, setCivilData] = useState(null);
  const [sides, setSides] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
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
  const [isArchived, setIsArchived] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Подтверждение',
    message: '',
    onConfirm: null
  });
  const [judges, setJudges] = useState([]);
  const [collapsedNotifications, setCollapsedNotifications] = useState(false);

  // Состояния для сворачивания блоков в сайдбаре
  const [collapsedSections, setCollapsedSections] = useState({
    sides: true,
    decisions: true,
    executions: true,
    movements: true,
    petitions: true
  });

  useEffect(() => {
    const fetchCivilDetails = async () => {
      try {
        setLoading(true);
        
        console.log('Loading civil details for ID:', id);

        const civilResponse = await CivilCaseService.getCivilProceedingById(id);
        
        if (civilResponse) {
          console.log('Civil data loaded:', civilResponse);
          setCivilData(civilResponse);
          setFormData(civilResponse);
          setIsArchived(civilResponse.status === 'archived');
          
          // Загружаем связанные данные
          const sidesResponse = await CivilCaseService.getSides(civilResponse.id);
          setSides(sidesResponse);
          
          const lawyersResponse = await CivilCaseService.getLawyers(civilResponse.id);
          setLawyers(lawyersResponse);
          
          const decisionsResponse = await CivilCaseService.getDecisions(civilResponse.id);
          setDecisions(decisionsResponse);
          
          const executionsResponse = await CivilCaseService.getExecutions(civilResponse.id);
          setExecutions(executionsResponse);
          
          const movementsResponse = await CivilCaseService.getMovements(civilResponse.id);
          setMovements(movementsResponse);
          
          const petitionsResponse = await CivilCaseService.getPetitions?.(civilResponse.id) || [];
          setPetitions(petitionsResponse);
        } else {
          setError('Гражданское дело не найдено');
        }

        // Загружаем опции и судей параллельно
        await Promise.all([
          loadOptions(),
          loadJudges()
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных гражданского дела:', err);
        setError('Не удалось загрузить данные гражданского дела');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCivilDetails();
    }
  }, [id]);

  const loadJudges = async () => {
    try {
      const judgesData = await CivilCaseService.getJudges();
      setJudges(judgesData);
    } catch (error) {
      console.error('Ошибка загрузки списка судей:', error);
      setJudges([]);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await CivilCaseService.getCivilOptions();
      setOptions(response);
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      setOptions({
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
    }
  };

  const handleFieldChange = useCallback((name, value) => {
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'archived_date', 'status'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном деле');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, [isArchived, isEditing]);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'archived_date', 'status'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном деле');
        return;
      }
    }
    
    handleFieldChange(name, type === 'checkbox' ? checked : value);
  }, [handleFieldChange, isArchived, isEditing]);

  const handleDateChange = useCallback((name, dateString) => {
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'archived_date', 'status'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном деле');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  }, [isArchived, isEditing]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend = { ...formData };

      delete dataToSend.sides;
      delete dataToSend.lawyers;
      delete dataToSend.decisions;
      delete dataToSend.executions;
      delete dataToSend.movements;
      delete dataToSend.petitions;
      delete dataToSend.id;

      if (isArchived) {
        const allowedFields = ['archive_notes', 'archived_date', 'status'];
        Object.keys(dataToSend).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete dataToSend[key];
          }
        });
      }

      const proceedingId = civilData.id;
      const updatedData = await CivilCaseService.updateCivilProceedings(proceedingId, dataToSend);
      
      setCivilData(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
      setSaving(false);
      
      setIsArchived(updatedData.status === 'archived');
      
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
      alert('Ошибка при сохранении данных');
    }
  };

  const handleArchive = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Отправка в архив',
      message: 'Отправить дело в архив? После архивации дело будет доступно только в разделе "Архив".',
      onConfirm: async () => {
        try {
          await CivilCaseService.archiveCivilProceeding(id);
          navigate('/archive');
        } catch (err) {
          console.error('Error archiving:', err);
          alert('Ошибка отправки в архив: ' + (err.response?.data?.error || err.message));
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUnarchive = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Возврат из архива',
      message: 'Вернуть дело из архива?',
      onConfirm: async () => {
        try {
          await CivilCaseService.unarchiveCivilProceeding(id);
          const updatedData = await CivilCaseService.getCivilProceedingById(id);
          setCivilData(updatedData);
          setFormData(updatedData);
          setIsArchived(false);
          alert('Дело возвращено из архива');
        } catch (err) {
          console.error('Error unarchiving:', err);
          alert('Ошибка возврата из архива: ' + (err.response?.data?.error || err.message));
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCancel = () => {
    setFormData(civilData);
    setIsEditing(false);
  };

  const handleNavigateToSide = (sideId) => {
    navigate(`/civil-proceedings/${id}/sides/${sideId}`);
  };

  const handleNavigateToLawyer = (lawyerId) => {
    navigate(`/civil-proceedings/${id}/lawyers/${lawyerId}`);
  };

  const handleNavigateToDecision = (decisionId) => {
    navigate(`/civil-proceedings/${id}/decisions/${decisionId}`);
  };

  const handleNavigateToExecution = (executionId) => {
    navigate(`/civil-proceedings/${id}/executions/${executionId}`);
  };

  const handleNavigateToMovement = (movementId) => {
    navigate(`/civil-proceedings/${id}/movements/${movementId}`);
  };

  const handleNavigateToPetition = (petitionId) => {
    navigate(`/civil-proceedings/${id}/petitions/${petitionId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getOptionLabel = (optionsArray, value) => {
    if (!optionsArray || !value) return 'Не указано';
    const option = optionsArray.find(opt => opt.value === value);
    return option?.label || 'Не указано';
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

  // Объединяем все стороны для отображения
  const allSides = [
    ...sides.map(s => ({
      ...s,
      sideType: s.plaintiff_name ? 'plaintiff' : s.defendant_name ? 'defendant' : 'third_party',
      sideTypeLabel: s.plaintiff_name ? 'Истец' : s.defendant_name ? 'Ответчик' : 'Третье лицо',
      displayName: s.plaintiff_name || s.defendant_name || s.third_parties || 'Сторона',
      onClick: () => handleNavigateToSide(s.id)
    })),
    ...lawyers.map(l => ({
      ...l,
      sideType: 'lawyer',
      sideTypeLabel: 'Адвокат',
      displayName: l.lawyer_detail?.law_firm_name || 'Адвокат',
      onClick: () => handleNavigateToLawyer(l.id)
    }))
  ];

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!civilData) {
    return <div className={styles.error}>Данные не найдены</div>;
  }

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
          <h1 className={styles.title}>
            Гражданское дело №{civilData.case_number_civil || 'Не указано'}
            {isArchived && <span className={styles.archiveBadge}>АРХИВ</span>}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          {isArchived ? (
            <button 
              onClick={handleUnarchive}
              className={styles.unarchiveButton}
            >
              📤 Вернуть из архива
            </button>
          ) : (
            <button 
              onClick={handleArchive}
              className={styles.archiveButton}
            >
              📁 Сдать в архив
            </button>
          )}
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              className={styles.editButton}
              disabled={isArchived}
              title={isArchived ? "Редактирование архивных дел ограничено" : ""}
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
                className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('basic')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Основные сведения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'movement' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('movement')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Движение дела
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'deadlines' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('deadlines')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Сроки и делопроизводство
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'additional' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                Дополнительно
              </button>
            </div>
            <div className={styles.tabContentWrapper}>
              {activeTab === 'basic' && (
                <BasicInfoTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                  judges={judges}
                />
              )}
              {activeTab === 'movement' && (
                <MovementTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                />
              )}
              {activeTab === 'deadlines' && (
                <DeadlinesTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                />
              )}
              {activeTab === 'additional' && (
                <AdditionalInfoTab
                  isEditing={isEditing}
                  formData={formData}
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  formatDate={formatDate}
                  isArchived={isArchived}
                />
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - сайдбар */}
        <div className={styles.sidebar}>
          {/* Стороны по делу */}
          <div className={styles.sidebarSection}>
            <div 
              className={styles.sidebarSectionHeader}
              onClick={() => toggleSection('sides')}
            >
              <h2 className={styles.sidebarSectionTitle}>
                Стороны по делу
                <span className={styles.sidebarSectionCount}>
                  {allSides.length}
                </span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.sides ? '▶' : '▼'}
              </button>
            </div>
            
            {!collapsedSections.sides && (
              <div className={styles.sidebarSectionContent}>
                {allSides.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {allSides.slice(0, 5).map(side => (
                      <div 
                        key={`${side.sideType}-${side.id}`} 
                        className={`${styles.sidebarListItem} ${styles[`sideType-${side.sideType}`]}`}
                        onClick={side.onClick}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {side.displayName}
                          </span>
                          <span className={`${styles.sideType} ${styles[`sideType-${side.sideType}`]}`}>
                            {side.sideTypeLabel}
                          </span>
                        </div>
                        {side.phone && (
                          <div className={styles.sidebarListItemSubtitle}>
                            {side.phone}
                          </div>
                        )}
                        <div className={styles.sidebarListItemHint}>
                          Нажмите для просмотра →
                        </div>
                      </div>
                    ))}
                    {allSides.length > 5 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {allSides.length - 5} участников
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Нет данных о сторонах по делу</p>
                )}
              </div>
            )}
          </div>

          {/* Решения */}
          <div className={styles.sidebarSection}>
            <div 
              className={styles.sidebarSectionHeader}
              onClick={() => toggleSection('decisions')}
            >
              <h2 className={styles.sidebarSectionTitle}>
                Решения
                <span className={styles.sidebarSectionCount}>
                  {decisions.length}
                </span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.decisions ? '▶' : '▼'}
              </button>
            </div>
            
            {!collapsedSections.decisions && (
              <div className={styles.sidebarSectionContent}>
                {decisions.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {decisions.slice(0, 3).map(decision => (
                      <div 
                        key={decision.id} 
                        className={styles.sidebarListItem}
                        onClick={() => handleNavigateToDecision(decision.id)}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {decision.decision_date 
                              ? `Решение от ${formatDate(decision.decision_date)}`
                              : `Решение №${decision.id}`
                            }
                          </span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>
                          {decision.outcome ? getOptionLabel(options.consideration_result_main, decision.outcome) : 'Результат не указан'}
                        </div>
                        <div className={styles.sidebarListItemHint}>
                          Нажмите для просмотра →
                        </div>
                      </div>
                    ))}
                    {decisions.length > 3 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {decisions.length - 3} решений
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Нет данных о решениях</p>
                )}
              </div>
            )}
          </div>

          {/* Исполнение */}
          <div className={styles.sidebarSection}>
            <div 
              className={styles.sidebarSectionHeader}
              onClick={() => toggleSection('executions')}
            >
              <h2 className={styles.sidebarSectionTitle}>
                Исполнение
                <span className={styles.sidebarSectionCount}>
                  {executions.length}
                </span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.executions ? '▶' : '▼'}
              </button>
            </div>
            
            {!collapsedSections.executions && (
              <div className={styles.sidebarSectionContent}>
                {executions.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {executions.slice(0, 3).map(execution => (
                      <div 
                        key={execution.id} 
                        className={styles.sidebarListItem}
                        onClick={() => handleNavigateToExecution(execution.id)}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {execution.writ_execution_date 
                              ? `Исполнение от ${formatDate(execution.writ_execution_date)}`
                              : `Запись об исполнении №${execution.id}`
                            }
                          </span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>
                          {execution.execution_result 
                            ? `Результат: ${execution.execution_result}`
                            : execution.writ_received_by 
                              ? `Выдано: ${execution.writ_received_by}`
                              : 'Информация отсутствует'
                          }
                        </div>
                        <div className={styles.sidebarListItemHint}>
                          Нажмите для просмотра →
                        </div>
                      </div>
                    ))}
                    {executions.length > 3 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {executions.length - 3} записей
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Нет данных об исполнении</p>
                )}
              </div>
            )}
          </div>
          <NotificationsPanel
            caseType="civil"
            caseId={id}
            caseNumber={civilData?.case_number_civil}
            collapsed={collapsedNotifications}
            onToggle={setCollapsedNotifications}
          />
       </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default CivilDetail;