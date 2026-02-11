import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import baseService from '../../API/baseService';
import styles from './PetitionDetail.module.css';
import PetitionService from '../../API/PetitionService';

const PetitionDetail = () => {
  const { cardId, petitionId, proceedingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Определяем, это уголовное или гражданское дело
  const isCriminal = location.pathname.includes('criminal-proceedings');
  const currentCardId = isCriminal ? proceedingId : cardId;
  
  const [petitionData, setPetitionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Списки для выбора
  const [petitionsList, setPetitionsList] = useState([]);
  const [sidesList, setSidesList] = useState([]);
  const [decisionsList, setDecisionsList] = useState([]);

  // Для отладки
  useEffect(() => {
    console.log('DEBUG - Параметры URL:', { 
      cardId, 
      petitionId,
      proceedingId,
      isCriminal,
      currentCardId,
      fullPathname: window.location.pathname 
    });
  }, [cardId, petitionId, proceedingId]);

  useEffect(() => {
    const fetchPetitionDetails = async () => {
      try {
        setLoading(true);
        
        let petitionResponse;
        let sidesListData = [];
        
        if (isCriminal) {
          // Загружаем данные уголовного ходатайства
          if (petitionId && petitionId !== 'create') {
            petitionResponse = await baseService.get(
              `/business_card/criminalproceedings/${currentCardId}/petitionsincase/${petitionId}/`
            );
          }
          
          // Загружаем стороны/обвиняемых для уголовного дела
          sidesListData = await getCriminalSides(currentCardId);
          
        } else {
          // Загружаем данные гражданского ходатайства
          petitionResponse = await baseService.get(
            `/business_card/businesscard/${currentCardId}/petitionsincase/${petitionId}/`
          );
          
          // Загружаем стороны для гражданского дела
          sidesListData = await getSidesOrDefendants(currentCardId);
        }
        
        // ПАРАЛЛЕЛЬНО загружаем общие списки для выбора
        const [
          petitionsResponse,
          decisionsResponse,
        ] = await Promise.all([
          baseService.get('/business_card/petitions/'),
          baseService.get('/business_card/decisions/'),
        ]);
        
        // Устанавливаем списки для выбора
        setPetitionsList(petitionsResponse.data || []);
        setDecisionsList(decisionsResponse.data || []);
        setSidesList(sidesListData || []);
        
        // Устанавливаем данные ходатайства
        if (petitionResponse && petitionResponse.data) {
          const data = petitionResponse.data;
          console.log('Загруженные данные ходатайства:', data);
          setPetitionData(data);
          
          // Преобразуем данные для формы
          const formDataToSet = {
            petitions_name: data.petitions_name?.[0]?.id || 
                           data.petitions_name?.[0] || 
                           data.petitions_name || '',
            notification_parties: data.notification_parties?.[0]?.id || 
                                 data.notification_parties?.[0] || 
                                 data.notification_parties || '',
            date_application: data.date_application || '',
            decision_rendered: data.decision_rendered?.[0]?.id || 
                              data.decision_rendered?.[0] || 
                              data.decision_rendered || '',
            date_decision: data.date_decision || '',
            notation: data.notation || '',
          };
          
          setFormData(formDataToSet);
        } else if (petitionId === 'create') {
          // Если создаем новое ходатайство, инициализируем пустую форму
          setPetitionData({
            id: 'new',
            date_application: new Date().toISOString().split('T')[0]
          });
          
          setFormData({
            petitions_name: '',
            notification_parties: '',
            date_application: new Date().toISOString().split('T')[0],
            decision_rendered: '',
            date_decision: '',
            notation: '',
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных ходатайства:', err);
        setError('Не удалось загрузить данные ходатайства');
        setLoading(false);
      }
    };

    fetchPetitionDetails();
  }, [currentCardId, petitionId, isCriminal]);

  // Функция для получения сторон для уголовного дела
  const getCriminalSides = async (proceedingId) => {
    try {
      // Загружаем обвиняемых
      const defendantsResponse = await baseService.get(
        `/criminal_proceedings/businesscard/${proceedingId}/defendants/`
      );
      
      // Загружаем адвокатов
      const lawyersResponse = await baseService.get(
        `/business_card/criminalproceedings/${proceedingId}/sidescaseincase/`
      );
      
      // Загружаем другие стороны
      const otherSidesResponse = await baseService.get(
        `/business_card/criminalproceedings/${proceedingId}/sidesincase/`
      );
      
      const allSides = [];
      
      // Преобразуем обвиняемых
      if (defendantsResponse.data) {
        defendantsResponse.data.forEach(defendant => {
          allSides.push({
            id: defendant.id,
            name: defendant.full_name || 'Неизвестный',
            type: 'defendant',
            full_name: defendant.full_name,
            side_case_name: defendant.side_case_name || 'Обвиняемый'
          });
        });
      }
      
      // Преобразуем адвокатов
      if (lawyersResponse.data) {
        lawyersResponse.data.forEach(lawyer => {
          allSides.push({
            id: lawyer.id,
            name: lawyer.law_firm_name || 'Адвокат',
            type: 'lawyer',
            law_firm_name: lawyer.law_firm_name,
            sides_case_name: 'Адвокат'
          });
        });
      }
      
      // Преобразуем другие стороны
      if (otherSidesResponse.data) {
        otherSidesResponse.data.forEach(side => {
          allSides.push({
            id: side.id,
            name: side.name || 'Сторона',
            type: 'side',
            sides_case_name: side.sides_case_name || 'Сторона'
          });
        });
      }
      
      console.log('Загружены стороны для уголовного дела:', allSides);
      return allSides;
      
    } catch (error) {
      console.error('Ошибка загрузки сторон уголовного дела:', error);
      return [];
    }
  };

  // Функция для получения сторон или обвиняемых для гражданского дела
  const getSidesOrDefendants = async (cardId) => {
    try {
      // Сначала пробуем загрузить стороны
      console.log('Пытаемся загрузить стороны...');
      const sidesResponse = await baseService.get(
        `/business_card/businesscard/${cardId}/sidescaseincase/`
      );
      
      if (sidesResponse.data && sidesResponse.data.length > 0) {
        console.log('Загружены стороны:', sidesResponse.data);
        return sidesResponse.data;
      }
      
      // Если сторон нет, пробуем загрузить обвиняемых
      console.log('Сторон нет, пытаемся загрузить обвиняемых...');
      const defendantsResponse = await baseService.get(
        `/criminal_proceedings/businesscard/${cardId}/defendants/`
      );
      
      if (defendantsResponse.data && defendantsResponse.data.length > 0) {
        console.log('Загружены обвиняемые:', defendantsResponse.data);
        // Преобразуем обвиняемых в формат, совместимый с отображением
        return defendantsResponse.data.map(defendant => ({
          ...defendant,
          // Добавляем поле name для совместимости
          name: defendant.full_name || 'Неизвестный',
          // Добавляем поле sides_case_name для совместимости
          sides_case_name: defendant.side_case_name || ''
        }));
      }
      
      console.log('Нет ни сторон, ни обвиняемых');
      return [];
      
    } catch (error) {
      console.error('Ошибка загрузки сторон/обвиняемых:', error);
      return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Подготовка данных для отправки
      const dataToSend = {
        petitions_name: formData.petitions_name ? [parseInt(formData.petitions_name, 10)] : [],
        notification_parties: formData.notification_parties ? [parseInt(formData.notification_parties, 10)] : [],
        date_application: formData.date_application || '',
        decision_rendered: formData.decision_rendered ? [parseInt(formData.decision_rendered, 10)] : [],
        date_decision: formData.date_decision || '',
        notation: formData.notation || '',
      };
      
      // Добавляем связь с делом
      if (isCriminal) {
        dataToSend.criminal_proceedings = parseInt(currentCardId, 10);
      } else {
        dataToSend.business_card = parseInt(currentCardId, 10);
      }
      
      console.log('Отправляемые данные:', dataToSend);
      
      let updatedData;
      
      if (isCriminal) {
        if (petitionId === 'create') {
          // Создаем новое уголовное ходатайство
          updatedData = await PetitionService.createCriminalPetition(currentCardId, dataToSend);
        } else {
          // Обновляем существующее уголовное ходатайство
          updatedData = await PetitionService.updateCriminalPetition(currentCardId, petitionId, dataToSend);
        }
      } else {
        if (petitionId === 'create') {
          // Создаем новое гражданское ходатайство
          updatedData = await baseService.post(
            `/business_card/businesscard/${currentCardId}/petitionsincase/`,
            dataToSend
          );
        } else {
          // Обновляем существующее гражданское ходатайство
          updatedData = await baseService.patch(
            `/business_card/businesscard/${currentCardId}/petitionsincase/${petitionId}/`, 
            dataToSend
          );
        }
        updatedData = updatedData.data;
      }
      
      setPetitionData(updatedData);
      
      // Обновляем formData с преобразованными данными
      const updatedFormData = {
        petitions_name: updatedData.petitions_name?.[0]?.id || 
                       updatedData.petitions_name?.[0] || 
                       updatedData.petitions_name || '',
        notification_parties: updatedData.notification_parties?.[0]?.id || 
                            updatedData.notification_parties?.[0] || 
                            updatedData.notification_parties || '',
        date_application: updatedData.date_application || '',
        decision_rendered: updatedData.decision_rendered?.[0]?.id || 
                         updatedData.decision_rendered?.[0] || 
                         updatedData.decision_rendered || '',
        date_decision: updatedData.date_decision || '',
        notation: updatedData.notation || '',
      };
      
      setFormData(updatedFormData);
      setIsEditing(false);
      setSaving(false);
      
      // Если создавали новое, перенаправляем на страницу редактирования
      if (petitionId === 'create') {
        navigate(`/criminal-proceedings/${currentCardId}/petitionsincase/${updatedData.id}`);
      }
      
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (petitionData) {
      const originalFormData = {
        petitions_name: petitionData.petitions_name?.[0]?.id || 
                       petitionData.petitions_name?.[0] || 
                       petitionData.petitions_name || '',
        notification_parties: petitionData.notification_parties?.[0]?.id || 
                            petitionData.notification_parties?.[0] || 
                            petitionData.notification_parties || '',
        date_application: petitionData.date_application || '',
        decision_rendered: petitionData.decision_rendered?.[0]?.id || 
                         petitionData.decision_rendered?.[0] || 
                         petitionData.decision_rendered || '',
        date_decision: petitionData.date_decision || '',
        notation: petitionData.notation || '',
      };
      setFormData(originalFormData);
    }
    setIsEditing(false);
    
    // Если отменяем создание, возвращаемся назад
    if (petitionId === 'create') {
      navigate(-1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const getPetitionName = () => {
    if (!petitionData?.petitions_name) return 'Не указано';
    
    if (Array.isArray(petitionData.petitions_name)) {
      if (petitionData.petitions_name[0]?.petitions) {
        return petitionData.petitions_name[0].petitions;
      }
      return petitionData.petitions_name[0] || 'Не указано';
    }
    return petitionData.petitions_name;
  };

  const getPartyName = () => {
    if (!petitionData?.notification_parties) return 'Не указана';
    
    if (Array.isArray(petitionData.notification_parties)) {
      if (petitionData.notification_parties[0]?.full_name) {
        return petitionData.notification_parties[0].full_name;
      }
      if (petitionData.notification_parties[0]?.name) {
        return petitionData.notification_parties[0].name;
      }
      return petitionData.notification_parties[0] || 'Не указана';
    }
    return petitionData.notification_parties;
  };

  const getDecisionName = () => {
    if (!petitionData?.decision_rendered) return 'Не указано';
    
    if (Array.isArray(petitionData.decision_rendered)) {
      if (petitionData.decision_rendered[0]?.decisions) {
        return petitionData.decision_rendered[0].decisions;
      }
      if (petitionData.decision_rendered[0]?.name_case) {
        return petitionData.decision_rendered[0].name_case;
      }
      return petitionData.decision_rendered[0] || 'Не указано';
    }
    return petitionData.decision_rendered;
  };

  // Функция для получения имени стороны/обвиняемого из списка
  const getSideName = (side) => {
    if (side.full_name) {
      // Это обвиняемый
      return `${side.full_name} ${side.side_case_name ? `(${side.side_case_name})` : ''}`;
    } else if (side.name) {
      // Это сторона
      return `${side.name} ${side.sides_case_name ? `(${side.sides_case_name})` : ''}`;
    } else if (side.law_firm_name) {
      // Это адвокат
      return `${side.law_firm_name} (Адвокат)`;
    }
    return 'Неизвестный';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных ходатайства...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  if (!petitionData && petitionId !== 'create') {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Данные ходатайства не найдены</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  const isCreateMode = petitionId === 'create';
  const pageTitle = isCreateMode 
    ? 'Создание ходатайства' 
    : 'Ходатайство по делу';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
          <h1 className={styles.title}>{pageTitle}</h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing && !isCreateMode ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <div className={styles.editButtons}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : isCreateMode ? 'Создать' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.formContainer}>
          {/* Основная информация */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Основная информация</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="petitions_name">Ходатайство *</label>
                {isEditing || isCreateMode ? (
                  <select
                    id="petitions_name"
                    name="petitions_name"
                    value={formData.petitions_name || ''}
                    onChange={handleInputChange}
                    className={styles.select}
                    required
                    disabled={petitionsList.length === 0}
                  >
                    <option value="">Выберите ходатайство</option>
                    {petitionsList.map((petition) => (
                      <option key={petition.id} value={petition.id}>
                        {petition.petitions || `Ходатайство ${petition.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{getPetitionName()}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="notification_parties">Сторона подавшая ходатайство *</label>
                {isEditing || isCreateMode ? (
                  <select
                    id="notification_parties"
                    name="notification_parties"
                    value={formData.notification_parties || ''}
                    onChange={handleInputChange}
                    className={styles.select}
                    required
                    disabled={sidesList.length === 0}
                  >
                    <option value="">Выберите сторону</option>
                    {sidesList.map((side) => (
                      <option key={side.id} value={side.id}>
                        {getSideName(side)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{getPartyName()}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="date_application">Дата поступления *</label>
                {isEditing || isCreateMode ? (
                  <input
                    type="date"
                    id="date_application"
                    name="date_application"
                    value={formData.date_application || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                ) : (
                  <span>{formatDate(petitionData.date_application)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Информация о решении */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Информация о решении</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="decision_rendered">Решение по ходатайству</label>
                {isEditing || isCreateMode ? (
                  <select
                    id="decision_rendered"
                    name="decision_rendered"
                    value={formData.decision_rendered || ''}
                    onChange={handleInputChange}
                    className={styles.select}
                    disabled={decisionsList.length === 0}
                  >
                    <option value="">Выберите решение</option>
                    {decisionsList.map((decision) => (
                      <option key={decision.id} value={decision.id}>
                        {decision.decisions || decision.name_case || `Решение ${decision.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{getDecisionName()}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="date_decision">Дата вынесения решения</label>
                {isEditing || isCreateMode ? (
                  <input
                    type="date"
                    id="date_decision"
                    name="date_decision"
                    value={formData.date_decision || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                ) : (
                  <span>{formatDate(petitionData.date_decision)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Примечания */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Примечания</h2>
            
            <div className={styles.field}>
              <label htmlFor="notation">Примечание</label>
              {isEditing || isCreateMode ? (
                <textarea
                  id="notation"
                  name="notation"
                  value={formData.notation || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows="4"
                  placeholder="Дополнительные примечания..."
                />
              ) : (
                <span>{petitionData.notation || 'Примечаний нет'}</span>
              )}
            </div>
          </div>

          {/* Служебная информация */}
          {!isCreateMode && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Служебная информация</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>ID ходатайства</label>
                  <span className={styles.readonly}>{petitionData.id}</span>
                </div>

                <div className={styles.field}>
                  <label>ID дела</label>
                  <span className={styles.readonly}>{currentCardId}</span>
                </div>

                <div className={styles.field}>
                  <label>Тип дела</label>
                  <span className={styles.readonly}>
                    {isCriminal ? 'Уголовное' : 'Гражданское'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetitionDetail;