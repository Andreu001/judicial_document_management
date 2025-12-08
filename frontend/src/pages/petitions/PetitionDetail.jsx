import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import baseService from '../../API/baseService';
import styles from './PetitionDetail.module.css';

const PetitionDetail = () => {
  const { cardId, petitionId } = useParams();
  const navigate = useNavigate();
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
      fullPathname: window.location.pathname 
    });
  }, [cardId, petitionId]);

  useEffect(() => {
    const fetchPetitionDetails = async () => {
      try {
        setLoading(true);
        
        // Загружаем данные ходатайства
        const petitionResponse = await baseService.get(
          `/business_card/businesscard/${cardId}/petitionsincase/${petitionId}/`
        );
        
        // ПАРАЛЛЕЛЬНО загружаем списки для выбора
        const [
          petitionsResponse,
          decisionsResponse,
          sidesResponse
        ] = await Promise.all([
          baseService.get('/business_card/petitions/'),
          baseService.get('/business_card/decisions/'),
          // Пробуем оба варианта - сначала стороны, потом обвиняемых
          getSidesOrDefendants(cardId)
        ]);
        
        // Устанавливаем списки для выбора
        setPetitionsList(petitionsResponse.data || []);
        setDecisionsList(decisionsResponse.data || []);
        setSidesList(sidesResponse || []);
        
        // Устанавливаем данные ходатайства
        if (petitionResponse.data) {
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
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных ходатайства:', err);
        setError('Не удалось загрузить данные ходатайства');
        setLoading(false);
      }
    };

    fetchPetitionDetails();
  }, [cardId, petitionId]);

  // Функция для получения сторон или обвиняемых
  const getSidesOrDefendants = async (cardId) => {
    try {
      // Сначала пробуем загрузить стороны
      console.log('Пытаемся загрузить стороны...');
      const sidesResponse = await baseService.get(
        `http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/`
      );
      
      if (sidesResponse.data && sidesResponse.data.length > 0) {
        console.log('Загружены стороны:', sidesResponse.data);
        return sidesResponse.data;
      }
      
      // Если сторон нет, пробуем загрузить обвиняемых
      console.log('Сторон нет, пытаемся загрузить обвиняемых...');
      const defendantsResponse = await baseService.get(
        `http://localhost:8000/criminal_proceedings/businesscard/${cardId}/defendants/`
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
        business_card: parseInt(cardId, 10),
      };
      
      console.log('Отправляемые данные:', dataToSend);
      
      const updatedData = await baseService.patch(
        `/business_card/businesscard/${cardId}/petitionsincase/${petitionId}/`, 
        dataToSend
      );
      
      setPetitionData(updatedData.data);
      
      // Обновляем formData с преобразованными данными
      const updatedFormData = {
        petitions_name: updatedData.data.petitions_name?.[0]?.id || 
                       updatedData.data.petitions_name?.[0] || 
                       updatedData.data.petitions_name || '',
        notification_parties: updatedData.data.notification_parties?.[0]?.id || 
                            updatedData.data.notification_parties?.[0] || 
                            updatedData.data.notification_parties || '',
        date_application: updatedData.data.date_application || '',
        decision_rendered: updatedData.data.decision_rendered?.[0]?.id || 
                         updatedData.data.decision_rendered?.[0] || 
                         updatedData.data.decision_rendered || '',
        date_decision: updatedData.data.date_decision || '',
        notation: updatedData.data.notation || '',
      };
      
      setFormData(updatedFormData);
      setIsEditing(false);
      setSaving(false);
      
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

  if (!petitionData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Данные ходатайства не найдены</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
          <h1 className={styles.title}>Ходатайство по делу</h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <div className={styles.editButtons}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
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
                {isEditing ? (
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
                {isEditing ? (
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
                {isEditing ? (
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
                {isEditing ? (
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
                {isEditing ? (
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
              {isEditing ? (
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
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Служебная информация</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>ID ходатайства</label>
                <span className={styles.readonly}>{petitionData.id}</span>
              </div>

              <div className={styles.field}>
                <label>ID карточки дела</label>
                <span className={styles.readonly}>{cardId}</span>
              </div>

              {petitionData.business_card && (
                <div className={styles.field}>
                  <label>Номер дела</label>
                  <span className={styles.readonly}>{petitionData.business_card.original_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetitionDetail;