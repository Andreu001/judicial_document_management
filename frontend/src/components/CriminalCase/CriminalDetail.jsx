import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import baseService from '../../API/baseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './CriminalDetail.module.css';
import CriminalNotifications from './CriminalNotifications';
import RulingEditor from './RulingEditor';
import {
  BasicInfoTab,
  EvidenceTab,
  CaseCategoryTab,
  HearingTab,
  ResultTab,
  AdditionalTab
} from './CriminalTabComponents';
import ConfirmDialog from '../../pages/ConfirmDialog';

const CriminalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [criminalData, setCriminalData] = useState(null);
  const [defendants, setDefendants] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [otherSides, setOtherSides] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [options, setOptions] = useState({
    caseOrder: [],
    caseCategory: [],
    judgeDecision: [],
    preliminaryHearingResult: [],
    hearingCompliance: [],
    hearingPostponedReason: [],
    suspensionReason: [],
    caseResult: [],
    caseDurationCategory: [],
    compositionCourt: [],
    preliminaryHearingGrounds: []
  });
  const [showRulingModal, setShowRulingModal] = useState(false);
  const [rulingType, setRulingType] = useState('');
  const [showRulingEditor, setShowRulingEditor] = useState(false);
  const [currentRuling, setCurrentRuling] = useState(null);
  const [referringAuthorities, setReferringAuthorities] = useState([]);
  const [judges, setJudges] = useState([]);
  const [isArchived, setIsArchived] = useState(false);

  // Состояния для сворачивания блоков в сайдбаре
  const [collapsedSections, setCollapsedSections] = useState({
    sides: true,
    decisions: true,
    executions: true
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Подтверждение',
    message: '',
    onConfirm: null
  });

  // Проверка, нужно ли показывать поле оснований предварительного слушания
  const showPreliminaryHearingGrounds = () => {
    if (!formData.judge_decision) return false;
    
    // Найдем опцию в judgeDecision, которая соответствует назначению предварительного слушания
    const hearingAppointmentOption = options.judgeDecision.find(option => 
      option.label && option.label.toLowerCase().includes('предварительн') ||
      option.value && option.value.toLowerCase().includes('preliminary')
    );
    
    if (!hearingAppointmentOption) return false;
    
    return formData.judge_decision === hearingAppointmentOption.value;
  };

  const generateRuling = async (type) => {
    setRulingType(type);
    setShowRulingModal(false);
    setShowRulingEditor(true);
    
    // Создаем новое постановление с шаблоном
    setCurrentRuling(null);
  };

  const handleSaveRuling = async (rulingData) => {
    try {
      if (currentRuling && currentRuling.id) {
        // Обновление существующего
        await CriminalCaseService.updateRuling(id, currentRuling.id, rulingData);
      } else {
        // Создание нового
        await CriminalCaseService.createRuling(id, rulingData);
      }
      setShowRulingEditor(false);
      setCurrentRuling(null);
    } catch (error) {
      console.error('Error saving ruling:', error);
      alert('Ошибка сохранения постановления');
    }
  };

  // Функция отмены редактирования
  const handleCancelRuling = () => {
    setShowRulingEditor(false);
    setCurrentRuling(null);
    setRulingType('');
  };

  // CriminalDetail.jsx - исправленная функция checkDeadlines
  const checkDeadlines = () => {
    if (!criminalData) return { caseAppointment: null, trialStart: null };

    const incomingDate = new Date(criminalData.incoming_date);
    const judgeAcceptanceDate = new Date(criminalData.judge_acceptance_date);
    const firstHearingDate = new Date(criminalData.first_hearing_date);

    // СРОК НАЗНАЧЕНИЯ ДЕЛА: от даты поступления до даты принятия судьей
    let caseAppointmentDeadline = 30; // стандартный срок
    if (criminalData.case_category === '1') {
      caseAppointmentDeadline = 14; // для содержащихся под стражей
    }

    const caseAppointmentDays = judgeAcceptanceDate ? 
      Math.floor((judgeAcceptanceDate - incomingDate) / (1000 * 60 * 60 * 24)) : null;
    
    const caseAppointmentViolation = caseAppointmentDays > caseAppointmentDeadline;

    // Срок начала разбирательства (оставляем как было)
    const trialStartDays = firstHearingDate ? 
      Math.floor((firstHearingDate - judgeAcceptanceDate) / (1000 * 60 * 60 * 24)) : null;
    
    const trialStartViolation = trialStartDays > 14;

    return {
      caseAppointment: {
        days: caseAppointmentDays,
        deadline: caseAppointmentDeadline,
        violation: caseAppointmentViolation
      },
      trialStart: {
        days: trialStartDays,
        violation: trialStartViolation
      }
    };
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

  useEffect(() => {
    const fetchCriminalDetails = async () => {
      try {
        setLoading(true);
        
        console.log('Loading criminal details for ID:', id);

        // Исправляем: добавляем правильный путь
        const criminalResponse = await CriminalCaseService.getCriminalProceedingById(id);
        
        if (criminalResponse) {
          console.log('Criminal data loaded:', criminalResponse);
          setCriminalData(criminalResponse);
          setFormData(criminalResponse);
          setIsArchived(criminalResponse.status === 'archived');
          
          // Загружаем подсудимых
          const defendantsResponse = await CriminalCaseService.getDefendants(criminalResponse.id);
          setDefendants(defendantsResponse);
          console.log('Defendants loaded:', defendantsResponse.length);

          // Загружаем адвокатов
          const lawyersResponse = await CriminalCaseService.getLawyers(criminalResponse.id);
          setLawyers(lawyersResponse);
          console.log('Lawyers loaded:', lawyersResponse.length);

          // Загружаем иные стороны
          const otherSidesResponse = await CriminalCaseService.getSides(criminalResponse.id);
          setOtherSides(otherSidesResponse);
          console.log('Other sides loaded:', otherSidesResponse.length);

          // Загружаем решения
          const decisionsResponse = await CriminalCaseService.getDecisions(criminalResponse.id);
          setDecisions(decisionsResponse);
          console.log('Decisions loaded:', decisionsResponse.length);

          // Загружаем исполнения
          const executionsResponse = await CriminalCaseService.getExecutions(criminalResponse.id);
          setExecutions(executionsResponse);
          console.log('Executions loaded:', executionsResponse.length);

          await fetchReferringAuthorities();
          await fetchJudges();
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
      // Загрузка всех опций из одного эндпоинта
      const response = await baseService.get('/criminal_proceedings/criminal-options/');
      
      setOptions({
        caseOrder: response.data.case_order || [],
        caseCategory: response.data.case_category || [],
        judgeDecision: response.data.judge_decision || [],
        preliminaryHearingResult: response.data.preliminary_hearing_result || [],
        hearingCompliance: response.data.hearing_compliance || [],
        hearingPostponedReason: response.data.hearing_postponed_reason || [],
        suspensionReason: response.data.suspension_reason || [],
        caseResult: response.data.case_result || [],
        caseDurationCategory: response.data.case_duration_category || [],
        compositionCourt: response.data.composition_court || [],
        preliminaryHearingGrounds: response.data.preliminary_hearing || [],
        preliminaryHearingGrounds: response.data.preliminary_hearing_grounds || [
          {value: '1', label: 'ходатайство стороны об исключении доказательства (ч. 3 ст. 229 УПК РФ)'},
          {value: '2', label: 'основание для возвращения дела прокурору (ст. 237 УПК РФ)'},
          {value: '3', label: 'основание для приостановления или прекращения дела'},
          {value: '4', label: 'ходатайство о проведении судебного разбирательства (ч. 5 ст. 247 УПК РФ)'},
          {value: '5', label: 'решение вопроса о рассмотрении дела с участием присяжных заседателей'},
          {value: '6', label: 'наличие не вступившего в силу приговора с условным осуждением'},
          {value: '7', label: 'основание для выделения уголовного дела'},
          {value: '8', label: 'ходатайство стороны о соединении уголовных дел'},
          {value: '9', label: 'иные основания'},
        ],
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      // Устанавливаем пустые массивы вместо ошибки
      setOptions({
        caseOrder: [],
        caseCategory: [],
        judgeDecision: [],
        preliminaryHearingResult: [],
        hearingCompliance: [],
        hearingPostponedReason: [],
        suspensionReason: [],
        caseResult: [],
        caseDurationCategory: [],
        compositionCourt: [],
        preliminaryHearingGrounds: []
      });
    }
  };
  
  const handleFieldChange = useCallback((name, value) => {
    // Для архивных дел разрешаем редактирование только определенных полей
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'special_notes', 'case_to_archive_date', 'status'];
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

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    // Для архивных дел разрешаем редактирование только определенных полей
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'special_notes', 'case_to_archive_date', 'status'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном деле');
        return;
      }
    }
    
    handleFieldChange(name, type === 'checkbox' ? checked : value);
  }, [handleFieldChange, isArchived, isEditing]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend = { ...formData };

      delete dataToSend.defendants;
      delete dataToSend.criminal_decisions;
      delete dataToSend.id;
      delete dataToSend.case_movement;

      // Для архивных дел оставляем только разрешенные поля
      if (isArchived) {
        const allowedFields = ['archive_notes', 'special_notes', 'case_to_archive_date', 'status'];
        Object.keys(dataToSend).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete dataToSend[key];
          }
        });
      }

      const proceedingId = criminalData.id;
      const updatedData = await CriminalCaseService.updateCriminalProceedings(proceedingId, dataToSend);
      
      setCriminalData(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
      setSaving(false);
      
      // Обновляем статус архивации
      setIsArchived(updatedData.status === 'archived');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
    }
  };

  const handleDateChange = useCallback((name, dateString) => {
    // Для архивных дел разрешаем редактирование только определенных полей
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'special_notes', 'case_to_archive_date', 'status'];
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
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBoolean = (value) => {
    return value ? 'Да' : 'Нет';
  };

  const getOptionLabel = (optionsArray, value) => {
    return optionsArray.find(opt => opt.value === value)?.label || 'Не указано';
  };

  // Функция для переключения сворачивания секций
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Объединяем все стороны для отображения
  const allSides = [
    ...defendants.map(d => ({ 
      ...d, 
      sideType: 'defendant', 
      sideTypeLabel: 'Подсудимый',
      displayName: d.full_name_criminal || d.full_name || 'Не указано',
      statusText: d.sides_case_defendant_name || 'Подсудимый'
    })),
    ...lawyers.map(l => ({ 
      ...l, 
      sideType: 'lawyer', 
      sideTypeLabel: 'Адвокат',
      displayName: l.lawyer_detail?.law_firm_name || l.sides_case_lawyer_detail?.sides_case || 'Адвокат',
      statusText: 'Адвокат'
    })),
    ...otherSides.map(s => ({ 
      ...s, 
      sideType: 'other', 
      sideTypeLabel: 'Сторона',
      displayName: s.criminal_side_case_detail?.name || s.sides_case_criminal_detail?.sides_case || 'Сторона',
      statusText: s.sides_case_criminal_detail?.sides_case || 'Сторона'
    }))
  ];

  // Модальное окно для формирования постановления
  const RulingModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Формирование постановления</h3>
        <p>Выберите тип постановления:</p>
        
        <div className={styles.rulingOptions}>
          <button 
            className={styles.rulingButton}
            onClick={() => generateRuling('preliminary_hearing')}
          >
            О назначении предварительного слушания
          </button>
          
          <button 
            className={styles.rulingButton}
            onClick={() => generateRuling('court_session')}
          >
            О назначении судебного заседания
          </button>
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.cancelButton}
            onClick={() => setShowRulingModal(false)}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!criminalData) {
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
            Уголовное дело №{criminalData.case_number_criminal || 'Не указано'}
            {isArchived && <span className={styles.archiveBadge}> (АРХИВ)</span>}
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
                className={`${styles.tab} ${activeTab === 'evidence' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('evidence')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Вещественные доказательства
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'category' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('category')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Категория и решение
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'result' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('result')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Результат и состав
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
                  isEditing={isEditing && !isArchived} // Для архивных дел блокируем редактирование
                  formData={formData}
                  options={options}
                  criminalData={criminalData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  handleInputChange={handleInputChange}
                  handleFieldChange={handleFieldChange}
                  getOptionLabel={getOptionLabel}
                  formatBoolean={formatBoolean}
                  referringAuthorities={referringAuthorities}
                  judges={judges}
                />
              )}
              {activeTab === 'evidence' && (
                <EvidenceTab
                  isEditing={isEditing && !isArchived} // Для архивных дел блокируем редактирование
                  formData={formData}
                  handleInputChange={handleInputChange}
                  formatBoolean={formatBoolean}
                  criminalData={criminalData}
                />
              )}
              {activeTab === 'category' && (
                <CaseCategoryTab
                  isEditing={isEditing && !isArchived} // Для архивных дел блокируем редактирование
                  formData={formData}
                  options={options}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  criminalData={criminalData}                  
                  formatDate={formatDate}
                  setShowRulingModal={setShowRulingModal}
                  showPreliminaryHearingGrounds={showPreliminaryHearingGrounds}
                  formatBoolean={formatBoolean}
                />
              )}
              {activeTab === 'result' && (
                <ResultTab
                  isEditing={isEditing && !isArchived} // Для архивных дел блокируем редактирование
                  formData={formData}
                  options={options}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  criminalData={criminalData}
                  formatBoolean={formatBoolean} 
                />
              )}
              {activeTab === 'additional' && (
                <AdditionalTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  criminalData={criminalData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  isArchived={isArchived} // Передаем флаг архива
                />
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - обновленные блоки */}
        <div className={styles.sidebar}>
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
                {collapsedSections.sides ? '▶' : '▼'}
              </button>
            </div>
            
            {!collapsedSections.sides && (
              <div className={styles.sidebarSectionContent}>
                {allSides.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {allSides.slice(0, 5).map(side => {
                      // Определяем путь в зависимости от типа стороны
                      let detailPath = '';
                      if (side.sideType === 'defendant') {
                        detailPath = `/criminal-proceedings/${id}/defendants/${side.id}`;
                      } else if (side.sideType === 'lawyer') {
                        detailPath = `/criminal-proceedings/${id}/lawyers-criminal/${side.id}`;
                      } else {
                        detailPath = `/criminal-proceedings/${id}/sides-case-in-case/${side.id}`;
                      }
                      
                      return (
                        <div 
                          key={`${side.sideType}-${side.id}`} 
                          className={`${styles.sidebarListItem} ${styles[`sideType-${side.sideType}`]}`}
                          onClick={() => navigate(detailPath)}
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
                      );
                    })}
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

          {/* Блок "Решения" */}
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
                        onClick={() => navigate(`/criminal-proceedings/${id}/criminal-decisions/${decision.id}`)}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {decision.court_consideration_date 
                              ? `Решение от ${formatDate(decision.court_consideration_date)}`
                              : `Решение №${decision.id}`
                            }
                          </span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>
                          {decision.appeal_consideration_result 
                            ? getOptionLabel(options.appeal_consideration_result || [], decision.appeal_consideration_result)
                            : 'Результат не указан'
                          }
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

          {/* Блок "Исполнение" */}
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
                        onClick={() => navigate(`/criminal-proceedings/${id}/executions/${execution.id}`)}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {execution.sentence_execution_date 
                              ? `Исполнение от ${formatDate(execution.sentence_execution_date)}`
                              : `Запись об исполнении №${execution.id}`
                            }
                          </span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>
                          {execution.execution_sent_to 
                            ? `Направлено: ${execution.execution_sent_to}`
                            : execution.control_result 
                              ? `Результат: ${execution.control_result}`
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

          {/* Уведомления по делу - теперь внутри sidebar */}
          <CriminalNotifications 
            id={id} 
            criminalData={criminalData} 
          />
        </div>
      </div>

      {showRulingModal && <RulingModal />}

      {showRulingEditor && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentLarge}>
            <RulingEditor
              rulingData={currentRuling}
              onSave={handleSaveRuling}
              onCancel={handleCancelRuling}
              templateVariables={{
                caseNumber: criminalData.case_number_criminal,
                judgeName: criminalData.judge_name,
                incomingDate: criminalData.incoming_date,
                defendants: defendants
              }}
              rulingType={rulingType}
            />
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения */}
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

export default CriminalDetail;