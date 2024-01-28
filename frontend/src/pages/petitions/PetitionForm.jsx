import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import { updateMove } from '../../API/PetitionService';

const PetitionForm = ({ create, editPetitionData = {}, onSave, onCancel, cardId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingBusinessPetitionId, setEditingBusinessPetitionId] = useState(null);

  const [businessPetition, setBusinessPetition] = useState({
    petitions: [],
    sides_case: [],
    date_application: '',
    decision_rendered: '',
    date_decision: '',
    notation: '',
  });

  useEffect(() => {
    if (editPetitionData && !isEditing) {
      setIsEditing(true);
      setBusinessPetition((prevBusinessPetition) => ({
        ...prevBusinessPetition,
        ...editPetitionData.data,
      }));
      
      setEditingBusinessPetitionId(editPetitionData.id);
    }
  }, [editPetitionData, isEditing]);
  

  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setBusinessPetition((prevBusinessPetition) => ({
      ...prevBusinessPetition,
      [name]: value,
    }));
    
  };

  const handleAddNewPetition = async (e) => {
    e.preventDefault();
  
    const newPetitionData = {
      petitions: petition.name,
      sides_case: petition.sides_case,
      date_application: petition.date_sending_agenda ? formatDate(petition.date_sending_agenda) : null,
      decision_rendered: petition.business_card,
      date_decision: petition.date_decision,
      notation: petition.notation,
    };
  
    try {
      if (newPetitionData.date_sending_agenda === null) {
        delete newPetitionData.date_sending_agenda;
      }
  
      if (editingSideId) {
        // Редактирование существующей стороны
        const response = await updatePetition(cardId, editingPetitionId, newPetitionData);
        console.log('Сторона cardId:', cardId);
        console.log('Сторона editingPetitionId:', editingPetitionId);
        console.log('Сторона обновлена:', response.data);
        onSave(response.data);
      } else {
        // Создание новой ходатайства
        const response = await axios.post(`http://localhost:8000/business_card/businesscard/${cardId}/petitions/`, newSideData);
        console.log('Сторона создана:', response.data);
        console.log('Отправка данных:', newPetitionData);
        create(response.data);
      }
  
      setPetition({
        petitions: '',
        sides_case: [],
        date_application: '',
        decision_rendered: '',
        date_decision: '',
        notation: '',
      });
    } catch (error) {
      console.error('Ошибка создания/обновления стороны:', error.message);
      console.error('Дополнительные сведения:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <form>
        <select
          name="petitions"
          value={side.petitions || (editSideData.petitions ? [editSideData.petitions.id] : '')}
          onChange={handleChange}
        >
          <option value="">Выберите Ходатайство</option>
          {petitionsCaseList.map((petitionCase, index) => (
            <option key={index} value={petitionCase.id}>
              {petitionCase.petitions}
            </option>
          ))}
        </select>
        <select
          name="sides_case"
          value={side.sides_case || (editSideData.sides_case ? [editSideData.sides_case.id] : '')}
          onChange={handleChange}
        >
          <option value="">Выберите Название стороны</option>
          {sidesCaseList.map((sideCase, index) => (
            <option key={index} value={sideCase.id}>
              {sideCase.sides_case}
            </option>
          ))}
        </select>
        <MyInput
        type="date"
        name="date_application"
        value={businessPetition.date_application || editPetitionData.date_application}
        onChange={handleChange}
        placeholder="Дата ходатайства"
      />
        <MyInput
        type="text"
        name="decision_rendered"
        value={businessPetition.decision_rendered || editPetitionData.decision_rendered}
        onChange={handleChange}
        placeholder="наименование вынесенного решения"
      />
        <MyInput
        type="date"
        name="date_decision"
        value={businessPetition.date_decision || editPetitionData.date_decision}
        onChange={handleChange}
        placeholder="Дата решения по ходатайству"
      />
        <MyInput
        type="text"
        name="notation"
        value={businessPetition.notation || editPetitionData.notation}
        onChange={handleChange}
        placeholder="примечания"
      />

      {isEditing ? (
        <>
          <MyButton onClick={handleAddNewPetition}>Сохранить</MyButton>
          <MyButton onClick={handleCancel}>Отменить</MyButton>
        </>
      ) : null}
    </form>
  );
};

export default PetitionForm;