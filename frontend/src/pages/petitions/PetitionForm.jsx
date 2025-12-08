import React, { useState, useEffect } from 'react';
import MyInput from '../../components/UI/input/MyInput';
import { updatedPetition } from '../../API/PetitionService';
import baseService from '../../API/baseService';
import styles from './PetitionForm.module.css';

const PetitionForm = ({ create, editPetitionData = {}, onSave, onCancel, cardId, isCriminalCase = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPetitionId, setEditingPetitionId] = useState(null);
  const [petitionsCaseList, setPetitionCaseList] = useState([]);
  const [sidesCaseList, setSidesCaseList] = useState([]);
  const [decisionsList, setDecisionsList] = useState([]);
  const [defendantsList, setDefendantsList] = useState([]); // Новое состояние для обвиняемых
  const [loading, setLoading] = useState(true);

  const [petition, setPetition] = useState({
    petitions_name: '',
    notification_parties: '',
    date_application: '',
    decision_rendered: '',
    date_decision: '',
    notation: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загрузка списка ходатайств
        const petitionsResponse = await baseService.get('http://localhost:8000/business_card/petitions/');
        setPetitionCaseList(petitionsResponse.data || []);
        
        // Загрузка списка решений
        const decisionsResponse = await baseService.get('http://localhost:8000/business_card/decisions/');
        setDecisionsList(decisionsResponse.data || []);
        
        // Определяем, какие данные загружать в зависимости от типа дела
        if (isCriminalCase) {
          // Для уголовных дел загружаем обвиняемых
          const defendantsResponse = await baseService.get(`http://localhost:8000/criminal_proceedings/businesscard/${cardId}/defendants/`);
          console.log('Обвиняемые:', defendantsResponse.data);
          setDefendantsList(defendantsResponse.data || []);
          setSidesCaseList([]); // Очищаем список сторон для обычных дел
        } else {
          // Для обычных дел загружаем стороны
          const sidesResponse = await baseService.get(`http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/`);
          console.log('Стороны:', sidesResponse.data);
          setSidesCaseList(sidesResponse.data || []);
          setDefendantsList([]); // Очищаем список обвиняемых
        }
        
        // Если редактируем, заполняем форму данными
        if (editPetitionData && editPetitionData.id) {
          setIsEditing(true);
          setEditingPetitionId(editPetitionData.id);
          
          // Преобразуем данные для формы
          const petitionData = {
            petitions_name: editPetitionData.petitions_name?.[0]?.id || 
                          editPetitionData.petitions_name?.[0] || 
                          editPetitionData.petitions_name || '',
            notification_parties: editPetitionData.notification_parties?.[0]?.id || 
                                editPetitionData.notification_parties?.[0] || 
                                editPetitionData.notification_parties || '',
            date_application: editPetitionData.date_application || '',
            decision_rendered: editPetitionData.decision_rendered?.[0]?.id || 
                             editPetitionData.decision_rendered?.[0] || 
                             editPetitionData.decision_rendered || '',
            date_decision: editPetitionData.date_decision || '',
            notation: editPetitionData.notation || '',
          };
          
          setPetition(petitionData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки данных для формы:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [editPetitionData, cardId, isCriminalCase]);

  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setPetition((prevPetition) => ({
      ...prevPetition,
      [name]: value,
    }));
  };

  const formatDate = (date) => {
    if (!date) return '';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '';
    return parsedDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Подготавливаем данные для отправки
    const petitionData = {
      petitions_name: petition.petitions_name ? [parseInt(petition.petitions_name, 10)] : [],
      notification_parties: petition.notification_parties ? [parseInt(petition.notification_parties, 10)] : [],
      date_application: formatDate(petition.date_application),
      decision_rendered: petition.decision_rendered ? [parseInt(petition.decision_rendered, 10)] : [],
      date_decision: petition.date_decision ? formatDate(petition.date_decision) : null, // Исправлено здесь
      notation: petition.notation || '',
      business_card: parseInt(cardId, 10),
    };
    
    console.log('Отправляемые данные ходатайства:', petitionData);
    
    try {
      if (isEditing && editingPetitionId) {
        // Редактирование существующего ходатайства
        const updated = await updatedPetition(cardId, editingPetitionId, petitionData);
        onSave(updated.data);
      } else {
        // Создание нового ходатайства
        const response = await baseService.post(
          `http://localhost:8000/business_card/businesscard/${cardId}/petitionsincase/`,
          petitionData
        );
        
        if (create) {
          create(response.data);
        } else {
          onSave(response.data);
        }
      }
      
      // Закрываем форму
      onCancel();
      
    } catch (error) {
      console.error('Ошибка сохранения ходатайства:', error);
      console.error('Детали ошибки:', error.response?.data || error.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.petitionFormOverlay}>
        <div className={styles.petitionForm}>
          <div className={styles.loading}>Загрузка данных...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.petitionFormOverlay} onClick={(e) => {
      if (e.target.classList.contains(styles.petitionFormOverlay)) {
        handleCancel();
      }
    }}>
      <div className={styles.petitionForm} onClick={(e) => e.stopPropagation()}>
        <h4>
          {isEditing ? 'Редактировать ходатайство' : 'Добавить ходатайство'}
          <button 
            type="button" 
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Закрыть"
          >
            ×
          </button>
        </h4>
        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Ходатайство *</label>
              <select
                name="petitions_name"
                value={petition.petitions_name || ''}
                onChange={handleChange}
                required
                disabled={petitionsCaseList.length === 0}
              >
                <option value="">Выберите ходатайство</option>
                {petitionsCaseList.map((petitionCase) => (
                  <option key={petitionCase.id} value={petitionCase.id}>
                    {petitionCase.petitions || `Ходатайство ${petitionCase.id}`}
                  </option>
                ))}
              </select>
              {petitionsCaseList.length === 0 && (
                <small className={styles.errorText}>Нет доступных ходатайств</small>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label>Сторона подавшая ходатайство *</label>
              {isCriminalCase ? (
                // Для уголовных дел показываем обвиняемых
                <select
                  name="notification_parties"
                  value={petition.notification_parties || ''}
                  onChange={handleChange}
                  required
                  disabled={defendantsList.length === 0}
                >
                  <option value="">Выберите обвиняемого</option>
                  {defendantsList.map((defendant) => (
                    <option key={defendant.id} value={defendant.id}>
                      {defendant.full_name} {defendant.side_case_name ? `(${defendant.side_case_name})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                // Для обычных дел показываем стороны
                <select
                  name="notification_parties"
                  value={petition.notification_parties || ''}
                  onChange={handleChange}
                  required
                  disabled={sidesCaseList.length === 0}
                >
                  <option value="">Выберите сторону</option>
                  {sidesCaseList.map((side) => (
                    <option key={side.id} value={side.id}>
                      {side.name} {side.sides_case_name ? `(${side.sides_case_name})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {(isCriminalCase ? defendantsList.length === 0 : sidesCaseList.length === 0) && (
                <small className={styles.errorText}>Нет доступных сторон</small>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Дата поступления *</label>
              <MyInput
                type="date"
                name="date_application"
                value={petition.date_application || ''}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Решение по ходатайству</label>
              <select 
                name="decision_rendered" 
                value={petition.decision_rendered || ''} 
                onChange={handleChange}
                disabled={decisionsList.length === 0}
              >
                <option value="">Выберите решение</option>
                {decisionsList.map((decision) => (
                  <option key={decision.id} value={decision.id}>
                    {decision.decisions || decision.name_case || `Решение ${decision.id}`}
                  </option>
                ))}
              </select>
              {decisionsList.length === 0 && (
                <small className={styles.errorText}>Нет доступных решений</small>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Дата рассмотрения ходатайства</label>
              <MyInput
                type="date"
                name="date_decision"
                value={petition.date_decision || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Примечание</label>
            <textarea
              name="notation"
              value={petition.notation || ''}
              onChange={handleChange}
              placeholder="Дополнительные примечания..."
              rows="3"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {isEditing ? 'Сохранить изменения' : 'Сохранить'}
            </button>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PetitionForm;