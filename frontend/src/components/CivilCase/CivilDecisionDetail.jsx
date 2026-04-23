import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';

const CivilDecisionDetail = () => {
  const { proceedingId, decisionId } = useParams();
  const navigate = useNavigate();
  const isEditing = decisionId && decisionId !== 'create' && decisionId !== 'undefined' && decisionId !== 'null';
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('main');

  const [options, setOptions] = useState({
    // Раздел 3. Результаты рассмотрения
    outcome: [],
    conciliation_type: [],
    conciliation_result: [],
    court_composition: [],
    // Раздел 4. Обжалование
    appeal_result: [],
    cassation_result: [],
    // Вспомогательные
    term_compliance: [],
    is_complex_case: [],
    protocol_objections_extended_deadline: []
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const optionsData = await CivilCaseService.getCivilDecisionOptions();
        setOptions(prev => ({
          ...prev,
          ...optionsData
        }));
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchDecisionData = async () => {
      if (isEditing) {
        try {
          setLoading(true);
          const data = await CivilCaseService.getDecisionById(proceedingId, decisionId);
          setFormData(data);
        } catch (err) {
          console.error('Error fetching decision:', err);
          setError('Не удалось загрузить данные решения');
        } finally {
          setLoading(false);
        }
      } else {
        // Режим создания - инициализируем пустыми значениями
        setFormData({});
        setLoading(false);
      }
    };

    fetchDecisionData();
  }, [proceedingId, decisionId, isEditing]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Очищаем данные перед отправкой
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });

      let savedDecision;
      if (isEditing) {
        savedDecision = await CivilCaseService.updateDecision(proceedingId, decisionId, dataToSend);
      } else {
        savedDecision = await CivilCaseService.createDecision(proceedingId, dataToSend);
      }
      
      navigate(`/civil-proceedings/${proceedingId}`);
    } catch (err) {
      console.error('Error saving decision:', err);
      setError('Ошибка при сохранении решения: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString;
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(-1)} 
            className={styles.backButton}
          >
            ← Назад к делу
          </button>
          <h1 className={styles.title}>
            {isEditing ? 'Редактирование решения' : 'Добавление решения'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={handleSubmit} 
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className={styles.cancelButton}
          >
            Отмена
          </button>
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
                className={`${styles.tab} ${activeTab === 'additional' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                Дополнительно
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              <form onSubmit={handleSubmit}>
                {/* Вкладка 1: Результат рассмотрения (Раздел 3) */}
                {activeTab === 'main' && (
                  <div className={styles.tabGrid}>
                    {/* Блок 3.1: Основные результаты */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Основные результаты</h3>
                      
                      <div className={styles.field}>
                        <label>Дата рассмотрения дела</label>
                        <input
                          type="date"
                          name="decision_date"
                          value={formatDateForInput(formData.decision_date)}
                          onChange={(e) => handleDateChange('decision_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата составления мотивированного решения</label>
                        <input
                          type="date"
                          name="motivated_decision_date"
                          value={formatDateForInput(formData.motivated_decision_date)}
                          onChange={(e) => handleDateChange('motivated_decision_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Результат рассмотрения (основное требование)</label>
                        <select
                          name="outcome"
                          value={formData.outcome || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Выберите результат</option>
                          {options.outcome?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Пункт, часть, статья прекращения/оставления</label>
                        <input
                          type="text"
                          name="outcome_clause"
                          value={formData.outcome_clause || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="например: п. 1 ч. 1 ст. 134 ГПК РФ"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Статья (194, 196 ГПК РФ, 194 КАС РФ)</label>
                        <input
                          type="text"
                          name="outcome_article"
                          value={formData.outcome_article || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Суд, в который передано дело</label>
                        <input
                          type="text"
                          name="transferred_to_court"
                          value={formData.transferred_to_court || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_simplified_procedure"
                            checked={formData.is_simplified_procedure || false}
                            onChange={handleInputChange}
                          />
                          Рассмотрено в упрощенном производстве
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_default_judgment"
                            checked={formData.is_default_judgment || false}
                            onChange={handleInputChange}
                          />
                          Рассмотрено без участия ответчика (заочное)
                        </label>
                      </div>
                    </div>

                    {/* Блок 3.2: Примирительные процедуры */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Примирительные процедуры</h3>
                      
                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="conciliation_procedure"
                            checked={formData.conciliation_procedure || false}
                            onChange={handleInputChange}
                          />
                          Проводились примирительные процедуры
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label>Вид примирительной процедуры</label>
                        <select
                          name="conciliation_type"
                          value={formData.conciliation_type || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                          disabled={!formData.conciliation_procedure}
                        >
                          <option value="">Выберите вид</option>
                          {options.conciliation_type?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Результат примирения</label>
                        <select
                          name="conciliation_result"
                          value={formData.conciliation_result || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                          disabled={!formData.conciliation_procedure}
                        >
                          <option value="">Выберите результат</option>
                          {options.conciliation_result?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Блок 3.3: Дополнительные определения */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Дополнительные определения</h3>
                      
                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="ruling_refusal_of_claim"
                            checked={formData.ruling_refusal_of_claim || false}
                            onChange={handleInputChange}
                          />
                          Определение о непринятии отказа истца от иска
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="ruling_refusal_of_recognition"
                            checked={formData.ruling_refusal_of_recognition || false}
                            onChange={handleInputChange}
                          />
                          Определение о непринятии признания иска ответчиком
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="ruling_refusal_of_settlement"
                            checked={formData.ruling_refusal_of_settlement || false}
                            onChange={handleInputChange}
                          />
                          Определение об отказе в утверждении мирового соглашения
                        </label>
                      </div>
                    </div>

                    {/* Блок 3.4: Присужденные суммы */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Присужденные суммы (руб.)</h3>
                      
                      <div className={styles.field}>
                        <label>По основному требованию</label>
                        <input
                          type="number"
                          name="awarded_amount_main"
                          value={formData.awarded_amount_main || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          step="0.01"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>По дополнительному требованию</label>
                        <input
                          type="number"
                          name="awarded_amount_additional"
                          value={formData.awarded_amount_additional || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          step="0.01"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Госпошлина в доход государства</label>
                        <input
                          type="number"
                          name="state_duty_to_state"
                          value={formData.state_duty_to_state || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          step="0.01"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Судебные издержки</label>
                        <input
                          type="number"
                          name="legal_costs"
                          value={formData.legal_costs || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Блок 3.5: Частные определения */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Частные определения</h3>
                      
                      <div className={styles.field}>
                        <label>Количество вынесенных частных определений</label>
                        <input
                          type="number"
                          name="special_rulings_count"
                          value={formData.special_rulings_count || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          min="0"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Поступило сообщений по частным определениям</label>
                        <input
                          type="number"
                          name="special_rulings_reports_received"
                          value={formData.special_rulings_reports_received || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Блок 3.6: Состав суда */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Состав суда и участники</h3>
                      
                      <div className={styles.field}>
                        <label>Состав суда, вынесший решение</label>
                        <select
                          name="court_composition"
                          value={formData.court_composition || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Выберите состав</option>
                          {options.court_composition?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Судьи (Ф.И.О.) при коллегиальном рассмотрении</label>
                        <textarea
                          name="judges_list"
                          value={formData.judges_list || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={3}
                          placeholder="Иванов И.И., Петров П.П."
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_prosecutor_state"
                            checked={formData.participant_prosecutor_state || false}
                            onChange={handleInputChange}
                          />
                          Прокурор как представитель государства
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_prosecutor_plaintiff"
                            checked={formData.participant_prosecutor_plaintiff || false}
                            onChange={handleInputChange}
                          />
                          Прокурор в интересах истца
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_gov_agency"
                            checked={formData.participant_gov_agency || false}
                            onChange={handleInputChange}
                          />
                          Представитель гос. органов, организаций
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_public_org"
                            checked={formData.participant_public_org || false}
                            onChange={handleInputChange}
                          />
                          Общественные организации
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_mass_media"
                            checked={formData.participant_mass_media || false}
                            onChange={handleInputChange}
                          />
                          СМИ
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_expert"
                            checked={formData.participant_expert || false}
                            onChange={handleInputChange}
                          />
                          Эксперт
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_specialist"
                            checked={formData.participant_specialist || false}
                            onChange={handleInputChange}
                          />
                          Специалист
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_translator"
                            checked={formData.participant_translator || false}
                            onChange={handleInputChange}
                          />
                          Переводчик
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="participant_minor"
                            checked={formData.participant_minor || false}
                            onChange={handleInputChange}
                          />
                          Несовершеннолетний
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Вкладка 2: Апелляция (Раздел 4.1) */}
                {activeTab === 'appeal' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Апелляционное обжалование</h3>
                      
                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_appealed"
                            checked={formData.is_appealed || false}
                            onChange={handleInputChange}
                          />
                          Решение обжаловано
                        </label>
                      </div>

                      {formData.is_appealed && (
                        <>
                          <div className={styles.field}>
                            <label>Кем обжаловано</label>
                            <textarea
                              name="appealed_by"
                              value={formData.appealed_by || ''}
                              onChange={handleInputChange}
                              className={styles.textarea}
                              rows={2}
                              placeholder="Истец, Ответчик, Прокурор..."
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Дата подачи жалобы/представления</label>
                            <input
                              type="date"
                              name="appeal_date"
                              value={formatDateForInput(formData.appeal_date)}
                              onChange={(e) => handleDateChange('appeal_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Тип обжалования</label>
                            <select
                              name="appeal_type"
                              value={formData.appeal_type || ''}
                              onChange={handleInputChange}
                              className={styles.select}
                            >
                              <option value="">Выберите тип</option>
                              <option value="1">Жалоба</option>
                              <option value="2">Представление прокурора</option>
                            </select>
                          </div>

                          <div className={styles.field}>
                            <label>Срок для устранения недостатков до</label>
                            <input
                              type="date"
                              name="appeal_deadline_for_corrections"
                              value={formatDateForInput(formData.appeal_deadline_for_corrections)}
                              onChange={(e) => handleDateChange('appeal_deadline_for_corrections', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Дело назначено к рассмотрению апел. инстанции на</label>
                            <input
                              type="date"
                              name="appeal_scheduled_date"
                              value={formatDateForInput(formData.appeal_scheduled_date)}
                              onChange={(e) => handleDateChange('appeal_scheduled_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Повторно назначено на</label>
                            <input
                              type="date"
                              name="appeal_scheduled_date_repeated"
                              value={formatDateForInput(formData.appeal_scheduled_date_repeated)}
                              onChange={(e) => handleDateChange('appeal_scheduled_date_repeated', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Дата направления в вышестоящий суд</label>
                            <input
                              type="date"
                              name="appeal_sent_to_higher_court_date"
                              value={formatDateForInput(formData.appeal_sent_to_higher_court_date)}
                              onChange={(e) => handleDateChange('appeal_sent_to_higher_court_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Дата повторного направления</label>
                            <input
                              type="date"
                              name="appeal_sent_to_higher_court_repeated"
                              value={formatDateForInput(formData.appeal_sent_to_higher_court_repeated)}
                              onChange={(e) => handleDateChange('appeal_sent_to_higher_court_repeated', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Дата возврата без рассмотрения</label>
                            <input
                              type="date"
                              name="appeal_returned_without_review_date"
                              value={formatDateForInput(formData.appeal_returned_without_review_date)}
                              onChange={(e) => handleDateChange('appeal_returned_without_review_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Причина возврата</label>
                            <textarea
                              name="appeal_return_reason"
                              value={formData.appeal_return_reason || ''}
                              onChange={handleInputChange}
                              className={styles.textarea}
                              rows={2}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Дата рассмотрения во II инстанции</label>
                            <input
                              type="date"
                              name="appeal_review_date"
                              value={formatDateForInput(formData.appeal_review_date)}
                              onChange={(e) => handleDateChange('appeal_review_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Результат апелляционного рассмотрения</label>
                            <select
                              name="appeal_result"
                              value={formData.appeal_result || ''}
                              onChange={handleInputChange}
                              className={styles.select}
                            >
                              <option value="">Выберите результат</option>
                              {options.appeal_result?.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Вкладка 3: Кассация (Раздел 4.2) */}
                {activeTab === 'cassation' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Кассационное обжалование</h3>
                      
                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_cassation_filed"
                            checked={formData.is_cassation_filed || false}
                            onChange={handleInputChange}
                          />
                          Подана кассационная жалоба
                        </label>
                      </div>

                      {formData.is_cassation_filed && (
                        <>
                          <div className={styles.field}>
                            <label>Кем подана кассационная жалоба</label>
                            <textarea
                              name="cassation_filed_by"
                              value={formData.cassation_filed_by || ''}
                              onChange={handleInputChange}
                              className={styles.textarea}
                              rows={2}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Дата подачи кассационной жалобы</label>
                            <input
                              type="date"
                              name="cassation_date"
                              value={formatDateForInput(formData.cassation_date)}
                              onChange={(e) => handleDateChange('cassation_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Дата рассмотрения в кассационной инстанции</label>
                            <input
                              type="date"
                              name="cassation_review_date"
                              value={formatDateForInput(formData.cassation_review_date)}
                              onChange={(e) => handleDateChange('cassation_review_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Результат кассационного рассмотрения</label>
                            <select
                              name="cassation_result"
                              value={formData.cassation_result || ''}
                              onChange={handleInputChange}
                              className={styles.select}
                            >
                              <option value="">Выберите результат</option>
                              {options.cassation_result?.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Вкладка 4: Дополнительно (Разделы 3.7, 3.8, 6) */}
                {activeTab === 'additional' && (
                  <div className={styles.tabGrid}>
                    {/* Блок 3.7: Продолжительность */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Продолжительность рассмотрения</h3>
                      
                      <div className={styles.field}>
                        <label>Продолжительность рассмотрения (мес.)</label>
                        <input
                          type="number"
                          name="consideration_duration_months"
                          value={formData.consideration_duration_months || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          step="1"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Продолжительность рассмотрения (дни)</label>
                        <input
                          type="number"
                          name="consideration_duration_days"
                          value={formData.consideration_duration_days || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          step="1"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Общая продолжительность (мес.)</label>
                        <input
                          type="number"
                          name="total_duration_months"
                          value={formData.total_duration_months || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          step="1"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Общая продолжительность (дни)</label>
                        <input
                          type="number"
                          name="total_duration_days"
                          value={formData.total_duration_days || ''}
                          onChange={handleNumberChange}
                          className={styles.input}
                          step="1"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дело рассмотрено в сроки</label>
                        <select
                          name="term_compliance"
                          value={formData.term_compliance || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Выберите</option>
                          {options.term_compliance?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Дата начала исчисления процесс. срока</label>
                        <input
                          type="date"
                          name="deadline_start_date"
                          value={formatDateForInput(formData.deadline_start_date)}
                          onChange={(e) => handleDateChange('deadline_start_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_complex_case"
                            checked={formData.is_complex_case || false}
                            onChange={handleInputChange}
                          />
                          Дело сложное
                        </label>
                      </div>
                    </div>

                    {/* Блок 3.8: Сдача в отдел и отправка копий */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Делопроизводство</h3>
                      
                      <div className={styles.field}>
                        <label>Дата сдачи дела в отдел делопроизводства</label>
                        <input
                          type="date"
                          name="submitted_to_department_date"
                          value={formatDateForInput(formData.submitted_to_department_date)}
                          onChange={(e) => handleDateChange('submitted_to_department_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Копии направлены не явившимся лицам</label>
                        <input
                          type="date"
                          name="copies_sent_to_absentees_date"
                          value={formatDateForInput(formData.copies_sent_to_absentees_date)}
                          onChange={(e) => handleDateChange('copies_sent_to_absentees_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Блок 3.9: Замечания на протокол */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Замечания на протокол</h3>
                      
                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="protocol_objections_filed"
                            checked={formData.protocol_objections_filed || false}
                            onChange={handleInputChange}
                          />
                          Принесены замечания на протокол
                        </label>
                      </div>

                      {formData.protocol_objections_filed && (
                        <>
                          <div className={styles.field}>
                            <label>Дата принесения замечаний</label>
                            <input
                              type="date"
                              name="protocol_objections_filed_date"
                              value={formatDateForInput(formData.protocol_objections_filed_date)}
                              onChange={(e) => handleDateChange('protocol_objections_filed_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.field}>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                name="protocol_objections_extended_deadline"
                                checked={formData.protocol_objections_extended_deadline || false}
                                onChange={handleInputChange}
                              />
                              Продлено по сложным делам
                            </label>
                          </div>

                          <div className={styles.field}>
                            <label>Дата рассмотрения замечаний</label>
                            <input
                              type="date"
                              name="protocol_objections_reviewed_date"
                              value={formatDateForInput(formData.protocol_objections_reviewed_date)}
                              onChange={(e) => handleDateChange('protocol_objections_reviewed_date', e.target.value)}
                              className={styles.input}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Блок 6: Другие судебные постановления */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Другие судебные постановления</h3>
                      
                      <div className={styles.field}>
                        <label>Дата дополнительного решения</label>
                        <input
                          type="date"
                          name="additional_decision_date"
                          value={formatDateForInput(formData.additional_decision_date)}
                          onChange={(e) => handleDateChange('additional_decision_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата определения о разъяснении решения</label>
                        <input
                          type="date"
                          name="clarification_ruling_date"
                          value={formatDateForInput(formData.clarification_ruling_date)}
                          onChange={(e) => handleDateChange('clarification_ruling_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата определения об изменении порядка исполнения</label>
                        <input
                          type="date"
                          name="execution_order_change_date"
                          value={formatDateForInput(formData.execution_order_change_date)}
                          onChange={(e) => handleDateChange('execution_order_change_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата другого определения в порядке исполнения</label>
                        <input
                          type="date"
                          name="other_execution_ruling_date"
                          value={formatDateForInput(formData.other_execution_ruling_date)}
                          onChange={(e) => handleDateChange('other_execution_ruling_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="court_fines_imposed"
                            checked={formData.court_fines_imposed || false}
                            onChange={handleInputChange}
                          />
                          Наложены судебные штрафы
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label>Детали штрафов (определение от, №, сумма и т.д.)</label>
                        <textarea
                          name="court_fines_details"
                          value={formData.court_fines_details || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={3}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Процессуальные издержки (кому, дата, сумма, дни)</label>
                        <textarea
                          name="procedural_costs_details"
                          value={formData.procedural_costs_details || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={3}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата определения о пересмотре по вновь открывшимся обстоятельствам</label>
                        <input
                          type="date"
                          name="review_ruling_date"
                          value={formatDateForInput(formData.review_ruling_date)}
                          onChange={(e) => handleDateChange('review_ruling_date', e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата кассационного постановления</label>
                        <input
                          type="date"
                          name="cassation_ruling_date"
                          value={formatDateForInput(formData.cassation_ruling_date)}
                          onChange={(e) => handleDateChange('cassation_ruling_date', e.target.value)}
                          className={styles.input}
                        />
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

export default CivilDecisionDetail;