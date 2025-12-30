import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './DefendantDetail.module.css';
import {
  DefendantBasicInfoTab,
  DefendantRestraintTab,
  DefendantPunishmentTab,
  DefendantDamageTab,
  DefendantDetentionTab,
  DefendantAdditionalTab
} from './CriminalTabComponents';

const DefendantDetail = () => {
  const { cardId, defendantId } = useParams();
  const { businesscardId } = useParams();
  const navigate = useNavigate();
  const [defendantData, setDefendantData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({
      sex: [],
      restraintMeasure: [],
      restraintApplication: [],
      restraintChange: [],
  });
  const [decisions, setDecisions] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    const fetchDefendantDetails = async () => {
      try {
        setLoading(true);
        
        const defendantResponse = await CriminalCaseService.getDefendantById(cardId, defendantId);
        
        if (defendantResponse) {
          setDefendantData(defendantResponse);
          setFormData(defendantResponse);
        }
        
        // Загрузка опций для выпадающих списков
        await loadOptions();
        
        // Загрузка решений
        await loadDecisions();
     
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных подсудимого:', err);
        setError('Не удалось загрузить данные подсудимого');
        setLoading(false);
      }
    };

    fetchDefendantDetails();
  }, [businesscardId, defendantId]);

  const loadDecisions = async () => {
    try {
      const decisionsResponse = await CriminalCaseService.getDecisions(cardId);
      setDecisions(decisionsResponse);
    } catch (error) {
      console.error('Ошибка загрузки решений:', error);
      setDecisions([]);
    }
  };

  const loadOptions = async () => {
    try {
      // Загрузка всех опций из одного эндпоинта для Defendant
      const response = await baseService.get('/criminal_proceedings/defendant-options/');
      
      setOptions({
        sex: response.data.sex || [],
        restraintMeasure: response.data.restraint_measure || [],
        restraintApplication: response.data.restraint_application || [],
        restraintChange: response.data.restraint_change || [],
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      // Устанавливаем пустые массивы вместо ошибки
      setOptions({
        sex: [],
        restraintMeasure: [],
        restraintApplication: [],
        restraintChange: [],
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
      delete dataToSend.criminal_proceedings;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;
      
      const updatedData = await CriminalCaseService.updateDefendant(defendantId, dataToSend);
      
      setDefendantData(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
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
    setFormData(defendantData);
    setIsEditing(false);
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
        <div className={styles.loading}>Загрузка данных подсудимого...</div>
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

  if (!defendantData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Данные подсудимого не найдены</div>
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
          <h1 className={styles.title}>Данные подсудимого: {defendantData.full_name}</h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <div className={styles.editActions}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отменить
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Основной контент с вкладками */}
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Основные сведения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'restraint' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('restraint')}
              >
                Меры пресечения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'punishment' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('punishment')}
              >
                Наказание
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'damage' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('damage')}
              >
                Ущерб и взыскания
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'detention' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('detention')}
              >
                Место содержания
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'additional' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                Дополнительно
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'basic' && (
                <DefendantBasicInfoTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleDateChange={handleDateChange}
                  defendantData={defendantData}
                  options={options}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                />
              )}
              {activeTab === 'restraint' && (
                <DefendantRestraintTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleDateChange={handleDateChange}
                  defendantData={defendantData}
                  options={options}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                />
              )}
              {activeTab === 'punishment' && (
                <DefendantPunishmentTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  defendantData={defendantData}
                />
              )}
              {activeTab === 'damage' && (
                <DefendantDamageTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  defendantData={defendantData}
                />
              )}
              {activeTab === 'detention' && (
                <DefendantDetentionTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  defendantData={defendantData}
                />
              )}
              {activeTab === 'additional' && (
                <DefendantAdditionalTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  defendantData={defendantData}
                  formatDate={formatDate}
                />
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - решения */}
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>В. Судебные решения</h2>
            
            {decisions.length > 0 ? (
              <div className={styles.defendantsList}>
                {decisions.map(decision => (
                  <div key={decision.id} className={styles.defendantItem}>
                    <h4>Решение от {formatDate(decision.created_at)}</h4>
                    <p>Обжалование: {decision.appeal_present || 'Не указано'}</p>
                    <p>Суд инстанции: {decision.court_instance || 'Не указано'}</p>
                    <p>Результат: {decision.appeal_consideration_result || 'Не указано'}</p>
                    <p>Дата вступления в силу: {formatDate(decision.sentence_effective_date)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>Судебные решения не добавлены</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefendantDetail;