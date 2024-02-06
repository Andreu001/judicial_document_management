import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import { updatedPetition } from '../../API/PetitionService';

const PetitionForm = ({ create, editSideData = {}, editPetitionData = {}, onSave, onCancel, cardId, sideId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPetitionId, setEditingPetitionId] = useState(null);
  const [petitionsCaseList, setPetitionCaseList] = useState([]);
  const [selectedPetitionId, setSelectedPetitionId] = useState('');
  const [sidesCaseList, setsidesCaseList] = useState([]);
  const [editingSideId, setEditingSideId] = useState(null);



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
  
  const [selectedSideId, setSelectedSideId] = useState('');
  

  useEffect(() => {
    axios
      .get(`http://localhost:8000/business_card/petitions/`)
      .then((response) => {
        setPetitionCaseList(response.data);
      })
      .catch((error) => {
        console.error('Error fetching category list:', error);
      });
  
      if (editPetitionData) {
        setIsEditing(true);
        setPetition((prevPetition) => ({
          ...prevPetition,
          ...editPetitionData,
          petitions: editPetitionData.sides_case ? [editPetitionData.petitions.id] : '',
        }));
        setEditingPetitionId(editPetitionData.id);
      }

      axios
      .get(`http://localhost:8000/business_card/sides/`)
      .then((response) => {
        setsidesCaseList(response.data);
      })
      .catch((error) => {
        console.error('Error fetching category list:', error);
      });
  
      if (editSideData) {
        setIsEditing(true);
        setSide((prevSide) => ({
          ...prevSide,
          ...editSideData,
          sides_case: editSideData.sides_case ? [editSideData.sides_case.id] : '',
        }));
        setEditingSideId(editSideData.id);
      }
      
  }, []);

  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    if (name === 'petitions') {
      setSelectedPetitionId(value);
    }
  
    setPetition((prevPetition) => ({
      ...prevPetition,
      [name]: name === 'petitions' ? [value] : value,
    }));
  
    setSide((prevSide) => ({
      ...prevSide,
      [name]: name === 'sides_case' ? [value] : value,
    }));
  };
   

  const handleAddNewPetition = async (e) => {
    e.preventDefault();
    
    const formatDate = (date) => {
      const formattedDate = new Date(date);
      return formattedDate.toISOString().split('T')[0];
    };
  
    const newPetitionData = {
      petitions: petition.petitions,
      sides_case: petition.sides_case.length > 0 ? [petition.sides_case[0]] : null,
      date_application: petition.date_application,
      decision_rendered: petition.decision_rendered, // Используйте decision_rendered из состояния petition
      date_decision: petition.date_decision,
      notation: petition.notation,
    };
  
    try {
      if (!newPetitionData.date_application) {
        delete newPetitionData.date_application;
      }
  
      if (!newPetitionData.decision_rendered) {
        delete newPetitionData.decision_rendered;
      }
  
      if (editingPetitionId) {
        // Редактирование существующей стороны
        const response = await updatedPetition(cardId, sideId, editingPetitionId, newPetitionData);
        console.log('Сторона cardId:', cardId);
        console.log('Сторона editingPetitionId:', editingPetitionId);
        console.log('Сторона обновлена:', response.data);
        onSave(response.data);
      } else {
        // Создание новой ходатайства
        const response = await axios.post(`http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/${sideId}/petitionsincase/`, newPetitionData);
        console.log('Ходатайство создана:', response.data);
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
      console.error('Ошибка создания/обновления ходатайства:', error.message);
      console.error('Дополнительные сведения:', error.response ? error.response.data : error.message);
    }
  };
  
  
  
  
  

  return (
    <form>
      <select
        name="petitions"
        value={selectedPetitionId}
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