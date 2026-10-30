// DefendantDetail.jsx - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './CriminalDetail.module.css';
import ArticleSelector from './ArticleSelector';

const DefendantDetail = () => {
  const { proceedingId, id } = useParams();
  const navigate = useNavigate();
  const [defendant, setDefendant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [options, setOptions] = useState({
    sex: [],
    restraint_measure: [],
    restraint_application: [],
    restraint_change: [],
    trial_result: []
  });
  const [criminalCase, setCriminalCase] = useState(null);
  
  const [sidesCaseOptions, setSidesCaseOptions] = useState([]);
  const [selectedSideId, setSelectedSideId] = useState('');
  const isCreateMode = !id || id === 'create';
  
  // Состояния для статей (пункты теперь хранятся как МАССИВ)
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [selectedArticlePart, setSelectedArticlePart] = useState('');
  const [selectedArticleClauses, setSelectedArticleClauses] = useState([]);
  
  const [selectedConvictionArticleId, setSelectedConvictionArticleId] = useState(null);
  const [selectedConvictionArticlePart, setSelectedConvictionArticlePart] = useState('');
  const [selectedConvictionArticleClauses, setSelectedConvictionArticleClauses] = useState([]);

  // Опции для гражданства
  const citizenshipOptions = [
    { value: '1', label: 'Российская Федерация' },
    { value: '2', label: 'другие государства СНГ' },
    { value: '3', label: 'иные государства' },
    { value: '4', label: 'без гражданства' },
  ];

  useEffect(() => {
    if (proceedingId) {
      if (isCreateMode) {
        setDefendant(null);
        setFormData({
          full_name_criminal: '',
          birth_date: '',
          sex: '',
          citizenship: '',
          address: '',
          special_notes: '',
          restraint_measure: '',
          restraint_date: '',
          restraint_application: '',
          restraint_change: '',
          restraint_change_date: '',
          restraint_change_to: '',
          punishment_type: '',
          punishment_term: '',
          additional_punishment: '',
          parole_info: '',
          property_damage: '',
          moral_damage: ''
        });
        setSelectedSideId('');
        setIsEditing(true);
        setLoading(false);
      } else if (id) {
        loadDefendantDetails();
      }
      
      loadOptions();
      loadSidesCaseOptions();
      loadCriminalCase();
    }
  }, [proceedingId, id]);

  const loadDefendantDetails = async () => {
    try {
      setLoading(true);
      const data = await CriminalCaseService.getDefendantById(proceedingId, id);
      
      setDefendant(data);
      setFormData(data);
      
      // Устанавливаем значения для статей
      setSelectedArticleId(data.article || null);
      setSelectedArticlePart(data.article_part || '');
      // Преобразуем строку с пунктами в массив
      let clausesArray = [];
      if (data.article_clauses) {
        if (Array.isArray(data.article_clauses)) {
          clausesArray = data.article_clauses;
        } else if (typeof data.article_clauses === 'string') {
          clausesArray = data.article_clauses.split(',').map(c => c.trim()).filter(c => c);
        }
      }
      setSelectedArticleClauses(clausesArray);
      
      setSelectedConvictionArticleId(data.conviction_article || null);
      setSelectedConvictionArticlePart(data.conviction_article_part || '');
      let convClausesArray = [];
      if (data.conviction_article_clauses) {
        if (Array.isArray(data.conviction_article_clauses)) {
          convClausesArray = data.conviction_article_clauses;
        } else if (typeof data.conviction_article_clauses === 'string') {
          convClausesArray = data.conviction_article_clauses.split(',').map(c => c.trim()).filter(c => c);
        }
      }
      setSelectedConvictionArticleClauses(convClausesArray);
      
      setSelectedSideId(data?.sides_case_defendant_id ? String(data.sides_case_defendant_id) : '');
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных подсудимого:', error);
      setLoading(false);
      setDefendant(null);
    }
  };

  const loadCriminalCase = async () => {
    try {
      const data = await CriminalCaseService.getCriminalProceedingById(proceedingId);
      setCriminalCase(data);
    } catch (error) {
      console.error('Ошибка загрузки уголовного дела:', error);
    }
  };

  const loadSidesCaseOptions = async () => {
    try {
      const response = await baseService.get('/business_card/sides/');
      setSidesCaseOptions(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки видов сторон:', error);
    }
  };

  const isDefendantSide = (sideId) => {
    const defendantSideIds = ['8', '9', '12', '13'];
    return defendantSideIds.includes(String(sideId));
  };

  const loadOptions = async () => {
    try {
      const response = await baseService.get('/criminal_proceedings/defendant-options/');
      setOptions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'sides_case_defendant_id') {
      setSelectedSideId(value);
      
      const selectedSide = sidesCaseOptions.find(option => 
        String(option.id) === String(value)
      );
      
      setFormData(prev => ({
        ...prev,
        sides_case_defendant_input: value ? parseInt(value, 10) : null,
        sides_case_defendant_name: selectedSide ? selectedSide.sides_case : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);

      const articleClausesStr = Array.isArray(selectedArticleClauses)
        ? selectedArticleClauses.join(',')
        : (selectedArticleClauses || '');

      const convictionClausesStr = Array.isArray(selectedConvictionArticleClauses)
        ? selectedConvictionArticleClauses.join(',')
        : (selectedConvictionArticleClauses || '');

      // Преобразуем пустые строки в null для полей дат и числовых полей
      const sanitizedData = { ...formData };
      
      // Список полей, которые должны быть null вместо пустой строки
      const dateFields = ['birth_date', 'restraint_date', 'restraint_change_date'];
      const numberFields = ['property_damage', 'moral_damage', 'maximum_penalty_article'];
      
      dateFields.forEach(field => {
        if (sanitizedData[field] === '') {
          sanitizedData[field] = null;
        }
      });
      
      numberFields.forEach(field => {
        if (sanitizedData[field] === '') {
          sanitizedData[field] = null;
        }
      });

      const dataToSend = {
        ...sanitizedData,
        sides_case_defendant_input: selectedSideId ? parseInt(selectedSideId, 10) : null,
        full_name_criminal: sanitizedData.full_name_criminal || '',
        article: selectedArticleId ? Number(selectedArticleId) : null,
        article_part: selectedArticlePart || null,
        article_clauses: articleClausesStr || null,
        conviction_article: selectedConvictionArticleId ? Number(selectedConvictionArticleId) : null,
        conviction_article_part: selectedConvictionArticlePart || null,
        conviction_article_clauses: convictionClausesStr || null
      };

      // Удаляем поля, которые не нужны для API
      delete dataToSend.sides_case_defendant_id;
      delete dataToSend.sides_case_defendant_name;
      delete dataToSend.name;
      delete dataToSend.full_name;
      delete dataToSend.article_detail;
      delete dataToSend.conviction_article_detail;
      delete dataToSend.article_structure;
      delete dataToSend.conviction_article_structure;
      delete dataToSend.id;
      delete dataToSend.criminal_proceedings;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;

      // Очищаем данные от undefined и пустых строк
      const cleanData = CriminalCaseService.cleanData(dataToSend);
      
      // Явно добавляем поля, которые могут быть null
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] !== undefined) {
          cleanData[key] = dataToSend[key];
        }
      });

      if (!cleanData.full_name_criminal || !cleanData.full_name_criminal.trim()) {
        alert('Пожалуйста, заполните поле "Полное ФИО"');
        setSaving(false);
        return;
      }
      
      if (!cleanData.sides_case_defendant_input) {
        alert('Пожалуйста, выберите вид стороны');
        setSaving(false);
        return;
      }
      
      if (isCreateMode) {
        await CriminalCaseService.createDefendant(proceedingId, cleanData);
        navigate(-1);
      } else {
        await CriminalCaseService.updateDefendant(proceedingId, id, cleanData);
        setIsEditing(false);
        await loadDefendantDetails();
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaving(false);
      
      let errorMessage = 'Не удалось сохранить изменения';
      if (error.response?.data) {
        if (error.response.data.sides_case_defendant_input) {
          errorMessage = 'Ошибка выбора вида стороны: ' + error.response.data.sides_case_defendant_input[0];
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          const firstErrorKey = Object.keys(error.response.data)[0];
          const firstError = error.response.data[firstErrorKey];
          if (Array.isArray(firstError)) {
            errorMessage = `${firstErrorKey}: ${firstError[0]}`;
          }
        }
      }
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate(-1);
    } else {
      setFormData(defendant || {});
      setSelectedSideId(defendant?.sides_case_defendant_id ? 
                        String(defendant.sides_case_defendant_id) : '');
      // Восстанавливаем значения статей
      if (defendant) {
        setSelectedArticleId(defendant.article || null);
        setSelectedArticlePart(defendant.article_part || '');
        let clausesArray = [];
        if (defendant.article_clauses) {
          if (Array.isArray(defendant.article_clauses)) {
            clausesArray = defendant.article_clauses;
          } else if (typeof defendant.article_clauses === 'string') {
            clausesArray = defendant.article_clauses.split(',').map(c => c.trim()).filter(c => c);
          }
        }
        setSelectedArticleClauses(clausesArray);
        
        setSelectedConvictionArticleId(defendant.conviction_article || null);
        setSelectedConvictionArticlePart(defendant.conviction_article_part || '');
        let convClausesArray = [];
        if (defendant.conviction_article_clauses) {
          if (Array.isArray(defendant.conviction_article_clauses)) {
            convClausesArray = defendant.conviction_article_clauses;
          } else if (typeof defendant.conviction_article_clauses === 'string') {
            convClausesArray = defendant.conviction_article_clauses.split(',').map(c => c.trim()).filter(c => c);
          }
        }
        setSelectedConvictionArticleClauses(convClausesArray);
      }
      setIsEditing(false);
    }
  };

  const handleEditStart = () => {
    if (formData.sides_case_defendant_id) {
      setSelectedSideId(String(formData.sides_case_defendant_id));
    } else {
      setSelectedSideId('');
    }
    setIsEditing(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch (e) {
      return 'Не указано';
    }
  };

  const getDisplayValue = (value, optionsArray) => {
    if (!value) return 'Не указано';
    if (!optionsArray || !Array.isArray(optionsArray)) return value;
    const option = optionsArray.find(opt => opt.value === value);
    return option?.label || value;
  };

  const getCitizenshipDisplayValue = (value) => {
    if (!value) return 'Не указано';
    const option = citizenshipOptions.find(opt => opt.value === value);
    return option?.label || value;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка данных подсудимого...</p>
        </div>
      </div>
    );
  }

  if (!defendant && !isCreateMode) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Подсудимый не найден</h2>
          <button 
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const currentDefendant = isCreateMode ? formData : defendant;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            ← Назад
          </button>
          <div>
            <h1 className={styles.title}>
              {isCreateMode ? 'Новый подсудимый' : (currentDefendant?.full_name_criminal || 'Имя не указано')}
              {!isCreateMode && currentDefendant && (
                <div><span className={styles.archiveBadge}>Вид стороны: {currentDefendant?.sides_case_defendant_name || 'Не указан'}</span></div>
              )}
            </h1>
            <div className={styles.subtitle}>
              <span>Уголовное дело: {criminalCase?.case_number_criminal || proceedingId}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          {!isCreateMode && (
            <button 
              onClick={() => navigate(`/criminal-proceedings/${proceedingId}/defendants/${id}/person-card`)}
              className={styles.personCardButton}
            >
              Статистическая карточка
            </button>
          )}
          
          {isCreateMode ? (
            <>
              <button 
                onClick={handleSave}
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                onClick={() => navigate(-1)}
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </>
          ) : (
            !isEditing ? (
              <button 
                onClick={handleEditStart}
                className={styles.editButton}
              >
                Редактировать
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={styles.saveButton}
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button 
                  onClick={handleCancel}
                  className={styles.cancelButton}
                >
                  Отмена
                </button>
              </>
            )
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Основные данные
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
                className={`${styles.tab} ${activeTab === 'financial' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('financial')}
              >
                Финансовые взыскания
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'special' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('special')}
              >
                Особые отметки
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'basic' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Личные данные</h3>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Полное ФИО *</label>
                        {isEditing || isCreateMode ? (
                          <input
                            type="text"
                            name="full_name_criminal"
                            value={formData.full_name_criminal || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            required
                          />
                        ) : (
                          <span>{currentDefendant?.full_name_criminal || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Вид стороны *</label>
                        {isEditing || isCreateMode ? (
                          <select
                            name="sides_case_defendant_id"
                            value={selectedSideId || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                            required
                          >
                            <option value="">Выберите вид стороны</option>
                            {sidesCaseOptions
                              .filter(side => isDefendantSide(side.id))
                              .map(side => (
                                <option key={side.id} value={String(side.id)}>
                                  {side.sides_case}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span>{currentDefendant?.sides_case_defendant_name || 'Не указан'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата рождения</label>
                        {isEditing || isCreateMode ? (
                          <input
                            type="date"
                            name="birth_date"
                            value={formData.birth_date || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(currentDefendant?.birth_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Пол</label>
                        {isEditing || isCreateMode ? (
                          <select
                            name="sex"
                            value={formData.sex || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите пол</option>
                            {options.sex?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{getDisplayValue(currentDefendant?.sex, options.sex)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Гражданство</label>
                        {isEditing || isCreateMode ? (
                          <select
                            name="citizenship"
                            value={formData.citizenship || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите гражданство</option>
                            {citizenshipOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{getCitizenshipDisplayValue(currentDefendant?.citizenship)}</span>
                        )}
                      </div>

                      <div className={`${styles.field} ${styles.fullWidth}`}>
                        <label>Адрес проживания</label>
                        {isEditing || isCreateMode ? (
                          <textarea
                            name="address"
                            value={formData.address || ''}
                            onChange={handleInputChange}
                            className={styles.textarea}
                            rows="3"
                          />
                        ) : (
                          <span>{currentDefendant?.address || 'Не указано'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'restraint' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Мера пресечения</label>
                        {isEditing ? (
                          <select
                            name="restraint_measure"
                            value={formData.restraint_measure || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите меру</option>
                            {options.restraint_measure?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{getDisplayValue(currentDefendant?.restraint_measure, options.restraint_measure)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата избрания</label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="restraint_date"
                            value={formData.restraint_date || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(currentDefendant?.restraint_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Мера применена</label>
                        {isEditing ? (
                          <select
                            name="restraint_application"
                            value={formData.restraint_application || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите момент</option>
                            {options.restraint_application?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{getDisplayValue(currentDefendant?.restraint_application, options.restraint_application)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Изменение меры</label>
                        {isEditing ? (
                          <select
                            name="restraint_change"
                            value={formData.restraint_change || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                          >
                            <option value="">Выберите статус</option>
                            {options.restraint_change?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{getDisplayValue(currentDefendant?.restraint_change, options.restraint_change)}</span>
                        )}
                      </div>

                      {currentDefendant?.restraint_change === '1' && (
                        <>
                          <div className={styles.field}>
                            <label>Дата изменения</label>
                            {isEditing ? (
                              <input
                                type="date"
                                name="restraint_change_date"
                                value={formData.restraint_change_date || ''}
                                onChange={handleInputChange}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formatDate(currentDefendant?.restraint_change_date)}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>Изменена на меру</label>
                            {isEditing ? (
                              <input
                                type="text"
                                name="restraint_change_to"
                                value={formData.restraint_change_to || ''}
                                onChange={handleInputChange}
                                className={styles.input}
                              />
                            ) : (
                              <span>{currentDefendant?.restraint_change_to || 'Не указано'}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'punishment' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <ArticleSelector
                          value={selectedConvictionArticleId}
                          onChange={setSelectedConvictionArticleId}
                          onPartChange={setSelectedConvictionArticlePart}
                          onClausesChange={setSelectedConvictionArticleClauses}
                          partValue={selectedConvictionArticlePart}
                          clausesValue={selectedConvictionArticleClauses}
                          label="Статья по приговору"
                          disabled={!isEditing && !isCreateMode}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Вид наказания</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="punishment_type"
                            value={formData.punishment_type || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{currentDefendant?.punishment_type || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Срок наказания</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="punishment_term"
                            value={formData.punishment_term || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{currentDefendant?.punishment_term || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дополнительное наказание</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="additional_punishment"
                            value={formData.additional_punishment || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{currentDefendant?.additional_punishment || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Условно-досрочное освобождение / испытательный срок</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="parole_info"
                            value={formData.parole_info || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{currentDefendant?.parole_info || 'Не указано'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'financial' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Сумма ущерба (руб.)</label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            name="property_damage"
                            value={formData.property_damage || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>
                            {currentDefendant?.property_damage ? `${currentDefendant.property_damage} руб.` : 'Не указано'}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Сумма морального вреда (руб.)</label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            name="moral_damage"
                            value={formData.moral_damage || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>
                            {currentDefendant?.moral_damage ? `${currentDefendant.moral_damage} руб.` : 'Не указано'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'special' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label>Заметки по лицу</label>
                      {isEditing ? (
                        <textarea
                          name="special_notes"
                          value={formData.special_notes || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows="6"
                        />
                      ) : (
                        <span>{currentDefendant?.special_notes || 'Нет особых отметок'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefendantDetail;