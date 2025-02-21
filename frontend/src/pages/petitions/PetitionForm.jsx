import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import { updatedPetition } from '../../API/PetitionService';
import styles from '../../components//UI/input/Input.module.css';

const PetitionForm = ({ create, editSideData = {}, editPetitionData = {}, onSave, onCancel, cardId, sideId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPetitionId, setEditingPetitionId] = useState(null);
  const [petitionsCaseList, setPetitionCaseList] = useState([]);
  const [selectedPetitionId, setSelectedPetitionId] = useState('');
  const [sidesCaseList, setsidesCaseList] = useState([]);
  const [editingSideId, setEditingSideId] = useState(null);



  const [petition, setPetition] = useState({
    petitions_name: [],
    notification_parties: [],
    date_application: '',
    decision_rendered: '',
    date_decision: '',
    notation: '',
  });

  const [side, setSide] = useState({
    name: '',
    sides_case: '',
  });
  

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
      .get(`http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/`)
      .then((response) => {
        setsidesCaseList(response.data);
        console.log(response.data)
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
  
    setPetition((prevPetition) => {
      if (name === 'petitions_name') {
        return {
          ...prevPetition,
          petitions_name: value ? [parseInt(value, 10)] : [],
        };
      }
      if (name === 'notification_parties') {
        return {
          ...prevPetition,
          notification_parties: value ? [parseInt(value, 10)] : [],
        };
      }
      return {
        ...prevPetition,
        [name]: value,
      };
    });
  };
  

  const formatDate = (date) => {
    if (!date) return null;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return null;
    return parsedDate.toISOString().split('T')[0];
  };
  
  const handleAddNewPetition = async (e) => {
    e.preventDefault();
  
    const newPetitionData = {
      petitions_name: petition.petitions_name.map(id => id), // Оставляем как массив чисел
      notification_parties: petition.notification_parties.map(id => id), // Тоже массив чисел
      date_application: formatDate(petition.date_application),
      decision_rendered: petition.decision_rendered,
      date_decision: formatDate(petition.date_decision),
      notation: petition.notation,
      business_card: cardId,
    };
  
    console.log('Отправка данных:', newPetitionData);
  
    try {
      let response;
      if (editingPetitionId) {
        // Если мы редактируем существующее ходатайство
        response = await updatedPetition(cardId, sideId, editingPetitionId, newPetitionData);
        onSave(response.data); // Обновляем родительский компонент
      } else {
        // Если добавляем новое ходатайство
        response = await axios.post(
          `http://localhost:8000/business_card/businesscard/${cardId}/petitionsincase/`,
          newPetitionData
        );
        create(response.data); // Обновляем родительский компонент с новым ходатайством
        setPetitionCaseList((prevList) => [...prevList, response.data]); // Добавляем новое ходатайство в список
      }
      
      onCancel(); // Закрываем форму после успешной отправки
  
      // Сбрасываем форму для нового ввода
      setPetition({
        petitions_name: [],
        notification_parties: [],
        date_application: '',
        decision_rendered: '',
        date_decision: '',
        notation: '',
      });
    } catch (error) {
      console.error('Ошибка:', error.message);
      console.error('Дополнительные сведения:', error.response ? error.response.data : error.message);
    }
  };
  
    

  return (
    <div className={styles.formContainer}>
      <form>
        <div className={styles.formGroup}>
        <label>Ходатайство</label>
        <select
          name="petitions_name"
          value={petition.petitions_name[0] || ''}
          onChange={handleChange}
        >
          <option value="">Выберите Ходатайство</option>
          {petitionsCaseList.map((petitionCase) => (
            <option key={petitionCase.id} value={petitionCase.id}>
              {petitionCase.petitions}
            </option>
          ))}
        </select>
        </div>
        <div className={styles.formGroup}>
        <label>Сторона подавшая ходатайство</label>
          <select
            name="notification_parties"
            value={petition.notification_parties || ''}
            onChange={handleChange}
          >
            <option value="">Выберите сторону</option>
            {sidesCaseList.map((side) => (
              <option key={side.id} value={side.id}>
                {side.name} ({side.sides_case_name})
              </option>
            ))}
          </select>
        </div>
          <div className={styles.formGroup}>
          <label>Дата поступления</label>
            <MyInput
              type="date"
              name="date_application"
              value={petition.date_application || editPetitionData.date_application}
              onChange={handleChange}
              placeholder="Дата ходатайства"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Решение по ходатайству</label>
            <MyInput
              type="text"
              name="decision_rendered"
              value={petition.decision_rendered || editPetitionData.decision_rendered}
              onChange={handleChange}
              placeholder="наименование вынесенного решения"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Дата вынесения</label>
              <MyInput
              type="date"
              name="date_decision"
              value={petition.date_decision || editPetitionData.date_decision}
              onChange={handleChange}
              placeholder="Дата решения по ходатайству"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Примечение</label>
            <MyInput
            type="text"
            name="notation"
            value={petition.notation || editPetitionData.notation}
            onChange={handleChange}
            placeholder="примечания"
        /> </div>

        {isEditing ? (
          <>
            <MyButton onClick={handleAddNewPetition}>Сохранить</MyButton>
            <MyButton onClick={handleCancel}>Отменить</MyButton>
          </>
        ) : null}
      </form>
    </div>
  );
};

export default PetitionForm;