import React, { useState, useEffect } from 'react';
import MyButton from './UI/button/MyButton';
import { useNavigate } from 'react-router-dom';
import CardService from '../API/CardService';
import PetitionService, { updatePetition } from '../API/PetitionService';
import { updateCard } from '../API/CardService';
import CardNavbar from './UI/CardNavbar/CardNavbar';
import CardHeader from './CardHeader';
import CardForm from './CardForm';
import { handleShowDetails, handleAddSide, handleDeleteSide, handleEditSide } from '../pages/sides/Sides';
import { handleShowDetailsMovement, handleAddMove, handleDeleteMove, handleEditMove } from '../pages/movement/Movement';
import { handleShowDetailsPetition, handleEditPetition, handleAddPetitions, handleDeletePetition } from '../pages/petitions/Petition';
import SidesForm from '../pages/sides/SidesForm';
import PetitionForm from '../pages/petitions/PetitionForm';
import SideService from '../API/SideService';
import MovementService from '../API/MovementService';
import { IoMdEye, IoMdTrash, IoMdCreate } from 'react-icons/io';
import MovementForm from '../pages/movement/MovementForm';

const BusinessCard = (props) => {
  const router = useNavigate();
  const { card } = props;
  const cardId = card.id;
  const [newside, setNewSide] = useState([]);
  const [newMove, setNewMove] = useState([]);
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
  const [movements, setMovements] = useState();
  const [petitions, setPetitions] = useState();
  const [isEditingPetition, setIsEditingPetition] = useState(false);
  const [showPetitionForm, setShowPetitionForm] = useState(false);
  const [newPetition, setNewPetition] = useState([]);
  const [editedPetitionId, setEditedPetitionId] = useState(null);

  useEffect(() => {
    PetitionService.getAllPetitions(cardId)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setPetitions(response.data);
        } else {
          console.error('Неверный тип данных в ответе:', response.data);
        }
      })
      .catch((error) => {
        console.error('Ошибка при загрузке сторон:', error);
      });
  }, [cardId]);
  
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
    setIsEditingPetition(true); // Добавьте это
    console.log('showPetitionForm:', showPetitionForm);
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
      await CardService.remove(cardId);
      console.log('Удаляется карточка с ID:', cardId);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  const handleAddSideToState = (e) => {
    e.preventDefault()
    setIsEditingSide(true);
    setShowSideForm(true);
    setSide([...sides, newside])
  };

  const createSide = (newSide) => {
    handleAddSide(newSide, setNewSide);
  };

  const createMove = (newMove) => {
    handleAddMove(newMove, setNewMove);
  };

  const createPetition = (newPetition) => {
    handleAddPetitions(newPetition, setNewPetition);
  };

  const renderButtons = () => {
    if (activeTab === 1) {
      return (
        <>
          <MyButton onClick={handleAddSideToState}>
            Добавить сторону
          </MyButton>
        </>
      );
    } else if (activeTab === 2) {
      return (
        <>
          <MyButton onClick={handleAddMovementToState}>
            Добавить движение по делу
          </MyButton>
        </>
      );
    } else if (activeTab === 3) {
      return (
        <>
          <MyButton onClick={handleAddPetitionToState}>
            Добавить ходатайство по делу
          </MyButton>
        </>
      );
    }
    { return (
        <>
          <MyButton onClick={() => router(`/cards/${props.card.id}`)}>
            Подробнее
          </MyButton>
          <MyButton onClick={handleRemove}>Удалить</MyButton>
          <MyButton onClick={handleEditToggle}>Редактировать</MyButton>
        </>
      );
    }
  };

  return (
    <div className="post">
      {showPetitionForm && isEditingPetition ? (
        <PetitionForm
          create={createPetition}
          editPetitionData={editedPetitionData}
          onSave={async (newPetition) => {
            if (editedPetitionId) {
              const updatedPetition = await PetitionService.updatePetition(cardId, editedPetitionId, newPetition);
              setEditedPetitionData(updatedPetition);
              setIsEditingPetition(false);
              setEditedPetitionId(null);
            } else {
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
          onSave={handleSaveMove}
          onCancel={() => setShowMovementForm(false)}
          cardId={cardId}
        />
      ) : null}
      {showSideForm && isEditingSide ? (
        <SidesForm
          create={createSide}
          editSideData={editedSideData}
          onSave={async (newSide) => {
            if (editedSideId) {
              const updatedSide = await SideService.updateSide(cardId, editedSideId, newSide);
              setEditedSideData(updatedSide);
              setIsEditingSide(false);
              setEditedSideId(null);
            } else {
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
      {isEditingCard ? (
        <CardForm
          create={props.create}
          editCardData={editedCardData}
          onSave={handleSaveCard}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="card-header">
            <h5>
              <CardHeader
                align-items="center"
                category={props.card.case_category_title}
              />
              <p></p>
              {` Карточка № ${props.card.original_name}`}
            </h5>
          </div>
          <div className="post__content">
            <div className="tab-content">
              <CardNavbar onTabChange={handleTabChange} />
              {activeTab === 0 && (
                <>
                  <strong>
                    АЙДИ карточки: {props.card.id} Номер карточки {props.card.original_name}.
                  </strong>
                  <div>Автор: {props.card.author}</div>
                  Категория:
                  <div>{props.card.case_category_title}</div>
                  <div>Статья: {props.card.article}</div>
                  Дата создания:
                  <div>{props.card.pub_date}</div>
                </>
              )}

              {activeTab === 1 && sides ? (
                <>
                  {sides.map((sides, index) => (
                    <div key={index} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>ФИО {sides.name}.</strong>
                          <div>Под стражей: {sides.under_arrest}</div>
                          {sides.sides_case ? (
                            sides.sides_case.map((sideCase, idx) => (
                              <div key={idx}>Статус стороны: {sideCase.sides_case}</div>
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
                              const currentSideId = sides.id; // или нужный вам способ получения id
                              console.log('currentSideId:', currentSideId);
                              console.log('props.card.id:', props.card.id);
                              handleDeleteSide(currentSideId, props.card.id, setSide);
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
              ) : null}

              {activeTab === 2 && movements ? (
                <>
                {movements.map((movements, index) => (
                  <div key={index} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Дата заседания: {movements.date_meeting}.</strong>
                        <div>Время заседания: {movements.meeting_time}</div>                        
                        <div>Решение по поступившему делу: {movements.decision_case}</div>
                        <div>Состав коллегии: {movements.composition_colleges}</div>
                        <div>Результат судебного заседания: {movements.result_court_session}</div>
                        <div>причина отложения: {movements.reason_deposition}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IoMdEye onClick={() => handleShowDetails({ move: movements }, router)} style={{ cursor: 'pointer', marginRight: '10px', color: 'blue' }} />
                        <IoMdTrash
                          onClick={() => {
                            const currentMoveId = movements.id;
                            console.log('currentMoveId:', currentMoveId);
                            console.log('props.card.id:', props.card.id);
                            handleDeleteMove(currentMoveId, props.card.id, setMovements);
                          }}
                          style={{ cursor: 'pointer', marginRight: '10px', color: 'red' }}
                        />
                        <IoMdCreate
                            onClick={() => handleEditMoveForm(true, setIsEditingMove, setEditedMoveData, movements.id)}
                            style={{ cursor: 'pointer', color: 'green' }}
                          />
                      </div>
                    </div>
                    <hr style={{ width: '100%', height: '1px', backgroundColor: '#d3d3d3', margin: '10px 0' }} />
                  </div>
                ))}
              </>
            ) : null}

              {activeTab === 3 && petitions ? (
                <>
                {petitions.map((petitions, index) => (
                  <div key={index} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>ходатайства по делу: {petitions.petitions}.</strong>
                        <div>Кто заявил ходатайство: {petitions.sides_case}</div>
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
                            console.log('currentPetitionId:', currentPetitionId);
                            console.log('props.card.id:', props.card.id);
                            handleDeletePetition(currentPetitionId, props.card.id, setPetitions);
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
            ) : null}

            </div>
          </div>
          <hr
            style={{
              width: '100%',
              height: '2px',
              backgroundColor: '#d3d3d3',
              margin: '15px 0',
            }}
          />
          <div className="post__btns">{renderButtons()}</div>
        </>
      )}
    </div>
  );
};

export default BusinessCard;
