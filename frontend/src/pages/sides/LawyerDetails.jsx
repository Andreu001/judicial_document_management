import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LawyerService from '../../API/LawyerService';
import styles from './LawyerDetails.module.css';

const LawyerDetails = () => {
  const { proceedingId, lawyerId } = useParams();
  const navigate = useNavigate();
  const [lawyerData, setLawyerData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'bank', 'payment'
  const [formData, setFormData] = useState({
    // CivilLawyer fields
    sides_case_role: '',
    
    // Lawyer fields
    law_firm_name: '',
    law_firm_address: '',
    law_firm_phone: '',
    law_firm_email: '',
    
    // Bank details
    bank_name: '',
    bank_bik: '',
    correspondent_account: '',
    payment_account: '',
    
    // Lawyer certificate
    lawyer_certificate_number: '',
    lawyer_certificate_date: '',
    
    // Payment info
    days_for_payment: '',
    payment_amount: '',
    payment_date: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sideRoles, setSideRoles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загружаем роли сторон
        const rolesResponse = await LawyerService.getSideRoles();
        setSideRoles(rolesResponse || []);
        
        // Проверяем, что lawyerId существует и это не 'create'
        if (lawyerId && lawyerId !== 'create') {
          // Проверяем, что ID является числом
          const numericId = parseInt(lawyerId);
          if (!isNaN(numericId)) {
            const data = await LawyerService.getLawyerById(proceedingId, numericId);
            console.log('Received lawyer data:', data);
            setLawyerData(data);

            // Заполняем форму данными из lawyer_detail
            setFormData({
              sides_case_role: data.sides_case_role?.id || data.sides_case_role || '',
              
              // Данные из lawyer_detail
              law_firm_name: data.lawyer_detail?.law_firm_name || '',
              law_firm_address: data.lawyer_detail?.law_firm_address || '',
              law_firm_phone: data.lawyer_detail?.law_firm_phone || '',
              law_firm_email: data.lawyer_detail?.law_firm_email || '',
              
              bank_name: data.lawyer_detail?.bank_name || '',
              bank_bik: data.lawyer_detail?.bank_bik || '',
              correspondent_account: data.lawyer_detail?.correspondent_account || '',
              payment_account: data.lawyer_detail?.payment_account || '',
              
              lawyer_certificate_number: data.lawyer_detail?.lawyer_certificate_number || '',
              lawyer_certificate_date: data.lawyer_detail?.lawyer_certificate_date || '',
              
              days_for_payment: data.lawyer_detail?.days_for_payment || '',
              payment_amount: data.lawyer_detail?.payment_amount || '',
              payment_date: data.lawyer_detail?.payment_date || '',
              notes: data.lawyer_detail?.notes || ''
            });
            
            setIsEditing(false); // Режим просмотра/редактирования
          } else {
            // Если ID не число, значит это 'create' или что-то другое
            setIsEditing(true);
          }
        } else {
          // Если lawyerId === 'create' или отсутствует
          setIsEditing(true);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [proceedingId, lawyerId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Формируем данные для отправки в формате, который ожидает бэкенд
      const requestData = {
        // Данные для создания/обновления адвоката
        lawyer_data: {
          law_firm_name: formData.law_firm_name,
          law_firm_address: formData.law_firm_address || null,
          law_firm_phone: formData.law_firm_phone || null,
          law_firm_email: formData.law_firm_email || null,
          
          bank_name: formData.bank_name || null,
          bank_bik: formData.bank_bik || null,
          correspondent_account: formData.correspondent_account || null,
          payment_account: formData.payment_account || null,
          
          lawyer_certificate_number: formData.lawyer_certificate_number || null,
          lawyer_certificate_date: formData.lawyer_certificate_date || null,
          
          days_for_payment: formData.days_for_payment ? parseInt(formData.days_for_payment) : null,
          payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount) : null,
          payment_date: formData.payment_date || null,
          notes: formData.notes || null
        },
        // Роль стороны (ID)
        sides_case_role: parseInt(formData.sides_case_role)
      };

      // Удаляем пустые значения из lawyer_data
      Object.keys(requestData.lawyer_data).forEach(key => {
        if (requestData.lawyer_data[key] === '' || 
            requestData.lawyer_data[key] === null || 
            requestData.lawyer_data[key] === undefined) {
          delete requestData.lawyer_data[key];
        }
      });

      console.log('Sending request data:', requestData);

      if (lawyerId && lawyerId !== 'create' && lawyerId !== 'undefined' && lawyerId !== 'null') {
        // Для обновления используем PATCH с полными данными
        await LawyerService.updateLawyer(proceedingId, lawyerId, requestData);
      } else {
        // Для создания
        await LawyerService.createLawyer(proceedingId, requestData);
      }
      
      navigate(-1);
    } catch (err) {
      console.error('Error saving lawyer:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          JSON.stringify(err.response?.data) || 
                          err.message;
      setError('Ошибка при сохранении адвоката: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
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
            {lawyerId && lawyerId !== 'create' ? 'Редактирование адвоката' : 'Добавление адвоката'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={handleSubmit} 
            className={styles.saveButton}
            disabled={saving}
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
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            {/* Вкладки */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'main' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('main')}
              >
                Основная информация
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'bank' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('bank')}
              >
                Банковские реквизиты
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'payment' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                Оплата за счет федерального бюджета
              </button>
            </div>

            <div className={styles.tabContentWrapper}>
              <form onSubmit={handleSubmit}>
                {/* Вкладка: Основная информация */}
                {activeTab === 'main' && (
                  <div className={styles.tabContent}>
                    {/* Роль в деле */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Роль в деле</h3>
                      <div className={styles.field}>
                        <label>Представитель какой стороны</label>
                        <select
                          name="sides_case_role"
                          value={formData.sides_case_role}
                          onChange={handleInputChange}
                          className={styles.select}
                          required
                        >
                          <option value="">Выберите роль</option>
                          {sideRoles && sideRoles.length > 0 ? (
                            sideRoles.map(role => (
                              <option key={role.id} value={role.id}>
                                {role.sides_case || role.name || 'Без названия'}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>Загрузка ролей...</option>
                          )}
                        </select>
                        {sideRoles.length === 0 && !loading && (
                          <div style={{ color: 'orange', fontSize: '12px', marginTop: '5px' }}>
                            Роли не загружены. Проверьте подключение к серверу.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Основная информация об адвокате */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Основная информация</h3>
                      
                      <div className={styles.field}>
                        <label>Название адвокатского образования *</label>
                        <input
                          type="text"
                          name="law_firm_name"
                          value={formData.law_firm_name || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Введите название адвокатского образования"
                          required
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Адрес</label>
                        <input
                          type="text"
                          name="law_firm_address"
                          value={formData.law_firm_address || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Юридический/фактический адрес"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Телефон</label>
                        <input
                          type="tel"
                          name="law_firm_phone"
                          value={formData.law_firm_phone || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="+7 (___) ___-__-__"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Email</label>
                        <input
                          type="email"
                          name="law_firm_email"
                          value={formData.law_firm_email || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    {/* Данные адвокатского удостоверения */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Адвокатское удостоверение</h3>
                      
                      <div className={styles.field}>
                        <label>Номер удостоверения</label>
                        <input
                          type="text"
                          name="lawyer_certificate_number"
                          value={formData.lawyer_certificate_number || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Номер адвокатского удостоверения"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата выдачи</label>
                        <input
                          type="date"
                          name="lawyer_certificate_date"
                          value={formData.lawyer_certificate_date || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Примечания (только на основной вкладке для краткости) */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Примечания</h3>
                      
                      <div className={styles.field}>
                        <textarea
                          name="notes"
                          value={formData.notes || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={4}
                          placeholder="Дополнительная информация, примечания..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Вкладка: Банковские реквизиты */}
                {activeTab === 'bank' && (
                  <div className={styles.tabContent}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Банковские реквизиты</h3>
                      
                      <div className={styles.field}>
                        <label>Наименование банка</label>
                        <input
                          type="text"
                          name="bank_name"
                          value={formData.bank_name || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Наименование банка"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>БИК</label>
                        <input
                          type="text"
                          name="bank_bik"
                          value={formData.bank_bik || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="БИК банка"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Корреспондентский счет</label>
                        <input
                          type="text"
                          name="correspondent_account"
                          value={formData.correspondent_account || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Корреспондентский счет"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Расчетный счет</label>
                        <input
                          type="text"
                          name="payment_account"
                          value={formData.payment_account || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Расчетный счет"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Вкладка: Оплата за счет федерального бюджета */}
                {activeTab === 'payment' && (
                  <div className={styles.tabContent}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Оплата за счет федерального бюджета</h3>
                      
                      <div className={styles.field}>
                        <label>Количество дней для оплаты</label>
                        <input
                          type="number"
                          name="days_for_payment"
                          value={formData.days_for_payment || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Сумма оплаты (руб.)</label>
                        <input
                          type="number"
                          name="payment_amount"
                          value={formData.payment_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата постановления об оплате</label>
                        <input
                          type="date"
                          name="payment_date"
                          value={formData.payment_date || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDetails;