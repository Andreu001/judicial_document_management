import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './DefendantDetail.module.css';

const DefendantDetails = () => {
  const { businesscardId, defendantId } = useParams();
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

  useEffect(() => {
    loadDefendantDetails();
    loadOptions();
    loadDecisions();
  }, [businesscardId, defendantId]);

  const loadDefendantDetails = async () => {
    try {
      setLoading(true);
      const data = await CriminalCaseService.getDefendantById(businesscardId, defendantId);
      
      // Если в данных есть name, используем его, иначе вычисляем
      const defendantData = {
        ...data,
        // Используем name из API, если есть, иначе используем sides_case_person.name
        name: data.name || data.sides_case_person?.name || 'Не указано'
      };
      
      setDefendant(defendantData);
      setFormData(defendantData);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных подсудимого:', error);
      setLoading(false);
    }
  };

  const loadDecisions = async () => {
    try {
      const response = await CriminalCaseService.getDecisionsByCardId(businesscardId);
      if (response && response.length > 0) {
        // Фильтруем решения, относящиеся к данному подсудимому
        const defendantDecisions = response.filter(decision => 
          decision.defendants?.some(def => def.id === parseInt(defendantId)) || 
          decision.defendant_id === parseInt(defendantId)
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (field, date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date || null
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await CriminalCaseService.updateDefendant(businesscardId, defendantId, formData);
      setIsEditing(false);
      await loadDefendantDetails();
      setSaving(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(defendant);
    setIsEditing(false);
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

  const formatBoolean = (value) => {
    return value ? 'Да' : 'Нет';
  };

  const getOptionLabel = (optionsArray, value) => {
    return optionsArray.find(opt => opt.value === value)?.label || 'Не указано';
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
  console.log('Defendant data:', defendant);
console.log('Sides case person:', defendant.sides_case_person);
console.log('Sides cases:', defendant.sides_case_person?.sides_case);

  if (!defendant) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Подсудимый не найден</h2>
          <button 
            onClick={() => navigate(`/cases/${businesscardId}/defendants`)}
            className={styles.backButton}
          >
            Вернуться к списку
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
          <h1 className={styles.title}>
            {defendant.name || defendant.sides_case_person?.name || 'Имя не указано'}
          </h1>
          
Вид стороны: {
  defendant.sides_case_person?.sides_case?.map(side => side.sides_case).join(', ') || 
  'Не указан'
}
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
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
              {/* Вкладка: Основные данные */}
              {activeTab === 'basic' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Личные данные</h3>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Полное ФИО</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{defendant.name || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата рождения</label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="birth_date"
                            value={formData.birth_date || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(defendant.birth_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Пол</label>
                        {isEditing ? (
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
                          <span>{getDisplayValue(defendant.sex, options.sex)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Гражданство</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="citizenship"
                            value={formData.citizenship || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{defendant.citizenship || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={`${styles.field} ${styles.fullWidth}`}>
                        <label>Адрес проживания</label>
                        {isEditing ? (
                          <textarea
                            name="address"
                            value={formData.address || ''}
                            onChange={handleInputChange}
                            className={styles.textarea}
                            rows="3"
                          />
                        ) : (
                          <span>{defendant.address || 'Не указано'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Уголовная статья</h3>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Статья УК РФ</label>
                        {isEditing ? (
                          <input
                            type="number"
                            name="article"
                            value={formData.article || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>ст. {defendant.article || 'Не указана'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Максимальное наказание</label>
                        {isEditing ? (
                          <input
                            type="number"
                            name="maximum_penalty_article"
                            value={formData.maximum_penalty_article || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>
                            {defendant.maximum_penalty_article ? `${defendant.maximum_penalty_article} лет` : 'Не указано'}
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
                    <p>Статус: {getOptionLabel(options.trial_result, decision.trial_result)}</p>
                    <p>Обжалование: {decision.appeal_present ? 'Есть' : 'Нет'}</p>
                    <button 
                      onClick={() => navigate(`/cases/${businesscardId}/decisions/${decision.id}`)}
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
                  onClick={() => navigate(`/cases/${businesscardId}/decisions/new`)}
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

export default DefendantDetails;