import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './CriminalDetail.module.css';

const CriminalDecisionDetail = () => {
  const { id, proceedingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isCreateMode = location.pathname.includes('/create');
  const [decisionData, setDecisionData] = useState(null);
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [activeTab, setActiveTab] = useState('appeal'); // appeal, cassation, civil
  const [loading, setLoading] = useState(!isCreateMode);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [defendants, setDefendants] = useState([]);
  
  // Данные для апелляции
  const [appealData, setAppealData] = useState(null);
  const [appealForm, setAppealForm] = useState({
    appeal_present: '',
    appeal_type: '',
    appeal_date: '',
    appeal_applicant: '',
    appeal_applicant_status: '',
    court_sent_date: '',
    court_return_date: '',
    court_return_reason: '',
    court_resend_date: '',
    court_consideration_date: '',
    court_composition: '',
    court_composition_details: '',
    appeal_result: '',
    appeal_changes: '',
    higher_court_receipt_date: '',
    notes: ''
  });
  
  // Данные для кассации
  const [cassationData, setCassationData] = useState(null);
  const [cassationForm, setCassationForm] = useState({
    instance_type: 'cassation_first',
    cassation_filed: false,
    cassation_type: '',
    cassation_date: '',
    cassation_applicant: '',
    court_sent_date: '',
    court_receipt_date: '',
    court_return_date: '',
    consideration_date: '',
    cassation_result: '',
    cassation_changes: '',
    ruling_number: '',
    ruling_date: '',
    supervisory_request: false,
    supervisory_result: '',
    notes: ''
  });
  
  // Данные для гражданского иска
  const [civilData, setCivilData] = useState(null);
  const [civilForm, setCivilForm] = useState({
    victim: '',
    plaintiff_name: '',
    defendant_name: '',
    claim_amount: '',
    theft_damage_amount: '',
    other_damage_amount: '',
    moral_damage_amount: '',
    moral_damage_article: '',
    state_duty_amount: '',
    result: '',
    awarded_amount: '',
    decision_date: '',
    execution_date: '',
    execution_notes: ''
  });
  
  // Справочники
  const [appealOptions, setAppealOptions] = useState({
    appeal_present: [],
    appeal_type: [],
    court_composition: [],
    appeal_result: []
  });
  const [cassationOptions, setCassationOptions] = useState({
    instance_type: [],
    cassation_type: [],
    cassation_result: [],
    supervisory_result: []
  });
  const [civilOptions, setCivilOptions] = useState({
    result: []
  });
  const [appealStatuses, setAppealStatuses] = useState([]);

  useEffect(() => {
    if (isCreateMode) {
      loadOptions();
      if (proceedingId) {
        loadDefendants(proceedingId);
      }
      setLoading(false);
    } else {
      fetchAllData();
    }
  }, [id, proceedingId, isCreateMode]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Загружаем апелляционные данные
      const appealResponse = await CriminalCaseService.getAppealInstances(proceedingId);
      if (appealResponse && appealResponse.length > 0) {
        const mainAppeal = appealResponse[0];
        setAppealData(mainAppeal);
        setAppealForm(mainAppeal);
      }
      
      // Загружаем кассационные данные
      const cassationResponse = await CriminalCaseService.getCassationInstances(proceedingId);
      if (cassationResponse && cassationResponse.length > 0) {
        const mainCassation = cassationResponse[0];
        setCassationData(mainCassation);
        setCassationForm(mainCassation);
      }
      
      // Загружаем гражданские иски
      const civilResponse = await CriminalCaseService.getCivilClaims(proceedingId);
      if (civilResponse && civilResponse.length > 0) {
        const mainCivil = civilResponse[0];
        setCivilData(mainCivil);
        setCivilForm(mainCivil);
      }
      
      await loadOptions();
      await loadDefendants(proceedingId);
      await loadAppealStatuses();
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Не удалось загрузить данные');
      setLoading(false);
    }
  };

  const loadDefendants = async (proceedingId) => {
    try {
      const defendantsResponse = await CriminalCaseService.getDefendants(proceedingId);
      setDefendants(defendantsResponse);
    } catch (error) {
      console.error('Ошибка загрузки обвиняемых:', error);
      setDefendants([]);
    }
  };

  const loadAppealStatuses = async () => {
    try {
      const statuses = await CriminalCaseService.getAppealApplicantStatuses();
      setAppealStatuses(statuses);
    } catch (error) {
      console.error('Ошибка загрузки статусов:', error);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await baseService.get('/criminal_proceedings/criminal-options/');
      
      setAppealOptions({
        appeal_present: response.data.appeal_present || [
          { value: '1', label: 'не обжалован' },
          { value: '2', label: 'обжалован осужденным (подсудимым)' },
          { value: '3', label: 'обжалован прокурором' },
          { value: '4', label: 'обжалован другими участниками процесса' }
        ],
        appeal_type: [
          { value: 'appeal', label: 'Апелляционная жалоба' },
          { value: 'representation', label: 'Апелляционное представление прокурора' }
        ],
        court_composition: [
          { value: '1', label: 'единолично судьей' },
          { value: '2', label: 'коллегией судей' },
          { value: '3', label: 'с участием присяжных заседателей' }
        ],
        appeal_result: [
          { value: '1', label: 'приговор суда первой инстанции оставлен без изменения' },
          { value: '2', label: 'обвинительный приговор отменен с оправданием лица' },
          { value: '3', label: 'обвинительный приговор отменен с прекращением дела' },
          { value: '4', label: 'обвинительный приговор отменен частично с оставлением менее тяжкого обвинения' },
          { value: '5', label: 'обвинительный приговор отменен с направлением дела на новое судебное рассмотрение' },
          { value: '6', label: 'обвинительный приговор изменен с переквалификацией обвинения без изменения наказания' },
          { value: '7', label: 'обвинительный приговор изменен с изменением наказания и переквалификацией обвинения' },
          { value: '8', label: 'обвинительный приговор изменен с изменением меры наказания без переквалификации обвинения' },
          { value: '9', label: 'апелляционное производство прекращено' },
          { value: '10', label: 'обвинительный приговор отменен с вынесением нового обвинительного приговора' },
          { value: '11', label: 'апелляционное постановление (определение) отменено с оставлением в силе постановления (приговора) суда первой инстанции' }
        ]
      });
      
      setCassationOptions({
        instance_type: [
          { value: 'cassation_first', label: 'Кассационный суд общей юрисдикции (первая кассация)' },
          { value: 'cassation_second', label: 'Судебная коллегия по уголовным делам ВС РФ (вторая кассация)' },
          { value: 'supervisory', label: 'Надзорная инстанция' }
        ],
        cassation_type: [
          { value: 'cassation', label: 'Кассационная жалоба' },
          { value: 'representation', label: 'Кассационное представление прокурора' }
        ],
        cassation_result: [
          { value: '1', label: 'судебное решение оставлено без изменения' },
          { value: '2', label: 'судебное решение отменено с передачей дела на новое судебное рассмотрение' },
          { value: '3', label: 'судебное решение отменено с прекращением дела' },
          { value: '4', label: 'судебное решение изменено' },
          { value: '5', label: 'судебное решение отменено с оставлением заявления без рассмотрения' },
          { value: '6', label: 'вынесено новое судебное решение' },
          { value: '7', label: 'производство по делу прекращено' },
          { value: '8', label: 'кассационное производство прекращено' }
        ],
        supervisory_result: [
          { value: '1', label: 'оставлено без изменения' },
          { value: '2', label: 'отменено с передачей дела на новое рассмотрение' },
          { value: '3', label: 'отменено с прекращением дела' },
          { value: '4', label: 'отменено с оставлением заявления без рассмотрения' },
          { value: '5', label: 'изменено' },
          { value: '6', label: 'вынесено новое судебное решение' }
        ]
      });
      
      setCivilOptions({
        result: [
          { value: '1', label: 'удовлетворен полностью' },
          { value: '2', label: 'удовлетворен частично' },
          { value: '3', label: 'оставлен без рассмотрения' },
          { value: '4', label: 'отказано в удовлетворении' },
          { value: '5', label: 'производство прекращено' }
        ]
      });
      
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
    }
  };

  const handleAppealChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppealForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCassationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCassationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCivilChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCivilForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (setter, name, dateString) => {
    setter(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleSaveAppeal = async () => {
    try {
      setSaving(true);
      const dataToSend = { ...appealForm };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });
      
      if (appealData) {
        await CriminalCaseService.updateAppealInstance(proceedingId, appealData.id, dataToSend);
      } else {
        await CriminalCaseService.createAppealInstance(proceedingId, dataToSend);
      }
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения апелляции:', err);
      setError('Не удалось сохранить данные апелляции');
      setSaving(false);
    }
  };

  const handleSaveCassation = async () => {
    try {
      setSaving(true);
      const dataToSend = { ...cassationForm };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });
      
      if (cassationData) {
        await CriminalCaseService.updateCassationInstance(proceedingId, cassationData.id, dataToSend);
      } else {
        await CriminalCaseService.createCassationInstance(proceedingId, dataToSend);
      }
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения кассации:', err);
      setError('Не удалось сохранить данные кассации');
      setSaving(false);
    }
  };

  const handleSaveCivil = async () => {
    try {
      setSaving(true);
      const dataToSend = { ...civilForm };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });
      
      if (civilData) {
        await CriminalCaseService.updateCivilClaim(proceedingId, civilData.id, dataToSend);
      } else {
        await CriminalCaseService.createCivilClaim(proceedingId, dataToSend);
      }
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения гражданского иска:', err);
      setError('Не удалось сохранить данные гражданского иска');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getOptionLabel = (optionsArray, value) => {
    return optionsArray.find(opt => opt.value === value)?.label || 'Не указано';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
          <h1 className={styles.title}>
            Решения по уголовному делу
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          <button onClick={handleCancel} className={styles.cancelButton}>
            Закрыть
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'appeal' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('appeal')}
              >
                Апелляция
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'cassation' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('cassation')}
              >
                Кассация / Надзор
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              {/* Вкладка Апелляции */}
              {activeTab === 'appeal' && (
                <div className={styles.tabContent}>
                  {/* Кнопка сохранения */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <button 
                      onClick={handleSaveAppeal}
                      disabled={saving}
                      className={styles.saveButton}
                    >
                      {saving ? 'Сохранение...' : 'Сохранить апелляцию'}
                    </button>
                  </div>

                  <div className={styles.tabGrid}>
                    {/* Блок: Обжалование приговора */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Обжалование приговора</h3>
                      
                      <div className={styles.field}>
                        <label>Обжалование приговора</label>
                        <select
                          name="appeal_present"
                          value={appealForm.appeal_present || ''}
                          onChange={handleAppealChange}
                          className={styles.select}
                        >
                          <option value="">Выберите</option>
                          {appealOptions.appeal_present.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Тип обжалования</label>
                        <select
                          name="appeal_type"
                          value={appealForm.appeal_type || ''}
                          onChange={handleAppealChange}
                          className={styles.select}
                        >
                          <option value="">Выберите</option>
                          {appealOptions.appeal_type.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Дата поступления апелляции</label>
                        <input
                          type="date"
                          name="appeal_date"
                          value={appealForm.appeal_date || ''}
                          onChange={(e) => handleDateChange(setAppealForm, 'appeal_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>ФИО заявителя апелляции</label>
                        <input
                          type="text"
                          name="appeal_applicant"
                          value={appealForm.appeal_applicant || ''}
                          onChange={handleAppealChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Процессуальное положение заявителя</label>
                        <select
                          name="appeal_applicant_status"
                          value={appealForm.appeal_applicant_status || ''}
                          onChange={handleAppealChange}
                          className={styles.select}
                        >
                          <option value="">Выберите</option>
                          {appealStatuses.map(status => (
                            <option key={status.id} value={status.id}>{status.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Блок: Направление в суд II инстанции */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Направление в суд II инстанции</h3>
                      
                      <div className={styles.field}>
                        <label>Дата направления в суд II инстанции</label>
                        <input
                          type="date"
                          name="court_sent_date"
                          value={appealForm.court_sent_date || ''}
                          onChange={(e) => handleDateChange(setAppealForm, 'court_sent_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата возвращения из суда II инстанции</label>
                        <input
                          type="date"
                          name="court_return_date"
                          value={appealForm.court_return_date || ''}
                          onChange={(e) => handleDateChange(setAppealForm, 'court_return_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Причина возвращения</label>
                        <textarea
                          name="court_return_reason"
                          value={appealForm.court_return_reason || ''}
                          onChange={handleAppealChange}
                          className={styles.textarea}
                          rows="2"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата повторного направления</label>
                        <input
                          type="date"
                          name="court_resend_date"
                          value={appealForm.court_resend_date || ''}
                          onChange={(e) => handleDateChange(setAppealForm, 'court_resend_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Блок: Рассмотрение во II инстанции */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Рассмотрение во II инстанции</h3>
                      
                      <div className={styles.field}>
                        <label>Дата рассмотрения</label>
                        <input
                          type="date"
                          name="court_consideration_date"
                          value={appealForm.court_consideration_date || ''}
                          onChange={(e) => handleDateChange(setAppealForm, 'court_consideration_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Состав суда II инстанции</label>
                        <select
                          name="court_composition"
                          value={appealForm.court_composition || ''}
                          onChange={handleAppealChange}
                          className={styles.select}
                        >
                          <option value="">Выберите</option>
                          {appealOptions.court_composition.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Состав коллегии (судьи)</label>
                        <input
                          type="text"
                          name="court_composition_details"
                          value={appealForm.court_composition_details || ''}
                          onChange={handleAppealChange}
                          className={styles.input}
                          placeholder="ФИО судей через запятую"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Результат апелляционного рассмотрения</label>
                        <select
                          name="appeal_result"
                          value={appealForm.appeal_result || ''}
                          onChange={handleAppealChange}
                          className={styles.select}
                        >
                          <option value="">Выберите</option>
                          {appealOptions.appeal_result.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Сущность изменений приговора</label>
                        <textarea
                          name="appeal_changes"
                          value={appealForm.appeal_changes || ''}
                          onChange={handleAppealChange}
                          className={styles.textarea}
                          rows="3"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата поступления дела из вышестоящего суда</label>
                        <input
                          type="date"
                          name="higher_court_receipt_date"
                          value={appealForm.higher_court_receipt_date || ''}
                          onChange={(e) => handleDateChange(setAppealForm, 'higher_court_receipt_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Примечания по апелляционному рассмотрению</label>
                        <textarea
                          name="notes"
                          value={appealForm.notes || ''}
                          onChange={handleAppealChange}
                          className={styles.textarea}
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка Кассации */}
              {activeTab === 'cassation' && (
                <div className={styles.tabContent}>
                  {/* Кнопка сохранения */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <button 
                      onClick={handleSaveCassation}
                      disabled={saving}
                      className={styles.saveButton}
                    >
                      {saving ? 'Сохранение...' : 'Сохранить кассацию'}
                    </button>
                  </div>

                  <div className={styles.tabGrid}>
                    {/* Блок: Основные сведения */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Основные сведения</h3>
                      
                      <div className={styles.field}>
                        <label>Кассационная инстанция</label>
                        <select
                          name="instance_type"
                          value={cassationForm.instance_type || 'cassation_first'}
                          onChange={handleCassationChange}
                          className={styles.select}
                        >
                          {cassationOptions.instance_type.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Подана кассационная жалоба/представление</label>
                        <select
                          name="cassation_filed"
                          value={cassationForm.cassation_filed}
                          onChange={handleCassationChange}
                          className={styles.select}
                        >
                          <option value="false">Нет</option>
                          <option value="true">Да</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Тип кассационного обжалования</label>
                        <select
                          name="cassation_type"
                          value={cassationForm.cassation_type || ''}
                          onChange={handleCassationChange}
                          className={styles.select}
                        >
                          <option value="">Выберите</option>
                          {cassationOptions.cassation_type.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Дата подачи кассационной жалобы</label>
                        <input
                          type="date"
                          name="cassation_date"
                          value={cassationForm.cassation_date || ''}
                          onChange={(e) => handleDateChange(setCassationForm, 'cassation_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Заявитель кассационной жалобы</label>
                        <input
                          type="text"
                          name="cassation_applicant"
                          value={cassationForm.cassation_applicant || ''}
                          onChange={handleCassationChange}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Блок: Направление дела в кассацию */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Направление дела в кассацию</h3>
                      
                      <div className={styles.field}>
                        <label>Дата направления дела в кассационную инстанцию</label>
                        <input
                          type="date"
                          name="court_sent_date"
                          value={cassationForm.court_sent_date || ''}
                          onChange={(e) => handleDateChange(setCassationForm, 'court_sent_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата поступления дела в кассационную инстанцию</label>
                        <input
                          type="date"
                          name="court_receipt_date"
                          value={cassationForm.court_receipt_date || ''}
                          onChange={(e) => handleDateChange(setCassationForm, 'court_receipt_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата возвращения дела из кассационной инстанции</label>
                        <input
                          type="date"
                          name="court_return_date"
                          value={cassationForm.court_return_date || ''}
                          onChange={(e) => handleDateChange(setCassationForm, 'court_return_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Блок: Рассмотрение в кассации */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Рассмотрение в кассации</h3>
                      
                      <div className={styles.field}>
                        <label>Дата рассмотрения в кассационной инстанции</label>
                        <input
                          type="date"
                          name="consideration_date"
                          value={cassationForm.consideration_date || ''}
                          onChange={(e) => handleDateChange(setCassationForm, 'consideration_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Результат кассационного рассмотрения</label>
                        <select
                          name="cassation_result"
                          value={cassationForm.cassation_result || ''}
                          onChange={handleCassationChange}
                          className={styles.select}
                        >
                          <option value="">Выберите</option>
                          {cassationOptions.cassation_result.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Сущность изменений</label>
                        <textarea
                          name="cassation_changes"
                          value={cassationForm.cassation_changes || ''}
                          onChange={handleCassationChange}
                          className={styles.textarea}
                          rows="3"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Номер кассационного определения/постановления</label>
                        <input
                          type="text"
                          name="ruling_number"
                          value={cassationForm.ruling_number || ''}
                          onChange={handleCassationChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата вынесения кассационного определения/постановления</label>
                        <input
                          type="date"
                          name="ruling_date"
                          value={cassationForm.ruling_date || ''}
                          onChange={(e) => handleDateChange(setCassationForm, 'ruling_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Блок: Надзорное производство (для второй кассации/надзора) */}
                    {cassationForm.instance_type !== 'cassation_first' && (
                      <div className={styles.fieldGroup}>
                        <h3 className={styles.subsectionTitle}>Надзорное производство</h3>
                        
                        <div className={styles.field}>
                          <label>Подано заявление о пересмотре в порядке надзора</label>
                          <select
                            name="supervisory_request"
                            value={cassationForm.supervisory_request}
                            onChange={handleCassationChange}
                            className={styles.select}
                          >
                            <option value="false">Нет</option>
                            <option value="true">Да</option>
                          </select>
                        </div>

                        <div className={styles.field}>
                          <label>Результат надзорного рассмотрения</label>
                          <select
                            name="supervisory_result"
                            value={cassationForm.supervisory_result || ''}
                            onChange={handleCassationChange}
                            className={styles.select}
                          >
                            <option value="">Выберите</option>
                            {cassationOptions.supervisory_result.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Блок: Примечания */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Примечания</h3>
                      
                      <div className={styles.field}>
                        <label>Примечания по кассационному/надзорному рассмотрению</label>
                        <textarea
                          name="notes"
                          value={cassationForm.notes || ''}
                          onChange={handleCassationChange}
                          className={styles.textarea}
                          rows="4"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Стороны по делу</h2>
            
            {defendants.length > 0 ? (
              <div className={styles.defendantsList}>
                {defendants.map(defendant => (
                  <div key={defendant.id} className={styles.defendantItem}>
                    <h4>{defendant.full_name_criminal}</h4>
                    <p>Статус: {defendant.sides_case_defendant_name || 'Подсудимый'}</p>
                    <p>Адрес: {defendant.address || 'Не указан'}</p>
                    <p>Дата рождения: {defendant.birth_date ? formatDate(defendant.birth_date) : 'Не указана'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>Обвиняемые не добавлены</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalDecisionDetail;