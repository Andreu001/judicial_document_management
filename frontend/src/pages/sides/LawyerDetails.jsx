import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LawyerService from '../../API/LawyerService';
import baseService from '../../API/baseService';
import styles from './LawyerDetails.module.css';

const LawyerDetails = () => {
  const { businesscardId, lawyerId } = useParams();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // Добавляем состояние для активной вкладки

  useEffect(() => {
    loadLawyerDetails();
  }, [businesscardId, lawyerId]);

  const loadLawyerDetails = async () => {
    try {
      setLoading(true);
      const response = await baseService.get(`/business_card/businesscard/${businesscardId}/lawyers/${lawyerId}/`);
      setLawyer(response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных адвоката:', error);
      setLoading(false);
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
      await baseService.patch(`/business_card/businesscard/${businesscardId}/lawyers/${lawyerId}/`, formData);
      setIsEditing(false);
      await loadLawyerDetails();
      setSaving(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(lawyer);
    setIsEditing(false);
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

  if (!lawyer) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Адвокат не найден</h2>
          <button 
            onClick={() => navigate(`/cases/${businesscardId}`)}
            className={styles.backButton}
          >
            Вернуться к делу
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Основная информация' },
    { id: 'certificate', label: 'Документы' },
    { id: 'finance', label: 'Финансовая информация' },
    { id: 'related', label: 'Связанные данные' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            Назад к делу
          </button>
          <h1 className={styles.title}>
            {lawyer.sides_case_incase_name || lawyer.sides_case_incase?.name || 'Адвокат'}
          </h1>
    Вид стороны: {
      (lawyer.sides_case_name || lawyer.sides_case_person?.sides_case_name || []).join(', ')
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
                  Адвокатское образование
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>Название адвокатского образования</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="law_firm_name"
                        value={formData.law_firm_name || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{lawyer.law_firm_name || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Адрес</label>
                    {isEditing ? (
                      <textarea
                        name="law_firm_address"
                        value={formData.law_firm_address || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows="2"
                      />
                    ) : (
                      <span>{lawyer.law_firm_address || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Телефон</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="law_firm_phone"
                        value={formData.law_firm_phone || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{lawyer.law_firm_phone || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="law_firm_email"
                        value={formData.law_firm_email || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{lawyer.law_firm_email || 'Не указано'}</span>
                    )}
                  </div>
                </div>

                <h3 className={styles.subsectionTitle} style={{ marginTop: '2rem' }}>
                  Примечания
                </h3>
                <div className={styles.field}>
                  <label>Дополнительная информация</label>
                  {isEditing ? (
                    <textarea
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      rows="4"
                    />
                  ) : (
                    <span>{lawyer.notes || 'Нет примечаний'}</span>
                  )}
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
                    {isEditing ? (
                      <input
                        type="text"
                        name="lawyer_certificate_number"
                        value={formData.lawyer_certificate_number || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{lawyer.lawyer_certificate_number || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Дата выдачи</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="lawyer_certificate_date"
                        value={formData.lawyer_certificate_date || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{formatDate(lawyer.lawyer_certificate_date)}</span>
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
                      {isEditing ? (
                        <input
                          type="text"
                          name="bank_name"
                          value={formData.bank_name || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{lawyer.bank_name || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>БИК банка</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="bank_bik"
                          value={formData.bank_bik || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{lawyer.bank_bik || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Корреспондентский счет</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="correspondent_account"
                          value={formData.correspondent_account || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{lawyer.correspondent_account || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Расчетный счет</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="payment_account"
                          value={formData.payment_account || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{lawyer.payment_account || 'Не указано'}</span>
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
                      {isEditing ? (
                        <input
                          type="number"
                          name="days_for_payment"
                          value={formData.days_for_payment || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{lawyer.days_for_payment || '0'} дней</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма оплаты</label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          name="payment_amount"
                          value={formData.payment_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatCurrency(lawyer.payment_amount)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата постановления</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="payment_date"
                          value={formData.payment_date || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(lawyer.payment_date)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Вкладка: Связанные данные */}
            {activeTab === 'related' && lawyer.sides_case_incase && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Связанная сторона
                </h3>
                <div className={styles.relatedParty}>
                  <div className={styles.partyInfo}>
                    <div className={styles.infoRow}>
                      <strong>Имя:</strong> {lawyer.sides_case_incase.name}
                    </div>
                    <div className={styles.infoRow}>
                      <strong>Статус:</strong> {lawyer.sides_case_incase.get_status_display || lawyer.sides_case_incase.status}
                    </div>
                    {lawyer.sides_case_incase.phone && (
                      <div className={styles.infoRow}>
                        <strong>Телефон:</strong> {lawyer.sides_case_incase.phone}
                      </div>
                    )}
                    {lawyer.sides_case_incase.email && (
                      <div className={styles.infoRow}>
                        <strong>Email:</strong> {lawyer.sides_case_incase.email}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/cases/${businesscardId}/sides/${lawyer.sides_case_incase.id}`)}
                    className={styles.viewPartyButton}
                  >
                    Просмотреть сторону
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDetails;