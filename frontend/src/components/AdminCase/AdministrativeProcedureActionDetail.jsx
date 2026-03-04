import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import styles from './AdministrativeDetail.module.css';

const AdministrativeProcedureActionDetail = () => {
  const { proceedingId, actionId } = useParams();
  const navigate = useNavigate();
  const [actionData, setActionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActionData = async () => {
      if (actionId && actionId !== 'create' && actionId !== 'undefined' && actionId !== 'null') {
        try {
          setLoading(true);
          // Для административных дел используем эндпоинт movements вместо procedure-actions
          const data = await AdministrativeCaseService.getMovementById(proceedingId, actionId);
          setActionData(data);
          setFormData(data);
          setIsEditing(false);
        } catch (err) {
          console.error('Error fetching procedure action:', err);
          setError('Не удалось загрузить данные процессуального действия');
        } finally {
          setLoading(false);
        }
      } else {
        // Режим создания - инициализируем пустыми значениями в соответствии с моделью AdministrativeCaseMovement
        setActionData(null);
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

    fetchActionData();
  }, [proceedingId, actionId]);

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

  const handleDecisionCaseChange = (e) => {
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
      let savedAction;
      if (actionId && actionId !== 'create' && actionId !== 'undefined' && actionId !== 'null') {
        savedAction = await AdministrativeCaseService.updateMovement(proceedingId, actionId, formData);
      } else {
        savedAction = await AdministrativeCaseService.createMovement(proceedingId, formData);
      }
      
      navigate(-1);
    } catch (err) {
      console.error('Error saving procedure action:', err);
      setError('Ошибка при сохранении процессуального действия: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
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
            {actionId && actionId !== 'create' ? 'Редактирование процессуального действия' : 'Добавление процессуального действия'}
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
          {!actionId && (
            <button 
              onClick={() => navigate(-1)} 
              className={styles.cancelButton}
            >
              Отмена
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
                    <h3 className={styles.subsectionTitle}>Судебное заседание</h3>
                    
                    <div className={styles.field}>
                      <label>Дата заседания</label>
                      <input
                        type="date"
                        name="date_meeting"
                        value={formData.date_meeting || ''}
                        onChange={(e) => handleDateChange('date_meeting', e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Время заседания</label>
                      <input
                        type="time"
                        name="meeting_time"
                        value={formData.meeting_time || ''}
                        onChange={handleTimeChange}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Состав коллегии</label>
                      <input
                        type="text"
                        name="composition_colleges"
                        value={formData.composition_colleges || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="ФИО судей через запятую"
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Результаты заседания</h3>
                    
                    <div className={styles.field}>
                      <label>Результат судебного заседания</label>
                      <textarea
                        name="result_court_session"
                        value={formData.result_court_session || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows={3}
                        placeholder="Результат рассмотрения, принятые решения..."
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Причина отложения (если было)</label>
                      <textarea
                        name="reason_deposition"
                        value={formData.reason_deposition || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows={3}
                        placeholder="Причина, по которой заседание было отложено..."
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Принятые решения</h3>
                    
                    <div className={styles.field}>
                      <label>Выберите решения по делу</label>
                      <select
                        multiple
                        name="decision_case"
                        value={formData.decision_case || []}
                        onChange={handleDecisionCaseChange}
                        className={styles.select}
                        size="4"
                      >
                        <option value="1">Решение 1</option>
                        <option value="2">Решение 2</option>
                        <option value="3">Решение 3</option>
                        <option value="4">Решение 4</option>
                      </select>
                      <small style={{ color: '#718096', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
                        Для выбора нескольких удерживайте Ctrl (Cmd на Mac)
                      </small>
                    </div>
                  </div>

                  {/* Дополнительная информация для административных дел */}
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Дополнительная информация</h3>
                    
                    <div className={styles.field}>
                      <label>Отметка о явке сторон</label>
                      <textarea
                        name="attendance_notes"
                        value={formData.attendance_notes || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows={2}
                        placeholder="Кто явился, кто не явился..."
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Ходатайства в заседании</label>
                      <textarea
                        name="petitions_notes"
                        value={formData.petitions_notes || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows={2}
                        placeholder="Заявленные ходатайства и результаты их рассмотрения..."
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

export default AdministrativeProcedureActionDetail;