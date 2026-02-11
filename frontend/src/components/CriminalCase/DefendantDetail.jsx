import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './DefendantDetail.module.css';

const DefendantDetail = () => {
  const { proceedingId, id } = useParams();
  const navigate = useNavigate();
  const [defendant, setDefendant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [decisions, setDecisions] = useState([]);
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

useEffect(() => {
  if (proceedingId) {
    if (isCreateMode) {
      // В режиме создания
      setLoading(false);
      setDefendant(null);
      setFormData({});
      setIsEditing(true); // Важно: в режиме создания сразу включаем редактирование
    } else if (id) {
      // В режиме редактирования/просмотра
      loadDefendantDetails();
    }
    
    loadOptions();
    loadSidesCaseOptions();
    loadCriminalCase();
  }
}, [proceedingId, id]);

const loadDefendantDetails = async () => {
  if (isCreateMode) {
    // В режиме создания просто сбрасываем состояние
    setLoading(false);
    setDefendant(null);
    setFormData({});
    setSelectedSideId('');
    return;
  }

  try {
    setLoading(true);
    const data = await CriminalCaseService.getDefendantById(proceedingId, id);
    
    const defendantData = {
      ...data,
      name: data.name || data.sides_case_defendant?.name || 'Не указано',
      sides_case_defendant_id: data.sides_case_defendant_id || 
                             data.sides_case_defendant?.id || 
                             null,
      sides_case_defendant_name: data.sides_case_defendant_name || 
                               data.sides_case_defendant?.sides_case || 
                               'Не указан'
    };
    
    setDefendant(defendantData);
    setFormData(defendantData);
    setSelectedSideId(defendantData.sides_case_defendant_id ? 
                      String(defendantData.sides_case_defendant_id) : '');
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

  const loadDecisions = async () => {
    try {
      const response = await CriminalCaseService.getDecisions(proceedingId);
      if (response && response.length > 0) {
        const defendantDecisions = response.filter(decision => 
          decision.defendants?.some(def => def.id === parseInt(id)) || 
          decision.defendant_id === parseInt(id)
        );
        setDecisions(defendantDecisions);
      }
    } catch (error) {
      console.error('Ошибка загрузки решений:', error);
      setDecisions([]);
    }
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
    // Обновляем selectedSideId
    setSelectedSideId(value);
    
    // Обновляем formData с правильным значением
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

      const dataToSend = {
        ...formData,
        sides_case_defendant_input: selectedSideId ? parseInt(selectedSideId, 10) : null,
        full_name_criminal: formData.full_name_criminal || '',
      };

      delete dataToSend.sides_case_defendant_id;
      delete dataToSend.sides_case_defendant_name;
      delete dataToSend.name;
      delete dataToSend.full_name;
      
      console.log('Отправляемые данные:', dataToSend);

      const cleanData = {};
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] !== undefined && dataToSend[key] !== null) {
          cleanData[key] = dataToSend[key];
        }
      });
      
      console.log('Очищенные данные для отправки:', cleanData);

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
        setFormData({
          full_name_criminal: '',
          article: '',
          maximum_penalty_article: '',
        });
        setSelectedSideId('');

      } else {

        await CriminalCaseService.updateDefendant(proceedingId, id, cleanData);
        setIsEditing(false);
        await loadDefendantDetails();
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      console.error('Детали ошибки:', error.response?.data);
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
          setFormData(defendant);
          setSelectedSideId(defendant?.sides_case_defendant_id ? 
                          String(defendant.sides_case_defendant_id) : '');
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
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getDisplayValue = (value, optionsArray) => {
    if (!value) return 'Не указано';
    const option = optionsArray?.find(opt => opt.value === value);
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
                        {isCreateMode ? 'Новый подсудимый' : (defendant?.full_name_criminal || 'Имя не указано')}
                        {!isCreateMode && (
                            <span> | Вид стороны: {defendant?.sides_case_defendant_name || 'Не указан'}</span>
                        )}
                    </h1>
                    <div className={styles.subtitle}>
                        <span>Уголовное дело: {criminalCase?.case_number_criminal || proceedingId}</span>
                    </div>
                </div>
            </div>
            
            <div className={styles.headerRight}>
                {isCreateMode ? (
                    <div className={styles.editActions}>
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
                    </div>
                ) : (
                    !isEditing ? (
                        <button 
                            onClick={handleEditStart}
                            className={styles.editButton}
                        >
                            Редактировать
                        </button>
                    ) : (
                        <div className={styles.editActions}>
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
                        </div>
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
                                                <span>{defendant?.full_name_criminal || 'Не указано'}</span>
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
                                                <span>{defendant?.sides_case_defendant_name || 'Не указан'}</span>
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
                                                <span>{formatDate(defendant?.birth_date)}</span>
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
                                                <span>{getDisplayValue(defendant?.sex, options.sex)}</span>
                                            )}
                                        </div>

                                        <div className={styles.field}>
                                            <label>Гражданство</label>
                                            {isEditing || isCreateMode ? (
                                                <input
                                                    type="text"
                                                    name="citizenship"
                                                    value={formData.citizenship || ''}
                                                    onChange={handleInputChange}
                                                    className={styles.input}
                                                />
                                            ) : (
                                                <span>{defendant?.citizenship || 'Не указано'}</span>
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
                                                <span>{defendant?.address || 'Не указано'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <h3 className={styles.subsectionTitle}>Уголовная статья</h3>
                                    <div className={styles.tabGrid}>
                                        <div className={styles.field}>
                                            <label>Статья УК РФ</label>
                                            {isEditing || isCreateMode ? (
                                                <input
                                                    type="number"
                                                    name="article"
                                                    value={formData.article || ''}
                                                    onChange={handleInputChange}
                                                    className={styles.input}
                                                />
                                            ) : (
                                                <span>ст. {defendant?.article || 'Не указана'}</span>
                                            )}
                                        </div>

                                        <div className={styles.field}>
                                            <label>Максимальное наказание</label>
                                            {isEditing || isCreateMode ? (
                                                <input
                                                    type="number"
                                                    name="maximum_penalty_article"
                                                    value={formData.maximum_penalty_article || ''}
                                                    onChange={handleInputChange}
                                                    className={styles.input}
                                                />
                                            ) : (
                                                <span>
                                                    {defendant?.maximum_penalty_article ? `${defendant.maximum_penalty_article} лет` : 'Не указано'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

              {/* Вкладка: Меры пресечения */}
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
                          <span>{getDisplayValue(defendant.restraint_measure, options.restraint_measure)}</span>
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
                          <span>{formatDate(defendant.restraint_date)}</span>
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
                          <span>{getDisplayValue(defendant.restraint_application, options.restraint_application)}</span>
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
                          <span>{getDisplayValue(defendant.restraint_change, options.restraint_change)}</span>
                        )}
                      </div>

                      {defendant.restraint_change === '1' && (
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
                              <span>{formatDate(defendant.restraint_change_date)}</span>
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
                              <span>{defendant.restraint_change_to || 'Не указано'}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка: Наказание */}
              {activeTab === 'punishment' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Статья по приговору</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="conviction_article"
                            value={formData.conviction_article || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{defendant.conviction_article || 'Не указано'}</span>
                        )}
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
                          <span>{defendant.punishment_type || 'Не указано'}</span>
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
                          <span>{defendant.punishment_term || 'Не указано'}</span>
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
                          <span>{defendant.additional_punishment || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Условно-досрочное освобождение</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="parole_info"
                            value={formData.parole_info || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{defendant.parole_info || 'Не указано'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка: Финансовые взыскания */}
              {activeTab === 'financial' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Сумма ущерба</label>
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
                            {defendant.property_damage ? `${defendant.property_damage} руб.` : 'Не указано'}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Сумма морального вреда</label>
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
                            {defendant.moral_damage ? `${defendant.moral_damage} руб.` : 'Не указано'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка: Особые отметки */}
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
                        <span>{defendant.special_notes || 'Нет особых отметок'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - Решения */}
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Судебные решения</h2>
            
            {decisions.length > 0 ? (
              <div className={styles.decisionsList}>
                {decisions.map(decision => (
                  <div key={decision.id} className={styles.decisionItem}>
                    <h4>Решение #{decision.id}</h4>
                    <p>Дата: {decision.decision_date ? formatDate(decision.decision_date) : 'Не указана'}</p>
                    <p>Суд: {decision.court_name || 'Не указан'}</p>
                    <p>Статус: {getDisplayValue(options.trial_result, decision.trial_result)}</p>
                    <p>Обжалование: {decision.appeal_present ? 'Есть' : 'Нет'}</p>
                    <button 
                      onClick={() => navigate(`/criminal-proceedings/${proceedingId}/criminal-decisions/${decision.id}`)}
                      className={styles.viewButton}
                    >
                      Просмотреть
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noDecisions}>
                <p>Судебных решений не найдено</p>
                <button 
                  onClick={() => navigate(`/criminal-proceedings/${proceedingId}/criminal-decisions/create`)}
                  className={styles.addButton}
                >
                  Добавить решение
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefendantDetail;
