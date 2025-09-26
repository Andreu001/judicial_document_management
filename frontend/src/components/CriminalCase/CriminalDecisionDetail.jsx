import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './CriminalDecisionDetail.module.css';

const CriminalDecisionDetail = () => {
  const { cardId, decisionId } = useParams();
  const navigate = useNavigate();
  const [decisionData, setDecisionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
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
    const fetchDecisionDetails = async () => {
      try {
        setLoading(true);
        
        const decisionResponse = await CriminalCaseService.getDecisionById(cardId, decisionId);
        
        if (decisionResponse) {
          setDecisionData(decisionResponse);
          setFormData(decisionResponse);
        }
        
        // Загрузка опций для выпадающих списков
        await loadOptions();
        
        // Загрузка обвиняемых
        await loadDefendants();
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных судебного решения:', err);
        setError('Не удалось загрузить данные судебного решения');
        setLoading(false);
      }
    };

    fetchDecisionDetails();
  }, [decisionId]);

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
      // Загрузка всех опций из одного эндпоинта для CriminalDecision
      const response = await baseService.get('/criminal_proceedings/criminal-decision-options/');
      
      setOptions({
        appeal_present: response.data.appeal_present || [],
        court_instance: response.data.court_instance || [],
        appeal_consideration_result: response.data.appeal_consideration_result || [],
        civil_claim_result: response.data.civil_claim_result || []
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      // Устанавливаем пустые массивы вместо ошибки
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
      delete dataToSend.id;
      delete dataToSend.criminal_proceedings;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;
      
      const updatedData = await CriminalCaseService.updateDecision(decisionId, dataToSend);
      
      setDecisionData(updatedData);
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
    setFormData(decisionData);
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
  const AppealTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>13. Обжалование приговора</h3>
          
          <div className={styles.field}>
            <label>Обжалование приговора</label>
            {isEditing ? (
              <select
                name="appeal_present"
                value={formData.appeal_present || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.appeal_present.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getOptionLabel(options.appeal_present, decisionData.appeal_present)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата поступления апелляции</label>
            {isEditing ? (
              <input
                type="date"
                name="appeal_date"
                value={formData.appeal_date || ''}
                onChange={(e) => handleDateChange('appeal_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.appeal_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>ФИО заявителя апелляции</label>
            {isEditing ? (
              <input
                type="text"
                name="appeal_applicant"
                value={formData.appeal_applicant || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.appeal_applicant || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Процессуальное положение заявителя</label>
            {isEditing ? (
              <input
                type="text"
                name="appeal_applicant_status"
                value={formData.appeal_applicant_status || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.appeal_applicant_status || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const CourtInstanceTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>14. Направление в суд II инстанции</h3>
          
          <div className={styles.field}>
            <label>Суд II инстанции</label>
            {isEditing ? (
              <select
                name="court_instance"
                value={formData.court_instance || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.court_instance.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getOptionLabel(options.court_instance, decisionData.court_instance)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата направления в суд II инстанции</label>
            {isEditing ? (
              <input
                type="date"
                name="court_sent_date"
                value={formData.court_sent_date || ''}
                onChange={(e) => handleDateChange('court_sent_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_sent_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата возвращения из суда II инстанции</label>
            {isEditing ? (
              <input
                type="date"
                name="court_return_date"
                value={formData.court_return_date || ''}
                onChange={(e) => handleDateChange('court_return_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_return_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Причина возвращения</label>
            {isEditing ? (
              <textarea
                name="court_return_reason"
                value={formData.court_return_reason || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.court_return_reason || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата повторного направления</label>
            {isEditing ? (
              <input
                type="date"
                name="court_resend_date"
                value={formData.court_resend_date || ''}
                onChange={(e) => handleDateChange('court_resend_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_resend_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ConsiderationTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>15. Рассмотрение во II инстанции</h3>
          
          <div className={styles.field}>
            <label>Дата рассмотрения во II инстанции</label>
            {isEditing ? (
              <input
                type="date"
                name="court_consideration_date"
                value={formData.court_consideration_date || ''}
                onChange={(e) => handleDateChange('court_consideration_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_consideration_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Результат рассмотрения во II инстанции</label>
            {isEditing ? (
              <select
                name="appeal_consideration_result"
                value={formData.appeal_consideration_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.appeal_consideration_result.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getOptionLabel(options.appeal_consideration_result, decisionData.appeal_consideration_result)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сущность изменений</label>
            {isEditing ? (
              <textarea
                name="consideration_changes"
                value={formData.consideration_changes || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.consideration_changes || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата поступления из вышестоящего суда</label>
            {isEditing ? (
              <input
                type="date"
                name="higher_court_receipt_date"
                value={formData.higher_court_receipt_date || ''}
                onChange={(e) => handleDateChange('higher_court_receipt_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.higher_court_receipt_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ExecutionTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>16-17. Вступление в силу и исполнение</h3>
          
          <div className={styles.field}>
            <label>Дата вступления в силу</label>
            {isEditing ? (
              <input
                type="date"
                name="sentence_effective_date"
                value={formData.sentence_effective_date || ''}
                onChange={(e) => handleDateChange('sentence_effective_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.sentence_effective_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата обращения к исполнению</label>
            {isEditing ? (
              <input
                type="date"
                name="sentence_execution_date"
                value={formData.sentence_execution_date || ''}
                onChange={(e) => handleDateChange('sentence_execution_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.sentence_execution_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>15.1. Результаты гражданского иска</h3>
          
          <div className={styles.field}>
            <label>Результат гражданского иска</label>
            {isEditing ? (
              <select
                name="civil_claim_result"
                value={formData.civil_claim_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.civil_claim_result.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getOptionLabel(options.civil_claim_result, decisionData.civil_claim_result)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма иска</label>
            {isEditing ? (
              <input
                type="number"
                name="civil_claim_amount"
                value={formData.civil_claim_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.civil_claim_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма госпошлины</label>
            {isEditing ? (
              <input
                type="number"
                name="state_duty_amount"
                value={formData.state_duty_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.state_duty_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма ущерба от хищения</label>
            {isEditing ? (
              <input
                type="number"
                name="theft_damage_amount"
                value={formData.theft_damage_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.theft_damage_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма ущерба от др. преступлений</label>
            {isEditing ? (
              <input
                type="number"
                name="other_damage_amount"
                value={formData.other_damage_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.other_damage_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма морального вреда</label>
            {isEditing ? (
              <input
                type="number"
                name="moral_damage_amount"
                value={formData.moral_damage_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.moral_damage_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Статья УК РФ по моральному вреду</label>
            {isEditing ? (
              <input
                type="text"
                name="moral_damage_article"
                value={formData.moral_damage_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.moral_damage_article || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const SpecialMarksTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>18-20. Особые отметки</h3>
          
          <div className={styles.field}>
            <label>Копия направлена</label>
            {isEditing ? (
              <input
                type="text"
                name="copy_sent_to_1"
                value={formData.copy_sent_to_1 || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.copy_sent_to_1 || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата направления 1</label>
            {isEditing ? (
              <input
                type="date"
                name="copy_sent_date_1"
                value={formData.copy_sent_date_1 || ''}
                onChange={(e) => handleDateChange('copy_sent_date_1', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.copy_sent_date_1)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Соединено с делом №</label>
            {isEditing ? (
              <input
                type="text"
                name="joined_with_case"
                value={formData.joined_with_case || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.joined_with_case || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Выделено в дело №</label>
            {isEditing ? (
              <input
                type="text"
                name="separated_to_case"
                value={formData.separated_to_case || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.separated_to_case || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Вид экспертизы</label>
            {isEditing ? (
              <input
                type="text"
                name="expertise_type"
                value={formData.expertise_type || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.expertise_type || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата направления экспертизы</label>
            {isEditing ? (
              <input
                type="date"
                name="expertise_sent_date"
                value={formData.expertise_sent_date || ''}
                onChange={(e) => handleDateChange('expertise_sent_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.expertise_sent_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата поступления экспертизы</label>
            {isEditing ? (
              <input
                type="date"
                name="expertise_received_date"
                value={formData.expertise_received_date || ''}
                onChange={(e) => handleDateChange('expertise_received_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.expertise_received_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Статья УК РФ о конфискации</label>
            {isEditing ? (
              <input
                type="text"
                name="confiscation_article"
                value={formData.confiscation_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.confiscation_article || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма судебного штрафа</label>
            {isEditing ? (
              <input
                type="number"
                name="court_fine_amount"
                value={formData.court_fine_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.court_fine_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Статья УК РФ о штрафе</label>
            {isEditing ? (
              <input
                type="text"
                name="court_fine_article"
                value={formData.court_fine_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.court_fine_article || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Меры процессуального принуждения</label>
            {isEditing ? (
              <textarea
                name="procedural_coercion"
                value={formData.procedural_coercion || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.procedural_coercion || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата применения мер</label>
            {isEditing ? (
              <input
                type="date"
                name="procedural_coercion_date"
                value={formData.procedural_coercion_date || ''}
                onChange={(e) => handleDateChange('procedural_coercion_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.procedural_coercion_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Процессуальные издержки</label>
            {isEditing ? (
              <input
                type="number"
                name="procedural_costs"
                value={formData.procedural_costs || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.procedural_costs || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Информация о ходатайствах</label>
            {isEditing ? (
              <textarea
                name="petitions_info"
                value={formData.petitions_info || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.petitions_info || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата отзыва ходатайства</label>
            {isEditing ? (
              <input
                type="date"
                name="petitions_withdrawal_date"
                value={formData.petitions_withdrawal_date || ''}
                onChange={(e) => handleDateChange('petitions_withdrawal_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.petitions_withdrawal_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Другие отметки</label>
            {isEditing ? (
              <textarea
                name="other_notes"
                value={formData.other_notes || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.other_notes || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата сдачи в архив</label>
            {isEditing ? (
              <input
                type="date"
                name="archive_date"
                value={formData.archive_date || ''}
                onChange={(e) => handleDateChange('archive_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.archive_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Системная информация</h3>
          
          <div className={styles.field}>
            <label>Дата создания записи</label>
            <span>{formatDate(decisionData.created_at)}</span>
          </div>

          <div className={styles.field}>
            <label>Дата последнего обновления</label>
            <span>{formatDate(decisionData.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );

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

  if (!decisionData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Данные судебного решения не найдены</div>
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
          <h1 className={styles.title}>Судебное решение</h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <div className={styles.editButtons}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
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
                className={`${styles.tab} ${activeTab === 'appeal' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('appeal')}
              >
                13. Обжалование
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'court' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('court')}
              >
                14. Суд II инстанции
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'consideration' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('consideration')}
              >
                15. Рассмотрение
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'execution' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('execution')}
              >
                16-17. Исполнение
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'special' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('special')}
              >
                18-20. Особые отметки
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'appeal' && <AppealTab />}
              {activeTab === 'court' && <CourtInstanceTab />}
              {activeTab === 'consideration' && <ConsiderationTab />}
              {activeTab === 'execution' && <ExecutionTab />}
              {activeTab === 'special' && <SpecialMarksTab />}
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