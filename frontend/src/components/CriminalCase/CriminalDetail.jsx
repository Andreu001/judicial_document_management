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

const CriminalDetail = () => {
  const { cardId } = useParams();
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
  const [preliminaryHearingGrounds, setPreliminaryHearingGrounds] = useState([]);
  const [showRulingEditor, setShowRulingEditor] = useState(false);
  const [currentRuling, setCurrentRuling] = useState(null);
  const [card, setCard] = useState(null);

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
        await CriminalCaseService.updateRuling(cardId, currentRuling.id, rulingData);
      } else {
        // Создание нового
        await CriminalCaseService.createRuling(cardId, rulingData);
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

  useEffect(() => {
    const fetchCriminalDetails = async () => {
      try {
        setLoading(true);
            const cardResponse = await baseService.get(`/business_card/businesscard/${cardId}/`);
            setCard(cardResponse.data);
            
            const criminalResponse = await CriminalCaseService.getByBusinessCardId(cardId);
       
          if (criminalResponse) {
            const criminalDataWithCaseNumber = {
              ...criminalResponse,
              case_number: criminalResponse.case_number || card?.original_name || ''
            };
        
        setCriminalData(criminalDataWithCaseNumber);
        setFormData(criminalDataWithCaseNumber);
          
          const defendantsResponse = await CriminalCaseService.getDefendants(cardId);
          
          const defendantsWithSideNames = await Promise.all(
            defendantsResponse.map(async (defendant) => {
              if (defendant.side_case) {
                try {
                  const sideResponse = await baseService.get(`/business_card/sides/${defendant.side_case}/`);
                  return {
                    ...defendant,
                    side_case_name: sideResponse.data.sides_case
                  };
                } catch (error) {
                  console.error('Ошибка загрузки названия стороны:', error);
                  return { ...defendant, side_case_name: 'Неизвестный статус' };
                }
              }
              return defendant;
            })
          );
          
          setDefendants(defendantsWithSideNames);
        }
        
        // Загрузка опций для выпадающих списков
        await loadOptions();
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных уголовного дела:', err);
        setError('Не удалось загрузить данные уголовного дела');
        setLoading(false);
      }
    };

    fetchCriminalDetails();
  }, [cardId]);

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
        preliminaryHearingGrounds: response.data.preliminary_hearing || []
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
      
      delete dataToSend.defendants;
      delete dataToSend.criminal_decisions;
      delete dataToSend.id;
      
      const updatedData = await CriminalCaseService.update(cardId, dataToSend);
      
      setCriminalData(updatedData);
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


  const DefendantsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.defendantsSection}>
        <h3 className={styles.subsectionTitle}>Б. Стороны по делу</h3>
        
        {defendants.length > 0 ? (
          <div className={styles.defendantsGrid}>
            {defendants.map(defendant => (
              <div key={defendant.id} className={styles.defendantCard}>
                <h4>{defendant.full_name}</h4>
                <div className={styles.defendantInfo}>
                  <p><strong>Статус:</strong> {defendant.side_case_name || 'Не указано'}</p>
                  <p><strong>Дата рождения:</strong> {formatDate(defendant.birth_date)}</p>
                  <p><strong>ИНН:</strong> {defendant.inn || 'Не указано'}</p>
                  <p><strong>Адрес:</strong> {defendant.address || 'Не указано'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noData}>Нет данных о сторонах по делу</p>
        )}
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
          <h1 className={styles.title}>Уголовное дело №{card.original_name}</h1>
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
                className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                1-2. Основные сведения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'evidence' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('evidence')}
              >
                3. Вещественные доказательства
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'category' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('category')}
              >
                4-6. Категория и решение
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'hearing' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('hearing')}
              >
                7-9. Слушания
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'result' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('result')}
              >
                10-11. Результат и состав
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'additional' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                12-13. Дополнительно
              </button>
            </div>
            <div className={styles.tabContentWrapper}>
              {activeTab === 'basic' && (
                <BasicInfoTab
                  isEditing={isEditing}
                  formData={formData}
                  options={options}
                  criminalData={criminalData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  card={card}
                  handleInputChange={handleInputChange}
                  handleFieldChange={handleFieldChange}
                  getOptionLabel={getOptionLabel}
                  formatBoolean ={formatBoolean}
                />
              )}
              {activeTab === 'evidence' && (
                <EvidenceTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  formatBoolean={formatBoolean}
                  criminalData={criminalData}
                />
              )}
              {activeTab === 'category' && (
                <CaseCategoryTab
                  isEditing={isEditing}
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
              {activeTab === 'hearing' && (
                <HearingTab
                  isEditing={isEditing}
                  formData={formData}
                  options={options}
                  handleInputChange={handleInputChange}
                  handleDateChange={handleDateChange}
                  getOptionLabel={getOptionLabel}
                  criminalData={criminalData}
                  formatDate={formatDate}
                />
              )}
              {activeTab === 'result' && (
                <ResultTab
                  isEditing={isEditing}
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
              cardId={cardId} 
              criminalData={criminalData} 
            />
        </div>
      </div> {/* Закрывающий тег для .content */}

      {showRulingModal && <RulingModal />}

      {showRulingEditor && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentLarge}>
            <RulingEditor
              rulingData={currentRuling}
              onSave={handleSaveRuling}
              onCancel={handleCancelRuling}
              templateVariables={{
                caseNumber: criminalData.case_number,
                judgeName: criminalData.judge_name,
                incomingDate: criminalData.incoming_date,
                defendants: defendants
              }}
              rulingType={rulingType}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CriminalDetail;