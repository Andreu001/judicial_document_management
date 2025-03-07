import React, { useState, useEffect } from 'react';
import SideService from '../../API/SideService';
import SidesForm from './SidesForm';
import { updateSide } from '../../API/SideService';
import SideList from './SidesList';
import axios from 'axios';

export const handleShowDetails = (props, router) => {
  router(`/business_card/businesscard/:id/sidescaseincase/${props.side.id}`);
  console.log( "Передается в САЙДДДД!!!!", props.side);
};

export const handleAddSide = (newSide, setGlobalSide) => {
  console.log('Добавляется сторона:', newSide);
  if (newSide && Object.keys(newSide).length > 0) {
    setGlobalSide((prevSide) => [...prevSide, newSide]);
  }
};

export const handleEditSide = (isEditing, setIsEditing) => {
  setIsEditing(isEditing);
};

export const handleDeleteSide = async (sideId, cardId, setSide) => {
  try {
    console.log('sideId:', sideId);
    console.log('cardId:', cardId);

    if (!sideId || !cardId) {
      console.error('ID стороны или карточки не определены');
      return;
    }

    const sideIdString = String(sideId);
    const cardIdString = String(cardId);

    await SideService.remove(cardIdString, sideIdString);
    console.log('Удаляется сторона с ID:', sideIdString);

    setSide((prevSide) => prevSide.filter((item) => String(item.id) !== sideIdString));

  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};

const Sides = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSideDataState, setEditedSideDataState] = useState({ ...props.sides });
  const [sides, setSide] = useState([]);

  const handleSave = async (editedSideData) => {
    try {
      const sideId = String(editedSideData.id);
      const updatedSide = await updateSide(sideId, editedSideData);
  
      setEditedSideDataState(updatedSide);
      setIsEditing(false);
  
      handleAddSide(updatedSide, setSide);
  
      console.log('Состояние side после сохранения:', updatedSide);
    } catch (error) {
      console.error('Ошибка при обновлении стороны:', error);
    }
  };
  
  useEffect(() => {
    const fetchSides = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/business_card/sidescaseincase/');
        console.log('Response:', response);
        setSide(response.data);
      } catch (error) {
        console.error('Error fetching sides:', error);
      }
    };
    
    fetchSides();
  }, []);
  

  const handleCancel = () => {
    setEditedSideDataState({ ...props.side });
    setIsEditing(false);
    console.log('Отменено. Состояние side:', sides);
  };

  return (
    <div className='App'>
      {isEditing ? (
        <SidesForm
          create={props.create}
          editSideData={editedSideDataState}
          onSave={handleSave}
          onCancel={handleCancel}
          setSide={props.setSide}
        />
      ) : (
        <SideList sides={sides} remove={handleDeleteSide} />
      )}
    </div>
  );
};

export default Sides;
