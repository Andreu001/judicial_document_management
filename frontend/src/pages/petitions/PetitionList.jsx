import React from 'react';
import { IoMdEye, IoMdTrash, IoMdCreate } from 'react-icons/io';

const PetitionList = ({
    petitions,
    handleShowDetailsPetition,
    handleDeletePetition,
    handleEditPetition,
    cardId,
    setPetitions,
    setIsEditingPetition,
    setEditedPetitionData,
    router
}) => {
  return (
    <>
        {petitions.map((petitions, index) => (
            <div key={index} style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                <strong>
                Ходатайство по делу:
                {petitions.petitions_name && petitions.petitions_name.length > 0
                    ? petitions.petitions_name.map((petition) => petition.petitions).join(', ')
                    : 'Не указано'}
                </strong>
                <div>
                    Кто заявил ходатайство:
                    {petitions.notification_parties && petitions.notification_parties.length > 0
                    ? petitions.notification_parties.map((party, idx) => (
                        <div key={idx}>{party.name || 'Не указано'}</div>
                        ))
                    : 'Неизвестно'}
                </div>
                <div>Дата ходатайства: {petitions.date_application}</div>
                <div>наименование вынесенного решения: {petitions.decision_rendered}</div>
                <div>Дата решения по ходатайству: {petitions.date_decision}</div>
                <div>примечания: {petitions.notation}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                <IoMdEye onClick={() => handleShowDetailsPetition({ petition: petitions }, router)} style={{ cursor: 'pointer', marginRight: '10px', color: 'blue' }} />
                <IoMdTrash
                    onClick={() => {
                    const currentPetitionId = petitions.id;
                    handleDeletePetition(currentPetitionId, cardId, setPetitions);
                    }}
                    style={{ cursor: 'pointer', marginRight: '10px', color: 'red' }}
                />
                <IoMdCreate
                    onClick={() => handleEditPetition(true, setIsEditingPetition, setEditedPetitionData, petitions.id)}
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

export default PetitionList;