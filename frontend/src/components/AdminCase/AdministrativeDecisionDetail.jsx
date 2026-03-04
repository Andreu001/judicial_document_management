import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import styles from './AdministrativeDetail.module.css';

const AdministrativeDecisionDetail = () => {
  const { proceedingId, decisionId } = useParams();
  const navigate = useNavigate();
  const [decisionData, setDecisionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    outcome: [],
    punishment_type: [],
    complaint_result: []
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const optionsData = await AdministrativeCaseService.getAdminDecisionOptions();
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
          const data = await AdministrativeCaseService.getDecisionById(proceedingId, decisionId);
          setDecisionData(data);
          setFormData(data);
          setIsEditing(false);
        } catch (err) {
          console.error('Error fetching decision:', err);
          setError('Не удалось загрузить данные постановления');
        } finally {
          setLoading(false);
        }
      } else {
        // Режим создания
        setDecisionData(null);
        setFormData({
          outcome: '',
          punishment_type: '',
          fine_amount: null,
          deprivation_period: '',
          arrest_period: '',
          suspension_period: '',
          decision_date: null,
          decision_motivated_date: null,
          decision_effective_date: null,
          complaint_filed: false,
          complaint_date: null,
          complaint_result: '',
          complaint_decision_date: null
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
        savedDecision = await AdministrativeCaseService.updateDecision(proceedingId, decisionId, formData);
      } else {
        savedDecision = await AdministrativeCaseService.createDecision(proceedingId, formData);
      }
      
      navigate(-1);
    } catch (err) {
      console.error('Error saving decision:', err);
      setError('Ошибка при сохранении постановления: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const getPunishmentTypeLabel = (value) => {
    const punishmentMap = {
      '1': 'Предупреждение',
      '2': 'Административный штраф',
      '3': 'Конфискация орудия или предмета',
      '4': 'Лишение специального права',
      '5': 'Административный арест',
      '6': 'Дисквалификация',
      '7': 'Административное приостановление деятельности',
      '8': 'Обязательные работы',
      '9': 'Административное выдворение',
    };
    return punishmentMap[value] || value;
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
            {decisionId && decisionId !== 'create' ? 'Редактирование постановления' : 'Добавление постановления'}
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
            <div className={styles.tabContentWrapper}>
              <form onSubmit={handleSubmit}>
                <div className={styles.tabGrid}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Результат рассмотрения</h3>
                    
                    <div className={styles.field}>
                      <label>Результат рассмотрения дела</label>
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
                      <label>Вид наказания</label>
                      <select
                        name="punishment_type"
                        value={formData.punishment_type || ''}
                        onChange={handleInputChange}
                        className={styles.select}
                        disabled={!isEditing}
                      >
                        <option value="">Не выбрано</option>
                        {options.punishment_type?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.punishment_type === '2' && (
                      <div className={styles.field}>
                        <label>Сумма штрафа (руб.)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="fine_amount"
                          value={formData.fine_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          disabled={!isEditing}
                        />
                      </div>
                    )}

                    {formData.punishment_type === '4' && (
                      <div className={styles.field}>
                        <label>Срок лишения специального права</label>
                        <input
                          type="text"
                          name="deprivation_period"
                          value={formData.deprivation_period || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Например: 1 год 6 месяцев"
                          disabled={!isEditing}
                        />
                      </div>
                    )}

                    {formData.punishment_type === '5' && (
                      <div className={styles.field}>
                        <label>Срок административного ареста</label>
                        <input
                          type="text"
                          name="arrest_period"
                          value={formData.arrest_period || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Например: 15 суток"
                          disabled={!isEditing}
                        />
                      </div>
                    )}

                    {formData.punishment_type === '7' && (
                      <div className={styles.field}>
                        <label>Срок приостановления деятельности</label>
                        <input
                          type="text"
                          name="suspension_period"
                          value={formData.suspension_period || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Например: 30 суток"
                          disabled={!isEditing}
                        />
                      </div>
                    )}
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Даты постановления</h3>
                    
                    <div className={styles.field}>
                      <label>Дата вынесения постановления</label>
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
                      <label>Дата составления мотивированного постановления</label>
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

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>
                      <input
                        type="checkbox"
                        name="complaint_filed"
                        checked={formData.complaint_filed || false}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        style={{ marginRight: '8px' }}
                      />
                      Обжалование
                    </h3>

                    {formData.complaint_filed && (
                      <>
                        <div className={styles.field}>
                          <label>Дата поступления жалобы</label>
                          <input
                            type="date"
                            name="complaint_date"
                            value={formData.complaint_date || ''}
                            onChange={(e) => handleDateChange('complaint_date', e.target.value)}
                            className={styles.input}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className={styles.field}>
                          <label>Результат рассмотрения жалобы</label>
                          <select
                            name="complaint_result"
                            value={formData.complaint_result || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                            disabled={!isEditing}
                          >
                            <option value="">Не выбрано</option>
                            {options.complaint_result?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.field}>
                          <label>Дата решения по жалобе</label>
                          <input
                            type="date"
                            name="complaint_decision_date"
                            value={formData.complaint_decision_date || ''}
                            onChange={(e) => handleDateChange('complaint_decision_date', e.target.value)}
                            className={styles.input}
                            disabled={!isEditing}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministrativeDecisionDetail;