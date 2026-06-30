// CriminalDecisionDetail.jsx - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ

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
  const [activeTab, setActiveTab] = useState('appeal');
  const [loading, setLoading] = useState(!isCreateMode);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [allSides, setAllSides] = useState([]);
  const [appealStatuses, setAppealStatuses] = useState([]);
  
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

  useEffect(() => {
    if (isCreateMode) {
      loadOptions();
      loadAllSides();
      loadAppealStatuses();
      setLoading(false);
    } else {
      fetchAllData();
    }
  }, [id, proceedingId, isCreateMode]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const appealResponse = await CriminalCaseService.getAppealInstances(proceedingId);
      if (appealResponse && appealResponse.length > 0) {
        const mainAppeal = appealResponse[0];
        setAppealData(mainAppeal);
        // Если есть сохраненный заявитель, преобразуем его в составной формат
        const formattedAppeal = { ...mainAppeal };
        if (mainAppeal.appeal_applicant) {
          // Ищем сторону по ID и типу
          const foundSide = allSides.find(side => side.id === mainAppeal.appeal_applicant);
          if (foundSide) {
            formattedAppeal.appeal_applicant = `${foundSide.type}-${foundSide.id}`;
          } else {
            formattedAppeal.appeal_applicant = '';
          }
        }
        setAppealForm(formattedAppeal);
      }
      
      const cassationResponse = await CriminalCaseService.getCassationInstances(proceedingId);
      if (cassationResponse && cassationResponse.length > 0) {
        const mainCassation = cassationResponse[0];
        setCassationData(mainCassation);
        // Преобразуем cassation_applicant в составной формат
        const formattedCassation = { ...mainCassation };
        if (mainCassation.cassation_applicant) {
          const foundSide = allSides.find(side => side.id === mainCassation.cassation_applicant);
          if (foundSide) {
            formattedCassation.cassation_applicant = `${foundSide.type}-${foundSide.id}`;
          } else {
            formattedCassation.cassation_applicant = '';
          }
        }
        setCassationForm(formattedCassation);
      }
      
      await loadOptions();
      await loadAllSides();
      await loadAppealStatuses();
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Не удалось загрузить данные');
      setLoading(false);
    }
  };

  const loadAllSides = async () => {
    try {
      const sides = await CriminalCaseService.getAllSides(proceedingId);
      console.log('Loaded sides:', sides);
      setAllSides(sides);
    } catch (error) {
      console.error('Ошибка загрузки сторон:', error);
      setAllSides([]);
    }
  };

  const loadAppealStatuses = async () => {
    try {
      const statuses = await CriminalCaseService.getAppealApplicantStatuses();
      console.log('Loaded statuses:', statuses);
      setAppealStatuses(statuses);
    } catch (error) {
      console.error('Ошибка загрузки статусов:', error);
      setAppealStatuses([]);
    }
  };

  // Функция для поиска ID статуса по названию
  const findStatusIdByName = (statusName) => {
    if (!statusName) return null;
    const status = appealStatuses.find(s => 
      s.name?.toLowerCase() === statusName.toLowerCase() ||
      s.name?.toLowerCase().includes(statusName.toLowerCase())
    );
    return status?.id || null;
  };

  // Функция для получения статуса по названию роли
  const getStatusForRole = (roleName, sideType) => {
    // Сопоставляем типы сторон с возможными статусами
    const roleToStatusMap = {
      'Подсудимый': 'Осужденный',
      'Обвиняемый': 'Осужденный',
      'Адвокат': 'Защитник',
      'Прокурор': 'Государственный обвинитель',
      'Потерпевший': 'Потерпевший',
      'Гражданский истец': 'Гражданский истец',
      'Гражданский ответчик': 'Гражданский ответчик'
    };
    
    // Ищем в маппинге
    for (const [key, value] of Object.entries(roleToStatusMap)) {
      if (roleName?.toLowerCase().includes(key.toLowerCase())) {
        return findStatusIdByName(value);
      }
    }
    
    // Если не нашли, пытаемся найти напрямую по названию роли
    return findStatusIdByName(roleName);
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

  const handleAppealApplicantChange = (e) => {
    const compositeValue = e.target.value;
    
    if (!compositeValue) {
      setAppealForm(prev => ({
        ...prev,
        appeal_applicant: '',
        appeal_applicant_status: ''
      }));
      return;
    }
    
    // Разбираем составное значение
    const parts = compositeValue.split('-');
    const type = parts[0];
    const parsedId = parseInt(parts[1], 10);
    
    // Находим выбранную сторону
    const selectedSide = allSides.find(side => 
      side.type === type && side.id === parsedId
    );
    
    if (selectedSide) {
      // Получаем роль для определения статуса
      const roleName = selectedSide.role || selectedSide.type || 
                      (selectedSide.sides_case_defendant_name) || 
                      (selectedSide.sides_case_criminal_detail?.sides_case) ||
                      'Участник процесса';
      
      const statusId = getStatusForRole(roleName, selectedSide.type);
      
      setAppealForm(prev => ({
        ...prev,
        appeal_applicant: compositeValue,
        appeal_applicant_status: statusId || ''
      }));
    } else {
      setAppealForm(prev => ({
        ...prev,
        appeal_applicant: '',
        appeal_applicant_status: ''
      }));
    }
  };

  const handleCassationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCassationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCassationApplicantChange = (e) => {
    const compositeValue = e.target.value;
    
    if (!compositeValue) {
      setCassationForm(prev => ({
        ...prev,
        cassation_applicant: '',
        cassation_applicant_status: ''
      }));
      return;
    }
    
    // Разбираем составное значение
    const parts = compositeValue.split('-');
    const type = parts[0];
    const parsedId = parseInt(parts[1], 10);
    
    // Находим выбранную сторону
    const selectedSide = allSides.find(side => 
      side.type === type && side.id === parsedId
    );
    
    if (selectedSide) {
      // Получаем роль для определения статуса
      const roleName = selectedSide.role || selectedSide.type || 
                      (selectedSide.sides_case_defendant_name) || 
                      (selectedSide.sides_case_criminal_detail?.sides_case) ||
                      'Участник процесса';
      
      const statusId = getStatusForRole(roleName, selectedSide.type);
      
      setCassationForm(prev => ({
        ...prev,
        cassation_applicant: compositeValue,
        cassation_applicant_status: statusId || ''
      }));
    } else {
      setCassationForm(prev => ({
        ...prev,
        cassation_applicant: '',
        cassation_applicant_status: ''
      }));
    }
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
      
      // Преобразуем appeal_applicant из составного значения в число
      if (dataToSend.appeal_applicant && typeof dataToSend.appeal_applicant === 'string') {
        const parts = dataToSend.appeal_applicant.split('-');
        dataToSend.appeal_applicant = parseInt(parts[1], 10);
      }
      
      // Преобразуем appeal_applicant_status в число (ID статуса)
      if (dataToSend.appeal_applicant_status) {
        dataToSend.appeal_applicant_status = parseInt(dataToSend.appeal_applicant_status, 10);
      }
      
      console.log('Sending appeal data:', dataToSend);
      
      if (appealData) {
        await CriminalCaseService.updateAppealInstance(proceedingId, appealData.id, dataToSend);
        // Обновляем сохраненные данные
        const updatedAppeal = { ...appealData, ...dataToSend };
        setAppealData(updatedAppeal);
      } else {
        const response = await CriminalCaseService.createAppealInstance(proceedingId, dataToSend);
        setAppealData(response);
      }
      setSaving(false);
      alert('Апелляция успешно сохранена');
    } catch (err) {
      console.error('Ошибка сохранения апелляции:', err);
      console.error('Error response:', err.response?.data);
      setError(`Не удалось сохранить данные апелляции: ${JSON.stringify(err.response?.data)}`);
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
      
      // Преобразуем cassation_applicant из составного значения в число
      if (dataToSend.cassation_applicant && typeof dataToSend.cassation_applicant === 'string') {
        const parts = dataToSend.cassation_applicant.split('-');
        dataToSend.cassation_applicant = parseInt(parts[1], 10);
      }
      
      if (dataToSend.cassation_filed !== undefined) {
        dataToSend.cassation_filed = dataToSend.cassation_filed === true || dataToSend.cassation_filed === 'true';
      }
      if (dataToSend.supervisory_request !== undefined) {
        dataToSend.supervisory_request = dataToSend.supervisory_request === true || dataToSend.supervisory_request === 'true';
      }
      
      console.log('Sending cassation data:', dataToSend);
      
      if (cassationData) {
        await CriminalCaseService.updateCassationInstance(proceedingId, cassationData.id, dataToSend);
        const updatedCassation = { ...cassationData, ...dataToSend };
        setCassationData(updatedCassation);
      } else {
        const response = await CriminalCaseService.createCassationInstance(proceedingId, dataToSend);
        setCassationData(response);
      }
      setSaving(false);
      alert('Кассация успешно сохранена');
    } catch (err) {
      console.error('Ошибка сохранения кассации:', err);
      console.error('Error response:', err.response?.data);
      setError(`Не удалось сохранить данные кассации: ${JSON.stringify(err.response?.data)}`);
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

  const getStatusName = (statusId) => {
    if (!statusId) return 'Не указано';
    const status = appealStatuses.find(s => s.id === statusId);
    return status?.name || 'Не указано';
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
            Пересмотр решений по уголовному делу
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
                        <label>Заявитель апелляции</label>
                        <select
                          name="appeal_applicant"
                          value={appealForm.appeal_applicant || ''}
                          onChange={handleAppealApplicantChange}
                          className={styles.select}
                        >
                          <option value="">Выберите заявителя</option>
                          {allSides.map(side => {
                            const displayRole = side.role || side.type || 
                              (side.sides_case_defendant_name) || 
                              (side.sides_case_criminal_detail?.sides_case) ||
                              'Участник';
                            const compositeValue = `${side.type}-${side.id}`;
                            return (
                              <option key={compositeValue} value={compositeValue}>
                                {side.name} ({displayRole})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Процессуальное положение заявителя</label>
                        <input
                          type="text"
                          value={getStatusName(appealForm.appeal_applicant_status)}
                          className={styles.input}
                          readOnly
                          disabled
                          style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

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
                        <select
                          name="cassation_applicant"
                          value={cassationForm.cassation_applicant || ''}
                          onChange={handleCassationApplicantChange}
                          className={styles.select}
                        >
                          <option value="">Выберите заявителя</option>
                          {allSides.map(side => {
                            const displayRole = side.role || side.type || 
                              (side.sides_case_defendant_name) || 
                              (side.sides_case_criminal_detail?.sides_case) ||
                              'Участник';
                            const compositeValue = `${side.type}-${side.id}`;
                            return (
                              <option key={compositeValue} value={compositeValue}>
                                {side.name} ({displayRole})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Процессуальное положение заявителя</label>
                        <input
                          type="text"
                          value={getStatusName(cassationForm.cassation_applicant_status)}
                          className={styles.input}
                          readOnly
                          disabled
                          style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

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
            
            {allSides.length > 0 ? (
              <div className={styles.defendantsList}>
                {allSides.map(side => {
                  const displayRole = side.role || side.type || 
                    (side.sides_case_defendant_name) || 
                    (side.sides_case_criminal_detail?.sides_case) ||
                    'Участник';
                  return (
                    <div key={`${side.type}-${side.id}`} className={styles.defendantItem}>
                      <h4>{side.name}</h4>
                      <p>Статус: {displayRole}</p>
                      {side.details && <p>{side.details}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.noData}>Стороны не добавлены</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalDecisionDetail;