import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovementService from '../../API/MovementService';
import baseService from '../../API/baseService';
import styles from './MovementDetail.module.css';

const MovementDetail = () => {
  const { cardId, movementId } = useParams();
  const navigate = useNavigate();
  const [movementData, setMovementData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const [selectedDecisions, setSelectedDecisions] = useState([]);
  
  // ДЛЯ ОТЛАДКИ
  useEffect(() => {
    console.log('DEBUG - Параметры URL:', { 
      cardId, 
      movementId,
      fullPathname: window.location.pathname 
    });
  }, [cardId, movementId]);

  useEffect(() => {
    const fetchMovementDetails = async () => {
      try {
        setLoading(true);
        
        // Загрузка данных движения
        const movementResponse = await baseService.get(`/business_card/businesscard/${cardId}/businessmovement/${movementId}/`);
        
        if (movementResponse.data) {
          const data = movementResponse.data;
          setMovementData(data);
          setFormData(data);
          
          // Извлекаем ID решений из ManyToMany поля
          if (data.decision_case && Array.isArray(data.decision_case)) {
            setSelectedDecisions(data.decision_case.map(dec => dec.id || dec));
          }
        }
        
        // Загрузка списка решений
        await loadDecisions();
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных движения по делу:', err);
        setError('Не удалось загрузить данные движения по делу');
        setLoading(false);
      }
    };

    fetchMovementDetails();
  }, [cardId, movementId]);

  const loadDecisions = async () => {
    try {
      const response = await MovementService.getDecisionCases();
      setDecisions(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки решений:', error);
      setDecisions([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDecisionChange = (e) => {
    const { value, checked } = e.target;
    const decisionId = parseInt(value);
    
    if (checked) {
      setSelectedDecisions(prev => [...prev, decisionId]);
    } else {
      setSelectedDecisions(prev => prev.filter(id => id !== decisionId));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Подготовка данных для отправки
      const dataToSend = {
        ...formData,
        decision_case: selectedDecisions
      };
      
      // Удаляем лишние поля, которые не должны отправляться
      delete dataToSend.id;
      delete dataToSend.business_card;
      
      const updatedData = await baseService.patch(
        `/business_card/businesscard/${cardId}/businessmovement/${movementId}/`, 
        dataToSend
      );
      
      setMovementData(updatedData.data);
      setFormData(updatedData.data);
      setIsEditing(false);
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
    }
  };

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleTimeChange = (name, timeString) => {
    setFormData(prev => ({
      ...prev,
      [name]: timeString || null
    }));
  };

  const handleCancel = () => {
    setFormData(movementData);
    setSelectedDecisions(movementData.decision_case?.map(dec => dec.id || dec) || []);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Не указано';
    return timeString.slice(0, 5); // Формат HH:mm
  };

  const getDecisionNames = () => {
    if (!movementData?.decision_case || !Array.isArray(movementData.decision_case)) {
      return 'Не указаны';
    }
    
    return movementData.decision_case
      .map(dec => dec.name_case || dec)
      .join(', ');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных движения по делу...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  if (!movementData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Данные движения по делу не найдены</div>
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
          <h1 className={styles.title}>Движение по делу</h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <div className={styles.editButtons}>
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
        <div className={styles.formContainer}>
          {/* Основная информация */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Основная информация</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="date_meeting">Дата заседания *</label>
                {isEditing ? (
                  <input
                    type="date"
                    id="date_meeting"
                    name="date_meeting"
                    value={formData.date_meeting || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                ) : (
                  <span>{formatDate(movementData.date_meeting)}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="meeting_time">Время заседания *</label>
                {isEditing ? (
                  <input
                    type="time"
                    id="meeting_time"
                    name="meeting_time"
                    value={formData.meeting_time || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                ) : (
                  <span>{formatTime(movementData.meeting_time)}</span>
                )}
              </div>

              <div className={styles.field}>
                <label>Решение по поступившему делу</label>
                {isEditing ? (
                  <div className={styles.checkboxGroup}>
                    {decisions.map(decision => (
                      <div key={decision.id} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id={`decision-${decision.id}`}
                          value={decision.id}
                          checked={selectedDecisions.includes(decision.id)}
                          onChange={handleDecisionChange}
                        />
                        <label htmlFor={`decision-${decision.id}`}>
                          {decision.name_case}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>{getDecisionNames()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Состав коллегии и результаты */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Состав коллегии и результаты</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="composition_colleges">Состав коллегии</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="composition_colleges"
                    name="composition_colleges"
                    value={formData.composition_colleges || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    maxLength="50"
                  />
                ) : (
                  <span>{movementData.composition_colleges || 'Не указано'}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="result_court_session">Результат судебного заседания</label>
                {isEditing ? (
                  <textarea
                    id="result_court_session"
                    name="result_court_session"
                    value={formData.result_court_session || ''}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows="3"
                    maxLength="200"
                  />
                ) : (
                  <span>{movementData.result_court_session || 'Не указано'}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="reason_deposition">Причина отложения</label>
                {isEditing ? (
                  <textarea
                    id="reason_deposition"
                    name="reason_deposition"
                    value={formData.reason_deposition || ''}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows="3"
                    maxLength="200"
                  />
                ) : (
                  <span>{movementData.reason_deposition || 'Не указано'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Служебная информация */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Служебная информация</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>ID движения</label>
                <span className={styles.readonly}>{movementData.id}</span>
              </div>

              <div className={styles.field}>
                <label>ID карточки дела</label>
                <span className={styles.readonly}>{cardId}</span>
              </div>

              {movementData.business_card && (
                <div className={styles.field}>
                  <label>Номер дела</label>
                  <span className={styles.readonly}>{movementData.business_card.original_name}</span>
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