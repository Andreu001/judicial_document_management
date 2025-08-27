import React, { useState, useEffect } from 'react';
import PetitionService from '../../API/PetitionService';
import PetitionForm from './PetitionForm';
import PetitionList from './PetitionList';
import axios from 'axios';
import baseService from '../../API/baseService';

export const handleShowDetailsPetition = (props, router) => {
  router(`/business_card/businesscard/:id/petitionsincase/${props.petition.id}`);
  console.log("Передается в МУВВВВ!!!!", props.petition);
};

export const handleAddPetitions = (newPetition, setPetitions) => {
  console.log('Добавляется ходатайство:', newPetition);
  if (newPetition && Object.keys(newPetition).length > 0) {
    setPetitions((prevPetitions) => [...prevPetitions, newPetition]);
  }
};

export const handleEditPetition = (isEditing, setIsEditing) => {
  setIsEditing(isEditing);
};

export const handleDeletePetition = async (petitionId, cardId, setPetitions) => {
  try {
    console.log('petitionId:', petitionId);
    console.log('cardId:', cardId);

    if (!petitionId || !cardId) {
      console.error('ID стороны или карточки не определены');
      return;
    }

    const petitionIdString = String(petitionId);
    const cardIdString = String(cardId);

    await PetitionService.remove(cardIdString, petitionIdString);
    console.log('Удаляется ходатайство с ID:', petitionIdString);

    setPetitions((prevPetitions) => prevPetitions.filter((item) => String(item.id) !== petitionIdString));

  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};

const Petition = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPetitionsDataState, setEditedPetitionsDataState] = useState({ ...props.petitions });
  const [petitions, setPetitions] = useState(props.petitions); // Изначально принимаем спискок через props

  const handleSave = async (editedPetitionsData) => {
    try {
      const petitionId = String(editedPetitionsData.id);
      const updatedPetitions = await updatedPetitions(petitionId, editedPetitionsData);
  
      setEditedPetitionsDataState(updatedPetitions);
      setIsEditing(false);
  
      handleAddPetitions(updatedPetitions, setPetitions); // Обновляем список

      console.log('Состояние Petitions после сохранения:', updatedPetitions);
    } catch (error) {
      console.error('Ошибка при обновлении движения:', error);
    }
  };
  
  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        const response = await baseService.get(`http://127.0.0.1:8000/business_card/petitions/`);
        console.log('Response:', response);
        setPetitions(response.data); // Обновляем состояние списка при загрузке
      } catch (error) {
        console.error('Error fetching Petitions:', error);
      }
    };
    
    fetchPetitions();
  }, []);

  const handleCancel = () => {
    setEditedPetitionsDataState({ ...props.petitions });
    setIsEditing(false);
    console.log('Отменено. Состояние Petitions:', petitions);
  };

  return (
    <div className='App'>
      {isEditing ? (
        <PetitionForm
          create={props.create}
          editPetitionsData={editedPetitionsDataState}
          onSave={handleSave}
          onCancel={handleCancel}
          setPetitions={setPetitions}
        />
      ) : (
        <PetitionList petitions={petitions} remove={handleDeletePetition} />
      )}
    </div>
  );
};

export default Petition;
