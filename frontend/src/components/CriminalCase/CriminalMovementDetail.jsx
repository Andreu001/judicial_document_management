import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './CriminalDetail.module.css'; // Используем единый файл стилей
import {
  MovementHearingTab,
  MovementComplianceTab,
  MovementPostponementTab
} from './CriminalTabComponents';

const CriminalMovementDetail = () => {
  const { cardId, moveId } = useParams();
  const navigate = useNavigate();
  const [movementData, setMovementData] = useState(null);
  const [isEditing, setIsEditing] = useState(moveId === 'create');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({
    preliminaryHearingResult: [],
    hearingCompliance: [],
    hearingPostponedReason: [],
    suspensionReason: []
  });
  const [defendants, setDefendants] = useState([]);
  const [activeTab, setActiveTab] = useState('hearing');
  
  const isCreateMode = moveId === 'create';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        await loadOptions();
        await loadDefendants();
        
        if (!isCreateMode) {
          const movementResponse = await CriminalCaseService.getCaseMovementById(cardId, moveId);
          
          if (movementResponse) {
            setMovementData(movementResponse);
            setFormData(movementResponse);
          } else {
            setError('Движение дела не найдено');
          }
        } else {
          setFormData({
            criminal_proceedings: cardId,
          });
          setIsEditing(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        if (!isCreateMode || err.response?.status !== 404) {
          setError('Не удалось загрузить данные');
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [cardId, moveId, isCreateMode]);

  const loadDefendants = async () => {
    try {
      const defendantsResponse = await CriminalCaseService.getDefendants(cardId);
      
      const defendantsWithSideNames = await Promise.all(
        defendantsResponse.map(async (defendant) => {
          if (defendant.side_case) {
            try {
              const sideResponse = await baseService.get(`/business_card/sides/${defendant.side_case}/`);
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
    } catch (error) {
      console.error('Ошибка загрузки обвиняемых:', error);
      setDefendants([]);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await baseService.get('/criminal_proceedings/criminal-case-movement-options/');
      
      setOptions({
        preliminaryHearingResult: response.data.preliminary_hearing_result || [],
        hearingCompliance: response.data.hearing_compliance || [],
        hearingPostponedReason: response.data.hearing_postponed_reason || [],
        suspensionReason: response.data.suspension_reason || []
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      setOptions({
        preliminaryHearingResult: [],
        hearingCompliance: [],
        hearingPostponedReason: [],
        suspensionReason: []
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend = { ...formData };

      delete dataToSend.id;
      delete dataToSend.business_card;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;
      
      if (isCreateMode) {
        await CriminalCaseService.createCaseMovement(cardId, dataToSend);
        navigate(-1);
      } else {
        const updatedData = await CriminalCaseService.updateCaseMovement(cardId, moveId, dataToSend);
        setMovementData(updatedData);
        setFormData(updatedData);
        setIsEditing(false);
      }
      
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
    }
  };

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate(-1);
    } else {
      setFormData(movementData);
      setIsEditing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatBoolean = (value) => {
    return value ? 'Да' : 'Нет';
  };

  const getOptionLabel = (optionsArray, value) => {
    return optionsArray.find(opt => opt.value === value)?.label || 'Не указано';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных движения...</div>
      </div>
    );
  }

  if (error && !isCreateMode) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  if (!isCreateMode && !movementData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Данные движения не найдены</div>
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
          <h1 className={styles.title}>
            {isCreateMode ? 'Создание движения дела' : 'Движение дела'}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing && !isCreateMode ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
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
                className={`${styles.tab} ${activeTab === 'hearing' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('hearing')}
              >
                Результат предварительного слушания
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'compliance' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('compliance')}
              >
                Соблюдение сроков
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'postponement' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('postponement')}
              >
                Причины отложения дела
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'hearing' && (
                <MovementHearingTab
                  isEditing={isEditing || isCreateMode}
                  formData={formData}
                  options={options}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  movementData={movementData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  formatBoolean={formatBoolean}
                  isCreateMode={isCreateMode}
                />
              )}
              {activeTab === 'compliance' && (
                <MovementComplianceTab
                  isEditing={isEditing || isCreateMode}
                  formData={formData}
                  options={options}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  movementData={movementData}
                  isCreateMode={isCreateMode}
                />
              )}
              {activeTab === 'postponement' && (
                <MovementPostponementTab
                  isEditing={isEditing || isCreateMode}
                  formData={formData}
                  options={options}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  movementData={movementData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  isCreateMode={isCreateMode}
                />
              )}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Стороны по делу</h2>
            
            {defendants.length > 0 ? (
              <div className={styles.defendantsList}>
                {defendants.map(defendant => (
                  <div key={defendant.id} className={styles.defendantItem}>
                    <h4>{defendant.full_name}</h4>
                    <p>Статус: {defendant.side_case_name}</p>
                    <p>Адрес: {defendant.address || 'Не указан'}</p>
                    <p>Дата рождения: {defendant.birth_date ? formatDate(defendant.birth_date) : 'Не указана'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>Обвиняемые не добавлены</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalMovementDetail;