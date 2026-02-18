import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';

const CivilDecisionDetail = () => {
  const { proceedingId, decisionId } = useParams();
  const navigate = useNavigate();
  const [decisionData, setDecisionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'appeal', 'cassation'

  // Опции для выпадающих списков
  const [options, setOptions] = useState({
    outcome: [],           // результат рассмотрения
    appeal_result: [],     // результат апелляции
    cassation_result: [],  // результат кассации
    second_instance_result: [] // для обратной совместимости
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const optionsData = await CivilCaseService.getCivilDecisionOptions();
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
          const data = await CivilCaseService.getDecisionById(proceedingId, decisionId);
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
        // Режим создания - инициализируем пустыми значениями в соответствии с моделью
        setDecisionData(null);
        setFormData({
          // Раздел 4. Результаты рассмотрения
          outcome: '',
          decision_date: null,
          decision_motivated_date: null,
          decision_effective_date: null,
          
          // Апелляция
          appeal_filed: false,
          appeal_date: null,
          appeal_result: '',
          appeal_decision_date: null,
          
          // Кассация
          cassation_filed: false,
          cassation_result: '',
          // Добавьте другие поля кассации, если они есть в модели
          // cassation_date: null,
          // cassation_decision_date: null,
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
      let savedDecision;
      if (decisionId && decisionId !== 'create' && decisionId !== 'undefined' && decisionId !== 'null') {
        savedDecision = await CivilCaseService.updateDecision(proceedingId, decisionId, formData);
      } else {
        savedDecision = await CivilCaseService.createDecision(proceedingId, formData);
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
                        <label>Дата вынесения решения</label>
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
                          name="decision_motivated_date"
                          value={formData.decision_motivated_date || ''}
                          onChange={(e) => handleDateChange('decision_motivated_date', e.target.value)}
                          className={styles.input}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата вступления в законную силу</label>
                        <input
                          type="date"
                          name="decision_effective_date"
                          value={formData.decision_effective_date || ''}
                          onChange={(e) => handleDateChange('decision_effective_date', e.target.value)}
                          className={styles.input}
                          disabled={!isEditing}
                        />
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
                          name="appeal_filed"
                          checked={formData.appeal_filed || false}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          style={{ marginRight: '8px' }}
                        />
                        Подана апелляционная жалоба
                      </h3>

                      {formData.appeal_filed && (
                        <>
                          <div className={styles.field}>
                            <label>Дата поступления апелляционной жалобы</label>
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
                              {/* Если нет appeal_result, используем second_instance_result */}
                              {(!options.appeal_result || options.appeal_result.length === 0) && 
                                options.second_instance_result?.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))
                              }
                            </select>
                          </div>

                          <div className={styles.field}>
                            <label>Дата апелляционного определения</label>
                            <input
                              type="date"
                              name="appeal_decision_date"
                              value={formData.appeal_decision_date || ''}
                              onChange={(e) => handleDateChange('appeal_decision_date', e.target.value)}
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
                      <h3 className={styles.subsectionTitle}>
                        <input
                          type="checkbox"
                          name="cassation_filed"
                          checked={formData.cassation_filed || false}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          style={{ marginRight: '8px' }}
                        />
                        Подана кассационная жалоба
                      </h3>

                      {formData.cassation_filed && (
                        <>
                          <div className={styles.field}>
                            <label>Результат кассационного рассмотрения</label>
                            <input
                              type="text"
                              name="cassation_result"
                              value={formData.cassation_result || ''}
                              onChange={handleInputChange}
                              className={styles.input}
                              disabled={!isEditing}
                              placeholder="Введите результат"
                            />
                          </div>
                          
                          {/* Если в модели есть дополнительные поля кассации, добавьте их здесь */}
                        </>
                      )}
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