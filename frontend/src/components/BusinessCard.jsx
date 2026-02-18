import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardService from '../API/CardService';
import PetitionService from '../API/PetitionService';
import { updateCard } from '../API/CardService';
import CardNavbar from './UI/CardNavbar/CardNavbar';
import CardHeader from './CardHeader';
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
import baseService from '../API/baseService';
import CriminalDecisionDetail from './CriminalCase/CriminalDecisionDetail';
import CaseRegistryService from '../API/CaseRegistryService';
import CivilCaseService from '../API/CivilCaseService';

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
  const isCriminalCategory = card.case_category;
  const [criminalDecisions, setCriminalDecisions] = useState([]);
  const [isEditingCriminalDecision, setIsEditingCriminalDecision] = useState(false);
  const [editedCriminalDecisionData, setEditedCriminalDecisionData] = useState({});
  const [editedCriminalDecisionId, setEditedCriminalDecisionId] = useState(null);
  const [registeredCase, setRegisteredCase] = useState(null);
  const [civilCase, setCivilCase] = useState(null);
  const [showCriminalSideForm, setShowCriminalSideForm] = useState(false);
  const [isEditingCriminalSide, setIsEditingCriminalSide] = useState(false);
  const [editedCriminalSideData, setEditedCriminalSideData] = useState({});
  const [editedCriminalSideId, setEditedCriminalSideId] = useState(null);
  const [criminalSides, setCriminalSides] = useState([]);
  const isCriminalCard = card.case_category && card.case_category === 4;

  const handleAddCriminalDecisionToState = () => {
    console.log("Adding criminal decision to state");
    setIsEditingCriminalDecision(false);
    setEditedCriminalDecisionData({});
  };

  const handleShowDetails = () => {
    const categoryId = card.case_category;
    
    switch(categoryId) {
      case 1: // Административное судопроизводство
        router(`/businesscard/${cardId}/administrative-details`);
        break;
      case 2: // Административное правнарушение
        router(`/businesscard/${cardId}/administrative-offense-details`);
        break;
      case 3: // Гражданское судопроизводство
        router(`/businesscard/${cardId}/civil-details`);
        break;
      case 4: // Уголовное судопроизводство
        // Проверяем, есть ли уже уголовное производство
        if (criminalCase && criminalCase.id) {
          router(`/criminal-proceedings/${criminalCase.id}`);
        } else {
          // Перенаправляем на страницу создания уголовного производства
          router(`/criminal-proceedings/create?card_id=${cardId}`);
        }
      break;
      default:
        router(`/cards/${cardId}`);
    }
  };

  const handleShowSideDetails = (sideId, sideTypes) => {
      console.log('Opening side details:', { sideId, sideTypes, cardId, isCriminalCard });

        if (isCriminalCard) {
          router(`/criminal-proceedings/${criminalCase?.id}/sides/${sideId}`);
          return;
  }
      
      const selectedSide = sides.find(s => s.id === sideId);
      console.log('Selected side:', selectedSide);
      if (card.case_category) {
        // Для уголовного дела ищем сторону в criminalSides
        const criminalSide = criminalSides.find(s => s.id === sideId);
        if (criminalSide) {
          // Переходим на детальную страницу стороны уголовного производства
          router(`/businesscard/${cardId}/criminal-sides/${sideId}`);
          return;
        }
      }
      
      if (!selectedSide) {
          console.error('Side not found');
          return;
      }

      // Проверяем, является ли сторона адвокатом/защитником
      const isLawyer = selectedSide?.sides_case_name?.some(name => 
          name.toLowerCase().includes('адвокат') || 
          name.toLowerCase().includes('защитник')
      );
      
      // Проверяем, является ли сторона обвиняемым/осужденным/подозреваемым/подсудимым
      // Используем sides_case_name для проверки
      const isDefendant = selectedSide?.sides_case_name?.some(name => {
          const lowerName = name.toLowerCase();
          return lowerName.includes('обвиняемый') || 
                lowerName.includes('осужденный') || 
                lowerName.includes('подозреваемый') || 
                lowerName.includes('подсудимый');
      });
      
      const lawyerId = selectedSide?.lawyer_id;
      
      console.log('Is lawyer?', isLawyer);
      console.log('Is defendant?', isDefendant);
      console.log('Lawyer ID:', lawyerId);
      console.log('Selected side name:', selectedSide?.name);
      console.log('All defendants:', defendants);
      console.log('Selected side sides_case_name:', selectedSide?.sides_case_name);

      if (isDefendant) {
          console.log('This is a defendant side, looking for defendant record');

          const defendant = defendants.find(def => {
              // Проверяем соответствие по имени
              const sideNameMatch = def.name === selectedSide.name;
              
              // Проверяем соответствие по ID стороны
              const sideIdMatch = def.sides_case_person === selectedSide.id;
              
              console.log('Comparing defendant:', {
                  defendantName: def.name,
                  sideName: selectedSide.name,
                  sideNameMatch,
                  defSideCasePerson: def.sides_case_person,
                  sideId: selectedSide.id,
                  sideIdMatch
              });
              
              return sideNameMatch || sideIdMatch;
          });
          
          if (defendant) {
              console.log('Found defendant record, navigating to defendant page:', defendant.id);
              router(`/businesscard/${cardId}/defendants/${defendant.id}`);
          } else {
              console.log('No defendant record found, creating one automatically');

              const createDefendantAndRedirect = async () => {
                  try {
                      // Находим ID стороны дела для обвиняемого
                      let sideCaseId = null;
                      
                      // Проверяем sides_case (может быть массивом объектов или массивом ID)
                      if (selectedSide.sides_case && Array.isArray(selectedSide.sides_case)) {
                          // Если это массив объектов
                          if (selectedSide.sides_case.length > 0 && typeof selectedSide.sides_case[0] === 'object') {
                              // Ищем среди объектов side с нужным названием
                              const defendantSide = selectedSide.sides_case.find(sc => {
                                  const lowerName = sc.sides_case?.toLowerCase() || '';
                                  return lowerName.includes('обвиняемый') || 
                                        lowerName.includes('осужденный') || 
                                        lowerName.includes('подозреваемый') || 
                                        lowerName.includes('подсудимый');
                              });
                              sideCaseId = defendantSide?.id;
                          } else {
                              // Если это массив ID, берем первый
                              sideCaseId = selectedSide.sides_case[0];
                          }
                      }
                      
                      if (!sideCaseId) {
                          console.error('No valid side case ID found, redirecting to side page');
                          router(`/businesscard/${cardId}/sides/${sideId}`);
                          return;
                      }
                      
                      const defendantData = {
                          name: selectedSide.name,
                          sides_case: [sideCaseId],
                          address: selectedSide.address || '',
                          birth_date: selectedSide.birth_date || null,
                          phone: selectedSide.phone || '',
                          status: selectedSide.status || 'individual'
                      };
                      
                      console.log('Creating defendant with data:', defendantData);

                      const newDefendant = await CriminalCaseService.createDefendant(cardId, defendantData);
                      
                      console.log('Defendant created:', newDefendant);

                      // Обновляем список обвиняемых
                      const updatedDefendants = await CriminalCaseService.getDefendants(cardId);
                      setDefendants(updatedDefendants);

                      router(`/businesscard/${cardId}/defendants/${newDefendant.id}`);
                      
                  } catch (error) {
                      console.error('Error creating defendant:', error);
                      router(`/businesscard/${cardId}/sides/${sideId}`);
                  }
              };

              createDefendantAndRedirect();
          }
      } 
      else if (isLawyer && lawyerId) {
          console.log('Navigating to lawyer page with ID:', lawyerId);
          router(`/business_card/businesscard/${cardId}/lawyers/${lawyerId}`);
      } 
      else if (isLawyer && !lawyerId) {
          console.log('Side is lawyer but lawyer record not found, redirecting to side page');
          router(`/businesscard/${cardId}/sides/${sideId}`);
      } 
      else {
          console.log('Navigating to standard side page');
          router(`/businesscard/${cardId}/sides/${sideId}`);
      }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
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
      if (criminalCase && criminalCase.id) {
        try {
          const decisionsData = await CriminalCaseService.getDecisions(criminalCase.id);
          setCriminalDecisions(decisionsData || []);
        } catch (error) {
          console.error('Ошибка загрузки уголовных решений:', error);
          setCriminalDecisions([]);
        }
      }
    };
    
    if (criminalCase) {
      loadCriminalDecisions();
    }
  }, [criminalCase]);

  const handleEditPetition = (
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
          setShowPetitionForm(true); // Добавляем эту строку
        } catch (error) {
          console.error('Ошибка загрузки ходатайства для редактирования:', error);
        }
      };
      
      fetchPetitionData();
  };


  const handleEditCriminalDecision = (decisionId) => {
    const decision = criminalDecisions.find(d => d.id === decisionId);
    setEditedCriminalDecisionData({ ...decision });
    setEditedCriminalDecisionId(decisionId);
    setIsEditingCriminalDecision(true);
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
    const loadCivilCase = async () => {
      if (card.case_category) {
        try {
          const civilData = await CivilCaseService.getByBusinessCardId(cardId);
          setCivilCase(civilData);
        } catch (error) {
          console.error('Ошибка загрузки гражданского дела:', error);
          setCivilCase(null);
        }
      }
    };
    
    if (cardId) {
      loadCivilCase();
    }
  }, [cardId, card.case_category]);

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

  useEffect(() => {
    // Загружаем стороны ТОЛЬКО для не-уголовных карточек
    if (!isCriminalCard) {
      SideService.getAllSide(cardId)
        .then((response) => {
          if (Array.isArray(response.data)) {
            setSide(response.data);
          } else {
            console.error('Неверный тип данных в ответе:', response.data);
          }
        })
        .catch((error) => {
          // Игнорируем ошибку 404 для уголовных карточек
          if (!isCriminalCard) {
            console.error('Ошибка при загрузке сторон:', error);
          }
        });
    }
  }, [cardId, isCriminalCard]);

  useEffect(() => {
    // Загружаем движение дела
    if (!isCriminalCard) {
      MovementService.getAllMove(cardId)
        .then((response) => {
          if (Array.isArray(response.data)) {
            setMovements(response.data);
          } else {
            console.error('Неверный тип данных в ответе:', response.data);
          }
        })
        .catch((error) => {
          if (!isCriminalCard) {
            console.error('Ошибка при загрузке движения дела:', error);
          }
        });
    }
  }, [cardId, isCriminalCard]);

  useEffect(() => {
    // Загружаем ходатайства
    if (!isCriminalCard) {
      const fetchPetitions = async () => {
        try {
          const response = await PetitionService.getAllPetitions(cardId);
          if (Array.isArray(response.data)) {
            setPetitions(response.data);
          } else {
            console.error("Неверный формат данных ходатайств:", response.data);
          }
        } catch (error) {
          if (!isCriminalCard) {
            console.error("Ошибка при загрузке ходатайств:", error);
          }
        }
      };
    
      if (cardId) {
        fetchPetitions();
      }
    }
  }, [cardId, isCriminalCard]);

  useEffect(() => {
    // Загружаем решения (considered)
    if (!isCriminalCard) {
      ConsideredService.getAllConsidereds(cardId)
        .then((response) => {
          if (Array.isArray(response.data)) {
            setConsidered(response.data);
          } else {
            console.error('Неверный тип данных в ответе:', response.data);
          }
        })
        .catch((error) => {
          if (!isCriminalCard) {
            console.error('Ошибка при загрузке решений:', error);
          }
        });
    }
  }, [cardId, isCriminalCard]);

  useEffect(() => {
    const loadCriminalCase = async () => {
      if (isCriminalCard) {
        try {
          // Используем новый метод для поиска по ID карточки
          const criminalProceeding = await CriminalCaseService.getCriminalProceedingsByCardId(cardId);
          
          if (criminalProceeding) {
            setCriminalCase(criminalProceeding);
            const defendantsData = await CriminalCaseService.getDefendants(criminalProceeding.id);
            setDefendants(defendantsData);
          } else {
            console.warn('Уголовное дело не найдено для карточки:', cardId);
          }
        } catch (error) {
          console.error('Ошибка загрузки уголовного дела:', error);
        }
      }
    };
    
    if (cardId && isCriminalCard) {
      loadCriminalCase();
    }
  }, [cardId, isCriminalCard]);

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
    setEditedMoveData({}); // Очищаем данные для редактирования
    setEditedMoveId(null); // Сбрасываем ID редактирования
    setShowMovementForm(true);
  };

  const handleAddPetitionToState = () => {
    console.log('Добавление ходатайства');
    setShowPetitionForm(true);
    setIsEditingPetition(true);
    setEditedPetitionData({});
    setEditedPetitionId(null);
  };

  const handleEditMoveForm = (moveId) => {
    // Находим движение по ID
    const editedMove = movements.find((move) => move.id === moveId);
    
    // Устанавливаем данные для редактирования
    setEditedMoveData(editedMove);
    setEditedMoveId(moveId); // Сохраняем ID для обновления
    setShowMovementForm(true); // Показываем форму
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
      
      // Проверяем, есть ли связанное уголовное дело
      if (criminalCase && criminalCase.id) {
        // Спрашиваем подтверждение для удаления уголовного дела
        const confirmDelete = window.confirm(
          'Это уголовное дело. Удалить его из системы? Это действие удалит как карточку, так и уголовное производство.'
        );
        
        if (confirmDelete) {
          try {
            // Сначала удаляем уголовное дело
            await CriminalCaseService.deleteCriminalProceedings(criminalCase.id);
            console.log('Уголовное производство удалено:', criminalCase.id);
          } catch (criminalError) {
            console.error('Ошибка удаления уголовного производства:', criminalError);
            // Можем продолжить или спросить пользователя
            if (!window.confirm('Не удалось удалить уголовное производство. Удалить только карточку?')) {
              return; // Отмена удаления
            }
          }
        } else {
          return; // Пользователь отменил удаление
        }
      }
      
      // Удаляем карточку
      await props.remove(cardId);
      console.log('Карточка удалена:', cardId);
      
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

const handleAddSideToState = (e) => {
  e.preventDefault();
  
  // Проверяем, является ли дело уголовным
  if (card.case_category && criminalCase) {
    // Для уголовного дела - показываем форму сторон уголовного производства
    setShowCriminalSideForm(true);
    setIsEditingCriminalSide(false);
    setEditedCriminalSideData({});
  } else {
    // Для других категорий дел - стандартная форма стороны
    setEditedSideData({});
    setEditedSideId(null);
    setShowSideForm(true);
  }
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
          create={createPetition}
          editPetitionData={editedPetitionData}
          onSave={async (savedPetition) => {
            // Обновляем список ходатайств
            try {
              const response = await PetitionService.getAllPetitions(cardId);
              if (Array.isArray(response.data)) {
                setPetitions(response.data);
              }
            } catch (error) {
              console.error("Ошибка обновления списка ходатайств:", error);
            }
            
            // Скрываем форму
            setShowPetitionForm(false);
            setIsEditingPetition(false);
            setEditedPetitionId(null);
            setEditedPetitionData({});
          }}
          onCancel={() => {
            setShowPetitionForm(false);
            setIsEditingPetition(false);
            setEditedPetitionId(null);
            setEditedPetitionData({});
          }}
          cardId={cardId}
          isCriminalCase={!!criminalCase}
        />
      ) : null}

      {showMovementForm && activeTab === 2 ? (
        <MovementForm
          create={createMove}
          editMovementData={editedMoveData} // Передаем данные для редактирования
          onSave={async (newMove) => {
            if (editedMoveId) {
              // Обновляем существующее движение
              const updatedMove = await MovementForm.updateMove(cardId, editedMoveId, newMove);
              // Обновляем состояние
              setMovements(movements.map(move => 
                move.id === editedMoveId ? updatedMove : move
              ));
            } else {
              // Создаем новое движение
              await createMove(newMove);
            }
            // Сбрасываем состояние
            setShowMovementForm(false);
            setEditedMoveData({});
            setEditedMoveId(null);
          }}
          onCancel={() => {
            setShowMovementForm(false);
            setEditedMoveData({});
            setEditedMoveId(null);
          }}
          cardId={cardId}
        />
      ) : null}

      {(showSideForm) && (
        <div className={styles.formOverlay}>
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
        <CardHeader card={props.card} />
          <div className={styles.cardContent}>
            <CardNavbar onTabChange={handleTabChange} />
              {activeTab === 0 && (
                <div>
                  <div>Пользователь: {authorName || 'Не указан'}</div>
                  <div>Дата создания: {formatDateTime(props.card.pub_date)}</div>
                  <div>Дата редактирования: {formatDateTime(props.card.updated_at)}</div>
                </div>
              )}

          {activeTab === 1 && sides ? (
            <SidesList
              sides={sides}
              handleShowSideDetails={handleShowSideDetails}
              handleDeleteSide={handleDeleteSide}
              handleEditSideForm={handleEditSideForm}
              cardId={cardId}
              setSide={setSide}
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
              setIsEditingMove={setIsEditingMove}
              setEditedMoveData={setEditedMoveData}
            />
          ) : null}

          {activeTab === 3 && petitions ? (
            <PetitionList
              petitions={petitions}
              handleShowDetailsPetition={handleShowDetailsPetition}
              handleDeletePetition={handleDeletePetition}
              handleEditPetition={(petitionId) => handleEditPetition(
                petitionId, 
                cardId, // Передаем cardId
                setPetitions, 
                setIsEditingPetition, 
                setEditedPetitionData
              )}
              cardId={cardId}
              setPetitions={setPetitions}
              setIsEditingPetition={setIsEditingPetition}
              setEditedPetitionData={setEditedPetitionData}
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
                            <div className={styles.infoLabel}><strong>Решение: {decision.name_case || 'Не указано'}</strong></div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Дата рассмотрения:</div>
                            <div className={styles.infoValue}>{formatDate(decision.court_consideration_date) || 'Не указана'}</div>
                          </div>
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
              card={card}
            />
    </div>
  );
};

export default BusinessCard;