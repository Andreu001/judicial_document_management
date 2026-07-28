// CriminalDetail.jsx - полная версия с движением дела

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import baseService from '../../API/baseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './CriminalDetail.module.css';
import {
  BasicInfoTab,
  EvidenceTab,
  CaseCategoryTab,
  ResultTab,
  AdditionalTab,
  ConfiscationAndFinesTab,
  ExpertiseAndJoiningTab,
  PrivateRulingsAndDatesTab,
  NextActionsList
} from './CriminalTabComponents';
import ConfirmDialog from '../../pages/ConfirmDialog';
import ProgressLog from '../CaseManagement/ProgressLog';
import NotificationsPanel from '../CaseManagement/NotificationsPanel';
import JudgeAssistant from './JudgeAssistant';
import AudioTranscriptionTab from './AudioTranscriptionTab';

const CriminalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [criminalData, setCriminalData] = useState(null);
  const [defendants, setDefendants] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [otherSides, setOtherSides] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [options, setOptions] = useState({
    caseOrder: [], caseCategory: [], closedCourt: [], judgeDecision: [],
    preliminaryHearingResult: [], hearingCompliance: [], hearingPostponedReason: [],
    suspensionReason: [], caseResult: [], caseDurationCategory: [], compositionCourt: [],
    preliminaryHearingGrounds: [], sex: [], restraintMeasure: [], restraintApplication: [],
    restraintChange: [], appealPresent: [], courtInstance: [], appealConsiderationResult: [],
    civilClaimResult: [], executionSentDocument: [],
  });
  const [showRulingModal, setShowRulingModal] = useState(false);
  const [rulingType, setRulingType] = useState('');
  const [currentRuling, setCurrentRuling] = useState(null);
  const [referringAuthorities, setReferringAuthorities] = useState([]);
  const [judges, setJudges] = useState([]);
  const [isArchived, setIsArchived] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [collapsedNotifications, setCollapsedNotifications] = useState(false);
  const [caseMovement, setCaseMovement] = useState(null);
  const [decisionsList, setDecisionsList] = useState([]);
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [editingMovement, setEditingMovement] = useState(null);
  const [movementFormData, setMovementFormData] = useState({
    date_meeting: '',
    meeting_time: '',
    decision_case: [],
    composition_colleges: '',
    result_court_session: '',
    reason_deposition: ''
  });

  // Состояния для сворачивания редко используемых полей в BasicInfoTab
  const [showRareFields, setShowRareFields] = useState(false);

  // Состояния для сворачивания блоков в сайдбаре
  const [collapsedSections, setCollapsedSections] = useState({
    sides: true,
    decisions: true,
    executions: true,
    movements: true,
    nextActions: false
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Подтверждение',
    message: '',
    onConfirm: null
  });

  // Загрузка движения дела
  const fetchCaseMovements = async () => {
    try {
      const movementsData = await CriminalCaseService.getCaseMovements(id);
      setMovements(movementsData);
    } catch (error) {
      console.error('Ошибка загрузки движений дела:', error);
    }
  };

  // Загрузка списка решений для выпадающего списка
  const fetchDecisionsList = async () => {
    try {
      const decisionsData = await CriminalCaseService.getCriminalDecisionsList();
      setDecisionsList(decisionsData);
    } catch (error) {
      console.error('Ошибка загрузки списка решений:', error);
    }
  };

  const handleProgressRefresh = () => {
    setRefreshProgress(prev => prev + 1);
  };

  const fetchReferringAuthorities = async () => {
    try {
      const response = await CriminalCaseService.getReferringAuthorities();
      setReferringAuthorities(response);
    } catch (error) {
      console.error('Ошибка загрузки списка органов:', error);
      setReferringAuthorities([]);
    }
  };

  const fetchJudges = async () => {
    try {
      const response = await CriminalCaseService.getJudges();
      setJudges(response);
    } catch (error) {
      console.error('Ошибка загрузки списка судей:', error);
      setJudges([]);
    }
  };

  const handleArchive = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Отправка в архив',
      message: 'Отправить дело в архив? После архивации дело будет доступно только в разделе "Архив".',
      onConfirm: async () => {
        try {
          await CriminalCaseService.archiveCriminalProceeding(id);
          navigate('/archive');
        } catch (err) {
          alert('Ошибка отправки в архив');
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
          await CriminalCaseService.unarchiveCriminalProceeding(id);
          const updatedData = await CriminalCaseService.getCriminalProceedingById(id);
          setCriminalData(updatedData);
          setFormData(updatedData);
          setIsArchived(false);
        } catch (err) {
          console.error('Error unarchiving:', err);
          alert('Ошибка возврата из архива: ' + (err.response?.data?.error || err.message));
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // =================== ФУНКЦИИ ДЛЯ ДВИЖЕНИЯ ДЕЛА ===================
  const handleOpenMovementModal = (movement = null) => {
    if (movement) {
      // Режим редактирования
      const movementData = movement.business_movement_detail || movement;
      setEditingMovement(movement);
      setMovementFormData({
        date_meeting: movementData.date_meeting || '',
        meeting_time: movementData.meeting_time || '',
        decision_case: movementData.decision_case?.map(d => d.id) || [],
        composition_colleges: movementData.composition_colleges || '',
        result_court_session: movementData.result_court_session || '',
        reason_deposition: movementData.reason_deposition || ''
      });
    } else {
      // Режим создания
      setEditingMovement(null);
      setMovementFormData({
        date_meeting: '',
        meeting_time: '',
        decision_case: [],
        composition_colleges: '',
        result_court_session: '',
        reason_deposition: ''
      });
    }
    setShowMovementModal(true);
  };

  const handleMovementInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMovementFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMovementDateChange = (name, dateString) => {
    setMovementFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleMovementMultiSelectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setMovementFormData(prev => ({
      ...prev,
      decision_case: selectedOptions
    }));
  };

  const handleSaveMovement = async () => {
    try {
      setSaving(true);
      const dataToSend = { ...movementFormData };
      
      // Очищаем пустые значения
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });
      
      if (!dataToSend.decision_case || dataToSend.decision_case.length === 0) {
        delete dataToSend.decision_case;
      }

      if (editingMovement) {
        await CriminalCaseService.updateCaseMovement(id, editingMovement.id, dataToSend);
      } else {
        await CriminalCaseService.createCaseMovement(id, dataToSend);
      }
      
      await fetchCaseMovements();
      setShowMovementModal(false);
      setEditingMovement(null);
    } catch (err) {
      console.error('Ошибка сохранения движения дела:', err);
      alert('Ошибка при сохранении движения дела');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMovement = async (movementId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Удаление записи',
      message: 'Вы уверены, что хотите удалить эту запись о движении дела?',
      onConfirm: async () => {
        try {
          await CriminalCaseService.deleteCaseMovement(id, movementId);
          await fetchCaseMovements();
        } catch (err) {
          console.error('Ошибка удаления движения дела:', err);
          alert('Ошибка при удалении движения дела');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  useEffect(() => {
    const fetchCriminalDetails = async () => {
      try {
        setLoading(true);
        const criminalResponse = await CriminalCaseService.getCriminalProceedingById(id);
        if (criminalResponse) {
          setCriminalData(criminalResponse);
          setFormData(criminalResponse);
          setIsArchived(criminalResponse.status === 'archived');
          
          const defendantsResponse = await CriminalCaseService.getDefendants(criminalResponse.id);
          setDefendants(defendantsResponse);
          const lawyersResponse = await CriminalCaseService.getLawyers(criminalResponse.id);
          setLawyers(lawyersResponse);
          const otherSidesResponse = await CriminalCaseService.getSides(criminalResponse.id);
          setOtherSides(otherSidesResponse);
          const decisionsResponse = await CriminalCaseService.getDecisions(criminalResponse.id);
          setDecisions(decisionsResponse);
          const executionsResponse = await CriminalCaseService.getExecutions(criminalResponse.id);
          setExecutions(executionsResponse);
          
          await fetchReferringAuthorities();
          await fetchJudges();
          await fetchCaseMovements();
          await fetchDecisionsList();
        } else {
          setError('Уголовное дело не найдено');
        }
        await loadOptions();
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных уголовного дела:', err);
        setError('Не удалось загрузить данные уголовного дела');
        setLoading(false);
      }
    };
    if (id) {
      fetchCriminalDetails();
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      const response = await baseService.get('/criminal_proceedings/criminal-options/');
      console.log('Options response:', response.data);
      setOptions({
        caseOrder: response.data.case_order || [],
        caseCategory: response.data.case_category_criminal || [],
        closedCourt: response.data.closed_court_session || [],
        judgeDecision: response.data.judge_decision || [],
        preliminaryHearingResult: response.data.preliminary_hearing_result || [],
        hearingCompliance: response.data.hearing_compliance || [],
        suspensionReason: response.data.suspension_reason || [],
        caseResult: response.data.case_result || [],
        caseDurationCategory: response.data.case_duration_category || [],
        compositionCourt: response.data.composition_court || [],
        preliminaryHearingGrounds: response.data.preliminary_hearing_grounds || [],
        sex: response.data.sex || [],
        restraintMeasure: response.data.restraint_measure || [],
        restraintApplication: response.data.restraint_application || [],
        restraintChange: response.data.restraint_change || [],
        appealPresent: response.data.appeal_present || [],
        courtInstance: response.data.court_instance || [],
        appealConsiderationResult: response.data.appeal_consideration_result || [],
        civilClaimResult: response.data.civil_claim_result || [],
        executionSentDocument: response.data.execution_sent_document || [],
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
    }
  };
  
  const handleFieldChange = useCallback((name, value) => {
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'special_notes', 'archived_date', 'status'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном деле');
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [isArchived, isEditing]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    handleFieldChange(name, type === 'checkbox' ? checked : value);
  }, [handleFieldChange]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSend = { ...formData };
      
      if (dataToSend.referring_authority && typeof dataToSend.referring_authority === 'object') {
        dataToSend.referring_authority_id = dataToSend.referring_authority.id;
        delete dataToSend.referring_authority;
      }
      else if (dataToSend.referring_authority && typeof dataToSend.referring_authority !== 'object') {
        dataToSend.referring_authority_id = parseInt(dataToSend.referring_authority, 10);
        delete dataToSend.referring_authority;
      }

      if (isArchived) {
        const allowedFields = ['archive_notes', 'special_notes', 'archived_date', 'status'];
        Object.keys(dataToSend).forEach(key => {
          if (!allowedFields.includes(key)) delete dataToSend[key];
        });
      }

      const proceedingId = criminalData.id;
      const updatedData = await CriminalCaseService.updateCriminalProceedings(proceedingId, dataToSend);
      setCriminalData(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
      setIsArchived(updatedData.status === 'archived');
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
    }
  };

  const handleDateChange = useCallback((name, dateString) => {
    handleFieldChange(name, dateString || null);
  }, [handleFieldChange]);

  const handleCancel = () => {
    setFormData(criminalData);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBoolean = (value) => {
    if (value === null || value === undefined) return 'Не указано';
    return value ? 'Да' : 'Нет';
  };

  const getOptionLabel = (optionsArray, value) => {
    if (!optionsArray || !Array.isArray(optionsArray)) return 'Не указано';
    const option = optionsArray.find(opt => opt.value === value);
    return option?.label || 'Не указано';
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const allSides = [
    ...defendants.map(d => ({ ...d, sideType: 'defendant', sideTypeLabel: 'Подсудимый', displayName: d.full_name_criminal || d.full_name || 'Не указано', navigatePath: `/criminal-proceedings/${id}/defendants/${d.id}` })),
    ...lawyers.map(l => ({ ...l, sideType: 'lawyer', sideTypeLabel: 'Адвокат', displayName: l.lawyer_detail?.law_firm_name || 'Адвокат', navigatePath: `/criminal-proceedings/${id}/lawyers-criminal/${l.id}` })),
    ...otherSides.map(s => ({ ...s, sideType: 'other', sideTypeLabel: 'Сторона', displayName: s.criminal_side_case_detail?.name || s.sides_case_criminal_detail?.sides_case || 'Сторона', navigatePath: `/criminal-proceedings/${id}/sides-case-in-case/${s.id}` }))
  ];

  const handleNavigateToSide = (side) => navigate(side.navigatePath);
  const handleNavigateToDecision = (decisionId) => navigate(`/criminal-proceedings/${id}/criminal-decisions/${decisionId}`);
  const handleNavigateToExecution = (executionId) => navigate(`/criminal-proceedings/${id}/executions/${executionId}`);

  if (loading) return <div className={styles.loading}>Загрузка данных...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!criminalData) return <div className={styles.error}>Данные не найдены</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>← Назад</button>
          <h1 className={styles.title}>
            Уголовное дело №{criminalData.case_number_criminal || 'Не указано'}
            {isArchived && <span className={styles.archiveBadge}> (АРХИВ)</span>}
          </h1>
        </div>
        <div className={styles.headerRight}>
          {isArchived ? (
            <button onClick={handleUnarchive} className={styles.unarchiveButton}>Вернуть из архива</button>
          ) : (
            <button onClick={handleArchive} className={styles.archiveButton}>Сдать в архив</button>
          )}
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton} disabled={isArchived}>Редактировать</button>
          ) : (
            <div className={styles.editButtons}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
              <button onClick={handleCancel} className={styles.cancelButton}>Отмена</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`} onClick={() => setActiveTab('basic')}>Основные сведения</button>
              <button className={`${styles.tab} ${activeTab === 'incoming' ? styles.activeTab : ''}`} onClick={() => setActiveTab('incoming')}>Автоматизированный помощник</button>
              <button className={`${styles.tab} ${activeTab === 'category' ? styles.activeTab : ''}`} onClick={() => setActiveTab('category')}>Категория и решение</button>
              <button className={`${styles.tab} ${activeTab === 'result' ? styles.activeTab : ''}`} onClick={() => setActiveTab('result')}>Результат и состав</button>
              <button className={`${styles.tab} ${activeTab === 'evidence' ? styles.activeTab : ''}`} onClick={() => setActiveTab('evidence')}>Вещественные доказательства</button>
              <button className={`${styles.tab} ${activeTab === 'confiscation' ? styles.activeTab : ''}`} onClick={() => setActiveTab('confiscation')}>Конфискация и штрафы</button>
              <button className={`${styles.tab} ${activeTab === 'expertise' ? styles.activeTab : ''}`} onClick={() => setActiveTab('expertise')}>Экспертизы и соединение</button>
              <button className={`${styles.tab} ${activeTab === 'private' ? styles.activeTab : ''}`} onClick={() => setActiveTab('private')}>Частные определения и даты</button>
              <button className={`${styles.tab} ${activeTab === 'additional' ? styles.activeTab : ''}`} onClick={() => setActiveTab('additional')}>Дополнительно</button>
              <button className={`${styles.tab} ${activeTab === 'audio' ? styles.activeTab : ''}`} onClick={() => setActiveTab('audio')}>🎤 Аудио-протокол</button>
            </div>
            <div className={styles.tabContentWrapper}>
              {activeTab === 'basic' && <BasicInfoTab isEditing={isEditing && !isArchived} formData={formData} options={options} criminalData={criminalData} caseMovement={caseMovement} handleDateChange={handleDateChange} formatDate={formatDate} handleInputChange={handleInputChange} handleFieldChange={handleFieldChange} getOptionLabel={getOptionLabel} formatBoolean={formatBoolean} referringAuthorities={referringAuthorities} judges={judges} showRareFields={showRareFields} setShowRareFields={setShowRareFields} showRepeatCaseDetails={() => formData.repeat_case === true}
                showSeparationDetails={() => formData.separated_case_number} />}   
              {activeTab === 'incoming' && (
                <div className={styles.tabContent}>
                  <JudgeAssistant proceedingId={id} />
                </div>
              )}          
              {activeTab === 'evidence' && <EvidenceTab isEditing={isEditing && !isArchived} formData={formData} handleInputChange={handleInputChange} formatBoolean={formatBoolean} criminalData={criminalData} />}
              {activeTab === 'category' && <CaseCategoryTab isEditing={isEditing && !isArchived} formData={formData} options={options} caseMovement={caseMovement} handleDateChange={handleDateChange} handleInputChange={handleInputChange} handleFieldChange={handleFieldChange} getOptionLabel={getOptionLabel} criminalData={criminalData} formatDate={formatDate} setShowRulingModal={setShowRulingModal} showPreliminaryHearingGrounds={() => formData.judge_decision === '2'} formatBoolean={formatBoolean} />}
              {activeTab === 'result' && <ResultTab 
                isEditing={isEditing && !isArchived} 
                formData={formData} 
                options={options} 
                handleInputChange={handleInputChange}
                handleFieldChange={handleFieldChange}
                getOptionLabel={getOptionLabel} 
                criminalData={criminalData} 
                formatBoolean={formatBoolean} 
              />}
              {activeTab === 'confiscation' && <ConfiscationAndFinesTab isEditing={isEditing && !isArchived} formData={formData} handleInputChange={handleInputChange} handleFieldChange={handleFieldChange} formatBoolean={formatBoolean} handleDateChange={handleDateChange} formatDate={formatDate} />}
              {activeTab === 'expertise' && <ExpertiseAndJoiningTab isEditing={isEditing && !isArchived} formData={formData} handleInputChange={handleInputChange} handleDateChange={handleDateChange} formatDate={formatDate} />}
              {activeTab === 'private' && <PrivateRulingsAndDatesTab isEditing={isEditing && !isArchived} formData={formData} handleInputChange={handleInputChange} handleDateChange={handleDateChange} formatDate={formatDate} criminalData={criminalData} />}
              {activeTab === 'additional' && <AdditionalTab isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} criminalData={criminalData} handleDateChange={handleDateChange} formatDate={formatDate} formatBoolean={formatBoolean} isArchived={isArchived} />}
              {activeTab === 'private' && <PrivateRulingsAndDatesTab isEditing={isEditing && !isArchived} formData={formData} handleInputChange={handleInputChange} handleDateChange={handleDateChange} formatDate={formatDate} criminalData={criminalData} />}
              
              {/* НОВАЯ ВКЛАДКА АУДИО */}
              {activeTab === 'audio' && <AudioTranscriptionTab caseId={id} />}
              
              {activeTab === 'additional' && <AdditionalTab isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} criminalData={criminalData} handleDateChange={handleDateChange} formatDate={formatDate} formatBoolean={formatBoolean} isArchived={isArchived} />}
            </div>
          </div>
        </div>
        
        <div className={styles.sidebar}>
          {/* Справочный лист */}
          <div className={styles.sidebarSection}>
            <ProgressLog caseType="criminal" caseId={id} onRefresh={refreshProgress} />
          </div>
          
          {/* Уведомления */}
          <NotificationsPanel caseType="criminal" caseId={id} caseNumber={criminalData?.case_number_criminal} onRefresh={handleProgressRefresh} collapsed={collapsedNotifications} onToggle={setCollapsedNotifications} />

          {/* Стороны по делу */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionHeader} onClick={() => toggleSection('sides')}>
              <h2 className={styles.sidebarSectionTitle}>Стороны по делу <span className={styles.sidebarSectionCount}>{allSides.length}</span></h2>
              <button className={styles.sidebarToggleButton}>{collapsedSections.sides ? 'Развернуть' : 'Свернуть'}</button>
            </div>
            {!collapsedSections.sides && (
              <div className={styles.sidebarSectionContent}>
                {allSides.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {allSides.slice(0, 5).map(side => (
                      <div key={`${side.sideType}-${side.id}`} className={`${styles.sidebarListItem} ${styles[`sideType-${side.sideType}`]}`} onClick={() => handleNavigateToSide(side)}>
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>{side.displayName}</span>
                          <span className={`${styles.sideType} ${styles[`sideType-${side.sideType}`]}`}>{side.sideTypeLabel}</span>
                        </div>
                        <div className={styles.sidebarListItemHint}>Нажмите для просмотра →</div>
                      </div>
                    ))}
                    {allSides.length > 5 && <div className={styles.sidebarListItemMore}>+ еще {allSides.length - 5} участников</div>}
                  </div>
                ) : <p className={styles.sidebarNoData}>Нет данных о сторонах по делу</p>}
              </div>
            )}
          </div>

          {/* Решения */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionHeader} onClick={() => toggleSection('decisions')}>
              <h2 className={styles.sidebarSectionTitle}>Решения <span className={styles.sidebarSectionCount}>{decisions.length}</span></h2>
              <button className={styles.sidebarToggleButton}>{collapsedSections.decisions ? 'Развернуть' : 'Свернуть'}</button>
            </div>
            {!collapsedSections.decisions && (
              <div className={styles.sidebarSectionContent}>
                {decisions.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {decisions.slice(0, 3).map(decision => (
                      <div key={decision.id} className={styles.sidebarListItem} onClick={() => handleNavigateToDecision(decision.id)}>
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>{decision.court_consideration_date ? `Решение от ${formatDate(decision.court_consideration_date)}` : `Решение №${decision.id}`}</span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>{decision.case_result ? getOptionLabel(options.caseResult, decision.case_result) : 'Результат не указан'}</div>
                        <div className={styles.sidebarListItemHint}>Нажмите для просмотра →</div>
                      </div>
                    ))}
                    {decisions.length > 3 && <div className={styles.sidebarListItemMore}>+ еще {decisions.length - 3} решений</div>}
                  </div>
                ) : <p className={styles.sidebarNoData}>Нет данных о решениях</p>}
              </div>
            )}
          </div>

          {/* Движение дела - НОВЫЙ БЛОК (как в гражданских делах) */}
          <div className={styles.sidebarSection}>
            <div 
              className={styles.sidebarSectionHeader} 
              onClick={() => toggleSection('movements')}
            >
              <h2 className={styles.sidebarSectionTitle}>
                Движение дела
                <span className={styles.sidebarSectionCount}>
                  {movements.length}
                </span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.movements ? 'Развернуть' : 'Свернуть'}
              </button>
            </div>
            
            {!collapsedSections.movements && (
              <div className={styles.sidebarSectionContent}>
                <button 
                  onClick={() => handleOpenMovementModal()}
                  className={styles.addButton}
                >
                  + Добавить движение
                </button>
                
                {movements.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {movements.slice(0, 5).map(movement => {
                      const movementData = movement.business_movement_detail || movement;
                      return (
                        <div 
                          key={movement.id} 
                          className={styles.sidebarListItem}
                          onClick={() => handleOpenMovementModal(movement)}
                        >
                          <div className={styles.sidebarListItemHeader}>
                            <span className={styles.sidebarListItemTitle}>
                              {movementData.date_meeting 
                                ? `Заседание от ${formatDate(movementData.date_meeting)}`
                                : `Движение №${movement.id}`
                              }
                            </span>
                          </div>
                          <div className={styles.sidebarListItemSubtitle}>
                            {movementData.meeting_time?.slice(0, 5) || ''}
                            {movementData.result_court_session && (
                              <span> — {movementData.result_court_session.length > 40 
                                ? movementData.result_court_session.slice(0, 40) + '...' 
                                : movementData.result_court_session}
                              </span>
                            )}
                          </div>
                          <div className={styles.sidebarListItemActions}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMovement(movement.id);
                              }}
                              className={styles.deleteButton}
                              title="Удалить"
                            >
                              ×
                            </button>
                            <div className={styles.sidebarListItemHint}>Нажмите для редактирования →</div>
                          </div>
                        </div>
                      );
                    })}
                    {movements.length > 5 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {movements.length - 5} записей
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Нет данных о движении дела</p>
                )}
              </div>
            )}
          </div>

          {/* Исполнение */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionHeader} onClick={() => toggleSection('executions')}>
              <h2 className={styles.sidebarSectionTitle}>Исполнение <span className={styles.sidebarSectionCount}>{executions.length}</span></h2>
              <button className={styles.sidebarToggleButton}>{collapsedSections.executions ? 'Развернуть' : 'Свернуть'}</button>
            </div>
            {!collapsedSections.executions && (
              <div className={styles.sidebarSectionContent}>
                {executions.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {executions.slice(0, 3).map(execution => (
                      <div key={execution.id} className={styles.sidebarListItem} onClick={() => handleNavigateToExecution(execution.id)}>
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>{execution.execution_sent_date ? `Исполнение от ${formatDate(execution.execution_sent_date)}` : `Запись об исполнении №${execution.id}`}</span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>{execution.execution_sent_to || 'Информация отсутствует'}</div>
                        <div className={styles.sidebarListItemHint}>Нажмите для просмотра →</div>
                      </div>
                    ))}
                    {executions.length > 3 && <div className={styles.sidebarListItemMore}>+ еще {executions.length - 3} записей</div>}
                  </div>
                ) : <p className={styles.sidebarNoData}>Нет данных об исполнении</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно для движения дела */}
      {showMovementModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMovementModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingMovement ? 'Редактирование движения дела' : 'Новое движение дела'}</h2>
              <button className={styles.modalClose} onClick={() => setShowMovementModal(false)}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Дата заседания *</label>
                <input
                  type="date"
                  name="date_meeting"
                  value={movementFormData.date_meeting || ''}
                  onChange={(e) => handleMovementDateChange('date_meeting', e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Время заседания *</label>
                <input
                  type="time"
                  name="meeting_time"
                  value={movementFormData.meeting_time || ''}
                  onChange={handleMovementInputChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Принятые решения</label>
                <select
                  name="decision_case"
                  multiple
                  value={movementFormData.decision_case || []}
                  onChange={handleMovementMultiSelectChange}
                  className={styles.select}
                  size={4}
                >
                  {decisionsList.map(decision => (
                    <option key={decision.id} value={decision.id}>
                      {decision.name_case}
                    </option>
                  ))}
                </select>
                <small className={styles.hint}>Удерживайте Ctrl для выбора нескольких решений</small>
              </div>

              <div className={styles.field}>
                <label>Состав коллегии</label>
                <input
                  type="text"
                  name="composition_colleges"
                  value={movementFormData.composition_colleges || ''}
                  onChange={handleMovementInputChange}
                  className={styles.input}
                  placeholder="ФИО судей через запятую"
                />
              </div>

              <div className={styles.field}>
                <label>Результат судебного заседания</label>
                <textarea
                  name="result_court_session"
                  value={movementFormData.result_court_session || ''}
                  onChange={handleMovementInputChange}
                  className={styles.textarea}
                  rows={3}
                  placeholder="Например: рассмотрение отложено, вынесен приговор и т.д."
                />
              </div>

              <div className={styles.field}>
                <label>Причина отложения (если есть)</label>
                <textarea
                  name="reason_deposition"
                  value={movementFormData.reason_deposition || ''}
                  onChange={handleMovementInputChange}
                  className={styles.textarea}
                  rows={2}
                  placeholder="Укажите причину, если заседание было отложено"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowMovementModal(false)} className={styles.cancelButton}>
                Отмена
              </button>
              <button onClick={handleSaveMovement} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};

export default CriminalDetail;