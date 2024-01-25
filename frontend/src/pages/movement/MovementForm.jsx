import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import { updateMove } from '../../API/MovementService';

const MovementForm = ({ create, editBusinessMovementData = {}, onSave, onCancel, cardId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingBusinessMovementId, setEditingBusinessMovementId] = useState(null);

  const [businessMovement, setBusinessMovement] = useState({
    date_meeting: '',
    meeting_time: '',
    decision_case: '',
    composition_colleges: '',
    result_court_session: '',
    reason_deposition: '',
    notation: '',
  });

  useEffect(() => {
    if (editBusinessMovementData && !isEditing) {
      setIsEditing(true);
      setBusinessMovement((prevBusinessMovement) => ({
        ...prevBusinessMovement,
        ...editBusinessMovementData,
      }));
      setEditingBusinessMovementId(editBusinessMovementData.id);
    }
  }, [editBusinessMovementData, isEditing]);
  

  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setBusinessMovement((prevBusinessMovement) => ({
      ...prevBusinessMovement,
      [name]: value,
    }));
    
  };

  const handleAddNewBusinessMovement = async (e) => {
    e.preventDefault();

    const newBusinessMovementData = { ...businessMovement, business_card: cardId };

    try {
      if (editingBusinessMovementId) {
        // Редактирование существующего "Движения по делу"
        const response = await updateMove(editingBusinessMovementId, newBusinessMovementData);
        console.log('Движение по делу обновлено:', response.data);
        onSave(response.data);
      } else {
        // Создание нового "Движения по делу"
        const response = await axios.post(`http://localhost:8000/business_card/businesscard/${cardId}/businessmovement/`, newBusinessMovementData);
        console.log('Движение по делу создано:', response.data);
        create(response.data);
      }

      setBusinessMovement({
        date_meeting: '',
        meeting_time: '',
        decision_case: '',
        composition_colleges: '',
        result_court_session: '',
        reason_deposition: '',
        notation: '',
      });
    } catch (error) {
      console.error('Ошибка создания/обновления "Движения по делу":', error.message);
      console.error('Дополнительные сведения:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <form>
      <MyInput
        type="date"
        name="date_meeting"
        value={businessMovement.date_meeting || editBusinessMovementData.date_meeting}
        onChange={handleChange}
        placeholder="Дата заседания"
      />
      <MyInput
        type="time"
        name="meeting_time"
        value={businessMovement.meeting_time || editBusinessMovementData.meeting_time}
        onChange={handleChange}
        placeholder="Время заседания"
      />
        <MyInput
        type="text"
        name="decision_case"
        value={businessMovement.decision_case || editBusinessMovementData.decision_case}
        onChange={handleChange}
        placeholder="Решение по поступившему делу"
      />
        <MyInput
        type="text"
        name="composition_colleges"
        value={businessMovement.composition_colleges || editBusinessMovementData.composition_colleges}
        onChange={handleChange}
        placeholder="Состав коллегии"
      />
        <MyInput
        type="text"
        name="result_court_session"
        value={businessMovement.result_court_session || editBusinessMovementData.result_court_session}
        onChange={handleChange}
        placeholder="Результат судебного заседания"
      />
        <MyInput
        type="text"
        name="reason_deposition"
        value={businessMovement.reason_deposition || editBusinessMovementData.reason_deposition}
        onChange={handleChange}
        placeholder="причина отложения"
      />

      {isEditing ? (
        <>
          <MyButton onClick={handleAddNewBusinessMovement}>Сохранить</MyButton>
          <MyButton onClick={handleCancel}>Отменить</MyButton>
        </>
      ) : null}
    </form>
  );
};

export default MovementForm;
