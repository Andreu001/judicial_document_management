import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../components/UI/input/MyInput';
import MyButton from '../components/UI/button/MyButton';

const SidesForm = ({ create, editSideData = {}, onSave, onCancel }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [side, setSide] = useState({
      name: '',
      sides_case: '',
      under_arrest: '',
      date_sending_agenda: '',
      business_card: '',
    });
  
    const [sidesCaseList, setsidesCaseList] = useState([]);
  
    useEffect(() => {
      axios
        .get('http://localhost:8000/business_card/sides/')
        .then((response) => {
          setsidesCaseList(response.data);
        })
        .catch((error) => {
          console.error('Error fetching category list:', error);
        });
  
      if (editSideData) {
        setIsEditing(true);
        setSide({ ...editSideData });
      }
    }, [editSideData]);
  
    const handleCancel = () => {
      setIsEditing(false);
      onCancel();
    };
  
    const handleChange = (e) => {
      setSide((prevSide) => ({ ...prevSide, [e.target.name]: e.target.name === 'sides_case' ? e.target.value : e.target.value }));
    };
    
  

    const handleAddNewSide = async (e) => {
      e.preventDefault();
  
      const newSideData = {
        name: side.name,
        under_arrest: side.under_arrest,
        sides_case: side.sides_case,
        date_sending_agenda: side.date_sending_agenda,
        business_card: side.business_card,
      };
  
      try {
        const response = await axios.post('http://localhost:8000/business_card/sidescaseincase/', newSideData);
        console.log('Сторона создана:', response.data);
        create(response.data);
        setSide({
          name: '',
          under_arrest: '',
          sides_case: '',
          date_sending_agenda: '',
          business_card: '',
        });
      } catch (error) {
        console.error('Ошибка создания стороны:', error);
      }
    };
    
    
  
    return (
      <form>
        <MyInput
          type="text"
          name="name"
          value={side.name}
          onChange={handleChange}
          placeholder="ФИО"
        />
        <MyInput
          type="text"
          name="under_arrest"
          value={side.under_arrest}
          onChange={handleChange}
          placeholder="Под стражей"
        />
        <select
          name="sides_case"
          value={side.sides_case}
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
          type="text"
          name="date_sending_agenda"
          value={side.date_sending_agenda}
          onChange={handleChange}
          placeholder="Дата направления повестки"
        />
          <MyInput
          type="text"
          name="business_card"
          value={side.business_card}
          onChange={handleChange}
          placeholder="Номер дела"
        />
        {isEditing ? (
          <>
            <MyButton onClick={handleAddNewSide}>Сохранить</MyButton>
            <MyButton onClick={handleCancel}>Отменить</MyButton>
          </>
        ) : null}
      </form>
    );
  };
  
  export default SidesForm;
