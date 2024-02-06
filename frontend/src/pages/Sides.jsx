import React, { useState, useEffect } from 'react';
import SideService from '../API/SideService';
import SidesForm from './SidesForm';
import { updateSide } from '../API/SideService';
import SideList from '../components/SideList';
import axios from 'axios';

export const handleShowDetails = (props, router) => {
  router(`/cards/details/${props.side.id}`);
  console.log( "Передается в САЙДДДД!!!!", props.side);
};

export const handleAddSide = (newSide, setGlobalSide) => {
  console.log('Добавляется сторона:', newSide);
  if (newSide && Object.keys(newSide).length > 0) {
    setGlobalSide((prevSide) => [...prevSide, newSide]);
  }
};

export const handleEditSide = (isEditing, setIsEditing) => {
  setIsEditing(!isEditing);
};

export const handleDeleteSide = async (id, setSide) => {
  try {
    if (!id) {
      console.error('ID стороны не определен');
      return;
    }

    const sideId = String(id);
    await SideService.remove(sideId);
    console.log('Удаляется сторона с ID:', sideId);

    setSide((prevSide) => prevSide.filter((item) => String(item.id) !== sideId));
  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};

const Sides = (props) => {
  const [modal, setModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSideData, setEditedSideData] = useState({ ...props.sides });
  const [sides, setSide] = useState([]);
  const [showSideForm, setShowSideForm] = useState(false);

  const fetchSides = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/business_card/sidescaseincase/`);
      console.log('Response:', response);
      setSide(response.data);
    } catch (error) {
      console.error('Error fetching sides:', error);
    }
  };
  
  useEffect(() => {
    fetchSides();
  }, []);

  const handleSave = async (editedSideData) => {
    try {
      const sideId = String(props.sides.id);
      const updatedSide = await updateSide(sideId, editedSideData);
  
      setEditedSideData(updatedSide);
      setIsEditing(false);
  
      handleAddSide(updatedSide, setSide);
  
      console.log('Состояние side после сохранения:', updatedSide);
    } catch (error) {
      console.error('Ошибка при обновлении стороны:', error);
    }
  };
  

  const handleCancel = () => {
    setEditedSideData({ ...props.side });
    setIsEditing(false);
    console.log('Отменено. Состояние side:', props.sides);
  };

  const handleCreateCardClick = () => {
    setShowSideForm(true);
  };

  return (
    <div className='App'>
      {isEditing ? (
        <SidesForm
          create={props.create}
          editSideData={editedSideData}
          onSave={handleSave}
          onCancel={handleCancel}
          setSide={props.setSide}
        />
      ) : (<SideList remove={handleDeleteSide} />)
      }
    </div>
  );
};

export default Sides;