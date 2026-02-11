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

  const formatBoolean = (value) => {
    return value ? 'Да' : 'Нет';
  };

  const getOptionLabel = (optionsArray, value) => {
    return optionsArray.find(opt => opt.value === value)?.label || 'Не указано';
  };

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

        {/* Правая колонка - обвиняемые */}
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Стороны по делу</h2>
            
            {defendants.length > 0 ? (
              <div className={styles.defendantsList}>
                {defendants.map(defendant => (
                  <div key={defendant.id} className={styles.defendantItem}>
                    <h4>{defendant.full_name}</h4>
                    <p>Статус: {defendant.side_case_name || 'Не указано'}</p>
                    <p>Дата рождения: {formatDate(defendant.birth_date)}</p>
                    <p>ИНН: {defendant.inn || 'Не указано'}</p>
                    <p>Адрес: {defendant.address || 'Не указано'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>Нет данных о сторонах по делу</p>
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