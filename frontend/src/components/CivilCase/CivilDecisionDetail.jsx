import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import baseService from '../../API/baseService';
import styles from './CivilDecisionDetail.module.css';
import {
  ConsiderationTab,
  AppealTab,
  ExecutionTab,
  AdditionalTab,
  CostsTab
} from './CivilDecisionTabComponents';

const CivilDecisionDetail = () => {
  const { cardId, decisionId } = useParams();
  const navigate = useNavigate();
  const [decisionData, setDecisionData] = useState(null);
  const [civilData, setCivilData] = useState(null);
  const [sides, setSides] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({
    ruling_type: [],
    consideration_result_main: [],
    consideration_result_additional: [],
    consideration_result_counter: [],
    second_instance_result: [],
    court_composition: []
  });
  const [activeTab, setActiveTab] = useState('consideration');

  useEffect(() => {
    const fetchDecisionDetails = async () => {
      try {
        setLoading(true);
        
        // Загрузка гражданского дела
        const civilResponse = await CivilCaseService.getByBusinessCardId(cardId);
        if (civilResponse) {
          setCivilData(civilResponse);
          
          // Загрузка решения
          const decisionResponse = await CivilCaseService.getDecisionById(civilResponse.id, decisionId);
          
          if (decisionResponse) {
            setDecisionData(decisionResponse);
            setFormData(decisionResponse);
          }
          
          // Загрузка сторон
          const sidesResponse = await CivilCaseService.getSides(civilResponse.id);
          setSides(sidesResponse);
        }
        
        // Загрузка опций
        await loadOptions();
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных судебного решения:', err);
        setError('Не удалось загрузить данные судебного решения');
        setLoading(false);
      }
    };

    fetchDecisionDetails();
  }, [cardId, decisionId]);

  const loadOptions = async () => {
    try {
      const response = await CivilCaseService.getDecisionOptions();
      setOptions({
        ruling_type: response.ruling_type || [],
        consideration_result_main: response.consideration_result_main || [],
        consideration_result_additional: response.consideration_result_additional || [],
        consideration_result_counter: response.consideration_result_counter || [],
        second_instance_result: response.second_instance_result || [],
        court_composition: response.court_composition || []
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      setOptions({});
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
      
      if (!civilData || !civilData.id) {
        throw new Error('Гражданское дело не найдено');
      }
      
      const dataToSend = { ...formData };
      delete dataToSend.id;
      delete dataToSend.civil_proceedings;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;
      
      const updatedData = await CivilCaseService.updateDecision(
        civilData.id, 
        decisionId, 
        dataToSend
      );
      
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

  const formatCurrency = (amount) => {
    if (!amount) return '0 руб.';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(amount);
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
          <h1 className={styles.title}>
            Решение по гражданскому делу №{civilData?.business_card_data?.original_name || ''}
          </h1>
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
                className={`${styles.tab} ${activeTab === 'consideration' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('consideration')}
              >
                Рассмотрение дела
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'appeal' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('appeal')}
              >
                Обжалование
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'execution' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('execution')}
              >
                Исполнение
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'costs' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('costs')}
              >
                Издержки и взыскания
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'additional' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                Дополнительно
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'consideration' && (
                <ConsiderationTab
                  isEditing={isEditing}
                  formData={formData}
                  options={options}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  decisionData={decisionData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  formatBoolean={formatBoolean}
                />
              )}
              
              {activeTab === 'appeal' && (
                <AppealTab
                  isEditing={isEditing}
                  formData={formData}
                  options={options}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  decisionData={decisionData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  formatBoolean={formatBoolean}
                />
              )}
              
              {activeTab === 'execution' && (
                <ExecutionTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  decisionData={decisionData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
              )}
              
              {activeTab === 'costs' && (
                <CostsTab
                  isEditing={isEditing}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  decisionData={decisionData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
              )}
              
              {activeTab === 'additional' && (
                <AdditionalTab
                  isEditing={isEditing}
                  formData={formData}
                  options={options}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  decisionData={decisionData}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                  formatBoolean={formatBoolean}
                />
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - стороны и итоги */}
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Стороны по делу</h2>
            
            {sides.length > 0 ? (
              <div className={styles.sidesList}>
                {sides.map(side => (
                  <div key={side.id} className={styles.sideItem}>
                    <h4>Истец:</h4>
                    <p>{side.plaintiff_name || 'Не указан'}</p>
                    
                    <h4>Ответчик:</h4>
                    <p>{side.defendant_name || 'Не указан'}</p>
                    
                    <div className={styles.claimsSummary}>
                      <p><strong>Основное требование:</strong> {formatCurrency(side.main_claim_amount)}</p>
                      {side.additional_claim_amount > 0 && (
                        <p><strong>Дополнительное:</strong> {formatCurrency(side.additional_claim_amount)}</p>
                      )}
                      {side.counter_claim_amount_main > 0 && (
                        <p><strong>Встречное:</strong> {formatCurrency(side.counter_claim_amount_main)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Стороны не добавлены</p>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Итоги решения</h2>
            
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <strong>Дата рассмотрения:</strong>
                <span>{formatDate(decisionData.considered_date)}</span>
              </div>
              
              <div className={styles.summaryItem}>
                <strong>Вид постановления:</strong>
                <span>{getOptionLabel(options.ruling_type, decisionData.ruling_type)}</span>
              </div>
              
              <div className={styles.summaryItem}>
                <strong>Результат (осн.):</strong>
                <span>{getOptionLabel(options.consideration_result_main, decisionData.consideration_result_main)}</span>
              </div>
              
              {decisionData.amicable_agreement && (
                <div className={styles.summaryItem}>
                  <strong>Мировое соглашение:</strong>
                  <span className={styles.success}>Заключено</span>
                </div>
              )}
              
              {decisionData.awarded_main > 0 && (
                <div className={styles.summaryItem}>
                  <strong>Присуждено:</strong>
                  <span className={styles.amount}>{formatCurrency(decisionData.awarded_main)}</span>
                </div>
              )}
              
              <div className={styles.summaryItem}>
                <strong>Вступило в силу:</strong>
                <span>{formatDate(decisionData.effective_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivilDecisionDetail;
