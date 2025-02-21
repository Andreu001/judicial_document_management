import React, { useState, useEffect } from 'react';
import ConsideredService from '../../API/ConsideredService';
import ConsideredForm from './ConsideredForm';
import ConsideredList from './ConsideredList';
import axios from 'axios';

export const handleShowDetailsConsidered = (props, router) => {
  router(`/cards/details/${props.considered.id}`);
  console.log("Передается в МУВВВВ!!!!", props.considered);
};

export const handleAddConsidered = (newConsidered, setConsideredCases) => {
  console.log('Добавляется рассмотренное дело:', newConsidered);
  if (newConsidered && Object.keys(newConsidered).length > 0) {
    setConsideredCases((prevCases) => [...prevCases, newConsidered]);
  }
};

export const handleEditConsidered = (isEditing, setIsEditing) => {
  setIsEditing(isEditing);
};

export const handleDeleteConsidered = async (consideredId, cardId, setConsideredCases) => {
  try {
    console.log('consideredId:', consideredId);
    console.log('cardId:', cardId);

    if (!consideredId || !cardId) {
      console.error('ID рассмотренного дела или карточки не определены');
      return;
    }

    const consideredIdString = String(consideredId);
    const cardIdString = String(cardId);

    await ConsideredService.remove(cardIdString, consideredIdString);
    console.log('Удаляется рассмотренное дело с ID:', consideredIdString);

    setConsideredCases((prevCases) => prevCases.filter((item) => String(item.id) !== consideredIdString));

  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};

const Considered = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedConsideredDataState, setEditedConsideredDataState] = useState({ ...props.consideredCases });
  const [consideredCases, setConsideredCases] = useState(props.consideredCases); // Изначально принимаем список через props

  const handleSave = async (editedConsideredData) => {
    try {
      const consideredId = String(editedConsideredData.id);
      const updatedConsidered = await ConsideredService.update(consideredId, editedConsideredData);
  
      setEditedConsideredDataState(updatedConsidered);
      setIsEditing(false);
  
      handleAddConsidered(updatedConsidered, setConsideredCases); // Обновляем список

      console.log('Состояние Considered после сохранения:', updatedConsidered);
    } catch (error) {
      console.error('Ошибка при обновлении рассмотренного дела:', error);
    }
  };
  
  useEffect(() => {
    const fetchConsideredCases = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/business_card/considered_cases/`);
        console.log('Response:', response);
        setConsideredCases(response.data); // Обновляем состояние списка при загрузке
      } catch (error) {
        console.error('Error fetching Considered Cases:', error);
      }
    };
    
    fetchConsideredCases();
  }, []);

  const handleCancel = () => {
    setEditedConsideredDataState({ ...props.consideredCases });
    setIsEditing(false);
    console.log('Отменено. Состояние Considered Cases:', consideredCases);
  };

  return (
    <div className='App'>
      {isEditing ? (
        <ConsideredForm
          create={props.create}
          editConsideredData={editedConsideredDataState}
          onSave={handleSave}
          onCancel={handleCancel}
          setConsideredCases={setConsideredCases} // Передаем функцию обновления
        />
      ) : (
        <ConsideredList consideredCases={consideredCases} remove={handleDeleteConsidered} />
      )}
    </div>
  );
};

export default Considered;
