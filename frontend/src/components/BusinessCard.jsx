import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardService from '../API/CardService';
import PetitionService from '../API/PetitionService';
import { updateCard } from '../API/CardService';
import CardNavbar from './UI/CardNavbar/CardNavbar';
import CardHeader from './CardHeader';
import CardForm from './CardForm';
import { handleShowDetails, handleAddSide, handleDeleteSide, } from '../pages/sides/Sides';
import { handleShowDetailsMovement, handleAddMove, handleDeleteMove, } from '../pages/movement/Movement';
import { handleShowDetailsPetition, handleEditPetition, handleAddPetitions, handleDeletePetition } from '../pages/petitions/Petition';
import { handleShowDetailsConsidered, handleAddConsidered, handleDeleteConsidered, } from '../pages/considered/Considered';
import SidesForm from '../pages/sides/SidesForm';
import SidesList from '../pages/sides/SidesList';
import PetitionForm from '../pages/petitions/PetitionForm';
import PetitionList from '../pages/petitions/PetitionList';
import ConsideredForm from '../pages/considered/ConsideredForm';
import ConsideredList from '../pages/considered/ConsideredList';
import SideService from '../API/SideService';
import MovementService from '../API/MovementService';
import ConsideredService from '../API/ConsideredService';
import MovementForm from '../pages/movement/MovementForm';
import MovementList from '../pages/movement/MovementList';
import styles from './UI/Card/BusinessCard.module.css';
import CardFooter from './UI/CardFooter/CardFooter';
import authService from '../API/authService';

const BusinessCard = (props) => {
  const router = useNavigate();
  const { card } = props;
  const cardId = card.id;
  const [newside, setNewSide] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isEditingMove, setIsEditingMove] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [editedCardData, setEditedCardData] = useState({ ...props.card });
  const [editedSideData, setEditedSideData] = useState({ ...props.side });
  const [editedMoveData, setEditedMoveData] = useState({ ...props.move });
  const [editedPetitionData, setEditedPetitionData] = useState({ ...props.petition });
  const [showSideForm, setShowSideForm] = useState(false);
  const [isEditingSide, setIsEditingSide] = useState(false);
  const [sides, setSide] = useState([]);
  const [editedSideId, setEditedSideId] = useState(null);
  const [editedMoveId, setEditedMoveId] = useState(null);
  const [movements, setMovements] = useState();
  const [petitions, setPetitions] = useState();
  const [isEditingPetition, setIsEditingPetition] = useState(false);
  const [showPetitionForm, setShowPetitionForm] = useState(false);
  const [newPetition, setNewPetition] = useState([]);
  const [petitionNames, setPetitionNames] = useState({});
  const [editedPetitionId, setEditedPetitionId] = useState(null);
  const [decisionCases, setDecisionCases] = useState([]);
  const [considered, setConsidered] = useState([]);
  const [isEditingConsidered, setIsEditingConsidered] = useState(false);
  const [showConsideredForm, setShowConsideredForm] = useState(false);
  const [editedConsideredData, setEditedConsideredData] = useState({});
  const [editedConsideredId, setEditedConsideredId] = useState(null);
  const [authorName, setAuthorName] = useState('');

  // Функция для форматирования даты
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Не указано';
    
    const date = new Date(dateString);
    
    // Форматируем дату: дд.мм.гг
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    
    // Форматируем время: чч:мм
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

// Загрузка данных об авторе
  useEffect(() => {
    const fetchAuthorName = async () => {
      try {
        if (props.card.author) {
          // Получаем данные пользователя по ID
          const userData = await authService.getUserById(props.card.author);
          if (userData) {
            setAuthorName(`${userData.first_name} ${userData.last_name}`);
          } else {
            setAuthorName(`Пользователь #${props.card.author}`);
          }
        } else if (props.card.author_name) {
          // Если автор уже приходит с сервера в виде имени
          setAuthorName(props.card.author_name);
        } else {
          setAuthorName('Неизвестный автор');
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных автора:', error);
        setAuthorName(`Пользователь #${props.card.author}`);
      }
    };

    if (props.card.author) {
      fetchAuthorName();
    }
  }, [props.card.author, props.card.author_name]);

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        const response = await PetitionService.getAllPetitions(cardId);
        if (Array.isArray(response.data)) {
          setPetitions(response.data);
        } else {
          console.error("Неверный формат данных ходатайств:", response.data);
        }
      } catch (error) {
        console.error("Ошибка при загрузке ходатайств:", error);
      }
    };
  
    if (cardId) {
      fetchPetitions();
    }
  }, [cardId]);
  
  
  useEffect(() => {
    const fetchPetitionNames = async () => {
      if (petitions) {
        const petitionIds = petitions.flatMap(petition => petition.petitions_name);
        const names = await Promise.all(petitionIds.map(async (id) => {
          try {
            const response = await PetitionService.getPetitionById(id);
            return { [id]: response.data.petitions };
          } catch (error) {
          }
        }));
  
        const nameMap = Object.assign({}, ...names);
        setPetitionNames(nameMap);
      }
    };
  
    fetchPetitionNames();
  }, [petitions]);
  
  useEffect(() => {
    SideService.getAllSide(cardId)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setSide(response.data);
        } else {
          console.error('Неверный тип данных в ответе:', response.data);
        }
      })
      .catch((error) => {
        console.error('Ошибка при загрузке сторон:', error);
      });
  }, [cardId]);

  useEffect(() => {
    MovementService.getAllMove(cardId)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setMovements(response.data);
        } else {
          console.error('Неверный тип данных в ответе:', response.data);
        }
      })
      .catch((error) => {
        console.error('Ошибка при загрузке сторон:', error);
      });
  }, [cardId]);

  useEffect(() => {
    MovementService.getDecisionCases()
      .then((response) => {
        if (Array.isArray(response.data)) {
          setDecisionCases(response.data);
        } else {
          console.error('Неверный формат данных:', response.data);
        }
      })
      .catch((error) => {
        console.error('Ошибка загрузки решений:', error);
      });
  }, []);

  useEffect(() => {
    ConsideredService.getAllConsidereds(cardId)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setConsidered(response.data);
        } else {
          console.error('Неверный тип данных в ответе:', response.data);
        }
      })
      .catch((error) => {
        console.error('Ошибка при загрузке решений:', error);
      });
  }, [cardId]);

  const handleAddConsideredToState = () => {
    console.log("Adding considered to state");
    setShowConsideredForm(true);
    setIsEditingConsidered(false);
    setEditedConsideredData({});
  };

  const handleEditConsideredForm = (consideredId) => {
    const editedConsidered = considered.find((c) => c.id === consideredId);
    setEditedConsideredId(consideredId);
    setIsEditingConsidered(true);
    setShowConsideredForm(true);
    setEditedConsideredData({ ...editedConsidered });
  };

  const handleEditToggle = () => {
    setIsEditingCard(!isEditingCard);
    setEditedCardData({ ...props.card });
    setEditedSideId(null);
  };

 
  const handleSaveCard = async (updatedCardData) => {
    try {
      const cardId = String(updatedCardData.id);
      const updatedCard = await updateCard(cardId, updatedCardData);
  
      setEditedCardData(updatedCard);
      setIsEditingCard(false);
  
      console.log('Состояние карточки после сохранения:', updatedCard);
    } catch (error) {
      console.error('Ошибка при обновлении карточки:', error);
    }
  };

  const handleAddMovementToState = () => {
    setShowMovementForm(true);
  };

  const handleAddPetitionToState = () => {
    console.log('Button Clicked');
    setShowPetitionForm(true);
    setIsEditingPetition(true);
    console.log('showPetitionForm:', showPetitionForm);
  };

  const handleEditMoveForm = (isEditing, setIsEditingMove, setEditedMoveData, moveId) => {
    setIsEditingMove(isEditing);

    const editedMove = movements.find((move) => move.id === moveId);
  
    setEditedMoveData({ ...editedMove });
    setShowMovementForm(true);
  };
  
  const handleCancel = () => {
    setEditedCardData({ ...props.card });
    setIsEditingCard(false);
    setEditedSideId(null);
  };

  const handleEditSideForm = (sideId) => {
    const editedSide = sides.find((side) => side.id === sideId);

    setEditedSideId(sideId);
    setIsEditingSide(true);
    setShowSideForm(true);
    setEditedSideData({ ...editedSide });
  };

  const handleRemove = async () => {
    try {
      if (!props.card.id) {
        console.error('ID карточки не определен');
        return;
      }
  
      const cardId = String(props.card.id);
      await props.remove(cardId); // Вызываем функцию remove, переданную через props
      console.log('Удаляется карточка с ID:', cardId);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

const handleAddSideToState = (e) => {
  e.preventDefault();
  setEditedSideData({}); // Очищаем данные перед добавлением новой стороны
  setIsEditingSide(true);
  setShowSideForm(true);
};


const createSide = async (newSide) => {
  try {
    await SideService.getAllSide(cardId, newSide); // Сначала создаем сторону
    const response = await SideService.getAllSide(cardId); // Получаем обновленные данные
    setSide(response.data); // Устанавливаем новые данные в стейт
    setShowSideForm(false); // Закрываем форму
  } catch (error) {
    console.error('Ошибка при создании стороны:', error);
  }
};

const createConsidered = async (newConsidered) => {
  try {
    const response = await ConsideredService.getAllConsidereds(cardId, newConsidered);
    // Обновляем состояние considereds, добавляя новое решение
    setConsidered(response.data);
    setShowConsideredForm(false); // Закрываем форму
  } catch (error) {
    console.error('Ошибка при создании решения:', error);
  }
};

const createPetition = async (newPetition) => {
  try {
    const response = await PetitionService.getAllPetitions(cardId, newPetition);
    setPetitions(response.data); // Обновляем состояние
    setShowPetitionForm(false); // Закрываем форму
  } catch (error) {
    console.error('Ошибка при создании ходатайства:', error);
  }
};

const createMove = async (newMove) => {
  try {
    const response = await MovementService.getAllMove(cardId, newMove);
    setMovements(response.data); // Обновляем состояние
    setShowMovementForm(false); // Закрываем форму
  } catch (error) {
    console.error('Ошибка при создании движения:', error);
  }
};


  return (
    <div className={styles.card}>
      {showPetitionForm && isEditingPetition ? (
        <PetitionForm
          create={createPetition} // Передаем функцию создания
          editPetitionData={editedPetitionData}
          onSave={async (newPetition) => {
            if (editedPetitionId) {
              const updatedPetition = await PetitionService.updatedPetition(cardId, editedPetitionId, newPetition);
              setEditedPetitionData(updatedPetition);
              setIsEditingPetition(false);
              setEditedPetitionId(null);
            } else {
              await createPetition(newPetition);
            }
          }}
          onCancel={() => {
            setShowPetitionForm(false);
            setIsEditingPetition(false);
            setEditedPetitionId(null);
          }}
          setNewPetition={setNewPetition}
          cardId={cardId}
        />
      ) : null}

      {showMovementForm && activeTab === 2 ? (
        <MovementForm
          create={createMove}
          editMovementData={editedMoveData}
          onSave={async (newMove) => {
            if (editedMoveId) {
              const updatedMove = await MovementService.updateMove(cardId, editedMoveId, newMove);
              setEditedMoveData(updatedMove);
              setIsEditingMove(false);
              setEditedMoveId(null);
            } else {
              await createMove(newMove); // Вызываем функцию создания
            }
          }}
          onCancel={() => setShowMovementForm(false)}
          cardId={cardId}
        />
      ) : null}

      {showSideForm && isEditingSide ? (
        <SidesForm
          create={createSide} // Передаем функцию создания
          editSideData={editedSideData}
          onSave={async (newSide) => {
            if (editedSideId) {
              const updatedSide = await SideService.updateSide(cardId, editedSideId, newSide);
              setEditedSideData(updatedSide);
              setIsEditingSide(false);
              setEditedSideId(null);
            } else {
              await createSide(newSide); // Вызываем функцию создания
            }
          }}
          onCancel={() => {
            setShowSideForm(false);
            setIsEditingSide(false);
            setEditedSideId(null);
          }}
          setNewSide={setNewSide}
          cardId={cardId}
        />
      ) : null}
      {showConsideredForm && (
        <ConsideredForm
          create={createConsidered}
          editConsideredData={editedConsideredData}
          onSave={async (newConsidered) => {
            if (editedConsideredId) {
              const updatedConsidered = await ConsideredService.updateConsidered(cardId, editedConsideredId, newConsidered);
              setEditedConsideredData(updatedConsidered);
              setIsEditingConsidered(false);
              setEditedConsideredId(null);
            } else {
              await createConsidered(newConsidered);
            }
          }}
          onCancel={() => {
            setShowConsideredForm(false);
            setIsEditingConsidered(false);
            setEditedConsideredId(null);
          }}
          setNewConsidered={setEditedConsideredData}
          cardId={cardId}
        />
      )}

      {isEditingCard ? (
        <CardForm
          create={props.create}
          editCardData={editedCardData}
          onSave={handleSaveCard}
          onCancel={handleCancel}
        />
      ) : (
        <>
        <CardHeader card={props.card} />
          <div className={styles.cardContent}>
            <CardNavbar onTabChange={handleTabChange} />
            {activeTab === 0 && (
              <div>
                <strong>АЙДИ карточки: {props.card.id}</strong>
                <div>Автор: {authorName || 'Не указан'}</div>
                <div>Дата создания: {formatDateTime(props.card.pub_date)}</div>
                <div>Дата редактирования: {formatDateTime(props.card.updated_at)}</div>
              </div>
            )}

          {activeTab === 1 && sides ? (
            <SidesList
              sides={sides}
              setSide={setSide}
              handleShowDetails={handleShowDetails}
              handleDeleteSide={handleDeleteSide}
              handleEditSideForm={handleEditSideForm}
              cardId={cardId}
              router={router}
            />
          ) : null}

          {activeTab === 2 && movements ? (
            <MovementList
              movements={movements}
              decisionCases={decisionCases}
              handleShowDetailsMovement={handleShowDetailsMovement}
              handleDeleteMove={handleDeleteMove}
              handleEditMoveForm={handleEditMoveForm}
              cardId={cardId}
              setMovements={setMovements}
              router={router}
            />
          ) : null}

          {activeTab === 3 && petitions ? (
              <PetitionList
                petitions={petitions}
                handleShowDetailsPetition={handleShowDetailsPetition}
                handleDeletePetition={handleDeletePetition}
                handleEditPetition={handleEditPetition}
                cardId={cardId}
                setPetitions={setPetitions}
                router={router}
              />
          ) : null}

          {activeTab === 4 && considered ? (
            <ConsideredList
              considered={considered}
              handleShowDetailsConsidered={handleShowDetailsConsidered}
              handleDeleteConsidered={handleDeleteConsidered}
              handleEditConsideredForm={handleEditConsideredForm}
              cardId={cardId}
              setConsidered={setConsidered}
              router={router}
            />
          ) : null}

          </div>
          <CardFooter
            activeTab={activeTab}
            handleAddSideToState={handleAddSideToState}
            handleAddMovementToState={handleAddMovementToState}
            handleAddPetitionToState={handleAddPetitionToState}
            handleAddConsideredToState={handleAddConsideredToState}
            handleRemove={handleRemove}
            handleEditToggle={handleEditToggle}
            isEditingCard={isEditingCard}
            cardId={card.id}
          />
        </>
      )}
    </div>
  );
};

export default BusinessCard;