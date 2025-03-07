import React, { useState, useEffect } from 'react';
import ConsideredService from '../../API/ConsideredService';
import ConsideredForm from './ConsideredForm';
import ConsideredList from './ConsideredList';
import axios from 'axios';

export const handleShowDetailsConsidered = (props, router) => {
  router(`/business_card/businesscard/${props.cardId}/considered/${props.considered.id}`);
  console.log("Передается в МУВВВВ!!!!", props.cardId);
};


export const handleAddConsidered = (newConsidered, setConsidered) => {
  console.log('Добавляется рассмотренное дело:', newConsidered);
  if (newConsidered && Object.keys(newConsidered).length > 0) {
    setConsidered((prevCases) => [...prevCases, newConsidered]);
  }
};

export const handleEditConsidered = (isEditing, setIsEditing) => {
  setIsEditing(isEditing);
};

export const handleDeleteConsidered = async (consideredId, cardId, setConsidered) => {
  try {
    console.log('consideredId:', consideredId);
    console.log('cardId:', cardId);

    if (!consideredId || !cardId) {
      console.error('ID рассмотренного решения или карточки не определены');
      return;
    }

    const consideredIdString = String(consideredId);
    const cardIdString = String(cardId);

    await ConsideredService.remove(cardIdString, consideredIdString);
    console.log('Удаляется решение с ID:', consideredIdString);

    setConsidered((prevCases) => prevCases.filter((item) => String(item.id) !== consideredIdString));

  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};


const Considered = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedConsideredDataState, setEditedConsideredDataState] = useState({ ...props.considered });
  const [considered, setConsidered] = useState(props.considered);

  const handleSave = async (editedConsideredData) => {
    try {
      const consideredId = String(editedConsideredData.id);
      const updatedConsidered = await ConsideredService.update(consideredId, editedConsideredData);
  
      setEditedConsideredDataState(updatedConsidered);
      setIsEditing(false);
  
      handleAddConsidered(updatedConsidered, setConsidered); // Обновляем список

      console.log('Состояние Considered после сохранения:', updatedConsidered);
    } catch (error) {
      console.error('Ошибка при обновлении рассмотренного дела:', error);
    }
  };
  
  const handleCancel = () => {
    setEditedConsideredDataState({ ...props.considered });
    setIsEditing(false);
    console.log('Отменено. Состояние Considered Cases:', considered);
  };

  return (
    <div className='App'>
      {isEditing ? (
        <ConsideredForm
          create={props.create}
          editConsideredData={editedConsideredDataState}
          onSave={handleSave}
          onCancel={handleCancel}
          setConsidered={setConsidered} // Передаем функцию обновления
        />
      ) : (
        <ConsideredList considered={considered} remove={handleDeleteConsidered} />
      )}
    </div>
  );
};

export default Considered;
