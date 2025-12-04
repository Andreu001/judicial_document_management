import React, { useState, useEffect } from 'react';
import PetitionService from '../../API/PetitionService';
import PetitionForm from './PetitionForm';
import PetitionList from './PetitionList';
import axios from 'axios';
import baseService from '../../API/baseService';

export const handleShowDetailsPetition = (props, router) => {
  router(`/business_card/businesscard/${props.card.id}/petitionsincase/${props.petition.id}`);
  console.log("Передается в МУВВВВ!!!!", props.petition);
};

export const handleAddPetitions = (newPetition, setPetitions) => {
  console.log('Добавляется ходатайство:', newPetition);
  if (newPetition && Object.keys(newPetition).length > 0) {
    setPetitions((prevPetitions) => [...prevPetitions, newPetition]);
  }
};

export const handleEditPetition = (
  petitionId, 
  cardId, 
  setPetitions, 
  setIsEditingPetition, 
  setEditedPetitionData
) => {
  console.log('Редактирование ходатайства ID:', petitionId, 'Card ID:', cardId);
  
  if (!cardId) {
    console.error('Card ID is undefined');
    return;
  }
  
  // Получаем данные ходатайства для редактирования
  const fetchPetitionData = async () => {
    try {
      const response = await baseService.get(
        `/business_card/businesscard/${cardId}/petitionsincase/${petitionId}/`
      );
      console.log('Загруженные данные для редактирования:', response.data);
      setEditedPetitionData(response.data);
      setIsEditingPetition(true);
    } catch (error) {
      console.error('Ошибка загрузки ходатайства для редактирования:', error);
    }
  };
  
  fetchPetitionData();
};

export const handleDeletePetition = async (petitionId, cardId, setPetitions) => {
  try {
    console.log('petitionId:', petitionId);
    console.log('cardId:', cardId);

    if (!petitionId || !cardId) {
      console.error('ID ходатайства или карточки не определены');
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
  const [isEditingPetition, setIsEditingPetition] = useState(false);
  const [editedPetitionData, setEditedPetitionData] = useState({});
  const [petitions, setPetitions] = useState([]);
  const [isCriminalCase, setIsCriminalCase] = useState(false);
  
  const cardId = props.card?.id;

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        if (!cardId) return;
        
        console.log('Fetching petitions for card ID:', cardId);
        const response = await baseService.get(`http://localhost:8000/business_card/businesscard/${cardId}/petitionsincase/`);
        console.log('Loaded petitions:', response.data);
        setPetitions(response.data);
        
        // Проверяем тип дела (добавьте логику определения типа дела)
        // Например, если есть какое-то поле в card, указывающее на тип дела
        // setIsCriminalCase(props.card.is_criminal || false);
        
      } catch (error) {
        console.error('Error fetching Petitions:', error);
      }
    };
    
    if (cardId) {
      fetchPetitions();
    }
  }, [cardId]);

  const handleSave = (savedPetition) => {
    if (editedPetitionData.id) {
      // Обновление существующего ходатайства
      setPetitions(prevPetitions => 
        prevPetitions.map(p => p.id === savedPetition.id ? savedPetition : p)
      );
    } else {
      // Добавление нового ходатайства
      setPetitions(prevPetitions => [...prevPetitions, savedPetition]);
    }
    
    setIsEditingPetition(false);
    setEditedPetitionData({});
  };

  const handleCancel = () => {
    setIsEditingPetition(false);
    setEditedPetitionData({});
  };

  const handleCreatePetition = () => {
    setEditedPetitionData({});
    setIsEditingPetition(true);
  };

  return (
    <div className='App'>
      {isEditingPetition ? (
        <PetitionForm
          create={handleAddPetitions}
          editPetitionData={editedPetitionData}
          onSave={handleSave}
          onCancel={handleCancel}
          cardId={cardId}
          isCriminalCase={isCriminalCase}
        />
      ) : (
        <>
          <button 
            onClick={handleCreatePetition}
            style={{
              marginBottom: '15px',
              padding: '10px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Добавить ходатайство
          </button>
          
          <PetitionList 
            petitions={petitions}
            handleShowDetailsPetition={handleShowDetailsPetition}
            handleDeletePetition={handleDeletePetition}
            handleEditPetition={(petitionId) => 
              handleEditPetition(
                petitionId, 
                cardId, 
                setPetitions, 
                setIsEditingPetition, 
                setEditedPetitionData
              )
            }
            cardId={cardId}
            setPetitions={setPetitions}
            setIsEditingPetition={setIsEditingPetition}
            setEditedPetitionData={setEditedPetitionData}
            router={props.router}
          />
        </>
      )}
    </div>
  );
};

export default Petition;
