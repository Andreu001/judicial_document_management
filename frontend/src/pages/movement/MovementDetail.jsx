// MovementDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovementService from '../../API/MovementService';
import styles from './MovementDetail.module.css';

const MovementDetail = () => {
  const { proceedingId, movementId } = useParams();
  const navigate = useNavigate();
  const isEditMode = movementId && movementId !== 'create';
  
  const [movementData, setMovementData] = useState(null);
  const [isEditing, setIsEditing] = useState(!isEditMode);
  const [activeTab, setActiveTab] = useState('main');
  const [formData, setFormData] = useState({
    date_meeting: '',
    meeting_time: '',
    decision_case: [],
    composition_colleges: '',
    result_court_session: '',
    reason_deposition: '',
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const [selectedDecisions, setSelectedDecisions] = useState([]);

  // Загрузка списка решений при монтировании
  useEffect(() => {
    loadDecisions();
  }, []);

  // Загрузка данных движения если это режим редактирования
  useEffect(() => {
    if (isEditMode) {
      fetchMovementDetails();
    }
  }, [proceedingId, movementId, isEditMode]);

  const fetchMovementDetails = async () => {
    try {
      setLoading(true);
      
      // Получаем CivilCaseMovement напрямую
      const response = await MovementService.getMovement(proceedingId, movementId);
      
      if (response.data) {
        const civilMovement = response.data;
        setMovementData(civilMovement);
        
        // Извлекаем данные из business_movement_detail
        if (civilMovement.business_movement_detail) {
          const details = civilMovement.business_movement_detail;
          
          // Получаем ID решений из деталей
          let decisionIds = [];
          if (details.decision_case && Array.isArray(details.decision_case)) {
            decisionIds = details.decision_case.map(d => d.id);
          }
          
          setFormData({
            date_meeting: details.date_meeting || '',
            meeting_time: details.meeting_time || '',
            decision_case: decisionIds,
            composition_colleges: details.composition_colleges || '',
            result_court_session: details.result_court_session || '',
            reason_deposition: details.reason_deposition || '',
          });
          
          setSelectedDecisions(decisionIds);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки данных движения по делу:', err);
      setError('Не удалось загрузить данные движения по делу');
      setLoading(false);
    }
  };

  const loadDecisions = async () => {
    try {
      // Используем существующий метод для получения решений
      const response = await MovementService.getDecisionCases();
      setDecisions(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки решений:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDecisionChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value));
      }
    }
    setSelectedDecisions(selectedValues);
    
    // Обновляем formData
    setFormData(prev => ({
      ...prev,
      decision_case: selectedValues
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.date_meeting) errors.push('Дата заседания обязательна');
    if (!formData.meeting_time) errors.push('Время заседания обязательно');
    
    if (errors.length > 0) {
      setError(`Пожалуйста, заполните обязательные поля: ${errors.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Подготавливаем данные для отправки
      const movementData = {
        date_meeting: formData.date_meeting,
        meeting_time: formData.meeting_time,
        decision_case: selectedDecisions,
        composition_colleges: formData.composition_colleges || '',
        result_court_session: formData.result_court_session || '',
        reason_deposition: formData.reason_deposition || '',
      };

      console.log('Данные для движения:', movementData);

      let response;
      
      if (isEditMode) {
        // Обновляем существующее движение
        response = await MovementService.updateMovement(
          proceedingId, 
          movementId, 
          movementData
        );
      } else {
        // Создаем новое движение
        response = await MovementService.createMovement(
          proceedingId, 
          movementData
        );
      }
      
      if (response.data) {
        console.log('Движение сохранено:', response.data);
        
        if (!isEditMode && response.data.id) {
          // Перенаправляем на страницу созданного движения
          navigate(-1);
        } else {
          // Обновляем данные на странице
          await fetchMovementDetails();
          setIsEditing(false);
        }
      }
      
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      
      if (err.response) {
        console.error('Детали ошибки:', err.response.data);
        
        let errorMessage = 'Не удалось сохранить данные:\n';
        if (err.response.data) {
          if (typeof err.response.data === 'object') {
            Object.keys(err.response.data).forEach(key => {
              const value = err.response.data[key];
              if (typeof value === 'object') {
                errorMessage += `\n${key}: ${JSON.stringify(value)}`;
              } else {
                errorMessage += `\n${key}: ${value}`;
              }
            });
          } else {
            errorMessage += `\n${err.response.data}`;
          }
        }
        setError(errorMessage);
      } else if (err.request) {
        setError('Сервер не отвечает. Проверьте подключение к сети.');
      } else {
        setError(`Ошибка: ${err.message}`);
      }
      
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      if (movementData) {
        // Восстанавливаем данные из formData (они уже должны быть загружены)
        setIsEditing(false);
        setError(null);
      }
    } else {
      navigate(`/civil-proceedings/${proceedingId}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Не указано';
    return timeString.slice(0, 5);
  };

  const getDecisionNames = () => {
    if (!selectedDecisions || selectedDecisions.length === 0) {
      return 'Не выбрано';
    }
    
    return selectedDecisions.map(id => {
      const foundDecision = decisions.find(d => d.id === id);
      return foundDecision ? foundDecision.name_case : `Решение #${id}`;
    }).join(', ');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          Загрузка данных движения по делу...
        </div>
      </div>
    );
  }

  if (error && !saving) {
    return (
      <div className={styles.container}>
        <div className={styles.error} style={{whiteSpace: 'pre-line'}}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Назад
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
            {isEditMode ? 'Движение по делу' : 'Новое движение по делу'}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <div className={styles.editActions}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'main' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('main')}
              >
                Основная информация
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'composition' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('composition')}
              >
                Состав и результаты
              </button>
              {isEditMode && (
                <button
                  className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  Служебная информация
                </button>
              )}
            </div>

            <div className={styles.tabContentWrapper}>
              {/* Вкладка: Основная информация */}
              {activeTab === 'main' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Дата и время заседания</h3>
                    
                    <div className={styles.field}>
                      <label>Дата заседания *</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="date_meeting"
                          value={formData.date_meeting || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          required
                        />
                      ) : (
                        <span>{formatDate(formData.date_meeting)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Время заседания *</label>
                      {isEditing ? (
                        <input
                          type="time"
                          name="meeting_time"
                          value={formData.meeting_time || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          required
                        />
                      ) : (
                        <span>{formatTime(formData.meeting_time)}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Решения по делу</h3>
                    
                    <div className={styles.field}>
                      <label>Выберите решения</label>
                      {isEditing ? (
                        <>
                          <select
                            multiple
                            name="decision_case"
                            value={selectedDecisions.map(String)}
                            onChange={handleDecisionChange}
                            className={styles.multiSelect}
                            size="4"
                          >
                            {decisions.map(decision => (
                              <option key={decision.id} value={decision.id}>
                                {decision.name_case}
                              </option>
                            ))}
                          </select>
                          <small className={styles.hint}>Удерживайте Ctrl для выбора нескольких решений</small>
                        </>
                      ) : (
                        <span className={styles.decisionList}>{getDecisionNames()}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка: Состав и результаты */}
              {activeTab === 'composition' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Состав коллегии</h3>
                    
                    <div className={styles.field}>
                      <label>Состав коллегии</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="composition_colleges"
                          value={formData.composition_colleges || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          maxLength="50"
                          placeholder="Введите состав коллегии"
                        />
                      ) : (
                        <span>{formData.composition_colleges || 'Не указано'}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Результаты заседания</h3>
                    
                    <div className={styles.field}>
                      <label>Результат судебного заседания</label>
                      {isEditing ? (
                        <textarea
                          name="result_court_session"
                          value={formData.result_court_session || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows="3"
                          maxLength="200"
                          placeholder="Введите результат заседания"
                        />
                      ) : (
                        <span>{formData.result_court_session || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Причина отложения</label>
                      {isEditing ? (
                        <textarea
                          name="reason_deposition"
                          value={formData.reason_deposition || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows="3"
                          maxLength="200"
                          placeholder="Введите причину отложения"
                        />
                      ) : (
                        <span>{formData.reason_deposition || 'Не указано'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка: Служебная информация */}
              {activeTab === 'info' && isEditMode && movementData && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Идентификаторы</h3>
                    
                    <div className={styles.field}>
                      <label>ID движения</label>
                      <span className={styles.valueReadonly}>{movementData.id}</span>
                    </div>

                    <div className={styles.field}>
                      <label>ID дела</label>
                      <span className={styles.valueReadonly}>{proceedingId}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementDetail;