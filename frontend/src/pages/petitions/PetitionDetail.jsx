// PetitionDetail.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './PetitionDetail.module.css';
import PetitionService from '../../API/PetitionService';
import KasCaseService from '../../API/KasCaseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import OtherMaterialService from '../../API/OtherMaterialService';
import baseService from '../../API/baseService';

const PetitionDetail = () => {
  const { proceedingId, petitionId, materialId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Определяем тип дела по URL
  const caseType = location.pathname.includes('/admin-proceedings/') ? 'admin' : 
                   location.pathname.includes('/kas-proceedings/') ? 'kas' :
                   location.pathname.includes('/criminal-proceedings/') ? 'criminal' :
                   location.pathname.includes('/other-materials/') ? 'other' : 'civil';
  
  // Для other-materials используем materialId вместо proceedingId
  const effectiveProceedingId = caseType === 'other' ? materialId : proceedingId;
  
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
        
        if (!effectiveProceedingId) {
          console.error('proceedingId отсутствует');
          setError('ID дела не указан');
          setLoading(false);
          return;
        }
        
        console.log('Загрузка данных для дела:', effectiveProceedingId, 'Тип дела:', caseType);
        
        let petitionTypesData, decisionsData, sidesData, lawyersData;
        
        if (caseType === 'kas') {
          petitionTypesData = await PetitionService.getPetitionTypes();
          decisionsData = await PetitionService.getDecisions();
          sidesData = await KasCaseService.getSides(effectiveProceedingId);
          lawyersData = await KasCaseService.getLawyers(effectiveProceedingId);
        } else if (caseType === 'criminal') {
          petitionTypesData = await PetitionService.getPetitionTypes();
          decisionsData = await PetitionService.getDecisions();
          sidesData = await CriminalCaseService.getSides(effectiveProceedingId);
          lawyersData = await CriminalCaseService.getLawyers(effectiveProceedingId);
        } else if (caseType === 'other') {
          petitionTypesData = await OtherMaterialService.getPetitionTypes();
          decisionsData = await OtherMaterialService.getDecisions();
          sidesData = await OtherMaterialService.getSides(effectiveProceedingId);
          lawyersData = await OtherMaterialService.getLawyers(effectiveProceedingId);
        } else {
          [petitionTypesData, decisionsData, sidesData, lawyersData] = await Promise.all([
            PetitionService.getPetitionTypes(),
            PetitionService.getDecisions(),
            PetitionService.getSides(effectiveProceedingId, caseType),
            PetitionService.getLawyers(effectiveProceedingId, caseType)
          ]);
        }
        
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
        
        const allPetitioners = [];
        
        sidesData.forEach(side => {
          let sideDetail = {};
          let name = '';
          let role = '';
          
          if (caseType === 'criminal') {
            sideDetail = side.criminal_side_case_detail || {};
            name = sideDetail.name || 'Сторона по делу';
            role = side.sides_case_criminal_detail?.sides_case || 'Сторона';
          } else {
            sideDetail = side.sides_case_incase_detail || {};
            name = sideDetail.name || 'Сторона по делу';
            role = side.sides_case_role_detail?.name || 'Сторона';
          }
          
          allPetitioners.push({
            id: side.id,
            name: name,
            role: role,
            type: caseType === 'criminal' ? 'criminal_side' :
                  caseType === 'admin' ? 'admin_sides' : 
                  caseType === 'kas' ? 'kas_sides' :
                  caseType === 'other' ? 'other_sides' : 'civil_sides',
            typeLabel: 'Сторона',
            detail: sideDetail
          });
        });
        
        lawyersData.forEach(lawyer => {
          const lawyerDetail = lawyer.lawyer_detail || {};
          let roleLabel = '';
          
          switch(caseType) {
            case 'criminal':
              roleLabel = 'Адвокат';
              break;
            case 'admin':
              roleLabel = 'Защитник';
              break;
            case 'kas':
              roleLabel = 'Представитель';
              break;
            case 'other':
              roleLabel = 'Представитель';
              break;
            default:
              roleLabel = 'Адвокат';
          }
          
          allPetitioners.push({
            id: lawyer.id,
            name: lawyerDetail.law_firm_name || roleLabel,
            role: lawyer.sides_case_role_detail?.name || roleLabel,
            type: caseType === 'criminal' ? 'criminal_lawyer' :
                  caseType === 'admin' ? 'admin_lawyer' : 
                  caseType === 'kas' ? 'kas_lawyer' :
                  caseType === 'other' ? 'other_lawyer' : 'civil_lawyer',
            typeLabel: roleLabel,
            detail: lawyerDetail
          });
        });
        
        setPetitioners(allPetitioners);
        
        if (!isCreateMode && petitionId && petitionId !== 'create') {
          try {
            let petition;
            if (caseType === 'kas') {
              petition = await KasCaseService.getPetitionById(effectiveProceedingId, petitionId);
            } else if (caseType === 'criminal') {
              petition = await CriminalCaseService.getPetitionById(effectiveProceedingId, petitionId);
            } else if (caseType === 'other') {
              petition = await OtherMaterialService.getPetitionById(effectiveProceedingId, petitionId);
            } else {
              petition = await PetitionService.getPetition(effectiveProceedingId, petitionId, caseType);
            }
            
            console.log('Загружено ходатайство:', petition);
            setPetitionData(petition);
            
            const petitionDetail = petition.petitions_incase_detail || {};
            const petitionerInfo = petition.petitioner_info || {};
            
            // Определяем тип заявителя для select
            let petitionerType = '';
            let petitionerId = '';
            
            if (petitionerInfo.type && petitionerInfo.id) {
              petitionerType = petitionerInfo.type;
              petitionerId = petitionerInfo.id;
            } else if (petition.petitioner_type && petition.petitioner_id) {
              petitionerType = petition.petitioner_type;
              petitionerId = petition.petitioner_id;
            }
            
            setFormData({
              petitions_name: petitionDetail.petitions_name?.[0]?.id || '',
              petitioner_type: petitionerType,
              petitioner_id: petitionerId,
              date_application: petitionDetail.date_application || '',
              decision_rendered: petitionDetail.decision_rendered?.id || petitionDetail.decision_rendered || '',
              date_decision: petitionDetail.date_decision || '',
              notation: petitionDetail.notation || '',
              // Сохраняем информацию о заявителе для отображения
              petitioner_info: petitionerInfo
            });
          } catch (err) {
            console.error('Ошибка загрузки ходатайства:', err);
            setError(`Не удалось загрузить ходатайство: ${err.message}`);
          }
        } else {
          setFormData({
            petitions_name: '',
            petitioner_type: '',
            petitioner_id: '',
            date_application: new Date().toISOString().split('T')[0],
            decision_rendered: '',
            date_decision: '',
            notation: '',
            petitioner_info: {}
          });
          setIsEditing(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError(`Не удалось загрузить данные: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [effectiveProceedingId, petitionId, isCreateMode, caseType]);

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
    
    // Находим информацию о заявителе
    const petitioner = petitioners.find(p => `${p.type}:${p.id}` === value);
    
    setFormData(prev => ({
      ...prev,
      petitioner_type: type,
      petitioner_id: id ? parseInt(id, 10) : '',
      // Сохраняем полную информацию о заявителе
      petitioner_info: petitioner ? {
        name: petitioner.name,
        role: petitioner.role,
        type: petitioner.type,
        id: petitioner.id,
        source: 'court'
      } : {}
    }));
  };

const handleSave = async () => {
  try {
    setSaving(true);
    
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
    
    // ПРАВИЛЬНЫЙ ФОРМАТ - только те поля, которые есть в модели
    const dataToSend = {
      petitions_name: [parseInt(formData.petitions_name)],
      date_application: formData.date_application,
      notation: formData.notation || '',
      // petitioner_type и petitioner_id - для связи с заявителем
      petitioner_type: formData.petitioner_type,
      petitioner_id: parseInt(formData.petitioner_id),
      // petitioner_info - JSON объект
      petitioner_info: {
        name: formData.petitioner_info?.name || '',
        role: formData.petitioner_info?.role || '',
        type: formData.petitioner_type,
        id: parseInt(formData.petitioner_id),
        source: 'court'
      }
    };
    
    // ДОБАВЛЯЕМ decision_rendered ТОЛЬКО ЕСЛИ ОН ВЫБРАН
    if (formData.decision_rendered && formData.decision_rendered !== '') {
      dataToSend.decision_rendered = parseInt(formData.decision_rendered);
    }
    
    // ДОБАВЛЯЕМ date_decision ТОЛЬКО ЕСЛИ ОН УКАЗАН
    if (formData.date_decision && formData.date_decision !== '') {
      dataToSend.date_decision = formData.date_decision;
    }
    
    console.log('Отправляемые данные:', JSON.stringify(dataToSend, null, 2));
    console.log('Тип дела:', caseType);
    console.log('Proceeding ID:', effectiveProceedingId);
    
    let result;
    
    if (isCreateMode) {
      // Создание
      if (caseType === 'kas') {
        result = await KasCaseService.createPetition(effectiveProceedingId, dataToSend);
      } else if (caseType === 'criminal') {
        result = await CriminalCaseService.createPetition(effectiveProceedingId, dataToSend);
      } else if (caseType === 'other') {
        result = await OtherMaterialService.createPetition(effectiveProceedingId, dataToSend);
      } else {
        result = await PetitionService.createPetition(effectiveProceedingId, dataToSend, caseType);
      }
      console.log('Создано ходатайство:', result);
      navigate(-1);
    } else {
      // Обновление - используем только заполненные поля (PATCH)
      // Удаляем поля с пустыми значениями
      const patchData = { ...dataToSend };
      Object.keys(patchData).forEach(key => {
        if (patchData[key] === null || patchData[key] === undefined || patchData[key] === '') {
          delete patchData[key];
        }
        // Если это массив и он пустой
        if (Array.isArray(patchData[key]) && patchData[key].length === 0) {
          delete patchData[key];
        }
      });
      
      console.log('PATCH данные:', JSON.stringify(patchData, null, 2));
      
      if (caseType === 'kas') {
        result = await KasCaseService.updatePetition(effectiveProceedingId, petitionId, patchData);
      } else if (caseType === 'criminal') {
        result = await CriminalCaseService.updatePetition(effectiveProceedingId, petitionId, patchData);
      } else if (caseType === 'other') {
        result = await OtherMaterialService.updatePetition(effectiveProceedingId, petitionId, patchData);
      } else {
        result = await PetitionService.updatePetition(effectiveProceedingId, petitionId, patchData, caseType);
      }
      console.log('Обновлено ходатайство:', result);
      navigate(-1);
    }
    
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    console.error('Ответ сервера:', err.response?.data);
    
    if (err.response) {
      let errorMessage = 'Не удалось сохранить данные: ';
      if (err.response.data) {
        if (typeof err.response.data === 'object') {
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
        
        let petitionerType = '';
        let petitionerId = '';
        
        if (petitionerInfo.type && petitionerInfo.id) {
          petitionerType = petitionerInfo.type;
          petitionerId = petitionerInfo.id;
        } else if (petitionData.petitioner_type && petitionData.petitioner_id) {
          petitionerType = petitionData.petitioner_type;
          petitionerId = petitionData.petitioner_id;
        }
        
        setFormData({
          petitions_name: petitionDetail.petitions_name?.[0]?.id || '',
          petitioner_type: petitionerType,
          petitioner_id: petitionerId,
          date_application: petitionDetail.date_application || '',
          decision_rendered: petitionDetail.decision_rendered?.id || petitionDetail.decision_rendered || '',
          date_decision: petitionDetail.date_decision || '',
          notation: petitionDetail.notation || '',
          petitioner_info: petitionerInfo
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!petitionId || petitionId === 'create') return;
    
    if (window.confirm('Вы уверены, что хотите удалить ходатайство?')) {
      try {
        if (caseType === 'kas') {
          await KasCaseService.deletePetition(effectiveProceedingId, petitionId);
        } else if (caseType === 'criminal') {
          await CriminalCaseService.deletePetition(effectiveProceedingId, petitionId);
        } else if (caseType === 'other') {
          await OtherMaterialService.deletePetition(effectiveProceedingId, petitionId);
        } else {
          await PetitionService.deletePetition(effectiveProceedingId, petitionId, caseType);
        }
        navigate(-1);
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
    const petitionerInfo = petitionData?.petitioner_info || petitionData?.petitions_incase_detail?.petitioner_info;
    
    if (!petitionerInfo) {
      // Если нет в petitioner_info, пробуем через petitioner_type/petitioner_id
      if (petitionData?.petitioner_type && petitionData?.petitioner_id) {
        const petitioner = petitioners.find(p => 
          p.type === petitionData.petitioner_type && p.id === petitionData.petitioner_id
        );
        if (petitioner) {
          return `${petitioner.name} (${petitioner.role})`;
        }
        return `${petitionData.petitioner_type}:${petitionData.petitioner_id}`;
      }
      return 'Не указан';
    }
    
    if (typeof petitionerInfo === 'object') {
      const name = petitionerInfo.name || petitionerInfo.full_name || 'Не указан';
      const role = petitionerInfo.side_name || petitionerInfo.role || '';
      const source = petitionerInfo.source === 'side_user' ? '(личный кабинет)' : '';
      return `${name} ${role} ${source}`.trim();
    }
    
    return String(petitionerInfo);
  };

  const getDecisionName = () => {
    if (!petitionData?.petitions_incase_detail?.decision_rendered) return 'Не указано';
    const decision = petitionData.petitions_incase_detail.decision_rendered;
    return decision.name_case || decision.decisions || 'Не указано';
  };

  const getTitle = () => {
    const action = isCreateMode ? 'Создание ходатайства' : 'Ходатайство по делу';
    
    let caseTypeText = '';
    switch(caseType) {
      case 'criminal':
        caseTypeText = '(уголовное)';
        break;
      case 'admin':
        caseTypeText = '(административное правонарушение)';
        break;
      case 'kas':
        caseTypeText = '(административное дело, КАС РФ)';
        break;
      case 'other':
        caseTypeText = '(иные материалы)';
        break;
      default:
        caseTypeText = '(гражданское)';
    }
    
    return `${action} ${caseTypeText}`;
  };

  // Получение значения для поля заявителя в select
  const getPetitionerSelectValue = () => {
    if (formData.petitioner_type && formData.petitioner_id) {
      return `${formData.petitioner_type}:${formData.petitioner_id}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Загрузка данных ходатайства...</p>
          <p>ID дела: {effectiveProceedingId}</p>
          <p>ID ходатайства: {petitionId}</p>
          <p>Тип дела: {caseType === 'criminal' ? 'Уголовное' :
                        caseType === 'admin' ? 'Административное правонарушение' :
                        caseType === 'kas' ? 'Административное дело (КАС РФ)' :
                        caseType === 'other' ? 'Иные материалы' : 'Гражданное'}</p>
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
          <h1 className={styles.title}>{getTitle()}</h1>
          {caseType === 'criminal' && (
            <span className={styles.caseTypeBadge}>Уголовное дело</span>
          )}
          {caseType === 'admin' && (
            <span className={styles.caseTypeBadge}>Административное правонарушение</span>
          )}
          {caseType === 'kas' && (
            <span className={styles.caseTypeBadge}>Административное дело (КАС РФ)</span>
          )}
          {caseType === 'other' && (
            <span className={styles.caseTypeBadge}>Иные материалы</span>
          )}
        </div>
        
        <div className={styles.headerRight}>
          {!isCreateMode && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                Редактировать
              </button>
              {!isCreateMode && (
                <button onClick={handleDelete} className={styles.deleteButton}>
                  Удалить
                </button>
              )}
            </>
          )}
          {(isEditing || isCreateMode) && (
            <>
              <button 
                onClick={handleSave} 
                className={styles.saveButton} 
                disabled={saving}
              >
                {saving ? 'Сохранение...' : isCreateMode ? 'Создать' : 'Сохранить'}
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
                            value={getPetitionerSelectValue()}
                            onChange={handlePetitionerChange}
                            className={styles.select}
                            required
                          >
                            <option value="">Выберите заявителя</option>
                            
                            {petitioners.filter(p => 
                              p.type === (caseType === 'criminal' ? 'criminal_side' :
                                        caseType === 'admin' ? 'admin_sides' : 
                                        caseType === 'kas' ? 'kas_sides' :
                                        caseType === 'other' ? 'other_sides' : 'civil_sides')
                            ).length > 0 && (
                              <optgroup label="Стороны">
                                {petitioners
                                  .filter(p => p.type === (caseType === 'criminal' ? 'criminal_side' :
                                                          caseType === 'admin' ? 'admin_sides' : 
                                                          caseType === 'kas' ? 'kas_sides' :
                                                          caseType === 'other' ? 'other_sides' : 'civil_sides'))
                                  .map(p => (
                                    <option key={`side-${p.id}`} value={`${p.type}:${p.id}`}>
                                      {p.name} ({p.role})
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                            
                            {petitioners.filter(p => 
                              p.type === (caseType === 'criminal' ? 'criminal_lawyer' :
                                        caseType === 'admin' ? 'admin_lawyer' : 
                                        caseType === 'kas' ? 'kas_lawyer' :
                                        caseType === 'other' ? 'other_lawyer' : 'civil_lawyer')
                            ).length > 0 && (
                              <optgroup label={
                                caseType === 'criminal' ? 'Адвокаты' :
                                caseType === 'admin' ? 'Защитники' :
                                caseType === 'kas' ? 'Представители' :
                                caseType === 'other' ? 'Представители' : 'Адвокаты'
                              }>
                                {petitioners
                                  .filter(p => p.type === (caseType === 'criminal' ? 'criminal_lawyer' :
                                                          caseType === 'admin' ? 'admin_lawyer' : 
                                                          caseType === 'kas' ? 'kas_lawyer' :
                                                          caseType === 'other' ? 'other_lawyer' : 'civil_lawyer'))
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
                  <label>Тип дела</label>
                  <span>{caseType === 'criminal' ? 'Уголовное' :
                        caseType === 'admin' ? 'Административное правонарушение' :
                        caseType === 'kas' ? 'Административное дело (КАС РФ)' :
                        caseType === 'other' ? 'Иные материалы' : 'Гражданское'}</span>
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