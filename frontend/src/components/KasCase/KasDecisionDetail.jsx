import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KasCaseService from '../../API/KasCaseService';
import styles from './KasDetail.module.css';

const KasDecisionDetail = () => {
  const { proceedingId, decisionId } = useParams();
  const navigate = useNavigate();
  const [decisionData, setDecisionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('main'); // main, appeal, cassation, other

  // Опции для выпадающих списков
  const [options, setOptions] = useState({
    outcomes: [],           // Результат рассмотрения (kas_outcome.csv)
    appealResults: [],      // Результат апелляции (kas_appeal_result.csv)
    cassationResults: [],   // Результат кассации (kas_cassation_result.csv)
    termCompliance: [],     // Соблюдение сроков (term_compliance.csv)
    appealTypes: [          // Тип обжалования
      { value: '1', label: 'Жалоба' },
      { value: '2', label: 'Представление прокурора' }
    ],
    cassationTypes: [       // Тип кассации
      { value: '1', label: 'Жалоба' },
      { value: '2', label: 'Представление прокурора' }
    ],
    courtComposition: [     // Состав суда
      { value: '1', label: 'Единолично судьей' },
      { value: '2', label: 'Коллегиально' }
    ],
    conciliationTypes: [    // Вид примирительной процедуры
      { value: '1', label: 'Медиация' },
      { value: '2', label: 'Судебное примирение' },
      { value: '3', label: 'Переговоры' }
    ],
    conciliationResults: [  // Результат примирения
      { value: '1', label: 'Спор урегулирован' },
      { value: '1.1', label: ' - с заключением мирового соглашения' },
      { value: '2', label: 'Не урегулирован' }
    ]
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const allOptions = await KasCaseService.getAllOptions();
        setOptions(prev => ({
          ...prev,
          outcomes: allOptions.outcomes || [],
          appealResults: allOptions.appealResults || [],
          cassationResults: allOptions.cassationResults || [],
          termCompliance: allOptions.termCompliance || []
        }));
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchDecisionData = async () => {
      if (decisionId && decisionId !== 'create' && decisionId !== 'undefined' && decisionId !== 'null') {
        try {
          setLoading(true);
          const data = await KasCaseService.getDecisionById(proceedingId, decisionId);
          setDecisionData(data);
          setFormData(data);
          setIsEditing(false);
        } catch (err) {
          console.error('Error fetching decision:', err);
          setError('Не удалось загрузить данные решения');
        } finally {
          setLoading(false);
        }
      } else {
        // Режим создания - инициализируем все поля модели
        setDecisionData(null);
        setFormData({
          // === III. РЕЗУЛЬТАТ РАССМОТРЕНИЯ ===
          decision_date: null,
          motivated_decision_date: null,
          is_simplified_procedure: false,
          decision_type: '1',
          is_default_judgment: false,
          outcome: '',
          outcome_clause: '',
          outcome_article: '',
          transferred_to_court: '',
          conciliation_procedure: false,
          conciliation_type: '',
          conciliation_result: '',
          ruling_refusal_of_claim: false,
          ruling_refusal_of_recognition: false,
          ruling_refusal_of_settlement: false,
          awarded_amount_main: null,
          awarded_amount_additional: null,
          state_duty_to_state: null,
          legal_costs: null,
          special_rulings_count: 0,
          special_rulings_reports_received: 0,
          court_composition: '',
          judges_list: '',
          participant_prosecutor_state: false,
          participant_prosecutor_plaintiff: false,
          participant_gov_agency: false,
          participant_public_org: false,
          participant_mass_media: false,
          participant_expert: false,
          participant_specialist: false,
          participant_translator: false,
          participant_minor: false,
          consideration_duration_months: null,
          consideration_duration_days: null,
          total_duration_months: null,
          total_duration_days: null,
          term_compliance: '',
          deadline_start_date: null,
          is_complex_case: false,
          submitted_to_department_date: null,
          copies_sent_to_absentees_date: null,
          protocol_objections_filed: false,
          protocol_objections_filed_date: null,
          protocol_objections_extended_deadline: false,
          protocol_objections_reviewed_date: null,

          // === IV. ОБЖАЛОВАНИЕ РЕШЕНИЯ (Апелляция) ===
          decision_is_appealed: false,
          decision_appeal_date: null,
          decision_appeal_review_date: null,
          decision_appeal_result: '',

          // === IV. ОБЖАЛОВАНИЕ РЕШЕНИЯ (Кассация) ===
          decision_is_cassation_filed: false,
          decision_cassation_date: null,
          decision_cassation_review_date: null,
          decision_cassation_result: '',

          // === VI. ДРУГИЕ СУДЕБНЫЕ ПОСТАНОВЛЕНИЯ ===
          additional_decision_date: null,
          clarification_ruling_date: null,
          execution_order_change_date: null,
          other_execution_ruling_date: null,
          court_fines_imposed: false,
          court_fines_details: '',
          procedural_costs_details: '',
          review_ruling_date: null
        });
        setIsEditing(true);
        setLoading(false);
      }
    };

    fetchDecisionData();
  }, [proceedingId, decisionId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : parseFloat(value)
    }));
  };

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (decisionId && decisionId !== 'create' && decisionId !== 'undefined' && decisionId !== 'null') {
        await KasCaseService.updateDecision(proceedingId, decisionId, formData);
      } else {
        await KasCaseService.createDecision(proceedingId, formData);
      }
      navigate(-1);
    } catch (err) {
      console.error('Error saving decision:', err);
      setError('Ошибка при сохранении решения: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getOptionLabel = (optionsArray, value) => {
    if (!optionsArray || !value) return 'Не указано';
    const option = optionsArray.find(opt => opt.value === value);
    return option?.label || value;
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад к делу
          </button>
          <h1 className={styles.title}>
            {decisionId && decisionId !== 'create' ? 'Редактирование решения' : 'Добавление решения'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button onClick={handleSubmit} className={styles.saveButton} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          {(!decisionId || decisionId === 'create') && (
            <button onClick={() => navigate(-1)} className={styles.cancelButton}>
              Отмена
            </button>
          )}
          {decisionId && decisionId !== 'create' && !isEditing && (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'main' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('main')}
              >
                Результат рассмотрения
              </button>
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
                Кассация
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'other' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('other')}
              >
                Другие постановления
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              <form onSubmit={handleSubmit}>
                
                {/* === ВКЛАДКА 1: РЕЗУЛЬТАТ РАССМОТРЕНИЯ === */}
                {activeTab === 'main' && (
                  <div className={styles.tabGrid}>
                    
                    {/* Блок 1: Основные даты и результат */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Даты и результат рассмотрения</h3>
                      
                      <div className={styles.field}>
                        <label>Дата рассмотрения дела</label>
                        {isEditing ? (
                          <input type="date" name="decision_date" value={formData.decision_date || ''}
                            onChange={(e) => handleDateChange('decision_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.decision_date)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Дата составления мотивированного решения</label>
                        {isEditing ? (
                          <input type="date" name="motivated_decision_date" value={formData.motivated_decision_date || ''}
                            onChange={(e) => handleDateChange('motivated_decision_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.motivated_decision_date)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Результат рассмотрения (основное требование)</label>
                        {isEditing ? (
                          <select name="outcome" value={formData.outcome || ''} onChange={handleInputChange} className={styles.select}>
                            <option value="">Не выбрано</option>
                            {options.outcomes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        ) : <span>{getOptionLabel(options.outcomes, decisionData?.outcome)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Пункт, часть, статья прекращения/оставления</label>
                        {isEditing ? (
                          <input type="text" name="outcome_clause" value={formData.outcome_clause || ''}
                            onChange={handleInputChange} className={styles.input} />
                        ) : <span>{decisionData?.outcome_clause || 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Статья (194, 196 КАС РФ)</label>
                        {isEditing ? (
                          <input type="text" name="outcome_article" value={formData.outcome_article || ''}
                            onChange={handleInputChange} className={styles.input} />
                        ) : <span>{decisionData?.outcome_article || 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Суд, в который передано дело</label>
                        {isEditing ? (
                          <input type="text" name="transferred_to_court" value={formData.transferred_to_court || ''}
                            onChange={handleInputChange} className={styles.input} />
                        ) : <span>{decisionData?.transferred_to_court || 'Не указано'}</span>}
                      </div>
                    </div>

                    {/* Блок 2: Примирительные процедуры */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Примирительные процедуры</h3>
                      
                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="conciliation_procedure" checked={formData.conciliation_procedure || false}
                            onChange={handleInputChange} disabled={!isEditing} />
                          Примирительные процедуры
                        </label>
                      </div>

                      {formData.conciliation_procedure && (
                        <>
                          <div className={styles.field}>
                            <label>Вид примирительной процедуры</label>
                            {isEditing ? (
                              <select name="conciliation_type" value={formData.conciliation_type || ''} onChange={handleInputChange} className={styles.select}>
                                <option value="">Выберите</option>
                                {options.conciliationTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            ) : <span>{getOptionLabel(options.conciliationTypes, decisionData?.conciliation_type)}</span>}
                          </div>

                          <div className={styles.field}>
                            <label>Результат примирения</label>
                            {isEditing ? (
                              <select name="conciliation_result" value={formData.conciliation_result || ''} onChange={handleInputChange} className={styles.select}>
                                <option value="">Выберите</option>
                                {options.conciliationResults.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            ) : <span>{getOptionLabel(options.conciliationResults, decisionData?.conciliation_result)}</span>}
                          </div>
                        </>
                      )}

                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="ruling_refusal_of_claim" checked={formData.ruling_refusal_of_claim || false}
                            onChange={handleInputChange} disabled={!isEditing} />
                          Определение о непринятии отказа истца от иска
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="ruling_refusal_of_recognition" checked={formData.ruling_refusal_of_recognition || false}
                            onChange={handleInputChange} disabled={!isEditing} />
                          Определение о непринятии признания иска ответчиком
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="ruling_refusal_of_settlement" checked={formData.ruling_refusal_of_settlement || false}
                            onChange={handleInputChange} disabled={!isEditing} />
                          Определение об отказе в утверждении соглашения о примирении
                        </label>
                      </div>
                    </div>

                    {/* Блок 3: Суммы и издержки */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Суммы и судебные издержки</h3>
                      
                      <div className={styles.field}>
                        <label>Присуждено к взысканию по основному требованию (руб.)</label>
                        {isEditing ? (
                          <input type="number" name="awarded_amount_main" value={formData.awarded_amount_main || ''}
                            onChange={handleNumberChange} className={styles.input} step="0.01" />
                        ) : <span>{decisionData?.awarded_amount_main ? `${decisionData.awarded_amount_main} ₽` : 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Присуждено к взысканию по дополнительным требованиям (руб.)</label>
                        {isEditing ? (
                          <input type="number" name="awarded_amount_additional" value={formData.awarded_amount_additional || ''}
                            onChange={handleNumberChange} className={styles.input} step="0.01" />
                        ) : <span>{decisionData?.awarded_amount_additional ? `${decisionData.awarded_amount_additional} ₽` : 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Госпошлина в доход государства (руб.)</label>
                        {isEditing ? (
                          <input type="number" name="state_duty_to_state" value={formData.state_duty_to_state || ''}
                            onChange={handleNumberChange} className={styles.input} step="0.01" />
                        ) : <span>{decisionData?.state_duty_to_state ? `${decisionData.state_duty_to_state} ₽` : 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Судебные издержки (руб.)</label>
                        {isEditing ? (
                          <input type="number" name="legal_costs" value={formData.legal_costs || ''}
                            onChange={handleNumberChange} className={styles.input} step="0.01" />
                        ) : <span>{decisionData?.legal_costs ? `${decisionData.legal_costs} ₽` : 'Не указано'}</span>}
                      </div>
                    </div>

                    {/* Блок 4: Состав суда и участники */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Состав суда и участники процесса</h3>
                      
                      <div className={styles.field}>
                        <label>Состав суда, вынесший решение</label>
                        {isEditing ? (
                          <select name="court_composition" value={formData.court_composition || ''} onChange={handleInputChange} className={styles.select}>
                            <option value="">Выберите</option>
                            {options.courtComposition.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        ) : <span>{getOptionLabel(options.courtComposition, decisionData?.court_composition)}</span>}
                      </div>

                      {formData.court_composition === '2' && (
                        <div className={styles.field}>
                          <label>Судьи (Ф.И.О.) при коллегиальном рассмотрении</label>
                          {isEditing ? (
                            <textarea name="judges_list" value={formData.judges_list || ''} onChange={handleInputChange}
                              className={styles.textarea} rows={3} placeholder="Укажите всех судей через запятую" />
                          ) : <span>{decisionData?.judges_list || 'Не указано'}</span>}
                        </div>
                      )}

                      <div className={styles.checkboxGroup}>
                        <h4 className={styles.subsectionTitle}>Участники процесса:</h4>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_prosecutor_state" checked={formData.participant_prosecutor_state || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Прокурор как представитель государства
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_prosecutor_plaintiff" checked={formData.participant_prosecutor_plaintiff || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Прокурор в интересах истца
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_gov_agency" checked={formData.participant_gov_agency || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Представитель гос. органов, организаций
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_public_org" checked={formData.participant_public_org || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Общественные организации
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_mass_media" checked={formData.participant_mass_media || false}
                            onChange={handleInputChange} disabled={!isEditing} /> СМИ
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_expert" checked={formData.participant_expert || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Эксперт
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_specialist" checked={formData.participant_specialist || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Специалист
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_translator" checked={formData.participant_translator || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Переводчик
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="participant_minor" checked={formData.participant_minor || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Несовершеннолетний
                        </label>
                      </div>
                    </div>

                    {/* Блок 5: Сроки рассмотрения */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Сроки рассмотрения</h3>
                      
                      <div className={styles.field}>
                        <label>Продолжительность рассмотрения (мес.)</label>
                        {isEditing ? (
                          <input type="number" name="consideration_duration_months" value={formData.consideration_duration_months || ''}
                            onChange={handleNumberChange} className={styles.input} />
                        ) : <span>{decisionData?.consideration_duration_months || 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Продолжительность рассмотрения (дни)</label>
                        {isEditing ? (
                          <input type="number" name="consideration_duration_days" value={formData.consideration_duration_days || ''}
                            onChange={handleNumberChange} className={styles.input} />
                        ) : <span>{decisionData?.consideration_duration_days || 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Общая продолжительность (мес.)</label>
                        {isEditing ? (
                          <input type="number" name="total_duration_months" value={formData.total_duration_months || ''}
                            onChange={handleNumberChange} className={styles.input} />
                        ) : <span>{decisionData?.total_duration_months || 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Общая продолжительность (дни)</label>
                        {isEditing ? (
                          <input type="number" name="total_duration_days" value={formData.total_duration_days || ''}
                            onChange={handleNumberChange} className={styles.input} />
                        ) : <span>{decisionData?.total_duration_days || 'Не указано'}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Дело рассмотрено в сроки</label>
                        {isEditing ? (
                          <select name="term_compliance" value={formData.term_compliance || ''} onChange={handleInputChange} className={styles.select}>
                            <option value="">Выберите</option>
                            {options.termCompliance.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        ) : <span>{getOptionLabel(options.termCompliance, decisionData?.term_compliance)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Дата начала исчисления процессуального срока</label>
                        {isEditing ? (
                          <input type="date" name="deadline_start_date" value={formData.deadline_start_date || ''}
                            onChange={(e) => handleDateChange('deadline_start_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.deadline_start_date)}</span>}
                      </div>

                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="is_complex_case" checked={formData.is_complex_case || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Дело сложное
                        </label>
                      </div>
                    </div>

                    {/* Блок 6: Частные определения и протокол */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Частные определения и протокол</h3>
                      
                      <div className={styles.field}>
                        <label>Количество вынесенных частных определений</label>
                        {isEditing ? (
                          <input type="number" name="special_rulings_count" value={formData.special_rulings_count || 0}
                            onChange={handleNumberChange} className={styles.input} />
                        ) : <span>{decisionData?.special_rulings_count || 0}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Поступило сообщений по частным определениям</label>
                        {isEditing ? (
                          <input type="number" name="special_rulings_reports_received" value={formData.special_rulings_reports_received || 0}
                            onChange={handleNumberChange} className={styles.input} />
                        ) : <span>{decisionData?.special_rulings_reports_received || 0}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Дата сдачи дела в отдел делопроизводства</label>
                        {isEditing ? (
                          <input type="date" name="submitted_to_department_date" value={formData.submitted_to_department_date || ''}
                            onChange={(e) => handleDateChange('submitted_to_department_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.submitted_to_department_date)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Копии направлены не явившимся лицам</label>
                        {isEditing ? (
                          <input type="date" name="copies_sent_to_absentees_date" value={formData.copies_sent_to_absentees_date || ''}
                            onChange={(e) => handleDateChange('copies_sent_to_absentees_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.copies_sent_to_absentees_date)}</span>}
                      </div>

                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="protocol_objections_filed" checked={formData.protocol_objections_filed || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Принесены замечания на протокол
                        </label>
                      </div>

                      {formData.protocol_objections_filed && (
                        <>
                          <div className={styles.field}>
                            <label>Дата принесения замечаний</label>
                            {isEditing ? (
                              <input type="date" name="protocol_objections_filed_date" value={formData.protocol_objections_filed_date || ''}
                                onChange={(e) => handleDateChange('protocol_objections_filed_date', e.target.value)} className={styles.input} />
                            ) : <span>{formatDate(decisionData?.protocol_objections_filed_date)}</span>}
                          </div>

                          <div className={styles.checkboxGroup}>
                            <label className={styles.checkboxLabel}>
                              <input type="checkbox" name="protocol_objections_extended_deadline" checked={formData.protocol_objections_extended_deadline || false}
                                onChange={handleInputChange} disabled={!isEditing} /> Продлено по сложным делам
                            </label>
                          </div>

                          <div className={styles.field}>
                            <label>Дата рассмотрения замечаний</label>
                            {isEditing ? (
                              <input type="date" name="protocol_objections_reviewed_date" value={formData.protocol_objections_reviewed_date || ''}
                                onChange={(e) => handleDateChange('protocol_objections_reviewed_date', e.target.value)} className={styles.input} />
                            ) : <span>{formatDate(decisionData?.protocol_objections_reviewed_date)}</span>}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Блок 7: Флаги упрощенного производства */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Особенности рассмотрения</h3>
                      
                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="is_simplified_procedure" checked={formData.is_simplified_procedure || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Рассмотрено в упрощенном производстве
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="is_default_judgment" checked={formData.is_default_judgment || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Рассмотрено без участия адм. ответчика
                        </label>
                      </div>
                    </div>

                  </div>
                )}

                {/* === ВКЛАДКА 2: АПЕЛЛЯЦИЯ === */}
                {activeTab === 'appeal' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>
                        <input type="checkbox" name="decision_is_appealed" checked={formData.decision_is_appealed || false}
                          onChange={handleInputChange} disabled={!isEditing} style={{ marginRight: '8px' }} />
                        Решение обжаловано в апелляции
                      </h3>

                      {formData.decision_is_appealed && (
                        <>
                          <div className={styles.field}>
                            <label>Дата подачи апелляционной жалобы на решение</label>
                            {isEditing ? (
                              <input type="date" name="decision_appeal_date" value={formData.decision_appeal_date || ''}
                                onChange={(e) => handleDateChange('decision_appeal_date', e.target.value)} className={styles.input} />
                            ) : <span>{formatDate(decisionData?.decision_appeal_date)}</span>}
                          </div>

                          <div className={styles.field}>
                            <label>Дата рассмотрения апелляции на решение</label>
                            {isEditing ? (
                              <input type="date" name="decision_appeal_review_date" value={formData.decision_appeal_review_date || ''}
                                onChange={(e) => handleDateChange('decision_appeal_review_date', e.target.value)} className={styles.input} />
                            ) : <span>{formatDate(decisionData?.decision_appeal_review_date)}</span>}
                          </div>

                          <div className={styles.field}>
                            <label>Результат апелляционного обжалования решения</label>
                            {isEditing ? (
                              <select name="decision_appeal_result" value={formData.decision_appeal_result || ''}
                                onChange={handleInputChange} className={styles.select}>
                                <option value="">Не выбрано</option>
                                {options.appealResults.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            ) : <span>{getOptionLabel(options.appealResults, decisionData?.decision_appeal_result)}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* === ВКЛАДКА 3: КАССАЦИЯ === */}
                {activeTab === 'cassation' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>
                        <input type="checkbox" name="decision_is_cassation_filed" checked={formData.decision_is_cassation_filed || false}
                          onChange={handleInputChange} disabled={!isEditing} style={{ marginRight: '8px' }} />
                        Решение обжаловано в кассации
                      </h3>

                      {formData.decision_is_cassation_filed && (
                        <>
                          <div className={styles.field}>
                            <label>Дата подачи кассационной жалобы на решение</label>
                            {isEditing ? (
                              <input type="date" name="decision_cassation_date" value={formData.decision_cassation_date || ''}
                                onChange={(e) => handleDateChange('decision_cassation_date', e.target.value)} className={styles.input} />
                            ) : <span>{formatDate(decisionData?.decision_cassation_date)}</span>}
                          </div>

                          <div className={styles.field}>
                            <label>Дата рассмотрения кассации на решение</label>
                            {isEditing ? (
                              <input type="date" name="decision_cassation_review_date" value={formData.decision_cassation_review_date || ''}
                                onChange={(e) => handleDateChange('decision_cassation_review_date', e.target.value)} className={styles.input} />
                            ) : <span>{formatDate(decisionData?.decision_cassation_review_date)}</span>}
                          </div>

                          <div className={styles.field}>
                            <label>Результат кассационного обжалования решения</label>
                            {isEditing ? (
                              <select name="decision_cassation_result" value={formData.decision_cassation_result || ''}
                                onChange={handleInputChange} className={styles.select}>
                                <option value="">Не выбрано</option>
                                {options.cassationResults.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            ) : <span>{getOptionLabel(options.cassationResults, decisionData?.decision_cassation_result)}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* === ВКЛАДКА 4: ДРУГИЕ СУДЕБНЫЕ ПОСТАНОВЛЕНИЯ === */}
                {activeTab === 'other' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Другие судебные постановления</h3>
                      
                      <div className={styles.field}>
                        <label>Дата дополнительного решения</label>
                        {isEditing ? (
                          <input type="date" name="additional_decision_date" value={formData.additional_decision_date || ''}
                            onChange={(e) => handleDateChange('additional_decision_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.additional_decision_date)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Дата определения о разъяснении решения</label>
                        {isEditing ? (
                          <input type="date" name="clarification_ruling_date" value={formData.clarification_ruling_date || ''}
                            onChange={(e) => handleDateChange('clarification_ruling_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.clarification_ruling_date)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Дата определения об изменении порядка исполнения</label>
                        {isEditing ? (
                          <input type="date" name="execution_order_change_date" value={formData.execution_order_change_date || ''}
                            onChange={(e) => handleDateChange('execution_order_change_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.execution_order_change_date)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Дата другого определения в порядке исполнения</label>
                        {isEditing ? (
                          <input type="date" name="other_execution_ruling_date" value={formData.other_execution_ruling_date || ''}
                            onChange={(e) => handleDateChange('other_execution_ruling_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.other_execution_ruling_date)}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Дата определения о пересмотре по вновь открывшимся обстоятельствам</label>
                        {isEditing ? (
                          <input type="date" name="review_ruling_date" value={formData.review_ruling_date || ''}
                            onChange={(e) => handleDateChange('review_ruling_date', e.target.value)} className={styles.input} />
                        ) : <span>{formatDate(decisionData?.review_ruling_date)}</span>}
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Судебные штрафы и издержки</h3>
                      
                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="court_fines_imposed" checked={formData.court_fines_imposed || false}
                            onChange={handleInputChange} disabled={!isEditing} /> Наложены судебные штрафы
                        </label>
                      </div>

                      {formData.court_fines_imposed && (
                        <div className={styles.field}>
                          <label>Детали штрафов (определение от, №, сумма и т.д.)</label>
                          {isEditing ? (
                            <textarea name="court_fines_details" value={formData.court_fines_details || ''}
                              onChange={handleInputChange} className={styles.textarea} rows={4} />
                          ) : <span>{decisionData?.court_fines_details || 'Не указано'}</span>}
                        </div>
                      )}

                      <div className={styles.field}>
                        <label>Процессуальные издержки (кому, дата, сумма, дни)</label>
                        {isEditing ? (
                          <textarea name="procedural_costs_details" value={formData.procedural_costs_details || ''}
                            onChange={handleInputChange} className={styles.textarea} rows={4} />
                        ) : <span>{decisionData?.procedural_costs_details || 'Не указано'}</span>}
                      </div>
                    </div>
                  </div>
                )}

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KasDecisionDetail;