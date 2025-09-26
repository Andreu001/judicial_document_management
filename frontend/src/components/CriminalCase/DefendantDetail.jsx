import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './DefendantDetail.module.css';

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

  // Компоненты вкладок
  const BasicInfoTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>1. Основные сведения</h3>
          
          <div className={styles.field}>
            <label>Статья</label>
            {isEditing ? (
              <input
                type="text"
                name="article"
                value={formData.article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.article || 'Не указано'}</span>
            )}
          </div>
          <div className={styles.field}>
            <label>Максимальное наказание по статье</label>
            {isEditing ? (
              <input
                type="text"
                name="maximum_penalty_article"
                value={formData.maximum_penalty_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.maximum_penalty_article || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>ФИО подсудимого</label>
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.full_name || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата рождения</label>
            {isEditing ? (
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date || ''}
                onChange={(e) => handleDateChange('birth_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(defendantData.birth_date)}</span>
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
                <option value="">Выберите</option>
                {options.sex.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.sex, defendantData.sex)}</span>
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
              <span>{defendantData.citizenship || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Адрес проживания</label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.address || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const RestraintTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>2. Меры пресечения</h3>
          
          <div className={styles.field}>
            <label>Мера пресечения</label>
            {isEditing ? (
              <select
                name="restraint_measure"
                value={formData.restraint_measure || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.restraintMeasure.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.restraintMeasure, defendantData.restraint_measure)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата избрания меры пресечения</label>
            {isEditing ? (
              <input
                type="date"
                name="restraint_date"
                value={formData.restraint_date || ''}
                onChange={(e) => handleDateChange('restraint_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(defendantData.restraint_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Мера пресечения применена</label>
            {isEditing ? (
              <select
                name="restraint_application"
                value={formData.restraint_application || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.restraintApplication.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.restraintApplication, defendantData.restraint_application)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Изменение меры пресечения</label>
            {isEditing ? (
              <select
                name="restraint_change"
                value={formData.restraint_change || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.restraintChange.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.restraintChange, defendantData.restraint_change)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата изменения меря пресечения</label>
            {isEditing ? (
              <input
                type="date"
                name="restraint_change_date"
                value={formData.restraint_change_date || ''}
                onChange={(e) => handleDateChange('restraint_change_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(defendantData.restraint_change_date)}</span>
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
              <span>{defendantData.restraint_change_to || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const PunishmentTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>3. Наказание</h3>
          
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
              <span>{defendantData.conviction_article || 'Не указано'}</span>
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
              <span>{defendantData.punishment_type || 'Не указано'}</span>
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
              <span>{defendantData.punishment_term || 'Не указано'}</span>
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
              <span>{defendantData.additional_punishment || 'Не указано'}</span>
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
              <span>{defendantData.parole_info || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const DamageTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>4. Ущерб и взыскания</h3>
          
          <div className={styles.field}>
            <label>Сумма ущерба</label>
            {isEditing ? (
              <input
                type="number"
                name="property_damage"
                value={formData.property_damage || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{defendantData.property_damage || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма морального вреда</label>
            {isEditing ? (
              <input
                type="number"
                name="moral_damage"
                value={formData.moral_damage || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{defendantData.moral_damage || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const DetentionTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>5. Место содержания</h3>
          
          <div className={styles.field}>
            <label>Содержится в учреждении</label>
            {isEditing ? (
              <input
                type="text"
                name="detention_institution"
                value={formData.detention_institution || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.detention_institution || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Адрес учреждения</label>
            {isEditing ? (
              <input
                type="text"
                name="detention_address"
                value={formData.detention_address || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.detention_address || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const AdditionalTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>6. Дополнительные сведения</h3>
          
          <div className={styles.field}>
            <label>Результат рассмотрения по данному лицу</label>
            {isEditing ? (
              <input
                type="text"
                name="trial_result"
                value={formData.trial_result || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.trial_result || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Особые отметки по лицу</label>
            {isEditing ? (
              <textarea
                name="special_notes"
                value={formData.special_notes || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{defendantData.special_notes || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата создания записи</label>
            <span>{formatDate(defendantData.created_at)}</span>
          </div>

          <div className={styles.field}>
            <label>Дата последнего обновления</label>
            <span>{formatDate(defendantData.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );

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
                1. Основные сведения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'restraint' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('restraint')}
              >
                2. Меры пресечения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'punishment' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('punishment')}
              >
                3. Наказание
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'damage' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('damage')}
              >
                4. Ущерб и взыскания
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'detention' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('detention')}
              >
                5. Место содержания
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'additional' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                6. Дополнительно
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'basic' && <BasicInfoTab />}
              {activeTab === 'restraint' && <RestraintTab />}
              {activeTab === 'punishment' && <PunishmentTab />}
              {activeTab === 'damage' && <DamageTab />}
              {activeTab === 'detention' && <DetentionTab />}
              {activeTab === 'additional' && <AdditionalTab />}
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