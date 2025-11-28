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
import CriminalCaseService from '../API/CriminalCaseService';
import DefendantForm from './CriminalCase/DefendantForm';
import baseService from '../API/baseService';
import CriminalDecisionForm from './CriminalCase/CriminalDecisionForm';
import CriminalDecisionDetail from './CriminalCase/CriminalDecisionDetail';
import CaseRegistryService from '../API/CaseRegistryService';

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
  const [criminalCase, setCriminalCase] = useState(null);
  const [defendants, setDefendants] = useState([]);
  const [showDefendantForm, setShowDefendantForm] = useState(false);
  const [isEditingDefendant, setIsEditingDefendant] = useState(false);
  const [editedDefendantData, setEditedDefendantData] = useState({});
  const [editedDefendantId, setEditedDefendantId] = useState(null);
  const isCriminalCategory = card.case_category === 4;
  const handleShowDetails = () => {
    if (isCriminalCategory) {
      router(`/businesscard/${cardId}/criminal-details`);
    } else {
      router(`/cards/${cardId}`);
    }
  };
  const [criminalDecisions, setCriminalDecisions] = useState([]);
  const [showCriminalDecisionForm, setShowCriminalDecisionForm] = useState(false);
  const [isEditingCriminalDecision, setIsEditingCriminalDecision] = useState(false);
  const [editedCriminalDecisionData, setEditedCriminalDecisionData] = useState({});
  const [editedCriminalDecisionId, setEditedCriminalDecisionId] = useState(null);
  const [registeredCase, setRegisteredCase] = useState(null);

  const handleAddCriminalDecisionToState = () => {
    console.log("Adding criminal decision to state");
    setShowCriminalDecisionForm(true);
    setIsEditingCriminalDecision(false);
    setEditedCriminalDecisionData({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  const getCourtInstanceText = (instance) => {
    switch (instance) {
      case '1': return 'Апелляционной';
      case '2': return 'Кассационной';
      default: return 'Не указано';
    }
  };

  useEffect(() => {
    const loadRegisteredCase = async () => {
      try {
        const cases = await CaseRegistryService.getCases({
          business_card: cardId
        });
        if (cases.length > 0) {
          setRegisteredCase(cases[0]);
        }
      } catch (error) {
        console.error('Ошибка загрузки зарегистрированного дела:', error);
      }
    };

    if (cardId) {
      loadRegisteredCase();
    }
  }, [cardId]);
  
  useEffect(() => {
    const loadCriminalDecisions = async () => {
      if (criminalCase) {
        try {
          const decisionsData = await CriminalCaseService.getDecisions(cardId);
          
          // Получаем названия для связанных полей
          const decisionsWithNames = await Promise.all(
            decisionsData.map(async (decision) => {
              if (decision.name_case) {
                try {
                  const decisionResponse = await baseService.get(`http://localhost:8000/business_card/decisions/${decision.name_case}/`);
                  decision.decision_name = decisionResponse.data.decisions;
                } catch (error) {
                  console.error('Ошибка загрузки названия решения:', error);
                  decision.decision_name = 'Неизвестное решение';
                }
              }
              
              if (decision.decision_appeal) {
                try {
                  const appealResponse = await baseService.get(`http://localhost:8000/business_card/appeal/${decision.decision_appeal}/`);
                  decision.appeal_name = appealResponse.data.appeal;
                } catch (error) {
                  console.error('Ошибка загрузки названия апелляции:', error);
                  decision.appeal_name = 'Неизвестный результат';
                }
              }
              
              return decision;
            })
          );
          
          setCriminalDecisions(decisionsWithNames);
        } catch (error) {
          console.error('Ошибка загрузки решений:', error);
          setCriminalDecisions([]);
        }
      } else {
        setCriminalDecisions([]);
      }
    };
    
    if (criminalCase) {
      loadCriminalDecisions();
    }
  }, [criminalCase, cardId]);

  const handleAddCriminalDecision = () => {
    setShowCriminalDecisionForm(true);
    setIsEditingCriminalDecision(false);
    setEditedCriminalDecisionData({});
  };

  const handleEditCriminalDecision = (decisionId) => {
    const decision = criminalDecisions.find(d => d.id === decisionId);
    setEditedCriminalDecisionData({ ...decision });
    setEditedCriminalDecisionId(decisionId);
    setIsEditingCriminalDecision(true);
    setShowCriminalDecisionForm(true);
  };

  const handleSaveCriminalDecision = async (decisionData) => {
    try {
      if (isEditingCriminalDecision) {
        const updatedDecision = await CriminalCaseService.updateDecision(
          cardId, 
          editedCriminalDecisionId, 
          decisionData
        );

        // Обновляем названия
        if (updatedDecision.name_case) {
          const decisionResponse = await baseService.get(`http://localhost:8000/business_card/decisions/${updatedDecision.name_case}/`);
          updatedDecision.decision_name = decisionResponse.data.decisions;
        }
        
        if (updatedDecision.decision_appeal) {
          const appealResponse = await baseService.get(`http://localhost:8000/business_card/appeals/${updatedDecision.decision_appeal}/`);
          updatedDecision.appeal_name = appealResponse.data.appeal;
        }
        
        setCriminalDecisions(criminalDecisions.map(d => 
          d.id === editedCriminalDecisionId ? updatedDecision : d
        ));
      } else {
        const newDecision = await CriminalCaseService.createDecision(cardId, decisionData);

        // Получаем названия
        if (newDecision.name_case) {
          const decisionResponse = await baseService.get(`http://localhost:8000/business_card/decisions/${newDecision.name_case}/`);
          newDecision.decision_name = decisionResponse.data.decisions;
        }
        
        if (newDecision.decision_appeal) {
          const appealResponse = await baseService.get(`http://localhost:8000/business_card/appeals/${newDecision.decision_appeal}/`);
          newDecision.appeal_name = appealResponse.data.appeal;
        }
        
        setCriminalDecisions([...criminalDecisions, newDecision]);
      }
      
      setShowCriminalDecisionForm(false);
      setEditedCriminalDecisionData({});
      setEditedCriminalDecisionId(null);
    } catch (error) {
      console.error('Ошибка сохранения решения:', error);
    }
  };

  const handleDeleteCriminalDecision = async (decisionId) => {
    try {
      await CriminalCaseService.deleteDecision(cardId, decisionId);
      setCriminalDecisions(criminalDecisions.filter(d => d.id !== decisionId));
    } catch (error) {
      console.error('Ошибка удаления решения:', error);
    }
  };

  const handleShowCriminalDecisionDetails = (decisionId) => {
    router(`/businesscard/${cardId}/criminal-decisions/${decisionId}`);
  };


  useEffect(() => {
    const loadDefendants = async () => {
      try {
        if (criminalCase) {
          const defendantsData = await CriminalCaseService.getDefendants(cardId);
          
          // Получаем названия сторон для каждого обвиняемого
          const defendantsWithSideNames = await Promise.all(
            defendantsData.map(async (defendant) => {
              if (defendant.side_case) {
                try {
                  const sideResponse = await baseService.get(`http://localhost:8000/business_card/sides/${defendant.side_case}/`);
                  return {
                    ...defendant,
                    side_case_name: sideResponse.data.sides_case
                  };
                } catch (error) {
                  console.error('Ошибка загрузки названия стороны:', error);
                  return { ...defendant, side_case_name: 'Неизвестный статус' };
                }
              }
              return defendant;
            })
          );
          
          setDefendants(defendantsWithSideNames);
        }
      } catch (error) {
        console.error('Ошибка загрузки обвиняемых:', error);
      }
    };
    
    if (criminalCase) {
      loadDefendants();
    }
  }, [criminalCase, cardId]);

  const handleAddDefendantToState = () => {
    setShowDefendantForm(true);
    setIsEditingDefendant(false);
    setEditedDefendantData({});
  };

const handleEditDefendant = (defendantId) => {
  const defendant = defendants.find(d => d.id === defendantId);
  setEditedDefendantData({ 
    ...defendant,
    side_case: defendant.side_case // Убедитесь, что передается side_case
  });
  setEditedDefendantId(defendantId);
  setIsEditingDefendant(true);
  setShowDefendantForm(true);
};

  const handleSaveDefendant = async (defendantData) => {
    try {
      console.log('Saving defendant data:', defendantData);
      
      if (isEditingDefendant) {
        const updatedDefendant = await CriminalCaseService.updateDefendant(
          cardId, 
          editedDefendantId, 
          defendantData
        );

        // Если сервер не возвращает side_case, добавляем его из отправленных данных
        const defendantWithSideCase = {
          ...updatedDefendant,
          side_case: defendantData.side_case || updatedDefendant.side_case
        };

        if (defendantWithSideCase.side_case) {
          const sideResponse = await baseService.get(`http://localhost:8000/business_card/sides/${defendantWithSideCase.side_case}/`);
          defendantWithSideCase.side_case_name = sideResponse.data.sides_case;
        }
        
        setDefendants(defendants.map(d => 
          d.id === editedDefendantId ? defendantWithSideCase : d
        ));
      } else {
        const newDefendant = await CriminalCaseService.createDefendant(cardId, defendantData);

        // Если сервер не возвращает side_case, добавляем его из отправленных данных
        const defendantWithSideCase = {
          ...newDefendant,
          side_case: defendantData.side_case || newDefendant.side_case
        };

        if (defendantWithSideCase.side_case) {
          const sideResponse = await baseService.get(`http://localhost:8000/business_card/sides/${defendantWithSideCase.side_case}/`);
          defendantWithSideCase.side_case_name = sideResponse.data.sides_case;
        }
        
        setDefendants([...defendants, defendantWithSideCase]);
      }
      
      setShowDefendantForm(false);
      setEditedDefendantData({});
      setEditedDefendantId(null);
    } catch (error) {
      console.error('Ошибка сохранения обвиняемого:', error);
      console.error('Error response data:', error.response?.data);
    }
  };

  const handleDeleteDefendant = async (defendantId) => {
    try {
      await CriminalCaseService.deleteDefendant(cardId, defendantId);
      setDefendants(defendants.filter(d => d.id !== defendantId));
    } catch (error) {
      console.error('Ошибка удаления обвиняемого:', error);
    }
  };

useEffect(() => {
  const loadCriminalCase = async () => {
    if (isCriminalCategory) {
      try {
        const criminalData = await CriminalCaseService.getByBusinessCardId(cardId);
        setCriminalCase(criminalData);
        
        if (criminalData) {
          try {
            const defendantsData = await CriminalCaseService.getDefendants(cardId);
            
            // Получаем названия сторон для каждого обвиняемого
            const defendantsWithSideNames = await Promise.all(
              defendantsData.map(async (defendant) => {
                if (defendant.side_case) {
                  try {
                    const sideResponse = await baseService.get(`http://localhost:8000/business_card/sides/${defendant.side_case}/`);
                    return {
                      ...defendant,
                      side_case_name: sideResponse.data.sides_case
                    };
                  } catch (error) {
                    console.error('Ошибка загрузки названия стороны:', error);
                    return { ...defendant, side_case_name: 'Неизвестный статус' };
                  }
                }
                return defendant;
              })
            );
            
            setDefendants(defendantsWithSideNames);
          } catch (defendantError) {
            console.error('Ошибка загрузки обвиняемых:', defendantError);
            setDefendants([]);
          }
        } else {
          console.log('No criminal case found for this card');
          setDefendants([]);
        }
      } catch (error) {
        console.error('Ошибка загрузки уголовного дела:', error);
        setCriminalCase(null);
        setDefendants([]);
      }
    } else {
      setCriminalCase(null);
      setDefendants([]);
    }
  };
  
  if (cardId) {
    loadCriminalCase();
  }
}, [cardId, isCriminalCategory]);

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

  const handleShowDefendantDetails = (defendantId) => {
    // Переход на страницу деталей обвиняемого
    router(`/businesscard/${cardId}/defendants/${defendantId}`);
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
    
    console.log('criminalCase:', criminalCase);
    console.log('showDefendantForm будет:', !!criminalCase);
    console.log('showSideForm будет:', !criminalCase);
    
    // Сначала скрываем обе формы
    setShowSideForm(false);
    setShowDefendantForm(false);
    
    // Ждем следующего tick для избежания конфликта рендеринга
    setTimeout(() => {
      // Если это уголовное дело, показываем форму обвиняемого
      if (criminalCase) {
        console.log('Showing defendant form for criminal case');
        setShowDefendantForm(true);
        setIsEditingDefendant(false);
        setEditedDefendantData({});
      } else {
        console.log('Showing regular side form');
        // Для обычных дел показываем стандартную форму стороны
        setEditedSideData({});
        setEditedSideId(null);
        setShowSideForm(true);
      }
    }, 0);
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

      {(showSideForm || showDefendantForm) && (
        <div className={styles.formOverlay}>
          {/* Форма обычной стороны - ТОЛЬКО если НЕТ уголовного дела */}
          {showSideForm && !criminalCase && (
            <div className={styles.formContainer}>
              <SidesForm
                create={createSide}
                editSideData={editedSideData}
                isEditing={!!editedSideId}
                onSave={async (newSide) => {
                  if (editedSideId) {
                    const updatedSide = await SideService.updateSide(cardId, editedSideId, newSide);
                    setEditedSideData(updatedSide);
                    setEditedSideId(null);
                  } else {
                    await createSide(newSide);
                  }
                  setShowSideForm(false);
                }}
                onCancel={() => {
                  setShowSideForm(false);
                  setEditedSideId(null);
                }}
                setNewSide={setNewSide}
                cardId={cardId}
              />
            </div>
          )}

          {/* Форма обвиняемого - ТОЛЬКО если ЕСТЬ уголовное дело */}
          {showDefendantForm && criminalCase && (
            <div className={styles.formContainer}>
              <DefendantForm
                defendantData={editedDefendantData}
                onDefendantDataChange={setEditedDefendantData}
                onSubmit={(data) => handleSaveDefendant(data)} // Принимаем данные
                onCancel={() => {
                  setShowDefendantForm(false);
                  setEditedDefendantData({});
                  setEditedDefendantId(null);
                }}
              />
            </div>
          )}
        </div>
      )}

      {showCriminalDecisionForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formContainer}>
            <CriminalDecisionForm
              decisionData={editedCriminalDecisionData}
              onDecisionDataChange={setEditedCriminalDecisionData}
              onSubmit={(data) => handleSaveCriminalDecision(data)}
              onCancel={() => {
                setShowCriminalDecisionForm(false);
                setEditedCriminalDecisionData({});
                setEditedCriminalDecisionId(null);
              }}
            />
          </div>
        </div>
      )}

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

            {activeTab === 1 && (
              <div>
                {criminalCase ? (
                  // Отображаем обвиняемых для уголовных дел
                  <div>
                    {defendants.length > 0 ? (
                      defendants.map(defendant => (
                        <div key={defendant.id} className={styles.defendantItem}>
                          <div className={styles.defendantInfo}>
                            <strong>{defendant.full_name}</strong>
                            {defendant.side_case_name && (
                              <div><strong>Статус: {defendant.side_case_name} </strong></div>
                            )}
                            <div>Адрес: {defendant.address || 'Не указан'}</div>
                            <div>Дата рождения: {defendant.birth_date || 'Не указана'}</div>
                            <div>Гражданство: {defendant.citizenship || 'Не указано'}</div>
                          </div>
                            <div className={styles.verticalActionButtons}>
                              <button 
                                onClick={() => handleShowDefendantDetails(defendant.id)}
                                className={`${styles.verticalActionButton} ${styles.viewButton}`}
                                title="Просмотреть подробнее"
                              >
                                <span className={styles.buttonIcon}>👁️</span>
                                Просмотр
                              </button>
                              <button 
                                onClick={() => handleEditDefendant(defendant.id)}
                                className={`${styles.verticalActionButton} ${styles.editButton}`}
                                title="Редактировать"
                              >
                                <span className={styles.buttonIcon}>✏️</span>
                                Изменить
                              </button>
                              <button 
                                onClick={() => handleDeleteDefendant(defendant.id)}
                                className={`${styles.verticalActionButton} ${styles.deleteButton}`}
                                title="Удалить"
                              >
                                <span className={styles.buttonIcon}>🗑️</span>
                                Удалить
                              </button>
                            </div>
                        </div>
                      ))
                    ) : (
                      <p>Обвиняемые не добавлены</p>
                    )}
                  </div>
                ) : (
                  // Отображаем обычные стороны для других категорий дел
                  sides && sides.length > 0 ? (
                    <SidesList
                      sides={sides}
                      setSide={setSide}
                      handleShowDetails={handleShowDetails}
                      handleDeleteSide={handleDeleteSide}
                      handleEditSideForm={handleEditSideForm}
                      cardId={cardId}
                      router={router}
                    />
                  ) : (
                    <p>Стороны не добавлены</p>
                  )
                )}
              </div>
            )}
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

          {activeTab === 4 && (
            <div>
              {criminalCase ? (
                // Отображаем решения для уголовных дел
                <div>
                  {criminalDecisions.length > 0 ? (
                    criminalDecisions.map(decision => (
                      <div key={decision.id} className={styles.defendantItem}>
                        <div className={styles.defendantInfo}>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}><strong>Решение:</strong></div>
                            <div className={styles.infoValue} ><strong>{decision.name_case || 'Не указано'}</strong></div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Дата апелляции:</div>
                            <div className={styles.infoValue}>{formatDate(decision.appeal_date) || 'Не указано'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Заявитель:</div>
                            <div className={styles.infoValue}>{decision.appeal_applicant || 'Не указан'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Процессуальное положение:</div>
                            <div className={styles.infoValue}>{decision.appeal_applicant_status || 'Не указано'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Суд:</div>
                            <div className={styles.infoValue}>{getCourtInstanceText(decision.court_instance) || 'Не указан'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Дата направления:</div>
                            <div className={styles.infoValue}>{formatDate(decision.court_sent_date) || 'Не указана'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Дата возвращения:</div>
                            <div className={styles.infoValue}>{formatDate(decision.court_return_date) || 'Не указана'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Причина возвращения:</div>
                            <div className={styles.infoValue}>{decision.court_return_reason || 'Не указана'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Дата повторного направления:</div>
                            <div className={styles.infoValue}>{formatDate(decision.court_resend_date) || 'Не указана'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Дата рассмотрения:</div>
                            <div className={styles.infoValue}>{formatDate(decision.court_consideration_date) || 'Не указана'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Результат:</div>
                            <div className={styles.infoValue}>{decision.appeal_name || 'Не указан'}</div>
                          </div>
                          {decision.consideration_changes && (
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>Сущность изменений:</div>
                              <div className={styles.infoValue}>{decision.consideration_changes}</div>
                            </div>
                          )}
                        </div>
                        <div className={styles.verticalActionButtons}>
                          <button 
                            onClick={() => handleShowCriminalDecisionDetails(decision.id)}
                            className={`${styles.verticalActionButton} ${styles.viewButton}`}
                            title="Просмотреть подробнее"
                          >
                            <span className={styles.buttonIcon}>👁️</span>
                            Просмотр
                          </button>
                          <button 
                            onClick={() => handleEditCriminalDecision(decision.id)}
                            className={`${styles.verticalActionButton} ${styles.editButton}`}
                            title="Редактировать"
                          >
                            <span className={styles.buttonIcon}>✏️</span>
                            Изменить
                          </button>
                          <button 
                            onClick={() => handleDeleteCriminalDecision(decision.id)}
                            className={`${styles.verticalActionButton} ${styles.deleteButton}`}
                            title="Удалить"
                          >
                            <span className={styles.buttonIcon}>🗑️</span>
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>Решения не добавлены</p>
                  )}
                </div>
              ) : (
                // Стандартная форма решений для других категорий дел
                considered && considered.length > 0 ? (
                  <ConsideredList
                    considered={considered}
                    handleShowDetailsConsidered={handleShowDetailsConsidered}
                    handleDeleteConsidered={handleDeleteConsidered}
                    handleEditConsideredForm={handleEditConsideredForm}
                    cardId={cardId}
                    setConsidered={setConsidered}
                    router={router}
                  />
                ) : (
                  <p>Решения не добавлены</p>
                )
              )}
            </div>
          )}
          </div>
            <CardFooter
              activeTab={activeTab}
              handleAddSideToState={handleAddSideToState}
              handleAddMovementToState={handleAddMovementToState}
              handleAddPetitionToState={handleAddPetitionToState}
              handleAddConsideredToState={criminalCase ? handleAddCriminalDecisionToState : handleAddConsideredToState}
              handleRemove={handleRemove}
              handleEditToggle={handleEditToggle}
              handleShowDetails={handleShowDetails}
              isEditingCard={isEditingCard}
              cardId={card.id}
              hasCriminalCase={!!criminalCase || isCriminalCategory}
              card={card}
            />
        </>
      )}
    </div>
  );
};

export default BusinessCard;