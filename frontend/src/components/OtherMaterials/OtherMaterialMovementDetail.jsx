// components/OtherMaterial/OtherMaterialMovementDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OtherMaterialService from '../../API/OtherMaterialService';
import styles from './OtherMaterialDetail.module.css';

const OtherMaterialMovementDetail = () => {
  const { materialId, movementId } = useParams();
  const navigate = useNavigate();
  const [movementData, setMovementData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    date_meeting: '',
    meeting_time: '',
    decision_case: [],
    composition_colleges: '',
    result_court_session: '',
    reason_deposition: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [decisionOptions, setDecisionOptions] = useState([]);

  useEffect(() => {
    const fetchMovementData = async () => {
      if (movementId && movementId !== 'create' && movementId !== 'undefined' && movementId !== 'null') {
        try {
          setLoading(true);
          const data = await OtherMaterialService.getMovementById(materialId, movementId);
          setMovementData(data);
          setFormData(data);
          setIsEditing(false);
        } catch (err) {
          console.error('Error fetching movement:', err);
          setError('Не удалось загрузить данные движения');
        } finally {
          setLoading(false);
        }
      } else {
        setMovementData(null);
        setFormData({
          date_meeting: '',
          meeting_time: '',
          decision_case: [],
          composition_colleges: '',
          result_court_session: '',
          reason_deposition: ''
        });
        setIsEditing(true);
        setLoading(false);
      }
    };

    fetchMovementData();
  }, [materialId, movementId]);

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

  const handleTimeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      meeting_time: e.target.value
    }));
  };

  const handleDecisionChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      decision_case: selectedOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (movementId && movementId !== 'create' && movementId !== 'undefined' && movementId !== 'null') {
        await OtherMaterialService.updateMovement(materialId, movementId, formData);
      } else {
        await OtherMaterialService.createMovement(materialId, formData);
      }
      
      navigate(-1);
    } catch (err) {
      console.error('Error saving movement:', err);
      setError('Ошибка при сохранении движения: ' + (err.response?.data?.message || err.message));
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
            ← Назад
          </button>
          <h1 className={styles.title}>
            {movementId && movementId !== 'create' ? 'Редактирование движения' : 'Добавление движения'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button onClick={handleSubmit} className={styles.saveButton} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          {(!movementId || movementId === 'create') && (
            <button onClick={() => navigate(-1)} className={styles.cancelButton}>
              Отмена
            </button>
          )}
          {movementId && movementId !== 'create' && !isEditing && (
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
            <div className={styles.tabContentWrapper}>
              <form onSubmit={handleSubmit}>
                <div className={styles.tabGrid}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Информация о заседании</h3>
                    
                    <div className={styles.field}>
                      <label>Дата заседания *</label>
                      <input
                        type="date"
                        name="date_meeting"
                        value={formData.date_meeting || ''}
                        onChange={(e) => handleDateChange('date_meeting', e.target.value)}
                        className={styles.input}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Время заседания *</label>
                      <input
                        type="time"
                        name="meeting_time"
                        value={formData.meeting_time || ''}
                        onChange={handleTimeChange}
                        className={styles.input}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Результаты заседания</h3>
                    
                    <div className={styles.field}>
                      <label>Состав коллегии</label>
                      <input
                        type="text"
                        name="composition_colleges"
                        value={formData.composition_colleges || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="ФИО судей через запятую"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Результат заседания</label>
                      <textarea
                        name="result_court_session"
                        value={formData.result_court_session || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows={3}
                        placeholder="Результат рассмотрения, принятые решения..."
                        disabled={!isEditing}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Причина отложения</label>
                      <textarea
                        name="reason_deposition"
                        value={formData.reason_deposition || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows={3}
                        placeholder="Причина отложения заседания..."
                        disabled={!isEditing}
                      />
                    </div>
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

export default OtherMaterialMovementDetail;