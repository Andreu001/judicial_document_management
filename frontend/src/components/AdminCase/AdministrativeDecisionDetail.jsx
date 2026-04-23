import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import styles from './AdministrativeDetail.module.css';

const AdministrativeDecisionDetail = () => {
  const { proceedingId, decisionId } = useParams();
  const navigate = useNavigate();
  
  // Состояния для решения
  const [decisionData, setDecisionData] = useState(null);
  const [isEditingDecision, setIsEditingDecision] = useState(false);
  const [decisionFormData, setDecisionFormData] = useState({});
  
  // Состояния для апелляции
  const [appealData, setAppealData] = useState(null);
  const [isEditingAppeal, setIsEditingAppeal] = useState(false);
  const [appealFormData, setAppealFormData] = useState({});
  
  // Состояния для кассации
  const [cassationData, setCassationData] = useState(null);
  const [isEditingCassation, setIsEditingCassation] = useState(false);
  const [cassationFormData, setCassationFormData] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('decision'); // 'decision', 'appeal', 'cassation'
  
  // Опции для выпадающих списков
  const [options, setOptions] = useState({
    outcome: [],
    punishment_type: [],
    complaint_result: []
  });
  const [appealResultOptions, setAppealResultOptions] = useState([]);
  const [cassationResultOptions, setCassationResultOptions] = useState([]);

  // Загрузка опций
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [optionsData, appealResults, cassationResults] = await Promise.all([
          AdministrativeCaseService.getAdminDecisionOptions(),
          Promise.resolve(AdministrativeCaseService.getAppealResultOptions()),
          Promise.resolve(AdministrativeCaseService.getCassationResultOptions())
        ]);
        setOptions(optionsData);
        setAppealResultOptions(appealResults);
        setCassationResultOptions(cassationResults);
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };
    fetchOptions();
  }, []);

  // Загрузка всех данных
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Загружаем решение (если указан ID)
        if (decisionId && decisionId !== 'create' && decisionId !== 'undefined' && decisionId !== 'null') {
          const decision = await AdministrativeCaseService.getDecisionById(proceedingId, decisionId);
          setDecisionData(decision);
          setDecisionFormData(decision);
          setIsEditingDecision(false);
        } else {
          // Режим создания нового решения
          setDecisionData(null);
          setDecisionFormData({
            outcome: '',
            punishment_type: '',
            fine_amount: null,
            deprivation_period: '',
            arrest_period: '',
            suspension_period: '',
            decision_date: null,
            decision_motivated_date: null,
            decision_effective_date: null,
            immediate_execution: false,
            is_below_lowest_limit: false,
            is_auto_fixed_5000: false,
            disqualification_period: '',
            mandatory_work_hours: 0,
            complaint_filed: false,
            complaint_date: null,
            complaint_result: '',
            complaint_decision_date: null
          });
          setIsEditingDecision(true);
        }
        
        // Загружаем апелляцию
        const appeal = await AdministrativeCaseService.getAppeal(proceedingId);
        setAppealData(appeal);
        if (appeal) {
          setAppealFormData(appeal);
        } else {
          setAppealFormData({
            complaint_filed: false,
            complaint_type: '',
            complaint_filed_by: '',
            complaint_filed_date: null,
            complaint_received_date: null,
            case_sent_to_higher_court_date: null,
            higher_court_case_number: '',
            review_date: null,
            review_result: '',
            result_description: '',
            decision_date: null,
            decision_effective_date: null
          });
        }
        
        // Загружаем кассацию
        const cassation = await AdministrativeCaseService.getCassation(proceedingId);
        setCassationData(cassation);
        if (cassation) {
          setCassationFormData(cassation);
        } else {
          setCassationFormData({
            cassation_filed: false,
            cassation_type: '',
            cassation_filed_by: '',
            cassation_filed_date: null,
            cassation_received_date: null,
            cassation_review_date: null,
            cassation_result: '',
            cassation_result_description: '',
            cassation_decision_date: null
          });
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [proceedingId, decisionId]);

  // Обработчики для решения
  const handleDecisionInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDecisionFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDecisionDateChange = (name, dateString) => {
    setDecisionFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  // Обработчики для апелляции
  const handleAppealInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppealFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAppealDateChange = (name, dateString) => {
    setAppealFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  // Обработчики для кассации
  const handleCassationInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCassationFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCassationDateChange = (name, dateString) => {
    setCassationFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  // Сохранение решения
  const handleSaveDecision = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let savedDecision;
      if (decisionId && decisionId !== 'create' && decisionId !== 'undefined' && decisionId !== 'null') {
        savedDecision = await AdministrativeCaseService.updateDecision(proceedingId, decisionId, decisionFormData);
      } else {
        savedDecision = await AdministrativeCaseService.createDecision(proceedingId, decisionFormData);
      }
      setDecisionData(savedDecision);
      setIsEditingDecision(false);
    } catch (err) {
      console.error('Error saving decision:', err);
      setError('Ошибка при сохранении постановления: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Сохранение апелляции
  const handleSaveAppeal = async () => {
    setSaving(true);
    setError(null);

    try {
      let savedAppeal;
      if (appealData && appealData.id) {
        savedAppeal = await AdministrativeCaseService.updateAppeal(proceedingId, appealFormData);
      } else {
        savedAppeal = await AdministrativeCaseService.createAppeal(proceedingId, appealFormData);
      }
      setAppealData(savedAppeal);
      setIsEditingAppeal(false);
    } catch (err) {
      console.error('Error saving appeal:', err);
      setError('Ошибка при сохранении апелляции: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Сохранение кассации
  const handleSaveCassation = async () => {
    setSaving(true);
    setError(null);

    try {
      let savedCassation;
      if (cassationData && cassationData.id) {
        savedCassation = await AdministrativeCaseService.updateCassation(proceedingId, cassationFormData);
      } else {
        savedCassation = await AdministrativeCaseService.createCassation(proceedingId, cassationFormData);
      }
      setCassationData(savedCassation);
      setIsEditingCassation(false);
    } catch (err) {
      console.error('Error saving cassation:', err);
      setError('Ошибка при сохранении кассации: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
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

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(`/admin-proceedings/${proceedingId}`)} 
            className={styles.backButton}
          >
            ← Назад к делу
          </button>
          <h1 className={styles.title}>
            Решения по делу об АП
          </h1>
        </div>
        <div className={styles.headerRight}>
          {(activeSubTab === 'decision' && !isEditingDecision && decisionData) && (
            <button 
              onClick={() => setIsEditingDecision(true)} 
              className={styles.editButton}
            >
              Редактировать постановление
            </button>
          )}
          {(activeSubTab === 'appeal' && !isEditingAppeal) && (
            <button 
              onClick={() => setIsEditingAppeal(true)} 
              className={styles.editButton}
            >
              {appealData ? 'Редактировать апелляцию' : 'Добавить апелляцию'}
            </button>
          )}
          {(activeSubTab === 'cassation' && !isEditingCassation) && (
            <button 
              onClick={() => setIsEditingCassation(true)} 
              className={styles.editButton}
            >
              {cassationData ? 'Редактировать кассацию' : 'Добавить кассацию'}
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            {/* Под-вкладки для решений */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeSubTab === 'decision' ? styles.activeTab : ''}`}
                onClick={() => setActiveSubTab('decision')}
              >
                Постановление по делу
              </button>
              <button 
                className={`${styles.tab} ${activeSubTab === 'appeal' ? styles.activeTab : ''}`}
                onClick={() => setActiveSubTab('appeal')}
              >
                Апелляционное обжалование
              </button>
              <button 
                className={`${styles.tab} ${activeSubTab === 'cassation' ? styles.activeTab : ''}`}
                onClick={() => setActiveSubTab('cassation')}
              >
                Кассационное обжалование
              </button>
            </div>
            
            <div className={styles.tabContentWrapper}>
              {/* Вкладка ПОСТАНОВЛЕНИЕ */}
              {activeSubTab === 'decision' && (
                <form onSubmit={handleSaveDecision}>
                  <div className={styles.tabGrid}>
                    {/* Раздел 1: Результат рассмотрения */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Результат рассмотрения</h3>
                      
                      <div className={styles.field}>
                        <label>Результат рассмотрения дела</label>
                        {isEditingDecision ? (
                          <select
                            name="outcome"
                            value={decisionFormData.outcome || ''}
                            onChange={handleDecisionInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите результат</option>
                            {options.outcome?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{options.outcome?.find(o => o.value === decisionData?.outcome)?.label || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Вид наказания</label>
                        {isEditingDecision ? (
                          <select
                            name="punishment_type"
                            value={decisionFormData.punishment_type || ''}
                            onChange={handleDecisionInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите вид</option>
                            {options.punishment_type?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{options.punishment_type?.find(p => p.value === decisionData?.punishment_type)?.label || 'Не указано'}</span>
                        )}
                      </div>

                      {/* Штраф */}
                      {decisionFormData.punishment_type === '2' && (
                        <div className={styles.field}>
                          <label>Сумма штрафа (руб.)</label>
                          {isEditingDecision ? (
                            <input
                              type="number"
                              step="0.01"
                              name="fine_amount"
                              value={decisionFormData.fine_amount || ''}
                              onChange={handleDecisionInputChange}
                              className={styles.input}
                            />
                          ) : (
                            <span>{formatCurrency(decisionData?.fine_amount)}</span>
                          )}
                        </div>
                      )}

                      {/* Лишение специального права */}
                      {decisionFormData.punishment_type === '4' && (
                        <div className={styles.field}>
                          <label>Срок лишения специального права</label>
                          {isEditingDecision ? (
                            <input
                              type="text"
                              name="deprivation_period"
                              value={decisionFormData.deprivation_period || ''}
                              onChange={handleDecisionInputChange}
                              className={styles.input}
                              placeholder="Например: 1 год 6 месяцев"
                            />
                          ) : (
                            <span>{decisionData?.deprivation_period || 'Не указано'}</span>
                          )}
                        </div>
                      )}

                      {/* Административный арест */}
                      {decisionFormData.punishment_type === '5' && (
                        <div className={styles.field}>
                          <label>Срок административного ареста</label>
                          {isEditingDecision ? (
                            <input
                              type="text"
                              name="arrest_period"
                              value={decisionFormData.arrest_period || ''}
                              onChange={handleDecisionInputChange}
                              className={styles.input}
                              placeholder="Например: 15 суток"
                            />
                          ) : (
                            <span>{decisionData?.arrest_period || 'Не указано'}</span>
                          )}
                        </div>
                      )}

                      {/* Приостановление деятельности */}
                      {decisionFormData.punishment_type === '7' && (
                        <div className={styles.field}>
                          <label>Срок приостановления деятельности</label>
                          {isEditingDecision ? (
                            <input
                              type="text"
                              name="suspension_period"
                              value={decisionFormData.suspension_period || ''}
                              onChange={handleDecisionInputChange}
                              className={styles.input}
                              placeholder="Например: 30 суток"
                            />
                          ) : (
                            <span>{decisionData?.suspension_period || 'Не указано'}</span>
                          )}
                        </div>
                      )}

                      {/* Дисквалификация (ст. 3.11 КоАП РФ) */}
                      <div className={styles.field}>
                        <label>Срок дисквалификации</label>
                        {isEditingDecision ? (
                          <input
                            type="text"
                            name="disqualification_period"
                            value={decisionFormData.disqualification_period || ''}
                            onChange={handleDecisionInputChange}
                            className={styles.input}
                            placeholder="Например: 2 года"
                          />
                        ) : (
                          <span>{decisionData?.disqualification_period || 'Не указано'}</span>
                        )}
                      </div>

                      {/* Обязательные работы (ст. 3.13 КоАП РФ) */}
                      <div className={styles.field}>
                        <label>Обязательные работы (часов)</label>
                        {isEditingDecision ? (
                          <input
                            type="number"
                            name="mandatory_work_hours"
                            value={decisionFormData.mandatory_work_hours || 0}
                            onChange={handleDecisionInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{decisionData?.mandatory_work_hours || 0} часов</span>
                        )}
                      </div>

                      {/* Особые отметки по наказанию */}
                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="immediate_execution"
                            checked={decisionFormData.immediate_execution || false}
                            onChange={handleDecisionInputChange}
                            disabled={!isEditingDecision}
                          />
                          Постановление обращено к немедленному исполнению
                        </label>
                        
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_below_lowest_limit"
                            checked={decisionFormData.is_below_lowest_limit || false}
                            onChange={handleDecisionInputChange}
                            disabled={!isEditingDecision}
                          />
                          Наказание назначено ниже низшего предела (ст. 4.1 КоАП РФ)
                        </label>
                        
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_auto_fixed_5000"
                            checked={decisionFormData.is_auto_fixed_5000 || false}
                            onChange={handleDecisionInputChange}
                            disabled={!isEditingDecision}
                          />
                          Штраф 5000 руб. при автофиксации (ч. 3.1 ст. 4.1 КоАП РФ)
                        </label>
                      </div>
                    </div>

                    {/* Раздел 2: Даты постановления */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Даты постановления</h3>
                      
                      <div className={styles.field}>
                        <label>Дата вынесения постановления</label>
                        {isEditingDecision ? (
                          <input
                            type="date"
                            name="decision_date"
                            value={decisionFormData.decision_date || ''}
                            onChange={(e) => handleDecisionDateChange('decision_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(decisionData?.decision_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата составления мотивированного постановления</label>
                        {isEditingDecision ? (
                          <input
                            type="date"
                            name="decision_motivated_date"
                            value={decisionFormData.decision_motivated_date || ''}
                            onChange={(e) => handleDecisionDateChange('decision_motivated_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(decisionData?.decision_motivated_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата вступления в законную силу</label>
                        {isEditingDecision ? (
                          <input
                            type="date"
                            name="decision_effective_date"
                            value={decisionFormData.decision_effective_date || ''}
                            onChange={(e) => handleDecisionDateChange('decision_effective_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(decisionData?.decision_effective_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditingDecision && (
                    <div className={styles.editButtons} style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
                      <button 
                        type="submit" 
                        className={styles.saveButton}
                        disabled={saving}
                      >
                        {saving ? 'Сохранение...' : 'Сохранить постановление'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingDecision(false);
                          if (decisionData) {
                            setDecisionFormData(decisionData);
                          }
                        }} 
                        className={styles.cancelButton}
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Вкладка АПЕЛЛЯЦИЯ */}
              {activeSubTab === 'appeal' && (
                <div>
                  <div className={styles.tabGrid}>
                    {/* Раздел 4.1: Поступление жалобы (протеста) */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>
                        <input
                          type="checkbox"
                          name="complaint_filed"
                          checked={appealFormData.complaint_filed || false}
                          onChange={handleAppealInputChange}
                          disabled={!isEditingAppeal}
                          style={{ marginRight: '8px' }}
                        />
                        Подана жалоба (протест)
                      </h3>

                      {appealFormData.complaint_filed && (
                        <>
                          <div className={styles.field}>
                            <label>Тип обжалования</label>
                            {isEditingAppeal ? (
                              <select
                                name="complaint_type"
                                value={appealFormData.complaint_type || ''}
                                onChange={handleAppealInputChange}
                                className={styles.select}
                              >
                                <option value="">Выберите тип</option>
                                <option value="complaint">Жалоба</option>
                                <option value="protest">Протест прокурора</option>
                              </select>
                            ) : (
                              <span>{appealData?.complaint_type === 'complaint' ? 'Жалоба' : appealData?.complaint_type === 'protest' ? 'Протест прокурора' : 'Не указано'}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>Кем подана жалоба (протест)</label>
                            {isEditingAppeal ? (
                              <input
                                type="text"
                                name="complaint_filed_by"
                                value={appealFormData.complaint_filed_by || ''}
                                onChange={handleAppealInputChange}
                                className={styles.input}
                              />
                            ) : (
                              <span>{appealData?.complaint_filed_by || 'Не указано'}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>Дата подачи жалобы (протеста)</label>
                            {isEditingAppeal ? (
                              <input
                                type="date"
                                name="complaint_filed_date"
                                value={appealFormData.complaint_filed_date || ''}
                                onChange={(e) => handleAppealDateChange('complaint_filed_date', e.target.value)}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formatDate(appealData?.complaint_filed_date)}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>Дата поступления в суд</label>
                            {isEditingAppeal ? (
                              <input
                                type="date"
                                name="complaint_received_date"
                                value={appealFormData.complaint_received_date || ''}
                                onChange={(e) => handleAppealDateChange('complaint_received_date', e.target.value)}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formatDate(appealData?.complaint_received_date)}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Раздел 4.2: Направление дела в вышестоящий суд */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Направление в вышестоящий суд</h3>
                      
                      <div className={styles.field}>
                        <label>Дата направления дела в вышестоящий суд</label>
                        {isEditingAppeal ? (
                          <input
                            type="date"
                            name="case_sent_to_higher_court_date"
                            value={appealFormData.case_sent_to_higher_court_date || ''}
                            onChange={(e) => handleAppealDateChange('case_sent_to_higher_court_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(appealData?.case_sent_to_higher_court_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Номер дела в вышестоящем суде</label>
                        {isEditingAppeal ? (
                          <input
                            type="text"
                            name="higher_court_case_number"
                            value={appealFormData.higher_court_case_number || ''}
                            onChange={handleAppealInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{appealData?.higher_court_case_number || 'Не указано'}</span>
                        )}
                      </div>
                    </div>

                    {/* Раздел 4.3: Результат рассмотрения */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Результат рассмотрения</h3>
                      
                      <div className={styles.field}>
                        <label>Дата рассмотрения</label>
                        {isEditingAppeal ? (
                          <input
                            type="date"
                            name="review_date"
                            value={appealFormData.review_date || ''}
                            onChange={(e) => handleAppealDateChange('review_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(appealData?.review_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Результат рассмотрения жалобы (протеста)</label>
                        {isEditingAppeal ? (
                          <select
                            name="review_result"
                            value={appealFormData.review_result || ''}
                            onChange={handleAppealInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите результат</option>
                            {appealResultOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{appealResultOptions.find(r => r.value === appealData?.review_result)?.label || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Описание результата (суть изменений)</label>
                        {isEditingAppeal ? (
                          <textarea
                            name="result_description"
                            value={appealFormData.result_description || ''}
                            onChange={handleAppealInputChange}
                            className={styles.textarea}
                            rows={3}
                          />
                        ) : (
                          <span>{appealData?.result_description || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата вынесения апелляционного определения</label>
                        {isEditingAppeal ? (
                          <input
                            type="date"
                            name="decision_date"
                            value={appealFormData.decision_date || ''}
                            onChange={(e) => handleAppealDateChange('decision_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(appealData?.decision_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата вступления в силу</label>
                        {isEditingAppeal ? (
                          <input
                            type="date"
                            name="decision_effective_date"
                            value={appealFormData.decision_effective_date || ''}
                            onChange={(e) => handleAppealDateChange('decision_effective_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(appealData?.decision_effective_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditingAppeal && (
                    <div className={styles.editButtons} style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={handleSaveAppeal} 
                        className={styles.saveButton}
                        disabled={saving}
                      >
                        {saving ? 'Сохранение...' : 'Сохранить апелляцию'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingAppeal(false);
                          if (appealData) {
                            setAppealFormData(appealData);
                          }
                        }} 
                        className={styles.cancelButton}
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Вкладка КАССАЦИЯ */}
              {activeSubTab === 'cassation' && (
                <div>
                  <div className={styles.tabGrid}>
                    {/* Раздел 5.1: Поступление кассационной жалобы (протеста) */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>
                        <input
                          type="checkbox"
                          name="cassation_filed"
                          checked={cassationFormData.cassation_filed || false}
                          onChange={handleCassationInputChange}
                          disabled={!isEditingCassation}
                          style={{ marginRight: '8px' }}
                        />
                        Подана кассационная жалоба (протест)
                      </h3>

                      {cassationFormData.cassation_filed && (
                        <>
                          <div className={styles.field}>
                            <label>Тип кассационного обжалования</label>
                            {isEditingCassation ? (
                              <select
                                name="cassation_type"
                                value={cassationFormData.cassation_type || ''}
                                onChange={handleCassationInputChange}
                                className={styles.select}
                              >
                                <option value="">Выберите тип</option>
                                <option value="complaint">Жалоба</option>
                                <option value="protest">Протест прокурора</option>
                              </select>
                            ) : (
                              <span>{cassationData?.cassation_type === 'complaint' ? 'Жалоба' : cassationData?.cassation_type === 'protest' ? 'Протест прокурора' : 'Не указано'}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>Кем подана кассационная жалоба (протест)</label>
                            {isEditingCassation ? (
                              <input
                                type="text"
                                name="cassation_filed_by"
                                value={cassationFormData.cassation_filed_by || ''}
                                onChange={handleCassationInputChange}
                                className={styles.input}
                              />
                            ) : (
                              <span>{cassationData?.cassation_filed_by || 'Не указано'}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>Дата подачи кассационной жалобы (протеста)</label>
                            {isEditingCassation ? (
                              <input
                                type="date"
                                name="cassation_filed_date"
                                value={cassationFormData.cassation_filed_date || ''}
                                onChange={(e) => handleCassationDateChange('cassation_filed_date', e.target.value)}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formatDate(cassationData?.cassation_filed_date)}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>Дата поступления в суд</label>
                            {isEditingCassation ? (
                              <input
                                type="date"
                                name="cassation_received_date"
                                value={cassationFormData.cassation_received_date || ''}
                                onChange={(e) => handleCassationDateChange('cassation_received_date', e.target.value)}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formatDate(cassationData?.cassation_received_date)}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Раздел 5.2: Результат рассмотрения */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Результат рассмотрения</h3>
                      
                      <div className={styles.field}>
                        <label>Дата рассмотрения</label>
                        {isEditingCassation ? (
                          <input
                            type="date"
                            name="cassation_review_date"
                            value={cassationFormData.cassation_review_date || ''}
                            onChange={(e) => handleCassationDateChange('cassation_review_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(cassationData?.cassation_review_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Результат рассмотрения кассационной жалобы (протеста)</label>
                        {isEditingCassation ? (
                          <select
                            name="cassation_result"
                            value={cassationFormData.cassation_result || ''}
                            onChange={handleCassationInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите результат</option>
                            {cassationResultOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{cassationResultOptions.find(r => r.value === cassationData?.cassation_result)?.label || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Описание результата (суть изменений)</label>
                        {isEditingCassation ? (
                          <textarea
                            name="cassation_result_description"
                            value={cassationFormData.cassation_result_description || ''}
                            onChange={handleCassationInputChange}
                            className={styles.textarea}
                            rows={3}
                          />
                        ) : (
                          <span>{cassationData?.cassation_result_description || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата вынесения кассационного определения</label>
                        {isEditingCassation ? (
                          <input
                            type="date"
                            name="cassation_decision_date"
                            value={cassationFormData.cassation_decision_date || ''}
                            onChange={(e) => handleCassationDateChange('cassation_decision_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(cassationData?.cassation_decision_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditingCassation && (
                    <div className={styles.editButtons} style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={handleSaveCassation} 
                        className={styles.saveButton}
                        disabled={saving}
                      >
                        {saving ? 'Сохранение...' : 'Сохранить кассацию'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingCassation(false);
                          if (cassationData) {
                            setCassationFormData(cassationData);
                          }
                        }} 
                        className={styles.cancelButton}
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministrativeDecisionDetail;