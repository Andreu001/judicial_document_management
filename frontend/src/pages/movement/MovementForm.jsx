import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import { updateMove } from '../../API/MovementService';
import styles from '../../components//UI/input/Input.module.css';

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
    if (editMovementData && !isEditing) {
      setIsEditing(true);
      setBusinessMovement((prevBusinessMovement) => ({
        ...prevBusinessMovement,
        ...editMovementData.data,
      }));
      
      setEditingBusinessMovementId(editMovementData.id);
    }

    // Загружаем список решений с сервера
    axios.get('http://localhost:8000/business_card/decisions/')
    .then((response) => {
      setDecisionCases(response.data);
    })
  }, [editMovementData, isEditing]);

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
  
    const newBusinessMovementData = { ...businessMovement, business_card: cardId };
  
    try {
      if (editingBusinessMovementId) {
        // Обновление существующего движения
        const response = await updateMove(cardId, editingBusinessMovementId, newBusinessMovementData);
        console.log('Движение по делу обновлено:', response.data);
        onSave(response.data); // Передаем обновленные данные в родительский компонент
      } else {
        // Создание нового движения
        const response = await axios.post(
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
    <div className={styles.formContainer}>
      <form>
        <div className={styles.formGroup}>
          <label>Дата заседания</label>
          <MyInput
            type="date"
            name="date_meeting"
            value={businessMovement.date_meeting || editMovementData.date_meeting}
            onChange={handleChange}
            placeholder="Дата заседания"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Время заседания</label>
          <MyInput
            type="time"
            name="meeting_time"
            value={businessMovement.meeting_time || editMovementData.meeting_time}
            onChange={handleChange}
            placeholder="Время заседания"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Решение по поступившему делу</label>
          <select
            name="decision_case"
            value={businessMovement.decision_case || editMovementData.decision_case}
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
            value={businessMovement.composition_colleges || editMovementData.composition_colleges}
            onChange={handleChange}
            placeholder="Состав коллегии"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Результат с/з</label>
          <MyInput
            type="text"
            name="result_court_session"
            value={businessMovement.result_court_session || editMovementData.result_court_session}
            onChange={handleChange}
            placeholder="Результат судебного заседания"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Причина отложения</label>
          <MyInput
            type="text"
            name="reason_deposition"
            value={businessMovement.reason_deposition || editMovementData.reason_deposition}
            onChange={handleChange}
            placeholder="Причина отложения"
          />
        </div>

        {isEditing ? (
          <>
            <MyButton onClick={handleAddNewBusinessMovement}>Сохранить</MyButton>
            <MyButton onClick={handleCancel}>Отменить</MyButton>
          </>
        ) : null}
      </form>
    </div>
  );
};

export default MovementForm;
