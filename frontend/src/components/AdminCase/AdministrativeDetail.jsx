import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import styles from './AdministrativeDetail.module.css';
import ConfirmDialog from '../../pages/ConfirmDialog';
import {
  BasicInfoTab,
  ConsiderationTab,
  DecisionTab,
  ExecutionTab,
  AdditionalInfoTab
} from './AdministrativeTabComponents';
import NotificationsPanel from '../CaseManagement/NotificationsPanel';
import ProgressLog from '../CaseManagement/ProgressLog';
import SubjectDetail from './SubjectDetail';
import SecurityMeasureDetail from './SecurityMeasureDetail';

const AdministrativeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
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
    considerationType: [],
    outcome: [],
    punishmentType: [],
    executionResult: [],
    suspensionReason: []
  });
  const [isArchived, setIsArchived] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Подтверждение',
    message: '',
    onConfirm: null
  });
  const [judges, setJudges] = useState([]);
  const [referringAuthorities, setReferringAuthorities] = useState([]);
  const [collapsedNotifications, setCollapsedNotifications] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [caseOrderOptions, setCaseOrderOptions] = useState([]);
  const [caseCategoryOptions, setCaseCategoryOptions] = useState([]);
  const [executionStageOptions, setExecutionStageOptions] = useState([]);
  const [termComplianceOptions, setTermComplianceOptions] = useState([]);
  const [postponementReasons, setPostponementReasons] = useState([]);
  const [suspensionReasons, setSuspensionReasons] = useState([]);
  const [appealData, setAppealData] = useState(null);
  const [cassationData, setCassationData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [securityMeasures, setSecurityMeasures] = useState([]);
  const [isEditingAppeal, setIsEditingAppeal] = useState(false);
  const [isEditingCassation, setIsEditingCassation] = useState(false);
  
  // Состояния для сворачивания блоков в сайдбаре
  const [collapsedSections, setCollapsedSections] = useState({
    sides: true,
    decisions: true,
    executions: true,
    movements: true,
    petitions: true,
    subjects: true,
    securityMeasures: true
  });

  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        setLoading(true);
        
        console.log('Loading admin details for ID:', id);

        const adminResponse = await AdministrativeCaseService.getAdministrativeProceedingById(id);
        
        if (adminResponse) {
          console.log('Admin data loaded:', adminResponse);
          setAdminData(adminResponse);
          setFormData(adminResponse);
          setIsArchived(adminResponse.status === 'archived');
          
          // Загружаем связанные данные
          const sidesResponse = await AdministrativeCaseService.getSides(adminResponse.id);
          setSides(sidesResponse);
          
          const lawyersResponse = await AdministrativeCaseService.getLawyers(adminResponse.id);
          setLawyers(lawyersResponse);
          
          const decisionsResponse = await AdministrativeCaseService.getDecisions(adminResponse.id);
          setDecisions(decisionsResponse);
          
          const executionsResponse = await AdministrativeCaseService.getExecutions(adminResponse.id);
          setExecutions(executionsResponse);
          
          const movementsResponse = await AdministrativeCaseService.getMovements(adminResponse.id);
          setMovements(movementsResponse);
          
          const petitionsResponse = await AdministrativeCaseService.getPetitions(adminResponse.id);
          setPetitions(petitionsResponse);

          // Загружаем апелляцию и кассацию
          const appealResponse = await AdministrativeCaseService.getAppeal(adminResponse.id);
          setAppealData(appealResponse);

          const cassationResponse = await AdministrativeCaseService.getCassation(adminResponse.id);
          setCassationData(cassationResponse);

          // Загружаем субъекты и меры обеспечения
          const subjectsResponse = await AdministrativeCaseService.getSubjects(adminResponse.id);
          setSubjects(subjectsResponse);

          const measuresResponse = await AdministrativeCaseService.getSecurityMeasures(adminResponse.id);
          setSecurityMeasures(measuresResponse);
        } else {
          setError('Административное дело не найдено');
        }

        // Загружаем опции, судей и органы параллельно
        await Promise.all([
          loadOptions(),
          loadJudges(),
          loadReferringAuthorities()
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных административного дела:', err);
        setError('Не удалось загрузить данные административного дела');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchAdminDetails();
    }
  }, [id]);

  const loadJudges = async () => {
    try {
      const judgesData = await AdministrativeCaseService.getJudges();
      setJudges(judgesData);
    } catch (error) {
      console.error('Ошибка загрузки списка судей:', error);
      setJudges([]);
    }
  };

  const loadReferringAuthorities = async () => {
    try {
      const authoritiesData = await AdministrativeCaseService.getReferringAuthorities();
      setReferringAuthorities(authoritiesData);
    } catch (error) {
      console.error('Ошибка загрузки органов:', error);
      setReferringAuthorities([]);
    }
  };

  const loadOptions = async () => {
    try {
      const [optionsData, orderData, categoryData, stageData, termData, postponementData, suspensionData] = await Promise.all([
        AdministrativeCaseService.getAdminOptions(),
        AdministrativeCaseService.getCaseOrderOptions(),
        AdministrativeCaseService.getCaseCategoryOptions(),
        AdministrativeCaseService.getExecutionStageOptions(),
        AdministrativeCaseService.getTermComplianceOptions(),
        AdministrativeCaseService.getPostponementReasons(),
        AdministrativeCaseService.getSuspensionReasons(),
      ]);
      
      setOptions(optionsData);
      setCaseOrderOptions(orderData);
      setCaseCategoryOptions(categoryData);
      setExecutionStageOptions(stageData);
      setTermComplianceOptions(termData);
      setPostponementReasons(postponementData);
      setSuspensionReasons(suspensionData);
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
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

      // Удаляем связанные данные, которые не должны отправляться
      delete dataToSend.sides;
      delete dataToSend.lawyers;
      delete dataToSend.decisions;
      delete dataToSend.executions;
      delete dataToSend.movements;
      delete dataToSend.petitions;
      delete dataToSend.id;
      delete dataToSend.admin_decisions;
      delete dataToSend.admin_executions;
      delete dataToSend.presiding_judge_full_name;
      delete dataToSend.status_display;
      delete dataToSend.referring_authority_detail;
      delete dataToSend.registered_case_info;
      delete dataToSend.appeal;
      delete dataToSend.cassation;
      delete dataToSend.subjects;
      delete dataToSend.security_measures;

      if (isArchived) {
        const allowedFields = ['archive_notes', 'archived_date', 'status'];
        Object.keys(dataToSend).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete dataToSend[key];
          }
        });
      }

      const proceedingId = adminData.id;
      const updatedData = await AdministrativeCaseService.updateAdministrativeProceedings(proceedingId, dataToSend);
      
      setAdminData(updatedData);
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
          await AdministrativeCaseService.archiveAdministrativeProceeding(id);
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
          await AdministrativeCaseService.unarchiveAdministrativeProceeding(id);
          const updatedData = await AdministrativeCaseService.getAdministrativeProceedingById(id);
          setAdminData(updatedData);
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
    setFormData(adminData);
    setIsEditing(false);
  };

  // Навигация для создания
  const handleAddSide = () => {
    navigate(`/admin-proceedings/${id}/sides/create`);
  };

  const handleAddLawyer = () => {
    navigate(`/admin-proceedings/${id}/lawyers/create`);
  };

  const handleAddDecision = () => {
    navigate(`/admin-proceedings/${id}/decisions/create`);
  };

  const handleAddExecution = () => {
    navigate(`/admin-proceedings/${id}/executions/create`);
  };

  const handleAddMovement = () => {
    navigate(`/admin-proceedings/${id}/movements/create`);
  };

  const handleAddPetition = () => {
    navigate(`/admin-proceedings/${id}/petitions/create`);
  };

  // Навигация для просмотра/редактирования
  const handleViewSide = (sideId) => {
    navigate(`/admin-proceedings/${id}/sides/${sideId}`);
  };

  const handleViewLawyer = (lawyerId) => {
    navigate(`/admin-proceedings/${id}/lawyers/${lawyerId}`);
  };

  const handleViewDecision = (decisionId) => {
    navigate(`/admin-proceedings/${id}/decisions/${decisionId}`);
  };

  const handleViewExecution = (executionId) => {
    navigate(`/admin-proceedings/${id}/executions/${executionId}`);
  };

  const handleViewMovement = (movementId) => {
    navigate(`/admin-proceedings/${id}/movements/${movementId}`);
  };

  const handleViewPetition = (petitionId) => {
    navigate(`/admin-proceedings/${id}/petitions/${petitionId}`);
  };

  // Удаление
  const handleDeleteSide = async (sideId) => {
    if (window.confirm('Удалить сторону по делу?')) {
      try {
        await AdministrativeCaseService.deleteSide(id, sideId);
        setSides(sides.filter(s => s.id !== sideId));
      } catch (error) {
        console.error('Ошибка удаления стороны:', error);
        alert('Не удалось удалить сторону');
      }
    }
  };

  const handleDeleteLawyer = async (lawyerId) => {
    if (window.confirm('Удалить защитника?')) {
      try {
        await AdministrativeCaseService.deleteLawyer(id, lawyerId);
        setLawyers(lawyers.filter(l => l.id !== lawyerId));
      } catch (error) {
        console.error('Ошибка удаления защитника:', error);
        alert('Не удалось удалить защитника');
      }
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    if (window.confirm('Удалить постановление по делу?')) {
      try {
        await AdministrativeCaseService.deleteDecision(id, decisionId);
        setDecisions(decisions.filter(d => d.id !== decisionId));
      } catch (error) {
        console.error('Ошибка удаления постановления:', error);
        alert('Не удалось удалить постановление');
      }
    }
  };

  const handleDeleteExecution = async (executionId) => {
    if (window.confirm('Удалить исполнение по делу?')) {
      try {
        await AdministrativeCaseService.deleteExecution(id, executionId);
        setExecutions(executions.filter(e => e.id !== executionId));
      } catch (error) {
        console.error('Ошибка удаления исполнения:', error);
        alert('Не удалось удалить исполнение');
      }
    }
  };

  const handleDeleteMovement = async (movementId) => {
    if (window.confirm('Удалить движение по делу?')) {
      try {
        await AdministrativeCaseService.deleteMovement(id, movementId);
        setMovements(movements.filter(m => m.id !== movementId));
      } catch (error) {
        console.error('Ошибка удаления движения:', error);
        alert('Не удалось удалить движение');
      }
    }
  };

  const handleDeletePetition = async (petitionId) => {
    if (window.confirm('Удалить ходатайство?')) {
      try {
        await AdministrativeCaseService.deletePetition(id, petitionId);
        setPetitions(petitions.filter(p => p.id !== petitionId));
      } catch (error) {
        console.error('Ошибка удаления ходатайства:', error);
        alert('Не удалось удалить ходатайство');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Объединяем все стороны для отображения в сайдбаре
  const allSides = [
    ...sides.map(s => ({ 
      ...s, 
      sideType: 'side', 
      sideTypeLabel: 'Сторона',
      displayName: s.sides_case_incase_detail?.name || 'Сторона',
      statusText: s.sides_case_role_detail?.name || 'Сторона',
      detailPath: `/admin-proceedings/${id}/sides/${s.id}`
    })),
    ...lawyers.map(l => ({ 
      ...l, 
      sideType: 'lawyer', 
      sideTypeLabel: 'Защитник',
      displayName: l.lawyer_detail?.law_firm_name || 'Защитник',
      statusText: 'Представитель',
      detailPath: `/admin-proceedings/${id}/lawyers/${l.id}`
    }))
  ];

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!adminData) {
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
            Дело об АП №{adminData.case_number_admin || 'Не указано'}
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
                className={`${styles.tab} ${activeTab === 'consideration' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('consideration')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Рассмотрение
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'decision' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('decision')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Постановление
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'execution' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('execution')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Исполнение
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
                  adminData={adminData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                  judges={judges}
                  referringAuthorities={referringAuthorities}
                  caseOrderOptions={caseOrderOptions}
                  caseCategoryOptions={caseCategoryOptions}
                />
              )}
              {activeTab === 'consideration' && (
                <ConsiderationTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  adminData={adminData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                  suspensionReasons={suspensionReasons}
                />
              )}
              {activeTab === 'decision' && (
                <DecisionTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  adminData={adminData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  isArchived={isArchived}
                />
              )}
              {activeTab === 'execution' && (
                <ExecutionTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  adminData={adminData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  isArchived={isArchived}
                  executionResultOptions={options.executionResult || []}
                  executionStageOptions={executionStageOptions}
                />
              )}
              {activeTab === 'additional' && (
                <AdditionalInfoTab
                  isEditing={isEditing}
                  formData={formData}
                  adminData={adminData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  isArchived={isArchived}
                />
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - обновленные блоки в стиле уголовных дел */}
        <div className={styles.sidebar}>
          {/* Блок "Ход дела (справочный лист)" */}
          <ProgressLog 
            caseType="coap"
            caseId={id}
            onRefresh={refreshProgress}
          />
          <NotificationsPanel
            caseType="coap"
            caseId={id}
            caseNumber={adminData?.case_number_admin}
            collapsed={collapsedNotifications}
            onToggle={setCollapsedNotifications}
          />

          {/* Блок "Стороны по делу" */}
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
                {collapsedSections.sides ? 'Развернуть' : 'Свернуть'}
              </button>
            </div>
            
            {!collapsedSections.sides && (
              <div className={styles.sidebarSectionContent}>
                <button 
                  onClick={handleAddSide}
                  className={styles.addButton}
                >
                  + Добавить сторону
                </button>
                <button 
                  onClick={handleAddLawyer}
                  className={styles.addButton}
                  style={{ marginTop: '8px' }}
                >
                  + Добавить защитника
                </button>
                
                {allSides.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {allSides.slice(0, 5).map(side => (
                      <div 
                        key={`${side.sideType}-${side.id}`} 
                        className={`${styles.sidebarListItem} ${styles[`sideType-${side.sideType}`]}`}
                        onClick={() => navigate(side.detailPath)}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {side.displayName}
                          </span>
                          <span className={`${styles.sideType} ${styles[`sideType-${side.sideType}`]}`}>
                            {side.sideTypeLabel}
                          </span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>
                          {side.statusText}
                        </div>
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

          {/* Блок "Постановления" */}
          <div className={styles.sidebarSection}>
            <div 
              className={styles.sidebarSectionHeader}
              onClick={() => toggleSection('decisions')}
            >
              <h2 className={styles.sidebarSectionTitle}>
                Постановления 
                <span className={styles.sidebarSectionCount}>
                  {decisions.length}
                </span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.decisions ? 'Развернуть' : 'Свернуть'}
              </button>
            </div>
            
            {!collapsedSections.decisions && (
              <div className={styles.sidebarSectionContent}>
                <button 
                  onClick={handleAddDecision}
                  className={styles.addButton}
                >
                  + Добавить постановление
                </button>
                
                {decisions.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {decisions.slice(0, 3).map(decision => {
                      const outcomeMap = {
                        '1': 'Назначено наказание',
                        '2': 'Прекращено',
                        '3': 'Возвращено',
                        '4': 'Передано',
                        '5': 'Предупреждение'
                      };
                      return (
                        <div 
                          key={decision.id} 
                          className={`${styles.sidebarListItem} ${styles.sideType-decision}`}
                          onClick={() => handleViewDecision(decision.id)}
                        >
                          <div className={styles.sidebarListItemHeader}>
                            <span className={styles.sidebarListItemTitle}>
                              {decision.decision_date ? formatDate(decision.decision_date) : 'Постановление'}
                            </span>
                            <span className={`${styles.sideType} ${styles.sideType-decision}`}>
                              Решение
                            </span>
                          </div>
                          <div className={styles.sidebarListItemSubtitle}>
                            {outcomeMap[decision.outcome] || decision.outcome || 'Результат не указан'}
                          </div>
                          {decision.fine_amount > 0 && (
                            <div className={styles.sidebarListItemSubtitle}>
                              Штраф: {formatCurrency(decision.fine_amount)}
                            </div>
                          )}
                          <div className={styles.sidebarListItemHint}>
                            Нажмите для просмотра →
                          </div>
                        </div>
                      );
                    })}
                    {decisions.length > 3 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {decisions.length - 3} постановлений
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Постановления не добавлены</p>
                )}
              </div>
            )}
          </div>

          {/* Блок "Субъекты правонарушения" */}
          <div className={styles.sidebarSection}>
            <div 
              className={styles.sidebarSectionHeader}
              onClick={() => toggleSection('subjects')}
            >
              <h2 className={styles.sidebarSectionTitle}>
                Субъекты правонарушения 
                <span className={styles.sidebarSectionCount}>
                  {subjects.length}
                </span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.subjects ? 'Развернуть' : 'Свернуть'}
              </button>
            </div>
            
            {!collapsedSections.subjects && (
              <div className={styles.sidebarSectionContent}>
                <button 
                  onClick={() => navigate(`/admin-proceedings/${id}/subjects/create`)}
                  className={styles.addButton}
                >
                  + Добавить субъект
                </button>
                
                {subjects.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {subjects.slice(0, 5).map(subject => (
                      <div 
                        key={subject.id} 
                        className={`${styles.sidebarListItem} ${styles.sideType-subject}`}
                        onClick={() => navigate(`/admin-proceedings/${id}/subjects/${subject.id}`)}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {subject.subject_type_label || subject.subject_type}
                          </span>
                          <span className={`${styles.sideType} ${styles.sideType-subject}`}>
                            Субъект
                          </span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>
                          {subject.sides_case_incase_detail?.name || 'Сторона не указана'}
                        </div>
                        <div className={styles.sidebarListItemHint}>
                          Нажмите для просмотра →
                        </div>
                      </div>
                    ))}
                    {subjects.length > 5 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {subjects.length - 5} субъектов
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Субъекты не добавлены</p>
                )}
              </div>
            )}
          </div>

          {/* Блок "Меры обеспечения" */}
          <div className={styles.sidebarSection}>
            <div 
              className={styles.sidebarSectionHeader}
              onClick={() => toggleSection('securityMeasures')}
            >
              <h2 className={styles.sidebarSectionTitle}>
                Меры обеспечения 
                <span className={styles.sidebarSectionCount}>
                  {securityMeasures.length}
                </span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.securityMeasures ? 'Развернуть' : 'Свернуть'}
              </button>
            </div>
            
            {!collapsedSections.securityMeasures && (
              <div className={styles.sidebarSectionContent}>
                <button 
                  onClick={() => navigate(`/admin-proceedings/${id}/security-measures/create`)}
                  className={styles.addButton}
                >
                  + Добавить меру обеспечения
                </button>
                
                {securityMeasures.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {securityMeasures.slice(0, 5).map(measure => (
                      <div 
                        key={measure.id} 
                        className={`${styles.sidebarListItem} ${styles.sideType-measure}`}
                        onClick={() => navigate(`/admin-proceedings/${id}/security-measures/${measure.id}`)}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {measure.measure_type_label || measure.measure_type}
                          </span>
                          <span className={`${styles.sideType} ${styles.sideType-measure}`}>
                            Мера
                          </span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>
                          {measure.applied_date ? formatDate(measure.applied_date) : 'Дата не указана'}
                        </div>
                        {measure.amount > 0 && (
                          <div className={styles.sidebarListItemSubtitle}>
                            Сумма: {formatCurrency(measure.amount)}
                          </div>
                        )}
                        <div className={styles.sidebarListItemHint}>
                          Нажмите для просмотра →
                        </div>
                      </div>
                    ))}
                    {securityMeasures.length > 5 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {securityMeasures.length - 5} мер
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Меры обеспечения не добавлены</p>
                )}
              </div>
            )}
          </div>
          {/* Блок "Исполнения" */}
          <div className={styles.sidebarSection}>
            <div 
              className={styles.sidebarSectionHeader}
              onClick={() => toggleSection('executions')}
            >
              <h2 className={styles.sidebarSectionTitle}>
                Исполнения 
                <span className={styles.sidebarSectionCount}>
                  {executions.length}
                </span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.executions ? 'Развернуть' : 'Свернуть'}
              </button>
            </div>
            
            {!collapsedSections.executions && (
              <div className={styles.sidebarSectionContent}>
                <button 
                  onClick={handleAddExecution}
                  className={styles.addButton}
                >
                  + Добавить исполнение
                </button>
                
                {executions.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {executions.slice(0, 3).map(execution => {
                      const resultMap = {
                        '1': 'Исполнено',
                        '2': 'Не исполнено',
                        '3': 'Возвращено',
                        '4': 'Частично'
                      };
                      return (
                        <div 
                          key={execution.id} 
                          className={`${styles.sidebarListItem} ${styles.sideType-execution}`}
                          onClick={() => handleViewExecution(execution.id)}
                        >
                          <div className={styles.sidebarListItemHeader}>
                            <span className={styles.sidebarListItemTitle}>
                              {execution.execution_document_date ? formatDate(execution.execution_document_date) : 'Исполнение'}
                            </span>
                            <span className={`${styles.sideType} ${styles.sideType-execution}`}>
                              Исполнение
                            </span>
                          </div>
                          <div className={styles.sidebarListItemSubtitle}>
                            Результат: {resultMap[execution.execution_result] || execution.execution_result || 'Не указан'}
                          </div>
                          {execution.fine_paid && (
                            <div className={styles.sidebarListItemSubtitle}>
                              Штраф уплачен: {execution.fine_paid_date ? formatDate(execution.fine_paid_date) : 'Да'}
                            </div>
                          )}
                          <div className={styles.sidebarListItemHint}>
                            Нажмите для просмотра →
                          </div>
                        </div>
                      );
                    })}
                    {executions.length > 3 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {executions.length - 3} исполнений
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Исполнения не добавлены</p>
                )}
              </div>
            )}
          </div>
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

export default AdministrativeDetail;