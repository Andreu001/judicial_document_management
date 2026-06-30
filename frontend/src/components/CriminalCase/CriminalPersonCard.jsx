import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './CriminalPersonCard.module.css';
import ArticleSelector from './ArticleSelector';

const CriminalPersonCard = () => {
  const { proceedingId, defendantId } = useParams();
  const navigate = useNavigate();
  
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('section1');
  const [defendant, setDefendant] = useState(null);
  const [criminalCase, setCriminalCase] = useState(null);
  
  // Состояния для вложенных данных
  const [previousConvictions, setPreviousConvictions] = useState([]);
  const [crimeCompositions, setCrimeCompositions] = useState([]);
  const [sentences, setSentences] = useState([]);
  
  // Состояния для форм добавления
  const [showAddConviction, setShowAddConviction] = useState(false);
  const [showAddCrime, setShowAddCrime] = useState(false);
  const [showAddSentence, setShowAddSentence] = useState(false);
  
  // Новое состояние для формы судимости
  const [newConviction, setNewConviction] = useState({
    sentence_date: '',
    article_id: '',
    article_part: '',
    article_clauses: '',
    punishment_type: '',
    punishment_served: ''
  });
  
  // Новое состояние для формы состава преступления
  const [newCrime, setNewCrime] = useState({
    instance: 'first',
    article_type: '2',
    article_id: '',
    article_part: '',
    article_clauses: '',
    crime_stage: '0',
    recidivism: '0'
  });
  
  const [newSentence, setNewSentence] = useState({
    instance: 'first',
    punishment_category: 'main',
    punishment_type: '',
    amount: '',
    assignment_features: ''
  });
  
  // Опции для select
  const [options, setOptions] = useState({
    sex: [],
    education: [],
    occupation: [],
    court_result: [],
    correctional_institution: [],
    punishment_type: [],
    recidivism: [],
    crime_stage: []
  });
  
  // Форма карточки
  const [formData, setFormData] = useState({
    // Раздел 1
    birth_date: '',
    age_at_crime: '',
    sex: '',
    family_status: '',
    dependents: '',
    citizenship: '',
    residence: '',
    education: '',
    occupation: '',
    profession_profile: '',
    position: '',
    official: '',
    prior_convictions_count: 0,
    // Раздел 5
    first_instance_date: '',
    effective_date: '',
    court_result: '',
    requalification: false,
    hearing_features: '',
    correctional_institution: '',
    treatment_assigned: '',
    sentence_suspension: '',
    fine_type: '',
    court_fine_amount: '',
    // Наказание
    probation_sentence: false,
    probation_period_years: '',
    probation_period_months: '',
    mitigating_circumstances: '',
    aggravating_circumstances: '',
    // Апелляция
    appeal_date: '',
    appeal_result: '',
    // Военнослужащие
    military_rank: '',
    service_years: '',
    service_months: '',
    had_weapon: false,
    // Дополнительно
    notes: '',
    detention_days_total: '',
    is_completed: false
  });
  
  useEffect(() => {
    if (proceedingId && defendantId) {
      loadData();
    }
  }, [proceedingId, defendantId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем данные подсудимого и дела
      const [defendantData, caseData] = await Promise.all([
        CriminalCaseService.getDefendantById(proceedingId, defendantId),
        CriminalCaseService.getCriminalProceedingById(proceedingId)
      ]);
      
      setDefendant(defendantData);
      setCriminalCase(caseData);
      
      // Заменяем try/catch на простую проверку
      const cardData = await CriminalCaseService.getPersonCardByDefendant(defendantId);
      if (cardData) {
          setCard(cardData);
          setFormData({
              ...cardData,
              previous_convictions: undefined,
              crime_compositions: undefined,
              sentences: undefined
          });
          setPreviousConvictions(cardData.previous_convictions || []);
          setCrimeCompositions(cardData.crime_compositions || []);
          setSentences(cardData.sentences || []);
      } else {
          console.log('Карточка не найдена, будет создана новая');
          setCard(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setLoading(false);
    }
  };
  
  const loadOptions = async () => {
    try {
      const [
        defendantOptions,
        criminalOptions
      ] = await Promise.all([
        CriminalCaseService.getDefendantOptions(),
        CriminalCaseService.getCriminalOptions()
      ]);
      
      setOptions({
        sex: defendantOptions.sex || [],
        education: [],
        occupation: [],
        court_result: criminalOptions.case_result || [],
        correctional_institution: [],
        punishment_type: [],
        recidivism: [],
        crime_stage: []
      });
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
  
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Подготавливаем данные для отправки
      const dataToSend = {
        ...formData,
        defendant: parseInt(defendantId),
        criminal_proceedings: parseInt(proceedingId)
      };
      
      // Удаляем лишние поля
      delete dataToSend.defendant_id;
      delete dataToSend.criminal_proceedings_id;
      delete dataToSend.defendant_name;
      delete dataToSend.case_number;
      delete dataToSend.sex_display;
      delete dataToSend.family_status_display;
      delete dataToSend.citizenship_display;
      delete dataToSend.education_display;
      delete dataToSend.occupation_display;
      delete dataToSend.court_result_display;
      delete dataToSend.correctional_institution_display;
      delete dataToSend.appeal_result_display;
      delete dataToSend.military_rank_display;
      delete dataToSend.previous_convictions;
      delete dataToSend.crime_compositions;
      delete dataToSend.sentences;
      delete dataToSend.id;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;
      
      // Очищаем пустые значения
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });
      
      let savedCard;
      if (card) {
        savedCard = await CriminalCaseService.updatePersonCard(card.id, dataToSend);
      } else {
        savedCard = await CriminalCaseService.createPersonCard(dataToSend);
      }
      
      setCard(savedCard);
      setSaving(false);
      alert('Карточка успешно сохранена');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      console.error('Детали ошибки:', error.response?.data);
      setSaving(false);
      
      // Показываем конкретную ошибку
      const errorMessage = error.response?.data?.defendant?.[0] || 
                          error.response?.data?.criminal_proceedings?.[0] ||
                          error.response?.data?.detail ||
                          JSON.stringify(error.response?.data) ||
                          'Ошибка сохранения карточки';
      alert(errorMessage);
    }
  };
  
  const addConviction = async () => {
    try {
      // Проверяем, что карточка существует
      if (!card || !card.id) {
        console.error('Card not found, cannot add conviction');
        alert('Сначала сохраните основную карточку');
        return;
      }

      const convictionData = {
        sentence_date: newConviction.sentence_date || null,
        article_id: newConviction.article_id || null,  // Используем article_id вместо article
        article_part: newConviction.article_part || null,
        article_clauses: newConviction.article_clauses || null,
        punishment_type: newConviction.punishment_type || null,
        punishment_served: newConviction.punishment_served || null
      };

      console.log('Sending conviction data:', convictionData);

      const conviction = await CriminalCaseService.createPreviousConviction(
        card.id,
        convictionData
      );
      
      setPreviousConvictions([...previousConvictions, conviction]);
      setShowAddConviction(false);
      setNewConviction({
        sentence_date: '',
        article_id: '',
        article_part: '',
        article_clauses: '',
        punishment_type: '',
        punishment_served: ''
      });
      
      setFormData(prev => ({
        ...prev,
        prior_convictions_count: previousConvictions.length + 1
      }));
      
      // Перезагружаем карточку для обновления счетчика
      const updatedCard = await CriminalCaseService.getPersonCardByDefendant(defendantId);
      if (updatedCard) {
        setCard(updatedCard);
        setFormData(prev => ({
          ...prev,
          prior_convictions_count: updatedCard.prior_convictions_count || 0
        }));
      }
    } catch (error) {
      console.error('Ошибка добавления судимости:', error);
      console.error('Error response:', error.response?.data);
      alert(`Ошибка добавления судимости: ${JSON.stringify(error.response?.data)}`);
    }
  };
  
  const addCrimeComposition = async () => {
    try {
      if (!card || !card.id) {
        console.error('Card not found, cannot add crime composition');
        alert('Сначала сохраните основную карточку');
        return;
      }

      const crimeData = {
        instance: newCrime.instance,
        article_type: newCrime.article_type,
        article_id: newCrime.article_id || null,  // Используем article_id
        article_part: newCrime.article_part || null,
        article_clauses: newCrime.article_clauses || null,
        crime_stage: newCrime.crime_stage,
        recidivism: newCrime.recidivism
      };

      console.log('Sending crime data:', crimeData);

      const crime = await CriminalCaseService.createCrimeComposition(
        card.id,
        crimeData
      );
      
      setCrimeCompositions([...crimeCompositions, crime]);
      setShowAddCrime(false);
      setNewCrime({
        instance: 'first',
        article_type: '2',
        article_id: '',
        article_part: '',
        article_clauses: '',
        crime_stage: '0',
        recidivism: '0'
      });
    } catch (error) {
      console.error('Ошибка добавления состава преступления:', error);
      console.error('Error response:', error.response?.data);
      alert(`Ошибка добавления состава преступления: ${JSON.stringify(error.response?.data)}`);
    }
  };
  
  const addSentence = async () => {
    try {
      if (!card || !card.id) {
        console.error('Card not found, cannot add sentence');
        alert('Сначала сохраните основную карточку');
        return;
      }

      const sentenceData = {
        instance: newSentence.instance,
        punishment_category: newSentence.punishment_category,
        punishment_type: newSentence.punishment_type,
        amount: newSentence.amount || null,
        assignment_features: newSentence.assignment_features || null
      };

      console.log('Sending sentence data:', sentenceData);

      const sentence = await CriminalCaseService.createSentence(
        card.id,
        sentenceData
      );
      
      setSentences([...sentences, sentence]);
      setShowAddSentence(false);
      setNewSentence({
        instance: 'first',
        punishment_category: 'main',
        punishment_type: '',
        amount: '',
        assignment_features: ''
      });
    } catch (error) {
      console.error('Ошибка добавления наказания:', error);
      console.error('Error response:', error.response?.data);
      alert(`Ошибка добавления наказания: ${JSON.stringify(error.response?.data)}`);
    }
  };
  
  const deleteItem = async (type, id) => {
    try {
      if (type === 'conviction') {
        await CriminalCaseService.deletePreviousConviction(card.id, id);
        setPreviousConvictions(previousConvictions.filter(c => c.id !== id));
        setFormData(prev => ({
          ...prev,
          prior_convictions_count: previousConvictions.length - 1
        }));
      } else if (type === 'crime') {
        await CriminalCaseService.deleteCrimeComposition(card.id, id);
        setCrimeCompositions(crimeCompositions.filter(c => c.id !== id));
      } else if (type === 'sentence') {
        await CriminalCaseService.deleteSentence(card.id, id);
        setSentences(sentences.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error(`Ошибка удаления ${type}:`, error);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };
  
  const getArticleDisplay = (articleDetail, part, clauses) => {
    if (!articleDetail) return 'ст. не указана';
    let result = '';
    if (articleDetail.full_number) {
      result = `Ст. ${articleDetail.full_number}`;
    } else if (articleDetail.id) {
      result = `Статья ID: ${articleDetail.id}`;
    } else {
      return 'ст. не указана';
    }
    if (part) result += ` ч.${part}`;
    if (clauses) {
      const clausesStr = Array.isArray(clauses) ? clauses.join(',') : clauses;
      if (clausesStr) result += ` п.${clausesStr}`;
    }
    return result;
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка карточки...</div>
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
          <div>
            <h1 className={styles.title}>
              Статистическая карточка на подсудимого
            </h1>
            <div className={styles.subtitle}>
              {defendant?.full_name_criminal} — Дело {criminalCase?.case_number_criminal}
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Сохранение...' : 'Сохранить карточку'}
          </button>
          <label className={styles.completedCheckbox}>
            <input
              type="checkbox"
              name="is_completed"
              checked={formData.is_completed}
              onChange={handleInputChange}
            />
            Карточка заполнена
          </label>
        </div>
      </div>
      
      <div className={styles.mainTabs}>
        <button 
          className={`${styles.mainTab} ${activeMainTab === 'section1' ? styles.activeMainTab : ''}`}
          onClick={() => setActiveMainTab('section1')}
        >
          Раздел 1. Сведения о подсудимом
        </button>
        <button 
          className={`${styles.mainTab} ${activeMainTab === 'convictions' ? styles.activeMainTab : ''}`}
          onClick={() => setActiveMainTab('convictions')}
        >
          Раздел 2. Судимости
        </button>
        <button 
          className={`${styles.mainTab} ${activeMainTab === 'crimes' ? styles.activeMainTab : ''}`}
          onClick={() => setActiveMainTab('crimes')}
        >
          Раздел 4. Составы преступлений
        </button>
        <button 
          className={`${styles.mainTab} ${activeMainTab === 'sentence' ? styles.activeMainTab : ''}`}
          onClick={() => setActiveMainTab('sentence')}
        >
          Раздел 5-7. Приговор и наказание
        </button>
        <button 
          className={`${styles.mainTab} ${activeMainTab === 'military' ? styles.activeMainTab : ''}`}
          onClick={() => setActiveMainTab('military')}
        >
          Раздел 9. Военнослужащие
        </button>
        <button 
          className={`${styles.mainTab} ${activeMainTab === 'additional' ? styles.activeMainTab : ''}`}
          onClick={() => setActiveMainTab('additional')}
        >
          Дополнительные сведения
        </button>
      </div>
      
      <div className={styles.content}>
        {/* Раздел 1. Сведения о подсудимом */}
        {activeMainTab === 'section1' && (
          <div className={styles.section}>
            <div className={styles.formGrid}>
              
              <div className={styles.fieldGroup}>
                <label>Возраст на дату совершения преступления</label>
                <input
                  type="number"
                  name="age_at_crime"
                  value={formData.age_at_crime || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="лет"
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Семейное положение</label>
                <select
                  name="family_status"
                  value={formData.family_status || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="1">Холост</option>
                  <option value="2">Женат (замужем)</option>
                  <option value="3">Разведен</option>
                  <option value="4">Вдовец (вдова)</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Наличие иждивенцев</label>
                <select
                  name="dependents"
                  value={formData.dependents || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="0">Нет</option>
                  <option value="1">Несовершеннолетние дети, в том числе малолетние</option>
                  <option value="2">Несовершеннолетние дети старше 14 лет</option>
                  <option value="3">Взрослые нетрудоспособные</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Место жительства</label>
                <select
                  name="residence"
                  value={formData.residence || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="1">Постоянные жители данной местности</option>
                  <option value="2">Беженцы, вынужденные переселенцы</option>
                  <option value="3">Другие жители иной местности</option>
                  <option value="4">Без определенного места жительства</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Образование</label>
                <select
                  name="education"
                  value={formData.education || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="1.1">Высшее профессиональное</option>
                  <option value="2">Среднее профессиональное</option>
                  <option value="3">Среднее общее</option>
                  <option value="4">Основное общее</option>
                  <option value="5">Начальное общее или нет</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Род занятий (социальное положение)</label>
                <select
                  name="occupation"
                  value={formData.occupation || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="1">Рабочий</option>
                  <option value="3">Государственный, муниципальный служащий</option>
                  <option value="4">Служащий коммерческой или иной организации</option>
                  <option value="6">Индивидуальный предприниматель</option>
                  <option value="7">Учащийся, студент</option>
                  <option value="10">Нетрудоспособный (неработающий)</option>
                  <option value="13">Военнослужащий по призыву</option>
                  <option value="14">Военнослужащий по контракту</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Занимаемая должность</label>
                <select
                  name="position"
                  value={formData.position || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="0">Иное недолжностное лицо</option>
                  <option value="1">Руководитель (владелец) предприятия</option>
                  <option value="2">Должностное лицо</option>
                  <option value="3">Недолжностное лицо с материальной ответственностью</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Количество неснятых/непогашенных судимостей</label>
                <input
                  type="number"
                  name="prior_convictions_count"
                  value={formData.prior_convictions_count || 0}
                  onChange={handleInputChange}
                  className={styles.input}
                  readOnly
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Раздел 2. Судимости */}
        {activeMainTab === 'convictions' && (
          <div className={styles.section}>
            <div className={styles.subsectionHeader}>
              <h3>Предыдущие судимости</h3>
              <button 
                onClick={() => setShowAddConviction(true)}
                className={styles.addButton}
              >
                + Добавить судимость
              </button>
            </div>
            
            {previousConvictions.length === 0 && !showAddConviction && (
              <div className={styles.emptyState}>Нет данных о предыдущих судимостях</div>
            )}
            
            {previousConvictions.map(conviction => (
              <div key={conviction.id} className={styles.cardItem}>
                <div className={styles.cardItemHeader}>
                  <span className={styles.cardItemTitle}>
                    Приговор от {formatDate(conviction.sentence_date)} — 
                    {getArticleDisplay(conviction.article_detail, conviction.article_part, conviction.article_clauses)}
                  </span>
                  <button 
                    onClick={() => deleteItem('conviction', conviction.id)}
                    className={styles.deleteButton}
                  >
                    Удалить
                  </button>
                </div>
                <div className={styles.cardItemDetails}>
                  <div>Вид наказания: {conviction.punishment_type_display || conviction.punishment_type}</div>
                  <div>Отбытие: {conviction.punishment_served_display || conviction.punishment_served}</div>
                </div>
              </div>
            ))}
            
            {showAddConviction && (
              <div className={styles.addForm}>
                <h4>Добавление судимости</h4>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label>Дата приговора</label>
                    <input
                      type="date"
                      value={newConviction.sentence_date}
                      onChange={(e) => setNewConviction({...newConviction, sentence_date: e.target.value})}
                      className={styles.input}
                    />
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <ArticleSelector
                      value={newConviction.article_id}
                      onChange={(id) => {
                        console.log('Article selected:', id);
                        setNewConviction(prev => ({...prev, article_id: id, article_part: '', article_clauses: ''}));
                      }}
                      onPartChange={(part) => {
                        console.log('Part selected:', part);
                        setNewConviction(prev => ({...prev, article_part: part, article_clauses: ''}));
                      }}
                      onClausesChange={(clauses) => {
                        console.log('Clauses selected:', clauses);
                        const clausesStr = Array.isArray(clauses) ? clauses.join(',') : clauses;
                        setNewConviction(prev => ({...prev, article_clauses: clausesStr}));
                      }}
                      partValue={newConviction.article_part}
                      clausesValue={newConviction.article_clauses}
                      label="Статья УК РФ"
                    />
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label>Вид наказания</label>
                    <select
                      value={newConviction.punishment_type}
                      onChange={(e) => setNewConviction({...newConviction, punishment_type: e.target.value})}
                      className={styles.select}
                    >
                      <option value="">Выберите</option>
                      <option value="1">Штраф</option>
                      <option value="5">Исправительные работы</option>
                      <option value="10">Лишение свободы</option>
                      <option value="7">Ограничение свободы</option>
                      <option value="4">Обязательные работы</option>
                      <option value="14">Принудительные работы</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button onClick={addConviction} className={styles.saveButton}>Добавить</button>
                  <button onClick={() => setShowAddConviction(false)} className={styles.cancelButton}>Отмена</button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Раздел 4. Составы преступлений */}
        {activeMainTab === 'crimes' && (
          <div className={styles.section}>
            <div className={styles.subsectionHeader}>
              <h3>Составы преступлений</h3>
              <button 
                onClick={() => setShowAddCrime(true)}
                className={styles.addButton}
              >
                + Добавить состав
              </button>
            </div>
            
            {crimeCompositions.length === 0 && !showAddCrime && (
              <div className={styles.emptyState}>Нет данных о составах преступлений</div>
            )}
            
            {crimeCompositions.map(crime => (
              <div key={crime.id} className={styles.cardItem}>
                <div className={styles.cardItemHeader}>
                  <span className={styles.cardItemTitle}>
                    {crime.instance === 'first' ? 'I инстанция' : 'Апелляция'} — 
                    {getArticleDisplay(crime.article_detail, crime.article_part, crime.article_clauses)}
                    {crime.article_type === '1' && ' (основная)'}
                  </span>
                  <button 
                    onClick={() => deleteItem('crime', crime.id)}
                    className={styles.deleteButton}
                  >
                    Удалить
                  </button>
                </div>
                <div className={styles.cardItemDetails}>
                  <div>Стадия: {crime.crime_stage_display || crime.crime_stage}</div>
                  <div>Рецидив: {crime.recidivism_display || crime.recidivism}</div>
                  {crime.crime_date && <div>Дата преступления: {formatDate(crime.crime_date)}</div>}
                </div>
              </div>
            ))}
            
              {showAddCrime && (
                <div className={styles.addForm}>
                  <h4>Добавление состава преступления</h4>
                  <div className={styles.formGrid}>
                    <div className={styles.fieldGroup}>
                      <label>Инстанция</label>
                      <select
                        value={newCrime.instance}
                        onChange={(e) => setNewCrime({...newCrime, instance: e.target.value})}
                        className={styles.select}
                      >
                        <option value="first">Первая инстанция</option>
                        <option value="appeal">Апелляция</option>
                      </select>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Тип статьи</label>
                      <select
                        value={newCrime.article_type}
                        onChange={(e) => setNewCrime({...newCrime, article_type: e.target.value})}
                        className={styles.select}
                      >
                        <option value="1">Основная статья</option>
                        <option value="2">Дополнительная квалификация</option>
                      </select>
                    </div>
                    <div className={styles.fieldGroup}>
                      <ArticleSelector
                        value={newCrime.article_id}
                        onChange={(id) => {
                          setNewCrime(prev => ({...prev, article_id: id, article_part: '', article_clauses: ''}));
                        }}
                        onPartChange={(part) => {
                          setNewCrime(prev => ({...prev, article_part: part, article_clauses: ''}));
                        }}
                        onClausesChange={(clauses) => {
                          const clausesStr = Array.isArray(clauses) ? clauses.join(',') : clauses;
                          setNewCrime(prev => ({...prev, article_clauses: clausesStr}));
                        }}
                        partValue={newCrime.article_part}
                        clausesValue={newCrime.article_clauses}
                        label="Статья УК РФ"
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Стадия преступления</label>
                      <select
                        value={newCrime.crime_stage}
                        onChange={(e) => setNewCrime({...newCrime, crime_stage: e.target.value})}
                        className={styles.select}
                      >
                        <option value="0">Оконченное</option>
                        <option value="1">Приготовление</option>
                        <option value="2">Покушение</option>
                      </select>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Рецидив</label>
                      <select
                        value={newCrime.recidivism}
                        onChange={(e) => setNewCrime({...newCrime, recidivism: e.target.value})}
                        className={styles.select}
                      >
                        <option value="0">Отсутствует</option>
                        <option value="1">Рецидив</option>
                        <option value="2">Опасный рецидив</option>
                        <option value="3">Особо опасный рецидив</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button onClick={addCrimeComposition} className={styles.saveButton}>Добавить</button>
                    <button onClick={() => setShowAddCrime(false)} className={styles.cancelButton}>Отмена</button>
                  </div>
                </div>
              )}
          </div>
        )}
        
        {/* Раздел 5-7. Приговор и наказание */}
        {activeMainTab === 'sentence' && (
          <div className={styles.section}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label>Дата рассмотрения дела (I инстанция)</label>
                <input
                  type="date"
                  name="first_instance_date"
                  value={formData.first_instance_date || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Дата вступления приговора в силу</label>
                <input
                  type="date"
                  name="effective_date"
                  value={formData.effective_date || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Результат рассмотрения</label>
                <select
                  name="court_result"
                  value={formData.court_result || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="1">Осуждено</option>
                  <option value="3.1">Оправдано (отсутствие события, состава)</option>
                  <option value="3.2">Оправдано (непричастность)</option>
                  <option value="4">Применены меры медицинского характера</option>
                  <option value="10">Прекращено: примирение с потерпевшим</option>
                  <option value="21">Назначена мера уголовно-правового характера - судебный штраф</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Вид исправительного учреждения</label>
                <select
                  name="correctional_institution"
                  value={formData.correctional_institution || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="0">Не назначалось</option>
                  <option value="1">Воспитательная колония</option>
                  <option value="3">Колония-поселение</option>
                  <option value="4">Колония общего режима</option>
                  <option value="5">Колония строгого режима</option>
                  <option value="6">Колония особого режима</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Смягчающие обстоятельства</label>
                <select
                  name="mitigating_circumstances"
                  value={formData.mitigating_circumstances || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="0">Отсутствуют</option>
                  <option value="1">Предусмотренные ч. 1 ст. 61 УК РФ</option>
                  <option value="2">Предусмотренные ч. 2 ст. 61 УК РФ</option>
                  <option value="12">Предусмотренные ч. 1 и 2 ст. 61 УК РФ</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Отягчающие обстоятельства</label>
                <select
                  name="aggravating_circumstances"
                  value={formData.aggravating_circumstances || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="0">Отсутствуют</option>
                  <option value="1">Предусмотренные ч. 1 и ч. 1.1 ст. 63 УК РФ</option>
                  <option value="2">Состояние опьянения (ч. 1.1 ст. 63 УК РФ)</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="probation_sentence"
                    checked={formData.probation_sentence}
                    onChange={handleInputChange}
                  />
                  Условное осуждение
                </label>
              </div>
              
              {formData.probation_sentence && (
                <>
                  <div className={styles.fieldGroup}>
                    <label>Испытательный срок (лет)</label>
                    <input
                      type="number"
                      name="probation_period_years"
                      value={formData.probation_period_years || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Испытательный срок (месяцев)</label>
                    <input
                      type="number"
                      name="probation_period_months"
                      value={formData.probation_period_months || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                </>
              )}
              
              <div className={styles.fieldGroup}>
                <label>Сумма судебного штрафа (руб.)</label>
                <input
                  type="number"
                  name="court_fine_amount"
                  value={formData.court_fine_amount || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
            </div>
            
            {/* Назначенные наказания */}
            <div className={styles.subsectionHeader}>
              <h3>Назначенные наказания</h3>
              <button 
                onClick={() => setShowAddSentence(true)}
                className={styles.addButton}
              >
                + Добавить наказание
              </button>
            </div>
            
            {sentences.length === 0 && !showAddSentence && (
              <div className={styles.emptyState}>Нет данных о назначенных наказаниях</div>
            )}
            
            {sentences.map(sentence => (
              <div key={sentence.id} className={styles.cardItem}>
                <div className={styles.cardItemHeader}>
                  <span className={styles.cardItemTitle}>
                    {sentence.instance === 'first' ? 'I инстанция' : 'Апелляция'} — 
                    {sentence.punishment_category === 'main' ? 'Основное' : 
                     sentence.punishment_category === 'additional' ? 'Дополнительное' : 'Основное (самостоятельно)'}
                  </span>
                  <button 
                    onClick={() => deleteItem('sentence', sentence.id)}
                    className={styles.deleteButton}
                  >
                    Удалить
                  </button>
                </div>
                <div className={styles.cardItemDetails}>
                  <div>Вид: {sentence.punishment_type_display || sentence.punishment_type}</div>
                  {sentence.amount && <div>Размер: {sentence.amount} {sentence.unit || ''}</div>}
                </div>
              </div>
            ))}
            
            {showAddSentence && (
              <div className={styles.addForm}>
                <h4>Добавление наказания</h4>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label>Инстанция</label>
                    <select
                      value={newSentence.instance}
                      onChange={(e) => setNewSentence({...newSentence, instance: e.target.value})}
                      className={styles.select}
                    >
                      <option value="first">Первая инстанция</option>
                      <option value="appeal">Апелляция</option>
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Категория</label>
                    <select
                      value={newSentence.punishment_category}
                      onChange={(e) => setNewSentence({...newSentence, punishment_category: e.target.value})}
                      className={styles.select}
                    >
                      <option value="main">Основное наказание</option>
                      <option value="main_separate">Основное наказание, исполняемое самостоятельно</option>
                      <option value="additional">Дополнительное наказание</option>
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Вид наказания</label>
                    <select
                      value={newSentence.punishment_type}
                      onChange={(e) => setNewSentence({...newSentence, punishment_type: e.target.value})}
                      className={styles.select}
                    >
                      <option value="">Выберите</option>
                      <option value="1">Штраф</option>
                      <option value="5">Исправительные работы</option>
                      <option value="10">Лишение свободы</option>
                      <option value="7">Ограничение свободы</option>
                      <option value="4">Обязательные работы</option>
                      <option value="14">Принудительные работы</option>
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Размер</label>
                    <input
                      type="text"
                      value={newSentence.amount}
                      onChange={(e) => setNewSentence({...newSentence, amount: e.target.value})}
                      className={styles.input}
                      placeholder="например, 2 года 6 месяцев"
                    />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button onClick={addSentence} className={styles.saveButton}>Добавить</button>
                  <button onClick={() => setShowAddSentence(false)} className={styles.cancelButton}>Отмена</button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Раздел 9. Военнослужащие */}
        {activeMainTab === 'military' && (
          <div className={styles.section}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label>Воинское звание</label>
                <select
                  name="military_rank"
                  value={formData.military_rank || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="1">Рядовой (матрос)</option>
                  <option value="5">Лейтенант</option>
                  <option value="6">Старший лейтенант</option>
                  <option value="7">Капитан (капитан-лейтенант)</option>
                  <option value="8">Майор (капитан 3 ранга)</option>
                  <option value="9">Подполковник (капитан 2 ранга)</option>
                  <option value="10">Полковник (капитан 1 ранга)</option>
                </select>
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Срок службы (лет)</label>
                <input
                  type="number"
                  name="service_years"
                  value={formData.service_years || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Срок службы (месяцев)</label>
                <input
                  type="number"
                  name="service_months"
                  value={formData.service_months || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="had_weapon"
                    checked={formData.had_weapon}
                    onChange={handleInputChange}
                  />
                  Совершено с оружием
                </label>
              </div>
            </div>
          </div>
        )}
        
        {/* Дополнительные сведения */}
        {activeMainTab === 'additional' && (
          <div className={styles.section}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label>Дата апелляционного рассмотрения</label>
                <input
                  type="date"
                  name="appeal_date"
                  value={formData.appeal_date || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label>Результат апелляции</label>
                <select
                  name="appeal_result"
                  value={formData.appeal_result || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  <option value="0">Не рассматривалось</option>
                  <option value="1">Оставлен без изменения</option>
                  <option value="8">Изменено наказание</option>
                  <option value="2">Отменен с оправданием</option>
                </select>
              </div>
              
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label>Срок содержания под стражей (всего дней)</label>
                <input
                  type="number"
                  name="detention_days_total"
                  value={formData.detention_days_total || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label>Примечания</label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriminalPersonCard;