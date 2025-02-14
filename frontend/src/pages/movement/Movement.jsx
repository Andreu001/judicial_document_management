import React, { useState, useEffect } from 'react';
import MovementService from '../../API/MovementService';
import MovementForm from './MovementForm';
import  { updateMove } from '../../API/MovementService';
import MovementList from './MovementList';
import axios from 'axios';

export const handleShowDetailsMovement = (props, router) => {
  router(`/cards/details/${props.move.id}`);
  console.log( "Передается в МУВВВВ!!!!", props.move);
};

export const handleAddMove = (newMove, setGlobalMove) => {
  console.log('Добавляется сторона:', newMove);
  if (newMove && Object.keys(newMove).length > 0) {
    setGlobalMove((prevMove) => [...prevMove, newMove]);
  }
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
    console.log('Удаляется движение с ID:', moveIdString);

    setMove((prevMove) => prevMove.filter((item) => String(item.id) !== moveIdString));

  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};

const Movement = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMoveDataState, setEditedMoveDataState] = useState({ ...props.movements });
  const [movements, setMovements] = useState();
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [isEditingMove, setIsEditingMove] = useState(false);
  const cardId = card.id;
  const { card } = props;

  const handleAddMovementToState = () => {
    setShowMovementForm(true);
  };

  const handleEditMoveForm = (isEditing, setIsEditingMove, setEditedMoveData, moveId) => {
    setIsEditingMove(isEditing);
  
    // Находим отредактированные данные движения по ID
    const editedMove = movements.find((move) => move.id === moveId);
  
    setEditedMoveData({ ...editedMove });
    setShowMovementForm(true);
  };
  

  const handleSaveMove = async (updatedMoveData) => {
    try {
      const moveId = String(updatedMoveData.id);
      const updatedMove = await MovementService.updateMove(cardId, moveId, updatedMoveData);

      setMovements((prevMovements) =>
        prevMovements.map((move) => (move.id === moveId ? updatedMove : move))
      );

      setIsEditingMove(false);
      console.log('Состояние движения после сохранения:', updatedMove);
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
          onSave={handleSaveMove}
          onCancel={handleCancel}
          setMovements={props.setMovements}
        />
      ) : (<MovementList remove={handleDeleteMove} />)
      }
    </div>
  );
};

export default Movement;