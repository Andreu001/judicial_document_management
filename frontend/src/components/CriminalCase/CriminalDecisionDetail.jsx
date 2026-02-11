import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './CriminalDecisionDetail.module.css';
import {
  AppealTab,
  CourtInstanceTab,
  ConsiderationTab,
  ExecutionTab,
  SpecialMarksTab
} from './CriminalTabComponents';

const CriminalDecisionDetail = () => {
  const { id, proceedingId } = useParams(); // получаем оба параметра
  const navigate = useNavigate();
  const location = useLocation();
  
  const isCreateMode = location.pathname.includes('/create');
  const [decisionData, setDecisionData] = useState(null);
  const [isEditing, setIsEditing] = useState(isCreateMode); // в режиме создания сразу редактируем
  const [formData, setFormData] = useState({
    // начальные данные для нового решения
    appeal_present: null,
    appeal_date: null,
    appeal_number: '',
    appeal_consideration_result: null,
    appeal_consideration_date: null,
    appeal_consideration_time: null,
    criminal_proceedings: proceedingId // автоматически заполняем ID производства
  });
  const [loading, setLoading] = useState(!isCreateMode); // загрузка только если не режим создания
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({
    appeal_present: [],
    court_instance: [],
    appeal_consideration_result: [],
    civil_claim_result: []
  });
  const [defendants, setDefendants] = useState([]);
  const [activeTab, setActiveTab] = useState('appeal');

  useEffect(() => {
    if (isCreateMode) {
      // В режиме создания просто загружаем опции и подсудимых
      loadOptions();
      if (proceedingId) {
        loadDefendants(proceedingId);
      }
      setLoading(false);
    } else {
      // В режиме просмотра/редактирования загружаем данные решения
      fetchDecisionDetails();
    }
  }, [id, proceedingId, isCreateMode]);

  const fetchDecisionDetails = async () => {
    try {
      setLoading(true);
      
      const decisionResponse = await CriminalCaseService.getDecisionById(proceedingId, id);
      
      if (decisionResponse) {
        setDecisionData(decisionResponse);
        setFormData(decisionResponse);

        if (decisionResponse.criminal_proceedings) {
          await loadDefendants(decisionResponse.criminal_proceedings);
        }
      }
      
      await loadOptions();
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки данных судебного решения:', err);
      setError('Не удалось загрузить данные судебного решения');
      setLoading(false);
    }
  };

  const loadDefendants = async (proceedingId) => {
    try {
      const defendantsResponse = await CriminalCaseService.getDefendants(proceedingId);
      setDefendants(defendantsResponse);
    } catch (error) {
      console.error('Ошибка загрузки обвиняемых:', error);
      setDefendants([]);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await baseService.get('/criminal_proceedings/criminal-decision-options/');
      
      setOptions({
        appeal_present: response.data.appeal_present || [],
        court_instance: response.data.court_instance || [],
        appeal_consideration_result: response.data.appeal_consideration_result || [],
        civil_claim_result: response.data.civil_claim_result || []
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      setOptions({
        appeal_present: [],
        court_instance: [],
        appeal_consideration_result: [],
        civil_claim_result: []
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
      
      if (isCreateMode) {
        // Создание нового решения
        const createdData = await CriminalCaseService.createDecision(proceedingId, dataToSend);
        setDecisionData(createdData);
        setFormData(createdData);
        // Перенаправляем на страницу созданного решения
        navigate(-1);
      } else {
        // Обновление существующего решения
        delete dataToSend.id;
        delete dataToSend.criminal_proceedings;
        delete dataToSend.created_at;
        delete dataToSend.updated_at;
        
        const updatedData = await CriminalCaseService.updateDecision(proceedingId, id, dataToSend);
        setDecisionData(updatedData);
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
      // В режиме создания возвращаемся назад
      navigate(-1);
    } else {
      // В режиме редактирования отменяем изменения
      setFormData(decisionData);
      setIsEditing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getOptionLabel = (optionsArray, value) => {
    return optionsArray.find(opt => opt.value === value)?.label || 'Не указано';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных судебного решения...</div>
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
          <h1 className={styles.title}>
            {isCreateMode ? 'Создание судебного решения' : 'Судебное решение'}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isCreateMode && !isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <div className={styles.editButtons}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : isCreateMode ? 'Создать' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                {isCreateMode ? 'Отмена' : 'Отменить'}
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
                className={`${styles.tab} ${activeTab === 'appeal' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('appeal')}
              >
                Обжалование решения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'court' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('court')}
              >
                Суд II инстанции
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'consideration' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('consideration')}
              >
                Рассмотрение судом второй инстанции
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'execution' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('execution')}
              >
                Исполнение
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'special' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('special')}
              >
                Особые отметки
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'appeal' && (
                 <AppealTab
                    isEditing={isEditing || isCreateMode}
                    formData={formData}
                    options={options}
                    handleInputChange={handleInputChange}
                    getOptionLabel={getOptionLabel}
                    decisionData={decisionData}
                    handleDateChange={handleDateChange}
                    formatDate={formatDate}
                 />
                )}
              {activeTab === 'court' && (
                <CourtInstanceTab
                    isEditing={isEditing || isCreateMode}
                    formData={formData}
                    options={options}
                    handleInputChange={handleInputChange}
                    getOptionLabel={getOptionLabel}
                    decisionData={decisionData}
                    handleDateChange={handleDateChange}
                    formatDate={formatDate}
                />)}
              {activeTab === 'consideration' && (
                <ConsiderationTab
                    isEditing={isEditing || isCreateMode}
                    formData={formData}
                    options={options}
                    handleInputChange={handleInputChange}
                    getOptionLabel={getOptionLabel}
                    decisionData={decisionData}
                    handleDateChange={handleDateChange}
                    formatDate={formatDate}
                />)}
              {activeTab === 'execution' && (
                <ExecutionTab
                    isEditing={isEditing || isCreateMode}
                    formData={formData}
                    options={options}
                    handleInputChange={handleInputChange}
                    getOptionLabel={getOptionLabel}
                    decisionData={decisionData}
                    handleDateChange={handleDateChange}
                    formatDate={formatDate}
                />)}
              {activeTab === 'special' && (
                <SpecialMarksTab
                    isEditing={isEditing || isCreateMode}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    decisionData={decisionData}
                    handleDateChange={handleDateChange}
                    formatDate={formatDate}
                />)}
            </div>
          </div>
        </div>

        {/* Правая колонка - обвиняемые */}
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Б. Стороны по делу</h2>
            
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
              <p>Обвиняемые не добавлены</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalDecisionDetail;