import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import { updateSide } from '../../API/SideService';
import styles from '../../components//UI/input/Input.module.css';


const SidesForm = ({ create, editSideData = {}, onSave, onCancel, cardId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingSideId, setEditingSideId] = useState(null);



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
        
    }, [editSideData]);
    
    
  
    const handleCancel = () => {
      setIsEditing(false);
      onCancel();
    };
  
    const handleChange = (e) => {
      const { name, value } = e.target;
    
      setSide((prevSide) => ({
        ...prevSide,
        [name]: name === 'sides_case' ? [value] : value,
      }));
    };
    
    const handleAddNewSide = async (e) => {
      e.preventDefault();
    
      const newSideData = {
        name: side.name,
        under_arrest: side.under_arrest,
        sides_case: side.sides_case,
        date_sending_agenda: side.date_sending_agenda ? formatDate(side.date_sending_agenda) : null,
        business_card: side.business_card,
      };
    
      try {
        if (newSideData.date_sending_agenda === null) {
          delete newSideData.date_sending_agenda;
        }
    
        if (editingSideId) {
          // Редактирование существующей стороны
          const response = await updateSide(cardId, editingSideId, newSideData);
          console.log('Сторона cardId:', cardId);
          console.log('Сторона editingSideId:', editingSideId);
          console.log('Сторона обновлена:', response.data);
          onSave(response.data);
        } else {
          // Создание новой стороны
          const response = await axios.post(`http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/`, newSideData);
          console.log('Сторона создана:', response.data);
          console.log('Отправка данных:', newSideData);
          create(response.data);
        }
    
        setSide({
          name: '',
          under_arrest: '',
          sides_case: [],
          date_sending_agenda: '',
          business_card: '',
        });
      } catch (error) {
        console.error('Ошибка создания/обновления стороны:', error.message);
        console.error('Дополнительные сведения:', error.response ? error.response.data : error.message);
      }
    };
  
    const formatDate = (inputDate) => {
      const date = new Date(inputDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
  
    return (
      <div className={styles.formContainer}>
        <form>
          <div className={styles.formGroup}>
          <label>Ф.И.О.</label>
            <MyInput
              type="text"
              name="name"
              value={side.name || editSideData.name}
              onChange={handleChange}
              placeholder="ФИО"
            />
          </div>
          <div className={styles.formGroup}>
          <label>Мера пресечения</label>
            <MyInput
              type="text"
              name="under_arrest"
              value={side.under_arrest || editSideData.under_arrest}
              onChange={handleChange}
              placeholder="Под стражей"
            />
          </div>
          <div className={styles.formGroup}>
          <label>Сторона по делу</label>
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
          </div>
          <div className={styles.formGroup}>
          <label>Дата повестки</label>
            <MyInput
              type="text"
              name="date_sending_agenda"
              value={side.date_sending_agenda || editSideData.date_sending_agenda}
              onChange={handleChange}
              placeholder="Дата направления повестки Г.М.Д."
            />
          </div>
          {isEditing ? (
            <>
              <MyButton onClick={handleAddNewSide}>Сохранить</MyButton>
              <MyButton onClick={handleCancel}>Отменить</MyButton>
            </>
          ) : null}
        </form>
      </div>
    );
  };
  
  export default SidesForm;
