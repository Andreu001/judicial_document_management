import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './CriminalDetail.module.css';

const CriminalCivilClaimDetail = () => {
  const { proceedingId, id } = useParams();
  const navigate = useNavigate();
  
  const isCreateMode = !id || id === 'create';
  const [claimData, setClaimData] = useState(null);
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [loading, setLoading] = useState(!isCreateMode);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [victims, setVictims] = useState([]);
  const [formData, setFormData] = useState({
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
  
  const [resultOptions, setResultOptions] = useState([]);

  useEffect(() => {
    if (isCreateMode) {
      loadVictims();
      loadOptions();
      setLoading(false);
    } else {
      fetchClaimData();
    }
  }, [proceedingId, id, isCreateMode]);

  const fetchClaimData = async () => {
    try {
      setLoading(true);
      const data = await CriminalCaseService.getCivilClaimById(proceedingId, id);
      setClaimData(data);
      setFormData(data);
      await loadVictims();
      await loadOptions();
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки гражданского иска:', err);
      setError('Не удалось загрузить данные гражданского иска');
      setLoading(false);
    }
  };

  const loadVictims = async () => {
    try {
      const defendants = await CriminalCaseService.getDefendants(proceedingId);
      setVictims(defendants);
    } catch (error) {
      console.error('Ошибка загрузки потерпевших:', error);
      setVictims([]);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await baseService.get('/criminal_proceedings/criminal-options/');
      
      setResultOptions([
        { value: '1', label: 'удовлетворен полностью' },
        { value: '2', label: 'удовлетворен частично' },
        { value: '3', label: 'оставлен без рассмотрения' },
        { value: '4', label: 'отказано в удовлетворении' },
        { value: '5', label: 'производство прекращено' }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });
      
      if (isCreateMode) {
        await CriminalCaseService.createCivilClaim(proceedingId, dataToSend);
        navigate(-1);
      } else {
        await CriminalCaseService.updateCivilClaim(proceedingId, id, dataToSend);
        setIsEditing(false);
        await fetchClaimData();
      }
      
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate(-1);
    } else {
      setFormData(claimData);
      setIsEditing(false);
    }
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
        <div className={styles.loading}>Загрузка данных гражданского иска...</div>
      </div>
    );
  }

  if (error && !isCreateMode) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
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
            {isCreateMode ? 'Новый гражданский иск' : 'Гражданский иск'}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isCreateMode && !isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Убираем .content и .sidebar - делаем на всю ширину */}
      <div className={styles.fullWidthContent}>
        <div className={styles.tabsContainer}>
          <div className={styles.tabContentWrapper}>
            <div className={styles.tabContent}>
              <div className={styles.fullWidthGrid}>
                {/* Блок: Стороны иска */}
                <div className={styles.fieldGroup}>
                  <h3 className={styles.subsectionTitle}>Стороны иска</h3>
                  
                  <div className={styles.twoColumnGrid}>
                    <div className={styles.field}>
                      <label>Потерпевший (истец)</label>
                      {(isEditing || isCreateMode) ? (
                        <select
                          name="victim"
                          value={formData.victim || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Выберите потерпевшего</option>
                          {victims.map(victim => (
                            <option key={victim.id} value={victim.id}>
                              {victim.full_name_criminal}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>
                          {victims.find(v => v.id === formData.victim)?.full_name_criminal || 'Не указано'}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Истец (гражданский истец)</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="text"
                          name="plaintiff_name"
                          value={formData.plaintiff_name || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="ФИО или наименование"
                        />
                      ) : (
                        <span>{formData.plaintiff_name || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Ответчик (гражданский ответчик)</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="text"
                          name="defendant_name"
                          value={formData.defendant_name || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="ФИО или наименование"
                        />
                      ) : (
                        <span>{formData.defendant_name || 'Не указано'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Блок: Суммы иска */}
                <div className={styles.fieldGroup}>
                  <h3 className={styles.subsectionTitle}>Суммы иска</h3>
                  
                  <div className={styles.twoColumnGrid}>
                    <div className={styles.field}>
                      <label>Сумма иска (руб.)</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="number"
                          step="0.01"
                          name="claim_amount"
                          value={formData.claim_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formData.claim_amount ? `${formData.claim_amount} руб.` : 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма ущерба от хищения (руб.)</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="number"
                          step="0.01"
                          name="theft_damage_amount"
                          value={formData.theft_damage_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formData.theft_damage_amount ? `${formData.theft_damage_amount} руб.` : 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма ущерба от других преступлений (руб.)</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="number"
                          step="0.01"
                          name="other_damage_amount"
                          value={formData.other_damage_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formData.other_damage_amount ? `${formData.other_damage_amount} руб.` : 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма морального вреда (руб.)</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="number"
                          step="0.01"
                          name="moral_damage_amount"
                          value={formData.moral_damage_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formData.moral_damage_amount ? `${formData.moral_damage_amount} руб.` : 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Статья УК РФ по моральному вреду</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="text"
                          name="moral_damage_article"
                          value={formData.moral_damage_article || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="например, 151"
                        />
                      ) : (
                        <span>{formData.moral_damage_article || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма госпошлины (руб.)</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="number"
                          step="0.01"
                          name="state_duty_amount"
                          value={formData.state_duty_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formData.state_duty_amount ? `${formData.state_duty_amount} руб.` : 'Не указано'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Блок: Результат рассмотрения */}
                <div className={styles.fieldGroup}>
                  <h3 className={styles.subsectionTitle}>Результат рассмотрения</h3>
                  
                  <div className={styles.twoColumnGrid}>
                    <div className={styles.field}>
                      <label>Результат рассмотрения гражданского иска</label>
                      {(isEditing || isCreateMode) ? (
                        <select
                          name="result"
                          value={formData.result || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Выберите результат</option>
                          {resultOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{getOptionLabel(resultOptions, formData.result)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Присужденная сумма (руб.)</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="number"
                          step="0.01"
                          name="awarded_amount"
                          value={formData.awarded_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formData.awarded_amount ? `${formData.awarded_amount} руб.` : 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата решения по гражданскому иску</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="date"
                          name="decision_date"
                          value={formData.decision_date || ''}
                          onChange={(e) => handleDateChange('decision_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(formData.decision_date)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Блок: Исполнение */}
                <div className={styles.fieldGroup}>
                  <h3 className={styles.subsectionTitle}>Исполнение</h3>
                  
                  <div className={styles.twoColumnGrid}>
                    <div className={styles.field}>
                      <label>Дата фактического исполнения</label>
                      {(isEditing || isCreateMode) ? (
                        <input
                          type="date"
                          name="execution_date"
                          value={formData.execution_date || ''}
                          onChange={(e) => handleDateChange('execution_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(formData.execution_date)}</span>
                      )}
                    </div>

                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label>Примечания по исполнению</label>
                      {(isEditing || isCreateMode) ? (
                        <textarea
                          name="execution_notes"
                          value={formData.execution_notes || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows="3"
                        />
                      ) : (
                        <span>{formData.execution_notes || 'Не указано'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalCivilClaimDetail;