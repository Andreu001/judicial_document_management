import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import baseService from '../../API/baseService';
import styles from './CivilDetail.module.css';

const CivilSideDetail = () => {
  const { proceedingId, sideId } = useParams();
  const navigate = useNavigate();
  const [sideData, setSideData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    // CivilSidesCaseInCase fields
    sides_case_role: '',
    
    // SidesCaseInCase fields
    name: '',
    status: 'individual',
    date_sending_agenda: '',
    
    // Physical person fields
    birth_date: '',
    gender: '',
    document_type: '',
    document_number: '',
    document_series: '',
    document_issued_by: '',
    document_issue_date: '',
    
    // Legal entity fields
    inn: '',
    kpp: '',
    ogrn: '',
    legal_address: '',
    director_name: '',
    
    // Common fields
    address: '',
    phone: '',
    email: '',
    additional_info: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sideRoles, setSideRoles] = useState([]);
  const [personType, setPersonType] = useState('individual');
  const [activeTab, setActiveTab] = useState('main'); // 'main' или 'physical'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загружаем роли сторон
        const rolesResponse = await CivilCaseService.getSideRoles();
        setSideRoles(rolesResponse || []);
        
        // Если это редактирование существующей стороны
        if (sideId && sideId !== 'create' && sideId !== 'undefined' && sideId !== 'null') {
          const data = await CivilCaseService.getSideById(proceedingId, sideId);
          console.log('Side data received:', data); // Для отладки
          setSideData(data);

          // Проверяем структуру данных и извлекаем нужные поля
          const sideInCaseDetail = data.sides_case_incase_detail || {};
          const roleDetail = data.sides_case_role_detail || {};

          setFormData({
            sides_case_role: data.sides_case_role || roleDetail?.id || '',
            name: sideInCaseDetail.name || data.name || '',
            status: sideInCaseDetail.status || data.status || 'individual',
            date_sending_agenda: sideInCaseDetail.date_sending_agenda || data.date_sending_agenda || '',
            birth_date: sideInCaseDetail.birth_date || data.birth_date || '',
            gender: sideInCaseDetail.gender || data.gender || '',
            document_type: sideInCaseDetail.document_type || data.document_type || '',
            document_number: sideInCaseDetail.document_number || data.document_number || '',
            document_series: sideInCaseDetail.document_series || data.document_series || '',
            document_issued_by: sideInCaseDetail.document_issued_by || data.document_issued_by || '',
            document_issue_date: sideInCaseDetail.document_issue_date || data.document_issue_date || '',
            inn: sideInCaseDetail.inn || data.inn || '',
            kpp: sideInCaseDetail.kpp || data.kpp || '',
            ogrn: sideInCaseDetail.ogrn || data.ogrn || '',
            legal_address: sideInCaseDetail.legal_address || data.legal_address || '',
            director_name: sideInCaseDetail.director_name || data.director_name || '',
            address: sideInCaseDetail.address || data.address || '',
            phone: sideInCaseDetail.phone || data.phone || '',
            email: sideInCaseDetail.email || data.email || '',
            additional_info: sideInCaseDetail.additional_info || data.additional_info || ''
          });
          
          setPersonType(sideInCaseDetail.status || data.status || 'individual');
        }
        
        setIsEditing(sideId === 'create');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [proceedingId, sideId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePersonTypeChange = (e) => {
    const newType = e.target.value;
    setPersonType(newType);
    setFormData(prev => ({
      ...prev,
      status: newType
    }));
    // Если выбран не физическое лицо, переключаем на основную вкладку
    if (newType !== 'individual') {
      setActiveTab('main');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Создаем вложенную структуру для отправки
      const sidesCaseInCaseData = {
        name: formData.name,
        status: formData.status,
        date_sending_agenda: formData.date_sending_agenda || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        document_type: formData.document_type || null,
        document_number: formData.document_number || null,
        document_series: formData.document_series || null,
        document_issued_by: formData.document_issued_by || null,
        document_issue_date: formData.document_issue_date || null,
        inn: formData.inn || null,
        kpp: formData.kpp || null,
        ogrn: formData.ogrn || null,
        legal_address: formData.legal_address || null,
        director_name: formData.director_name || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        additional_info: formData.additional_info || null
      };

      // Удаляем пустые значения
      Object.keys(sidesCaseInCaseData).forEach(key => {
        if (sidesCaseInCaseData[key] === '' || sidesCaseInCaseData[key] === null || sidesCaseInCaseData[key] === undefined) {
          delete sidesCaseInCaseData[key];
        }
      });

      // Отправляем данные с вложенной структурой
      const civilSideData = {
        sides_case_role: formData.sides_case_role,
        sides_case_incase_data: sidesCaseInCaseData
      };

      console.log('Sending nested data:', civilSideData);

      if (sideId && sideId !== 'create' && sideId !== 'undefined' && sideId !== 'null') {
        await CivilCaseService.updateSide(proceedingId, sideId, civilSideData);
      } else {
        await CivilCaseService.createSide(proceedingId, civilSideData);
      }
      
      navigate(-1);
    } catch (err) {
      console.error('Error saving side:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          JSON.stringify(err.response?.data) || 
                          err.message;
      setError('Ошибка при сохранении стороны: ' + errorMessage);
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
            {sideId && sideId !== 'create' ? 'Редактирование стороны' : 'Добавление стороны'}
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
                className={`${styles.tab} ${activeTab === 'physical' ? styles.activeTab : ''} ${personType !== 'individual' ? styles.disabledTab : ''}`}
                onClick={() => personType === 'individual' && setActiveTab('physical')}
                disabled={personType !== 'individual'}
              >
                Данные физического лица
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
                        <label>Роль стороны</label>
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

                    {/* Основная информация */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Основная информация</h3>
                      
                      <div className={styles.field}>
                        <label>ФИО / Наименование</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Введите ФИО или наименование"
                          required
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Статус лица</label>
                        <select
                          name="status"
                          value={personType}
                          onChange={handlePersonTypeChange}
                          className={styles.select}
                        >
                          <option value="individual">Физическое лицо</option>
                          <option value="legal">Юридическое лицо</option>
                          <option value="government">Орган власти</option>
                          <option value="other">Иное</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Дата направления повестки</label>
                        <input
                          type="date"
                          name="date_sending_agenda"
                          value={formData.date_sending_agenda || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Юридическое лицо (если выбрано) */}
                    {(personType === 'legal') && (
                      <div className={styles.fieldGroup}>
                        <h3 className={styles.subsectionTitle}>Данные юридического лица</h3>
                        
                        <div className={styles.field}>
                          <label>ИНН</label>
                          <input
                            type="text"
                            name="inn"
                            value={formData.inn || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.field}>
                          <label>КПП</label>
                          <input
                            type="text"
                            name="kpp"
                            value={formData.kpp || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.field}>
                          <label>ОГРН</label>
                          <input
                            type="text"
                            name="ogrn"
                            value={formData.ogrn || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.field}>
                          <label>Юридический адрес</label>
                          <input
                            type="text"
                            name="legal_address"
                            value={formData.legal_address || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.field}>
                          <label>ФИО руководителя</label>
                          <input
                            type="text"
                            name="director_name"
                            value={formData.director_name || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </div>
                      </div>
                    )}

                    {/* Орган власти / Иное (если выбрано) */}
                    {(personType === 'government' || personType === 'other') && (
                      <div className={styles.fieldGroup}>
                        <h3 className={styles.subsectionTitle}>
                          {personType === 'government' ? 'Данные органа власти' : 'Дополнительные данные'}
                        </h3>
                        
                        <div className={styles.field}>
                          <label>Полное наименование</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Введите полное наименование"
                          />
                        </div>
                      </div>
                    )}

                    {/* Контактная информация (для всех типов) */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Контактная информация</h3>
                      
                      <div className={styles.field}>
                        <label>Адрес</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Адрес проживания/нахождения"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Телефон</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="+7 (___) ___-__-__"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дополнительная информация</label>
                        <textarea
                          name="additional_info"
                          value={formData.additional_info || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={3}
                          placeholder="Примечания, комментарии..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Вкладка: Данные физического лица */}
                {activeTab === 'physical' && personType === 'individual' && (
                  <div className={styles.tabContent}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Данные физического лица</h3>
                      
                      <div className={styles.field}>
                        <label>Дата рождения</label>
                        <input
                          type="date"
                          name="birth_date"
                          value={formData.birth_date || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Пол</label>
                        <select
                          name="gender"
                          value={formData.gender || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Не указан</option>
                          <option value="male">Мужской</option>
                          <option value="female">Женский</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Документ удостоверяющий личность</label>
                        <input
                          type="text"
                          name="document_type"
                          value={formData.document_type || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Паспорт, в/у и т.д."
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Серия документа</label>
                        <input
                          type="text"
                          name="document_series"
                          value={formData.document_series || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Номер документа</label>
                        <input
                          type="text"
                          name="document_number"
                          value={formData.document_number || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Кем выдан</label>
                        <input
                          type="text"
                          name="document_issued_by"
                          value={formData.document_issued_by || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Дата выдачи</label>
                        <input
                          type="date"
                          name="document_issue_date"
                          value={formData.document_issue_date || ''}
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

export default CivilSideDetail;