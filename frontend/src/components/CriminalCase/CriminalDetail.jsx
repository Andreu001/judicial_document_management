import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import baseService from '../../API/baseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './CriminalDetail.module.css';
import CriminalNotifications from './CriminalNotifications';

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

  // Функция для формирования постановления
  const generateRuling = (type) => {
    setRulingType(type);
    setShowRulingModal(true);
    
    // Логика формирования постановления будет здесь
    console.log(`Формирование постановления: ${type}`);
    
    // Можно добавить вызов API для генерации документа
    // generateRulingDocument(cardId, type);
  };

  // Проверка, можно ли формировать постановление (должны быть заполнены обязательные поля)
  const canGenerateRuling = () => {
    return criminalData && 
           criminalData.incoming_date && 
           criminalData.judge_acceptance_date && 
           criminalData.judge_name &&
           criminalData.case_number;
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
        
        const criminalResponse = await CriminalCaseService.getByBusinessCardId(cardId);
        
        // criminalResponse теперь объект или null
        if (criminalResponse) {
          setCriminalData(criminalResponse);
          setFormData(criminalResponse);
          
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

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

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

  // Компоненты вкладок
  const BasicInfoTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>1. Основные сведения</h3>
          <div className={styles.field}>
            <div className={styles.field}>
              <label>№ дела</label>
              <span>{criminalData.case_number || 'Не указано'}</span>
            </div>

            <div className={styles.field}>
              <label>Дата поступления дела в суд</label>
              {isEditing ? (
                <input
                  type="date"
                  name="incoming_date"
                  value={formData.incoming_date || ''}
                  onChange={(e) => handleDateChange('incoming_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(criminalData.incoming_date)}</span>
              )}
            </div>
            <label>Число лиц по делу</label>
            {isEditing ? (
              <input
                type="number"
                name="number_of_persons"
                value={formData.number_of_persons || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.number_of_persons || 'Не указано'}</span>
            )}
          </div>
            <div className={styles.field}>
              <label>Откуда поступило</label>
              {isEditing ? (
                <input
                  key={`incoming_from_${isEditing}`}
                  type="text"
                  name="incoming_from"
                  value={formData.incoming_from || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <span>{criminalData.incoming_from || 'Не указано'}</span>
              )}
            </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>2. Порядок поступления дела</h3>
          <div className={styles.field}>
            <label>Порядок поступления</label>
            {isEditing ? (
              <select
                name="case_order"
                value={formData.case_order ??''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseOrder.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseOrder, criminalData.case_order)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Номер дела, из которого выделено</label>
            {isEditing ? (
              <input
                type="text"
                name="separated_case_number"
                value={formData.separated_case_number || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.separated_case_number || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата выделения дела</label>
            {isEditing ? (
              <input
                type="date"
                name="separated_case_date"
                value={formData.separated_case_date || ''}
                onChange={(e) => handleDateChange('separated_case_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.separated_case_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Код суда при повторном поступлении</label>
            {isEditing ? (
              <input
                type="text"
                name="repeated_court_code"
                value={formData.repeated_court_code || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.repeated_court_code || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>№ производства по первичной регистрации</label>
            {isEditing ? (
              <input
                type="text"
                name="repeated_primary_reg_number"
                value={formData.repeated_primary_reg_number || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.repeated_primary_reg_number || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Повторное поступление дела</label>
            {isEditing ? (
              <select
                name="repeat_case"
                value={formData.repeat_case}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.repeat_case)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата повторного поступления</label>
            {isEditing ? (
              <input
                type="date"
                name="repeat_case_date"
                value={formData.repeat_case_date || ''}
                onChange={(e) => handleDateChange('repeat_case_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.repeat_case_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Новая вкладка для вещественных доказательств
  const EvidenceTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Вещественные доказательства</h3>
          
          <div className={styles.field}>
            <label>Наличие вещдоков</label>
            {isEditing ? (
              <select
                name="evidence_present"
                value={formData.evidence_present}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.evidence_present)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Рег. номер вещдока</label>
            {isEditing ? (
              <input
                type="text"
                name="evidence_reg_number"
                value={formData.evidence_reg_number || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.evidence_reg_number || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const CaseCategoryTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>3. Категория дела</h3>
          <div className={styles.field}>
            <label>Категория дела</label>
            {isEditing ? (
              <select
                name="case_category"
                value={formData.case_category || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseCategory.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseCategory, criminalData.case_category)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>ФИО судьи</label>
            {isEditing ? (
              <input
                type="text"
                name="judge_name"
                value={formData.judge_name || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.judge_name || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Код судьи</label>
            {isEditing ? (
              <input
                type="text"
                name="judge_code"
                value={formData.judge_code || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.judge_code || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата принятия дела судьей</label>
            {isEditing ? (
              <input
                type="date"
                name="judge_acceptance_date"
                value={formData.judge_acceptance_date || ''}
                onChange={(e) => handleDateChange('judge_acceptance_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.judge_acceptance_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>5. Решение судьи при назначении дела</h3>
          
          {/* Кнопка формирования постановления */}
          <div className={styles.rulingSection}>
            <button 
              className={styles.generateRulingButton}
              onClick={() => setShowRulingModal(true)}
              disabled={!canGenerateRuling()}
              title={!canGenerateRuling() ? "Заполните обязательные поля: дата поступления, дата принятия судьей, ФИО судьи, номер дела" : ""}
            >
              📄 Сформировать постановление о назначении дела
            </button>
            {!canGenerateRuling() && (
              <p className={styles.rulingWarning}>
                Для формирования постановления заполните: дату поступления, дату принятия судьей, ФИО судьи и номер дела
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label>Решение судьи</label>
            {isEditing ? (
              <select
                name="judge_decision"
                value={formData.judge_decision || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.judgeDecision.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.judgeDecision, criminalData.judge_decision)}</span>
            )}
          </div>

          {/* Поле оснований предварительного слушания */}
          {showPreliminaryHearingGrounds() && (
              <div className={styles.field}>
                  <label>Основания проведения предварительного слушания</label>
                  {isEditing ? (
                      <select
                          name="preliminary_hearing"
                          value={formData.preliminary_hearing || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                      >
                          <option value="">Выберите основание</option>
                          {options.preliminaryHearingGrounds.map(option => (
                              <option key={option.value} value={option.value}>
                                  {option.label}
                              </option>
                          ))}
                      </select>
                  ) : (
                      <span>
                          {options.preliminaryHearingGrounds.find(opt => opt.value === criminalData.preliminary_hearing)?.label || 'Не указано'}
                      </span>
                  )}
              </div>
          )}

          <div className={styles.field}>
            <label>Дата предварительного слушания</label>
            {isEditing ? (
              <input
                type="date"
                name="case_transfer_date"
                value={formData.case_transfer_date || ''}
                onChange={(e) => handleDateChange('case_transfer_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.case_transfer_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Куда направлено дело</label>
            {isEditing ? (
              <input
                type="text"
                name="case_transfer_destination"
                value={formData.case_transfer_destination || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.case_transfer_destination || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>С использованием ВКС</label>
            {isEditing ? (
              <select
                name="vks_used"
                value={formData.vks_used}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.vks_used)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата направления дела</label>
            {isEditing ? (
              <input
                type="date"
                name="preliminary_hearing_date"
                value={formData.preliminary_hearing_date || ''}
                onChange={(e) => handleDateChange('preliminary_hearing_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.preliminary_hearing_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const HearingTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>6. Результат предварительного слушания</h3>
          <div className={styles.field}>
            <label>Результат слушания</label>
            {isEditing ? (
              <select
                name="preliminary_hearing_result"
                value={formData.preliminary_hearing_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.preliminaryHearingResult.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.preliminaryHearingResult, criminalData.preliminary_hearing_result)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата первого заседания</label>
            {isEditing ? (
              <input
                type="date"
                name="first_hearing_date"
                value={formData.first_hearing_date || ''}
                onChange={(e) => handleDateChange('first_hearing_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.first_hearing_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>7. Соблюдение сроков</h3>
          <div className={styles.field}>
            <label>Соблюдение сроков</label>
            {isEditing ? (
              <select
                name="hearing_compliance"
                value={formData.hearing_compliance || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.hearingCompliance.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.hearingCompliance, criminalData.hearing_compliance)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>8. Причины отложения дела</h3>
          <div className={styles.field}>
            <label>Причина отложения</label>
            {isEditing ? (
              <select
                name="hearing_postponed_reason"
                value={formData.hearing_postponed_reason || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.hearingPostponedReason.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.hearingPostponedReason, criminalData.hearing_postponed_reason)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Текст причины отложения</label>
            {isEditing ? (
              <textarea
                name="hearing_postponed_reason_text"
                value={formData.hearing_postponed_reason_text || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={2}
              />
            ) : (
              <span>{criminalData.hearing_postponed_reason_text || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата приостановления производства</label>
            {isEditing ? (
              <input
                type="date"
                name="suspension_date"
                value={formData.suspension_date || ''}
                onChange={(e) => handleDateChange('suspension_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.suspension_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Причина приостановления</label>
            {isEditing ? (
              <select
                name="suspension_reason"
                value={formData.suspension_reason || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.suspensionReason.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.suspensionReason, criminalData.suspension_reason)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата возобновления производства</label>
            {isEditing ? (
              <input
                type="date"
                name="resumption_date"
                value={formData.resumption_date || ''}
                onChange={(e) => handleDateChange('resumption_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.resumption_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ResultTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>9. Результат рассмотрения дела</h3>
          <div className={styles.field}>
            <label>Результат рассмотрения</label>
            {isEditing ? (
              <select
                name="case_result"
                value={formData.case_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseResult.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseResult, criminalData.case_result)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Общая продолжительность (дни)</label>
            {isEditing ? (
              <input
                type="number"
                name="total_duration_days"
                value={formData.total_duration_days || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.total_duration_days || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Категория длительности рассмотрения</label>
            {isEditing ? (
              <select
                name="case_duration_category"
                value={formData.case_duration_category || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseDurationCategory.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseDurationCategory, criminalData.case_duration_category)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>10. Состав суда</h3>
          <div className={styles.field}>
            <label>Состав суда</label>
            {isEditing ? (
              <select
                name="composition_court"
                value={formData.composition_court || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.compositionCourt.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.compositionCourt, criminalData.composition_court)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Участие прокурора</label>
            {isEditing ? (
              <select
                name="participation_prosecutor"
                value={formData.participation_prosecutor}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.participation_prosecutor)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Участие переводчика</label>
            {isEditing ? (
              <select
                name="participation_translator"
                value={formData.participation_translator}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.participation_translator)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Участие эксперта</label>
            {isEditing ? (
              <select
                name="participation_expert"
                value={formData.participation_expert}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.participation_expert)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Участие специалиста</label>
            {isEditing ? (
              <select
                name="participation_specialist"
                value={formData.participation_specialist}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.participation_specialist)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Без участия подсудимого</label>
            {isEditing ? (
              <select
                name="absence_defendant"
                value={formData.absence_defendant}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.absence_defendant)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Без участия адвоката</label>
            {isEditing ? (
              <select
                name="absence_lawyer"
                value={formData.absence_lawyer}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.absence_lawyer)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Без участия лица по делам о ПММХ</label>
            {isEditing ? (
              <select
                name="absence_pmmh_person"
                value={formData.absence_pmmh_person}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.absence_pmmh_person)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Закрытое заседание</label>
            {isEditing ? (
              <select
                name="closed_hearing"
                value={formData.closed_hearing}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.closed_hearing)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Использование ВКС</label>
            {isEditing ? (
              <select
                name="vks_technology"
                value={formData.vks_technology}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.vks_technology)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Использование аудиозаписи</label>
            {isEditing ? (
              <select
                name="audio_recording"
                value={formData.audio_recording}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.audio_recording)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Использование видеозаписи</label>
            {isEditing ? (
              <select
                name="video_recording"
                value={formData.video_recording}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.video_recording)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Особый порядок при согласии обвиняемого</label>
            {isEditing ? (
              <select
                name="special_procedure_consent"
                value={formData.special_procedure_consent}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.special_procedure_consent)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Особый порядок при досудебном соглашении</label>
            {isEditing ? (
              <select
                name="special_procedure_agreement"
                value={formData.special_procedure_agreement}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.special_procedure_agreement)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const AdditionalTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>11. Частные определения</h3>
          <div className={styles.field}>
            <label>Количество частных определений</label>
            {isEditing ? (
              <input
                type="number"
                name="private_rulings_count"
                value={formData.private_rulings_count || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.private_rulings_count || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата вынесения частного определения</label>
            {isEditing ? (
              <input
                type="date"
                name="private_ruling_date"
                value={formData.private_ruling_date || ''}
                onChange={(e) => handleDateChange('private_ruling_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.private_ruling_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>12. Дополнительные сведения</h3>
          <div className={styles.field}>
            <label>Примечание</label>
            {isEditing ? (
              <textarea
                name="note"
                value={formData.note || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{criminalData.note || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата создания записи</label>
            <span>{formatDate(criminalData.created_at)}</span>
          </div>

          <div className={styles.field}>
            <label>Дата последнего обновления</label>
            <span>{formatDate(criminalData.updated_at)}</span>
          </div>
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
          <h1 className={styles.title}>Уголовное дело №{criminalData.case_number}</h1>
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
              {activeTab === 'basic' && <BasicInfoTab />}
              {activeTab === 'evidence' && <EvidenceTab />}
              {activeTab === 'category' && <CaseCategoryTab />}
              {activeTab === 'hearing' && <HearingTab />}
              {activeTab === 'result' && <ResultTab />}
              {activeTab === 'additional' && <AdditionalTab />}
            </div>
          </div>
        </div>

        {/* Правая колонка - обвиняемые */}
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Б. Стороны по делу</h2>
            
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
        </div>
          <CriminalNotifications 
            cardId={cardId} 
            criminalData={criminalData} 
          />
      </div>

      {/* Модальное окно для формирования постановления */}
      {showRulingModal && <RulingModal />}
    </div>
  );
};

export default CriminalDetail;