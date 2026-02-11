import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './LawyerDetails.module.css';

const CriminalLawyerDetails = () => {
  const { proceedingId, lawyerId } = useParams();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [sidesCaseOptions, setSidesCaseOptions] = useState([]);
  const [selectedSideId, setSelectedSideId] = useState('');
  
  // Определяем режим создания
  const isCreateMode = !lawyerId || lawyerId === 'create';

  useEffect(() => {
    if (proceedingId) {
      if (isCreateMode) {
        // Режим создания
        setLoading(false);
        setLawyer(null);
        setFormData({});
        setIsEditing(true);
        loadSidesCaseOptions();
      } else if (lawyerId) {
        // Режим редактирования/просмотра
        loadLawyerDetails();
        loadSidesCaseOptions();
      }
    }
  }, [proceedingId, lawyerId]);

  const loadLawyerDetails = async () => {
    if (isCreateMode) {
      setLoading(false);
      setLawyer(null);
      setFormData({});
      setSelectedSideId('');
      return;
    }

    try {
      setLoading(true);
      const data = await CriminalCaseService.getLawyerById(proceedingId, lawyerId);
      
      // Обрабатываем вложенные данные адвоката
      const lawyerDetails = data.lawyer_detail || data.sides_case_lawyer_criminal_data || {};
      const lawyerData = {
        ...data,
        ...lawyerDetails,
        sides_case_lawyer_id: data.sides_case_lawyer_id || 
                              data.sides_case_lawyer?.id || 
                              data.sides_case_lawyer || 
                              null,
        sides_case_lawyer_name: data.sides_case_lawyer_name || 
                               data.sides_case_lawyer?.sides_case || 
                               data.sides_case_lawyer_detail?.sides_case || 
                               'Не указан'
      };
      
      setLawyer(lawyerData);
      setFormData(lawyerData);
      setSelectedSideId(lawyerData.sides_case_lawyer_id ? 
                       String(lawyerData.sides_case_lawyer_id) : '');
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных адвоката:', error);
      setLoading(false);
      setLawyer(null);
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

  const isLawyerSide = (sideId) => {
    // ID сторон, которые являются адвокатами (дополнить при необходимости)
    const lawyerSideIds = ['1', '2', '3']; 
    return lawyerSideIds.includes(String(sideId));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'sides_case_lawyer') {
      setSelectedSideId(value);
      
      const selectedSide = sidesCaseOptions.find(option => 
        String(option.id) === String(value)
      );
      
      setFormData(prev => ({
        ...prev,
        sides_case_lawyer: value ? parseInt(value, 10) : null,
        sides_case_lawyer_name: selectedSide ? selectedSide.sides_case : ''
      }));
    } else {
      // Для всех полей адвоката
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Собираем данные для связанной модели Lawyer
      const lawyerDetailData = {
        // Основная информация адвоката
        law_firm_name: formData.law_firm_name || '',
        law_firm_address: formData.law_firm_address || '',
        law_firm_phone: formData.law_firm_phone || '',
        law_firm_email: formData.law_firm_email || '',
        // Документы
        lawyer_certificate_number: formData.lawyer_certificate_number || '',
        // Исправляем: для дат отправляем null вместо пустой строки
        lawyer_certificate_date: formData.lawyer_certificate_date || null,
        // Финансовая информация
        bank_name: formData.bank_name || '',
        bank_bik: formData.bank_bik || '',
        correspondent_account: formData.correspondent_account || '',
        payment_account: formData.payment_account || '',
        days_for_payment: formData.days_for_payment || 0,
        payment_amount: formData.payment_amount || 0,
        // Исправляем: для дат отправляем null вместо пустой строки
        payment_date: formData.payment_date || null,
        // Примечания
        notes: formData.notes || ''
      };

      // Основные данные для LawyerCriminal
      const lawyerData = {
        sides_case_lawyer: selectedSideId ? parseInt(selectedSideId, 10) : null,
        sides_case_lawyer_criminal_data: lawyerDetailData
      };

      console.log('Отправляемые данные адвоката:', lawyerData);

      // Проверка обязательных полей
      if (!lawyerData.sides_case_lawyer) {
        alert('Пожалуйста, выберите вид стороны для адвоката');
        setSaving(false);
        return;
      }
      
      let savedLawyer;
      if (isCreateMode) {
        // Отправляем данные для создания
        savedLawyer = await CriminalCaseService.createLawyer(proceedingId, lawyerData);
        // После создания редиректим назад
        navigate(-1);
      } else {
        // Отправляем данные для обновления
        await CriminalCaseService.updateLawyer(proceedingId, lawyerId, lawyerData);
        setIsEditing(false);
        await loadLawyerDetails();
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Ошибка сохранения адвоката:', error);
      console.error('Детали ошибки:', error.response?.data);
      setSaving(false);
      
      if (error.response?.data) {
        if (error.response.data.sides_case_lawyer) {
          alert(`Ошибка в поле "Вид стороны": ${error.response.data.sides_case_lawyer[0]}`);
        } else if (error.response.data.detail) {
          alert(`Ошибка: ${error.response.data.detail}`);
        } else {
          alert('Произошла ошибка при сохранении адвоката');
        }
      }
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate(-1);
    } else {
      setFormData(lawyer);
      setSelectedSideId(lawyer?.sides_case_lawyer_id ? 
                       String(lawyer.sides_case_lawyer_id) : '');
      setIsEditing(false);
    }
  };

  const handleEditStart = () => {
    if (formData.sides_case_lawyer_id) {
      setSelectedSideId(String(formData.sides_case_lawyer_id));
    } else {
      setSelectedSideId('');
    }
    setIsEditing(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Не указано';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка данных адвоката...</p>
        </div>
      </div>
    );
  }

  if (!lawyer && !isCreateMode) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Адвокат не найден</h2>
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

  const tabs = [
    { id: 'general', label: 'Основная информация' },
    { id: 'certificate', label: 'Документы' },
    { id: 'finance', label: 'Финансовая информация' },
    { id: 'notes', label: 'Примечания' }
  ];

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
              {isCreateMode ? 'Новый адвокат' : (formData.law_firm_name || 'Адвокат')}
              {!isCreateMode && (
                <span> | Вид стороны: {lawyer?.sides_case_lawyer_name || 'Не указан'}</span>
              )}
            </h1>
            <div className={styles.subtitle}>
              <span>Уголовное дело: {proceedingId}</span>
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

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContentWrapper}>
          <div className={styles.tabContent}>
            {/* Вкладка: Основная информация */}
            {activeTab === 'general' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Выбор типа стороны
                </h3>
                <div className={styles.field}>
                  <label>Вид стороны *</label>
                  {isEditing || isCreateMode ? (
                    <select
                      name="sides_case_lawyer"
                      value={selectedSideId || ''}
                      onChange={handleInputChange}
                      className={styles.select}
                      required
                      disabled={!isCreateMode && !isEditing}
                    >
                      <option value="">Выберите вид стороны (адвокат)</option>
                      {sidesCaseOptions
                        .filter(side => isLawyerSide(side.id))
                        .map(side => (
                          <option key={side.id} value={String(side.id)}>
                            {side.sides_case}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <span>{lawyer?.sides_case_lawyer_name || 'Не указан'}</span>
                  )}
                </div>

                <h3 className={styles.subsectionTitle} style={{ marginTop: '2rem' }}>
                  Адвокатское образование
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>Название адвокатского образования</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="text"
                        name="law_firm_name"
                        value={formData.law_firm_name || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Например: Адвокатский кабинет Петрова И.И."
                      />
                    ) : (
                      <span>{lawyer?.law_firm_name || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Адрес</label>
                    {isEditing || isCreateMode ? (
                      <textarea
                        name="law_firm_address"
                        value={formData.law_firm_address || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows="2"
                        placeholder="Юридический адрес"
                      />
                    ) : (
                      <span>{lawyer?.law_firm_address || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Телефон</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="tel"
                        name="law_firm_phone"
                        value={formData.law_firm_phone || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="+7 (XXX) XXX-XX-XX"
                      />
                    ) : (
                      <span>{lawyer?.law_firm_phone || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Email</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="email"
                        name="law_firm_email"
                        value={formData.law_firm_email || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="example@domain.com"
                      />
                    ) : (
                      <span>{lawyer?.law_firm_email || 'Не указано'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка: Документы */}
            {activeTab === 'certificate' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Адвокатское удостоверение
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>Номер удостоверения</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="text"
                        name="lawyer_certificate_number"
                        value={formData.lawyer_certificate_number || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Номер адвокатского удостоверения"
                      />
                    ) : (
                      <span>{lawyer?.lawyer_certificate_number || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Дата выдачи</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="date"
                        name="lawyer_certificate_date"
                        value={formData.lawyer_certificate_date || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{formatDate(lawyer?.lawyer_certificate_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка: Финансовая информация */}
            {activeTab === 'finance' && (
              <>
                <div className={styles.fieldGroup}>
                  <h3 className={styles.subsectionTitle}>
                    Банковские реквизиты
                  </h3>
                  <div className={styles.tabGrid}>
                    <div className={styles.field}>
                      <label>Наименование банка</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="text"
                          name="bank_name"
                          value={formData.bank_name || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Наименование банка"
                        />
                      ) : (
                        <span>{lawyer?.bank_name || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>БИК банка</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="text"
                          name="bank_bik"
                          value={formData.bank_bik || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="БИК банка"
                        />
                      ) : (
                        <span>{lawyer?.bank_bik || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Корреспондентский счет</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="text"
                          name="correspondent_account"
                          value={formData.correspondent_account || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Корреспондентский счет"
                        />
                      ) : (
                        <span>{lawyer?.correspondent_account || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Расчетный счет</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="text"
                          name="payment_account"
                          value={formData.payment_account || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Расчетный счет"
                        />
                      ) : (
                        <span>{lawyer?.payment_account || 'Не указано'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <h3 className={styles.subsectionTitle}>
                    Информация об оплате
                  </h3>
                  <div className={styles.tabGrid}>
                    <div className={styles.field}>
                      <label>Количество дней для оплаты</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="number"
                          name="days_for_payment"
                          value={formData.days_for_payment || 0}
                          onChange={handleInputChange}
                          className={styles.input}
                          min="0"
                        />
                      ) : (
                        <span>{lawyer?.days_for_payment || '0'} дней</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма оплаты</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="number"
                          step="0.01"
                          name="payment_amount"
                          value={formData.payment_amount || 0}
                          onChange={handleInputChange}
                          className={styles.input}
                          min="0"
                        />
                      ) : (
                        <span>{formatCurrency(lawyer?.payment_amount)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата постановления об оплате</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="date"
                          name="payment_date"
                          value={formData.payment_date || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(lawyer?.payment_date)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Вкладка: Примечания */}
            {activeTab === 'notes' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Примечания
                </h3>
                <div className={styles.field}>
                  <label>Дополнительная информация</label>
                  {isEditing || isCreateMode ? (
                    <textarea
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      rows="4"
                      placeholder="Любая дополнительная информация об адвокате..."
                    />
                  ) : (
                    <span>{lawyer?.notes || 'Нет примечаний'}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalLawyerDetails;
