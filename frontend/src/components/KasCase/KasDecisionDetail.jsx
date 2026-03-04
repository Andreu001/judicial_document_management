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
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'appeal', 'cassation', 'execution'

  // Опции для выпадающих списков
  const [options, setOptions] = useState({
    outcome: [],
    appeal_result: [],
    cassation_result: []
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const optionsData = await KasCaseService.getKasDecisionOptions();
        setOptions(optionsData);
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
        // Режим создания
        setDecisionData(null);
        setFormData({
          // Раздел III. Результат рассмотрения
          outcome: '',
          decision_date: null,
          motivated_decision_date: null,
          is_simplified_procedure: false,
          is_default_judgment: false,
          court_composition: '',
          
          // Раздел IV. Обжалование
          is_appealed: false,
          appeal_date: null,
          appeal_result: '',
          appeal_review_date: null,
          
          // Кассация
          cassation_ruling_date: null,
          cassation_result: '',
          
          // Раздел V. Исполнение (может быть частью решения или отдельным объектом)
          // Здесь оставим только то, что относится к решению
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
            {decisionId && decisionId !== 'create' ? 'Редактирование решения' : 'Добавление решения'}
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
          {(!decisionId || decisionId === 'create') && (
            <button 
              onClick={() => navigate(-1)} 
              className={styles.cancelButton}
            >
              Отмена
            </button>
          )}
          {decisionId && decisionId !== 'create' && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className={styles.editButton}
            >
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
            </div>

            <div className={styles.tabContentWrapper}>
              <form onSubmit={handleSubmit}>
                {/* Вкладка "Результат рассмотрения" */}
                {activeTab === 'main' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Результат рассмотрения дела</h3>
                      
                      <div className={styles.field}>
                        <label>Результат рассмотрения</label>
                        <select
                          name="outcome"
                          value={formData.outcome || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                          disabled={!isEditing}
                        >
                          <option value="">Не выбрано</option>
                          {options.outcome?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Дата рассмотрения дела</label>
                        <input
                          type="date"
                          name="decision_date"
                          value={formData.decision_date || ''}
                          onChange={(e) => handleDateChange('decision_date', e.target.value)}
                          className={styles.input}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата составления мотивированного решения</label>
                        <input
                          type="date"
                          name="motivated_decision_date"
                          value={formData.motivated_decision_date || ''}
                          onChange={(e) => handleDateChange('motivated_decision_date', e.target.value)}
                          className={styles.input}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Состав суда</label>
                        <select
                          name="court_composition"
                          value={formData.court_composition || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                          disabled={!isEditing}
                        >
                          <option value="">Не выбрано</option>
                          <option value="1">Единолично судьей</option>
                          <option value="2">Коллегиально</option>
                        </select>
                      </div>

                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_simplified_procedure"
                            checked={formData.is_simplified_procedure || false}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                          Рассмотрено в упрощенном производстве
                        </label>

                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="is_default_judgment"
                            checked={formData.is_default_judgment || false}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                          Рассмотрено без участия адм. ответчика
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Вкладка "Апелляция" */}
                {activeTab === 'appeal' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>
                        <input
                          type="checkbox"
                          name="is_appealed"
                          checked={formData.is_appealed || false}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          style={{ marginRight: '8px' }}
                        />
                        Подана апелляционная жалоба
                      </h3>

                      {formData.is_appealed && (
                        <>
                          <div className={styles.field}>
                            <label>Дата подачи жалобы/представления</label>
                            <input
                              type="date"
                              name="appeal_date"
                              value={formData.appeal_date || ''}
                              onChange={(e) => handleDateChange('appeal_date', e.target.value)}
                              className={styles.input}
                              disabled={!isEditing}
                            />
                          </div>

                          <div className={styles.field}>
                            <label>Результат апелляционного рассмотрения</label>
                            <select
                              name="appeal_result"
                              value={formData.appeal_result || ''}
                              onChange={handleInputChange}
                              className={styles.select}
                              disabled={!isEditing}
                            >
                              <option value="">Не выбрано</option>
                              {options.appeal_result?.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.field}>
                            <label>Дата рассмотрения во II инстанции</label>
                            <input
                              type="date"
                              name="appeal_review_date"
                              value={formData.appeal_review_date || ''}
                              onChange={(e) => handleDateChange('appeal_review_date', e.target.value)}
                              className={styles.input}
                              disabled={!isEditing}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Вкладка "Кассация" */}
                {activeTab === 'cassation' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Кассационное обжалование</h3>
                      
                      <div className={styles.field}>
                        <label>Дата кассационного постановления</label>
                        <input
                          type="date"
                          name="cassation_ruling_date"
                          value={formData.cassation_ruling_date || ''}
                          onChange={(e) => handleDateChange('cassation_ruling_date', e.target.value)}
                          className={styles.input}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Результат кассации</label>
                        <select
                          name="cassation_result"
                          value={formData.cassation_result || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                          disabled={!isEditing}
                        >
                          <option value="">Не выбрано</option>
                          {options.cassation_result?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
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