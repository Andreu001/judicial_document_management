import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PetitionDetail.module.css';
import PetitionService from '../../API/PetitionService';

const PetitionDetail = () => {
  const { proceedingId, petitionId } = useParams();
  const navigate = useNavigate();
  
  const [petitionData, setPetitionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [petitionTypes, setPetitionTypes] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [sides, setSides] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [petitioners, setPetitioners] = useState([]);

  const isCreateMode = petitionId === 'create' || petitionId === undefined;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!proceedingId) {
          console.error('proceedingId отсутствует');
          setError('ID дела не указан');
          setLoading(false);
          return;
        }
        
        const [
          petitionTypesData,
          decisionsData,
          sidesData,
          lawyersData
        ] = await Promise.all([
          PetitionService.getPetitionTypes(),
          PetitionService.getDecisions(),
          PetitionService.getSides(proceedingId),
          PetitionService.getLawyers(proceedingId)
        ]);
        
        console.log('Загруженные данные:', {
          petitionTypes: petitionTypesData?.length,
          decisions: decisionsData?.length,
          sides: sidesData?.length,
          lawyers: lawyersData?.length
        });
        
        setPetitionTypes(petitionTypesData || []);
        setDecisions(decisionsData || []);
        setSides(sidesData || []);
        setLawyers(lawyersData || []);
        
        // Формируем список заявителей
        const allPetitioners = [];
        
        sidesData.forEach(side => {
          const sideDetail = side.sides_case_incase_detail || {};
          allPetitioners.push({
            id: side.id,
            name: sideDetail.name || 'Сторона по делу',
            role: side.sides_case_role_detail?.name || 'Сторона',
            type: 'civil_sides',
            typeLabel: 'Сторона',
            detail: sideDetail
          });
        });
        
        lawyersData.forEach(lawyer => {
          const lawyerDetail = lawyer.lawyer_detail || {};
          allPetitioners.push({
            id: lawyer.id,
            name: lawyerDetail.law_firm_name || 'Адвокат',
            role: lawyer.sides_case_role_detail?.name || 'Представитель',
            type: 'civil_lawyer',
            typeLabel: 'Адвокат',
            detail: lawyerDetail
          });
        });
        
        setPetitioners(allPetitioners);
        
        // Загружаем данные ходатайства только если это не режим создания
        if (!isCreateMode && petitionId && petitionId !== 'create') {
          try {
            const petition = await PetitionService.getPetition(proceedingId, petitionId);
            setPetitionData(petition);
            
            const petitionDetail = petition.petitions_incase_detail || {};
            const petitionerInfo = petition.petitioner_info || {};
            
            setFormData({
              petitions_name: petitionDetail.petitions_name?.[0]?.id || '',
              petitioner_type: petitionerInfo.type || '',
              petitioner_id: petitionerInfo.id || '',
              date_application: petitionDetail.date_application || '',
              decision_rendered: petitionDetail.decision_rendered?.[0]?.id || '',
              date_decision: petitionDetail.date_decision || '',
              notation: petitionDetail.notation || ''
            });
          } catch (err) {
            console.error('Ошибка загрузки ходатайства:', err);
            setError(`Не удалось загрузить ходатайство: ${err.message}`);
          }
        } else {
          // Режим создания - устанавливаем начальные значения формы
          setFormData({
            petitions_name: '',
            petitioner_type: '',
            petitioner_id: '',
            date_application: new Date().toISOString().split('T')[0],
            decision_rendered: '',
            date_decision: '',
            notation: ''
          });
          setIsEditing(true); // Сразу включаем режим редактирования при создании
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError(`Не удалось загрузить данные: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [proceedingId, petitionId, isCreateMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePetitionerChange = (e) => {
    const { value } = e.target;
    if (!value) {
      setFormData(prev => ({
        ...prev,
        petitioner_type: '',
        petitioner_id: ''
      }));
      return;
    }
    
    const [type, id] = value.split(':');
    
    setFormData(prev => ({
      ...prev,
      petitioner_type: type,
      petitioner_id: id ? parseInt(id, 10) : ''
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Валидация обязательных полей
      if (!formData.petitions_name) {
        alert('Выберите тип ходатайства');
        setSaving(false);
        return;
      }
      
      if (!formData.petitioner_type || !formData.petitioner_id) {
        alert('Выберите заявителя');
        setSaving(false);
        return;
      }
      
      if (!formData.date_application) {
        alert('Укажите дату подачи ходатайства');
        setSaving(false);
        return;
      }
      
      // ИСПРАВЛЕНИЕ: Проверяем формат, который ожидает сервер
      // Судя по ошибке, сервер ожидает что-то другое для decision_rendered
      const dataToSend = {
        petitions_name: formData.petitions_name ? [parseInt(formData.petitions_name)] : [],
        petitioner_type: formData.petitioner_type,
        petitioner_id: formData.petitioner_id,
        date_application: formData.date_application,
        // ИСПРАВЛЕНИЕ: Возможно, сервер ожидает ID напрямую, а не массив
        decision_rendered: formData.decision_rendered ? parseInt(formData.decision_rendered) : null,
        date_decision: formData.date_decision || null,
        notation: formData.notation || ''
      };
      
      console.log('Отправляемые данные:', dataToSend);
      
      let response;
      
      if (isCreateMode) {
        response = await PetitionService.createPetition(proceedingId, dataToSend);
        
        if (response && response.id) {
          navigate(`/civil-proceedings/${proceedingId}/petitions/${response.id}`);
        } else {
          navigate(`/civil-proceedings/${proceedingId}`);
        }
      } else {
        console.log('Обновление существующего ходатайства с ID:', petitionId);
        
        if (!petitionId) {
          throw new Error('Не указан ID ходатайства для обновления');
        }
        
        response = await PetitionService.updatePetition(proceedingId, petitionId, dataToSend);
        console.log('Ходатайство обновлено:', response);
        
        const updatedPetition = await PetitionService.getPetition(proceedingId, petitionId);
        setPetitionData(updatedPetition);
        setIsEditing(false);
      }
      
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      
      if (err.response) {
        console.error('Детали ошибки:', err.response.data);
        
        // Показываем более понятное сообщение об ошибке
        let errorMessage = 'Не удалось сохранить данные: ';
        if (err.response.data) {
          if (typeof err.response.data === 'object') {
            // Форматируем ошибки от сервера
            const errors = Object.entries(err.response.data)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            errorMessage += errors;
          } else {
            errorMessage += err.response.data;
          }
        } else {
          errorMessage += err.response.status;
        }
        
        setError(errorMessage);
      } else if (err.request) {
        setError('Не удалось получить ответ от сервера');
      } else {
        setError(`Не удалось сохранить данные: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate(-1);
    } else {
      setIsEditing(false);
      if (petitionData) {
        const petitionDetail = petitionData.petitions_incase_detail || {};
        const petitionerInfo = petitionData.petitioner_info || {};
        
        setFormData({
          petitions_name: petitionDetail.petitions_name?.[0]?.id || '',
          petitioner_type: petitionerInfo.type || '',
          petitioner_id: petitionerInfo.id || '',
          date_application: petitionDetail.date_application || '',
          decision_rendered: petitionDetail.decision_rendered?.[0]?.id || '',
          date_decision: petitionDetail.date_decision || '',
          notation: petitionDetail.notation || ''
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!petitionId || petitionId === 'create') return;
    
    if (window.confirm('Вы уверены, что хотите удалить ходатайство?')) {
      try {
        await PetitionService.deletePetition(proceedingId, petitionId);
        navigate(`/civil-proceedings/${proceedingId}`);
      } catch (err) {
        console.error('Ошибка удаления:', err);
        alert(`Не удалось удалить ходатайство: ${err.message}`);
      }
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
    if (!petitionData?.petitions_incase_detail?.petitions_name?.[0]) return 'Не указано';
    return petitionData.petitions_incase_detail.petitions_name[0].name || 'Не указано';
  };

  const getPetitionerName = () => {
    const petitionerInfo = petitionData?.petitioner_info;
    if (!petitionerInfo) return 'Не указан';
    return `${petitionerInfo.name} (${petitionerInfo.role})`;
  };

  const getDecisionName = () => {
    if (!petitionData?.petitions_incase_detail?.decision_rendered?.[0]) return 'Не указано';
    return petitionData.petitions_incase_detail.decision_rendered[0].name_case || 'Не указано';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Загрузка данных ходатайства...</p>
          <p>ID дела: {proceedingId}</p>
          <p>ID ходатайства: {petitionId}</p>
        </div>
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
          {!isCreateMode && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                Редактировать
              </button>
            </>
          )}
          {(isEditing || isCreateMode) && (
            <>
              <button 
                onClick={handleSave} 
                className={styles.saveButton} 
                disabled={saving}
              >
                {saving ? 'Сохранение...' : isCreateMode ? 'Создать' : 'Сохранить'} {/* ИСПРАВЛЕНО */}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'main' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('main')}
              >
                Основная информация
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'decision' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('decision')}
              >
                Информация о решении
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              <form onSubmit={(e) => e.preventDefault()}>
                {activeTab === 'main' && (
                  <div className={styles.tabContent}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Тип ходатайства</h3>
                      <div className={styles.field}>
                        <label>Тип ходатайства *</label>
                        {(isEditing || isCreateMode) ? (
                          <select
                            name="petitions_name"
                            value={formData.petitions_name || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                            required
                          >
                            <option value="">Выберите тип ходатайства</option>
                            {petitionTypes.length > 0 ? (
                              petitionTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.petitions || `Ходатайство ${type.id}`}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>Загрузка типов...</option>
                            )}
                          </select>
                        ) : (
                          <span>{getPetitionName()}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Заявитель</h3>
                      <div className={styles.field}>
                        <label>Заявитель *</label>
                        {(isEditing || isCreateMode) ? (
                          <select
                            name="petitioner"
                            value={formData.petitioner_type && formData.petitioner_id ? 
                                   `${formData.petitioner_type}:${formData.petitioner_id}` : ''}
                            onChange={handlePetitionerChange}
                            className={styles.select}
                            required
                          >
                            <option value="">Выберите заявителя</option>
                            {petitioners.filter(p => p.type === 'civil_sides').length > 0 && (
                              <optgroup label="Стороны">
                                {petitioners
                                  .filter(p => p.type === 'civil_sides')
                                  .map(p => (
                                    <option key={`side-${p.id}`} value={`${p.type}:${p.id}`}>
                                      {p.name} ({p.role})
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                            {petitioners.filter(p => p.type === 'civil_lawyer').length > 0 && (
                              <optgroup label="Адвокаты">
                                {petitioners
                                  .filter(p => p.type === 'civil_lawyer')
                                  .map(p => (
                                    <option key={`lawyer-${p.id}`} value={`${p.type}:${p.id}`}>
                                      {p.name} ({p.role})
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                          </select>
                        ) : (
                          <span>{getPetitionerName()}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Дата подачи</h3>
                      <div className={styles.field}>
                        <label>Дата подачи *</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="date"
                            name="date_application"
                            value={formData.date_application || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            required
                          />
                        ) : (
                          <span>{formatDate(petitionData?.petitions_incase_detail?.date_application)}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Примечания</h3>
                      <div className={styles.field}>
                        <label>Примечание</label>
                        {(isEditing || isCreateMode) ? (
                          <textarea
                            name="notation"
                            value={formData.notation || ''}
                            onChange={handleInputChange}
                            className={styles.textarea}
                            rows={4}
                            placeholder="Дополнительные примечания..."
                          />
                        ) : (
                          <span>{petitionData?.petitions_incase_detail?.notation || 'Примечаний нет'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'decision' && (
                  <div className={styles.tabContent}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Решение по ходатайству</h3>
                      <div className={styles.field}>
                        <label>Решение</label>
                        {(isEditing || isCreateMode) ? (
                          <select
                            name="decision_rendered"
                            value={formData.decision_rendered || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите решение</option>
                            {decisions.length > 0 ? (
                              decisions.map((decision) => (
                                <option key={decision.id} value={decision.id}>
                                  {decision.name_case || decision.decisions || `Решение ${decision.id}`}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>Загрузка решений...</option>
                            )}
                          </select>
                        ) : (
                          <span>{getDecisionName()}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Дата вынесения решения</h3>
                      <div className={styles.field}>
                        <label>Дата</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="date"
                            name="date_decision"
                            value={formData.date_decision || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(petitionData?.petitions_incase_detail?.date_decision)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {!isCreateMode && petitionData && (
            <div className={styles.infoSection}>
              <h3 className={styles.infoTitle}>Служебная информация</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>ID ходатайства</label>
                  <span>{petitionData.id}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>ID PetitionsInCase</label>
                  <span>{petitionData.petitions_incase || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Дата создания</label>
                  <span>{petitionData.petitions_incase_detail?.date_application || '—'}</span>
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