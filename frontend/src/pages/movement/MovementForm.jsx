import React, { useState, useEffect } from 'react';
import MyInput from '../../components/UI/input/MyInput';
import { updateMove } from '../../API/MovementService';
import baseService from '../../API/baseService';
import styles from './MovementForm.module.css';

const MovementForm = ({ create, editMovementData = {}, onSave, onCancel, cardId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingBusinessMovementId, setEditingBusinessMovementId] = useState(null);

  const [businessMovement, setBusinessMovement] = useState({
    date_meeting: '',
    meeting_time: '',
    decision_case: [],
    composition_colleges: '',
    result_court_session: '',
    reason_deposition: '',
    notation: '',
  });

  const [decisionCases, setDecisionCases] = useState([]);

  useEffect(() => {
    // Загружаем список решений с сервера
    baseService.get('http://localhost:8000/business_card/decisions/')
    .then((response) => {
      setDecisionCases(response.data);
    });
  }, []);

  useEffect(() => {
    if (editMovementData && Object.keys(editMovementData).length > 0) {
      console.log('editMovementData received:', editMovementData);
      setIsEditing(true);
      setEditingBusinessMovementId(editMovementData.id);
      
      // Форматируем дату для input type="date" (YYYY-MM-DD)
      const formattedDate = editMovementData.date_meeting 
        ? editMovementData.date_meeting.split('T')[0]
        : '';
      
      // Форматируем время для input type="time" (HH:MM)
      const formattedTime = editMovementData.meeting_time 
        ? editMovementData.meeting_time.substring(0, 5)
        : '';
      
      setBusinessMovement({
        date_meeting: formattedDate,
        meeting_time: formattedTime,
        decision_case: editMovementData.decision_case || [],
        composition_colleges: editMovementData.composition_colleges || '',
        result_court_session: editMovementData.result_court_session || '',
        reason_deposition: editMovementData.reason_deposition || '',
        notation: editMovementData.notation || '',
      });
    } else {
      setIsEditing(false);
      setEditingBusinessMovementId(null);
      // Сбрасываем форму для создания нового
      setBusinessMovement({
        date_meeting: '',
        meeting_time: '',
        decision_case: [],
        composition_colleges: '',
        result_court_session: '',
        reason_deposition: '',
        notation: '',
      });
    }
  }, [editMovementData]);

  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setBusinessMovement((prevBusinessMovement) => ({
      ...prevBusinessMovement,
      [name]: name === "decision_case" ? [value] : value,
    }));
  };
  
  const handleAddNewBusinessMovement = async (e) => {
    e.preventDefault();
  
    // Подготавливаем данные в правильном формате для Django
    const newBusinessMovementData = { 
      ...businessMovement, 
      business_card: cardId 
    };

    // Если date_meeting пустое, удаляем поле (или оставляем null)
    if (!newBusinessMovementData.date_meeting) {
      newBusinessMovementData.date_meeting = null;
    }

    // Если meeting_time пустое, удаляем поле (или оставляем null)
    if (!newBusinessMovementData.meeting_time) {
      newBusinessMovementData.meeting_time = null;
    } else {
      // Добавляем секунды если нужно
      newBusinessMovementData.meeting_time = newBusinessMovementData.meeting_time + ':00';
    }

    console.log('Submitting data:', newBusinessMovementData);

    try {
      if (editingBusinessMovementId) {
        // Обновление существующего движения
        const response = await updateMove(cardId, editingBusinessMovementId, newBusinessMovementData);
        console.log('Движение по делу обновлено:', response);
        onSave(response); // Передаем обновленные данные в родительский компонент
      } else {
        // Создание нового движения
        const response = await baseService.post(
          `http://localhost:8000/business_card/businesscard/${cardId}/businessmovement/`,
          newBusinessMovementData
        );
        console.log('Движение по делу создано:', response.data);
        onSave(response.data); // Передаем новые данные в родительский компонент
      }
  
      onCancel(); // Закрываем форму
  
      // Сбрасываем состояние формы
      setBusinessMovement({
        date_meeting: '',
        meeting_time: '',
        decision_case: [],
        composition_colleges: '',
        result_court_session: '',
        reason_deposition: '',
        notation: '',
      });
    } catch (error) {
      console.error('Ошибка создания/обновления "Движения по делу":', newBusinessMovementData);
      console.error('Дополнительные сведения:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div className={styles.movementFormOverlay} onClick={(e) => {
      if (e.target.classList.contains(styles.movementFormOverlay)) {
        handleCancel();
      }
    }}>
      <div className={styles.movementForm} onClick={(e) => e.stopPropagation()}>
        <h4>
          {isEditing ? 'Редактировать движение по делу' : 'Добавить движение по делу'}
          <button 
            type="button" 
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Закрыть"
          >
            ×
          </button>
        </h4>
        <form onSubmit={handleAddNewBusinessMovement}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Дата заседания</label>
              <MyInput
                type="date"
                name="date_meeting"
                value={businessMovement.date_meeting}
                onChange={handleChange}
                placeholder="Дата заседания"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Время заседания</label>
              <MyInput
                type="time"
                name="meeting_time"
                value={businessMovement.meeting_time}
                onChange={handleChange}
                placeholder="Время заседания"
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Решение по поступившему делу</label>
              <select
                name="decision_case"
                value={businessMovement.decision_case[0] || ''}
                onChange={handleChange}
              >
                <option value="">Выберите решение</option>
                {decisionCases.map((caseItem, index) => (
                  <option key={index} value={caseItem.id}>
                    {caseItem.name_case}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Состав коллегии</label>
              <MyInput
                type="text"
                name="composition_colleges"
                value={businessMovement.composition_colleges}
                onChange={handleChange}
                placeholder="Состав коллегии"
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Результат с/з</label>
              <MyInput
                type="text"
                name="result_court_session"
                value={businessMovement.result_court_session}
                onChange={handleChange}
                placeholder="Результат судебного заседания"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Причина отложения</label>
              <MyInput
                type="text"
                name="reason_deposition"
                value={businessMovement.reason_deposition}
                onChange={handleChange}
                placeholder="Причина отложения"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Примечание</label>
              <MyInput
                type="text"
                name="notation"
                value={businessMovement.notation}
                onChange={handleChange}
                placeholder="Примечание"
              />
            </div>
          </div>
          
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton}>
              {isEditing ? 'Сохранить изменения' : 'Сохранить'}
            </button>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovementForm;