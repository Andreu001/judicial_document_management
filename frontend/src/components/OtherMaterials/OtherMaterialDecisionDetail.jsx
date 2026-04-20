// components/OtherMaterial/OtherMaterialDecisionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OtherMaterialService from '../../API/OtherMaterialService';
import styles from './OtherMaterialDetail.module.css';

const OtherMaterialDecisionDetail = () => {
  const { materialId, decisionId } = useParams();
  const navigate = useNavigate();
  const [decisionData, setDecisionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDecisionData = async () => {
      if (decisionId && decisionId !== 'create' && decisionId !== 'undefined' && decisionId !== 'null') {
        try {
          setLoading(true);
          const data = await OtherMaterialService.getDecisionById(materialId, decisionId);
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
        setDecisionData(null);
        setFormData({
          outcome: '',
          decision_date: null,
          decision_effective_date: null,
          complaint_filed: false,
          complaint_result: ''
        });
        setIsEditing(true);
        setLoading(false);
      }
    };

    fetchDecisionData();
  }, [materialId, decisionId]);

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
        await OtherMaterialService.updateDecision(materialId, decisionId, formData);
      } else {
        await OtherMaterialService.createDecision(materialId, formData);
      }
      navigate(-1);
    } catch (err) {
      console.error('Error saving decision:', err);
      setError('Ошибка при сохранении решения');
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
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад к материалу
          </button>
          <h1 className={styles.title}>
            {decisionId && decisionId !== 'create' ? 'Редактирование решения' : 'Добавление решения'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button onClick={handleSubmit} className={styles.saveButton} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
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
                      <label>Результат рассмотрения</label>
                      <select
                        name="outcome"
                        value={formData.outcome || ''}
                        onChange={handleInputChange}
                        className={styles.select}
                      >
                        <option value="">Выберите результат</option>
                        <option value="1">Удовлетворено</option>
                        <option value="2">Отказано в удовлетворении</option>
                        <option value="3">Прекращено производство</option>
                        <option value="4">Оставлено без рассмотрения</option>
                        <option value="5">Передано по подведомственности</option>
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
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Дата вступления в силу</label>
                      <input
                        type="date"
                        name="decision_effective_date"
                        value={formData.decision_effective_date || ''}
                        onChange={(e) => handleDateChange('decision_effective_date', e.target.value)}
                        className={styles.input}
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
                        style={{ marginRight: '8px' }}
                      />
                      Обжалование
                    </h3>

                    {formData.complaint_filed && (
                      <div className={styles.field}>
                        <label>Результат обжалования</label>
                        <select
                          name="complaint_result"
                          value={formData.complaint_result || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Выберите результат</option>
                          <option value="1">Оставлено без изменения</option>
                          <option value="2">Отменено</option>
                          <option value="3">Изменено</option>
                        </select>
                      </div>
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

export default OtherMaterialDecisionDetail;