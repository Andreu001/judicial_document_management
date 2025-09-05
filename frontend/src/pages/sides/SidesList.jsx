import React from 'react';
import { IoMdEye, IoMdTrash, IoMdCreate } from 'react-icons/io';

const SidesList = ({
    sides,
    handleShowDetails,
    handleDeleteSide,
    handleEditSideForm,
    cardId,
    setSide,
    router
}) => {
  return (
    <>
        {sides.map((sides, index) => (
        <div key={index} style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <strong>ФИО {sides.name}.</strong>
                {sides.sides_case_name ? (
                sides.sides_case_name.map((sideCaseName, idx) => (
                    <div key={idx}>Статус стороны: {sideCaseName || 'Не указано'}</div>
                ))
                ) : (
                <div>Нет данных по сторонам дела</div>
                )}
                <div>Дата направления повестки: {sides.date_sending_agenda}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <IoMdEye onClick={() => handleShowDetails({ side: sides }, router)} style={{ cursor: 'pointer', marginRight: '10px', color: 'blue' }} />
                <IoMdTrash
                onClick={() => {
                    const currentSideId = sides.id;
                    console.log('currentSideId:', currentSideId);
                    console.log('cardId:', cardId);
                    handleDeleteSide(currentSideId, cardId, setSide);
                }}
                style={{ cursor: 'pointer', marginRight: '10px', color: 'red' }}
                />
                <IoMdCreate
                    onClick={() => handleEditSideForm(sides.id)}
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

export default SidesList;