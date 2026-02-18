import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';

const CivilLawyerDetail = () => {
  const { proceedingId, lawyerId } = useParams();
  const navigate = useNavigate();
  const [lawyerData, setLawyerData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
        const rolesResponse = await CivilCaseService.getSideRoles();
        setSideRoles(rolesResponse || []);
        
        // Если это редактирование существующего адвоката
        if (lawyerId && lawyerId !== 'create' && lawyerId !== 'undefined' && lawyerId !== 'null') {
          const data = await CivilCaseService.getLawyerById(proceedingId, lawyerId);
          setLawyerData(data);

          setFormData({
            sides_case_role: data.sides_case_role?.id || '',
            
            law_firm_name: data.lawyer?.law_firm_name || data.law_firm_name || '',
            law_firm_address: data.lawyer?.law_firm_address || data.law_firm_address || '',
            law_firm_phone: data.lawyer?.law_firm_phone || data.law_firm_phone || '',
            law_firm_email: data.lawyer?.law_firm_email || data.law_firm_email || '',
            
            bank_name: data.lawyer?.bank_name || data.bank_name || '',
            bank_bik: data.lawyer?.bank_bik || data.bank_bik || '',
            correspondent_account: data.lawyer?.correspondent_account || data.correspondent_account || '',
            payment_account: data.lawyer?.payment_account || data.payment_account || '',
            
            lawyer_certificate_number: data.lawyer?.lawyer_certificate_number || data.lawyer_certificate_number || '',
            lawyer_certificate_date: data.lawyer?.lawyer_certificate_date || data.lawyer_certificate_date || '',
            
            days_for_payment: data.lawyer?.days_for_payment || data.days_for_payment || '',
            payment_amount: data.lawyer?.payment_amount || data.payment_amount || '',
            payment_date: data.lawyer?.payment_date || data.payment_date || '',
            notes: data.lawyer?.notes || data.notes || ''
          });
        }
        
        setIsEditing(lawyerId === 'create');
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
        // Сначала создаем/обновляем данные юриста в таблице Lawyer
        const lawyerData = {
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
        };

        // Удаляем пустые значения
        Object.keys(lawyerData).forEach(key => {
        if (lawyerData[key] === '' || lawyerData[key] === null || lawyerData[key] === undefined) {
            delete lawyerData[key];
        }
        });

        // Проверяем, есть ли у нас уже ID юриста
        let lawyerId;
        
        if (lawyerData.lawyer?.id) {
        // Если это редактирование и у нас уже есть ID юриста
        lawyerId = lawyerData.lawyer.id;
        } else {
        // Создаем нового юриста через отдельный API
        // ВАЖНО: Вам нужно добавить метод для создания Lawyer в ваш CivilCaseService
        // const createdLawyer = await CivilCaseService.createLawyer(lawyerData);
        // lawyerId = createdLawyer.id;
        
        // Пока как заглушка - нужно добавить соответствующий API
        console.error('Нужен API для создания Lawyer');
        return;
        }

        // Отправляем данные CivilLawyer только с ID юриста
        const civilLawyerData = {
        sides_case_role: formData.sides_case_role,
        lawyer: lawyerId  // Отправляем ID, а не объект
        };

        console.log('Sending civil lawyer data:', civilLawyerData);

        if (lawyerId && lawyerId !== 'create' && lawyerId !== 'undefined' && lawyerId !== 'null') {
        await CivilCaseService.updateLawyer(proceedingId, lawyerId, civilLawyerData);
        } else {
        await CivilCaseService.createLawyer(proceedingId, civilLawyerData);
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
            <div className={styles.tabContentWrapper}>
              <form onSubmit={handleSubmit}>
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

                {/* Банковские реквизиты */}
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

                {/* Оплата за счет федерального бюджета */}
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

                {/* Примечания */}
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivilLawyerDetail;