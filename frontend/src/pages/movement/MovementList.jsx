import React from 'react';
import { IoMdEye, IoMdTrash, IoMdCreate } from 'react-icons/io';

const MovementList = ({
    movements,
    decisionCases,
    handleShowDetailsMovement,
    handleDeleteMove,
    handleEditMoveForm,
    cardId,
    setMovements,
    router
}) => {

  return (
    <>
      {movements.map((movement, index) => (
        <div key={index} style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Дата заседания: {movement.date_meeting}.</strong>
              <div>Время заседания: {movement.meeting_time}</div>
              <div>
                Решение по поступившему делу: {movement.decision_case && movement.decision_case.length > 0
                  ? decisionCases.find((decision) => decision.id === movement.decision_case[0])?.name_case || 'Неизвестно'
                  : 'Неизвестно'}
              </div>
              <div>Состав коллегии: {movement.composition_colleges}</div>
              <div>Результат судебного заседания: {movement.result_court_session}</div>
              <div>Причина отложения: {movement.reason_deposition}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IoMdEye
                onClick={() => handleShowDetailsMovement({ move: movement }, router)}
                style={{ cursor: 'pointer', marginRight: '10px', color: 'blue' }}
              />
              <IoMdTrash
                onClick={() => handleDeleteMove(movement.id, cardId, setMovements)} // Передаем правильные параметры
                style={{ cursor: 'pointer', marginRight: '10px', color: 'red' }}
              />
              <IoMdCreate
                onClick={() => handleEditMoveForm(true, movement.id)}
                style={{ cursor: 'pointer', color: 'green' }}
              />
            </div>
          </div>
          <hr style={{ width: '100%', height: '1px', backgroundColor: '#d3d3d3', margin: '10px 0' }} />
        </div>
      ))}
    </>
  );
};

export default MovementList;
