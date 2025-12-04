import React, { useState, useEffect } from 'react';
import MovementService from '../../API/MovementService';
import MovementForm from './MovementForm';
import { updateMove } from '../../API/MovementService';
import MovementList from './MovementList';
import axios from 'axios';
import baseService from '../../API/baseService';

export const handleShowDetailsMovement = (props, router) => {
  router(`/business_card/businesscard/${props.card.id}/businessmovement/${props.move.id}`);
  console.log("Передается в МУВВВВ!!!!", props.move);
};

export const handleAddMove = (newMove, setGlobalMove) => {
  console.log('Добавляется сторона:', newMove);
  if (newMove && Object.keys(newMove).length > 0) {
    setGlobalMove((prevMove) => [...prevMove, newMove]);
  }
};

export const handleDeleteMove = async (moveId, cardId, setMovements) => {
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

    // Обновляем состояние movements, удаляя удаленное движение
    setMovements((prevMovements) => prevMovements.filter((item) => String(item.id) !== moveIdString));

  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};

const Movement = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMoveDataState, setEditedMoveDataState] = useState({});
  const [movements, setMovements] = useState([]);
  const { card } = props;
  const cardId = card?.id;

  const handleEditMoveForm = (isEditing, moveId) => {
    setIsEditing(isEditing);
    const editedMove = movements.find((move) => move.id === moveId);
    setEditedMoveDataState({ ...editedMove });
  };

  const handleSaveMove = async (updatedMoveData) => {
    try {
      const moveId = String(updatedMoveData.id);
      const updatedMove = await MovementService.updateMove(cardId, moveId, updatedMoveData);

      setMovements((prevMovements) =>
        prevMovements.map((move) => (move.id === moveId ? updatedMove : move))
      );

      setIsEditing(false);
      console.log('Состояние движения после сохранения:', updatedMove);
    } catch (error) {
      console.error('Ошибка при обновлении движения:', error);
    }
  };

  const handleDeleteMove = async (moveId, cardId) => {
    try {
      if (!moveId || !cardId) {
        console.error('ID стороны или карточки не определены');
        return;
      }

      const moveIdString = String(moveId);
      const cardIdString = String(cardId);

      await MovementService.remove(cardIdString, moveIdString);
      console.log('Удаляется движение с ID:', moveIdString);

      // Обновление состояния для удаления движения из списка
      setMovements((prevMovements) =>
        prevMovements.filter((item) => String(item.id) !== moveIdString)
      );
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  useEffect(() => {
    const fetchMoves = async () => {
      try {
        const response = await baseService.get(`http://127.0.0.1:8000/business_card/sidescaseincase/`);
        console.log('Response:', response);
        setMovements(response.data);
      } catch (error) {
        console.error('Error fetching Movements:', error);
      }
    };

    if (cardId) {
      fetchMoves();
    }
  }, [cardId]);

  return (
    <div className="App">
      {isEditing ? (
        <MovementForm
          create={props.create}
          editMoveData={editedMoveDataState}
          onSave={handleSaveMove}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <MovementList
          movements={movements}
          handleDeleteMove={handleDeleteMove} // Передаем handleDeleteMove
          handleEditMoveForm={handleEditMoveForm}
          cardId={cardId}
          router={props.router}
        />
      )}
    </div>
  );
};

export default Movement;