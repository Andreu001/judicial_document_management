import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import { updatedPetition } from '../../API/PetitionService';

const PetitionForm = ({ create, editPetitionData = {}, onSave, onCancel, cardId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPetitionId, setEditingPetitionId] = useState(null);
  const [petitionsCaseList, setPetitionCaseList] = useState([]);

  const [petition, setPetition] = useState({
    petitions: [],
    sides_case: [],
    date_application: '',
    decision_rendered: '',
    date_decision: '',
    notation: '',
  });

  const [side, setSide] = useState({
    name: '',
    sides_case: '',
    under_arrest: '',
    date_sending_agenda: '',
    business_card: '',
  });

  useEffect(() => {
    if (editPetitionData && !isEditing) {
      setIsEditing(true);
      setPetition((prevBusinessPetition) => ({
        ...prevBusinessPetition,
        ...editPetitionData.data,
      }));
      
      setEditingPetitionId(editPetitionData.id);
    }
  }, [editPetitionData, isEditing]);
  

  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPetition((prevBusinessPetition) => ({
      ...prevBusinessPetition,
      [name]: value,
    }));
    
  };

  const handleAddNewPetition = async (e) => {
    e.preventDefault();
  
    const newPetitionData = {
      petitions: petition.name,
      sides_case: petition.sides_case,
      date_application: petition.date_sending_agenda,
      decision_rendered: petition.business_card,
      date_decision: petition.date_decision,
      notation: petition.notation,
    };
  
    try {
      if (newPetitionData.date_sending_agenda === null) {
        delete newPetitionData.date_sending_agenda;
      }
  
      if (editingPetitionId) {
        // Редактирование существующей стороны
        const response = await updatedPetition(cardId, editingPetitionId, newPetitionData);
        console.log('Сторона cardId:', cardId);
        console.log('Сторона editingPetitionId:', editingPetitionId);
        console.log('Сторона обновлена:', response.data);
        onSave(response.data);
      } else {
        // Создание новой ходатайства
        const response = await axios.post(`http://localhost:8000/business_card/businesscard/${cardId}/petitions/`, newPetitionData);
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
          value={petition.petitions || (editPetitionData.petitions ? [editPetitionData.petitions.id] : '')}
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
          value={side.sides_case || (editPetitionData.sides_case ? [editPetitionData.sides_case.id] : '')}
          onChange={handleChange}
        >
          <option value="">Выберите Название стороны</option>
          {petitionsCaseList.map((petitionCase, index) => (
            <option key={index} value={petitionCase.id}>
              {petitionCase.sides_case}
            </option>
          ))}
        </select>
        <MyInput
        type="date"
        name="date_application"
        value={petition.date_application || editPetitionData.date_application}
        onChange={handleChange}
        placeholder="Дата ходатайства"
      />
        <MyInput
        type="text"
        name="decision_rendered"
        value={petition.decision_rendered || editPetitionData.decision_rendered}
        onChange={handleChange}
        placeholder="наименование вынесенного решения"
      />
        <MyInput
        type="date"
        name="date_decision"
        value={petition.date_decision || editPetitionData.date_decision}
        onChange={handleChange}
        placeholder="Дата решения по ходатайству"
      />
        <MyInput
        type="text"
        name="notation"
        value={petition.notation || editPetitionData.notation}
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