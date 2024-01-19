import React, { useState, useEffect } from 'react';
import MovementService from '../../API/MovementService';
import MovementForm from './MovementForm';
import  { updateMove } from '../../API/MovementService';
import MovementList from '../../components/MovementList';
import axios from 'axios';

export const handleShowDetailsMovement = (props, router) => {
  router(`/cards/details/${props.movements.id}`);
  console.log( "Передается в МУВВВВ!!!!", props.movements);
};

export const handleAddMove = (newMove, setGlobalMove) => {
  console.log('Добавляется сторона:', newMove);
  if (newMove && Object.keys(newMove).length > 0) {
    setGlobalMove((prevMove) => [...prevMove, newMove]);
  }
};

export const handleEditMove = (isEditing, setIsEditing) => {
  setIsEditing(isEditing);
};

export const handleDeleteMove = async (moveId, cardId, setMove) => {
  try {
    console.log('moveId:', moveId);
    console.log('cardId:', cardId);

    if (!moveId || !cardId) {
      console.error('ID стороны или карточки не определены');
      return;
    }

    const moveIdString = String(moveId);
    const cardIdString = String(cardId);

    await MovementService.remove(cardIdString, moveIdString);
    console.log('Удаляется сторона с ID:', moveIdString);

    setMove((prevMove) => prevMove.filter((item) => String(item.id) !== moveIdString));

  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};

const Movement = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMoveDataState, setEditedMoveDataState] = useState({ ...props.movements });
  const [movements, setMovements] = useState();

  const handleSave = async (editedMoveData) => {
    try {
      const moveId = String(editedMoveData.id);
      const updatedMove = await updateMove(moveId, editedMoveData);
  
      setEditedMoveDataState(updatedMove);
      setIsEditing(false);
  
      handleAddMove(updatedMove, setMovements);
  
      console.log('Состояние movements после сохранения:', updatedMove);
    } catch (error) {
      console.error('Ошибка при обновлении движения:', error);
    }
  };
  
  useEffect(() => {
    const fetchMove = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/business_card/sidescaseincase/`);
        console.log('Response:', response);
        setMovements(response.data);
      } catch (error) {
        console.error('Error fetching Movements:', error);
      }
    };
    
    fetchMove();
  }, []);

  const handleCancel = () => {
    setEditedMoveDataState({ ...props.movements });
    setIsEditing(false);
    console.log('Отменено. Состояние movements:', movements);
  };

  return (
    <div className='App'>
      {isEditing ? (
        <MovementForm
          create={props.create}
          editMoveData={editedMoveDataState}
          onSave={handleSave}
          onCancel={handleCancel}
          setMovements={props.setMovements}
        />
      ) : (<MovementList remove={handleDeleteMove} />)
      }
    </div>
  );
};

export default Movement;
