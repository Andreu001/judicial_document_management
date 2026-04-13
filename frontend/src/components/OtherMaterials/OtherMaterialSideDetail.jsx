// components/OtherMaterial/OtherMaterialSideDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OtherMaterialService from '../../API/OtherMaterialService';
import styles from './OtherMaterialDetail.module.css';

const OtherMaterialSideDetail = () => {
  const { materialId, sideId } = useParams();
  const navigate = useNavigate();
  const [sideData, setSideData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    sides_case_role: '',
    name: '',
    status: 'individual',
    date_sending_agenda: '',
    birth_date: '',
    gender: '',
    document_type: '',
    document_number: '',
    document_series: '',
    document_issued_by: '',
    document_issue_date: '',
    inn: '',
    kpp: '',
    ogrn: '',
    legal_address: '',
    director_name: '',
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
  const [activeTab, setActiveTab] = useState('main');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const rolesResponse = await OtherMaterialService.getSideRoles();
        setSideRoles(rolesResponse || []);
        
        if (sideId && sideId !== 'create' && sideId !== 'undefined' && sideId !== 'null') {
          const data = await OtherMaterialService.getSideById(materialId, sideId);
          setSideData(data);

          const sideInCaseDetail = data.sides_case_incase_detail || {};
          const roleDetail = data.sides_case_role_detail || {};

          setFormData({
            sides_case_role: data.sides_case_role || roleDetail?.id || '',
            name: sideInCaseDetail.name || '',
            status: sideInCaseDetail.status || 'individual',
            date_sending_agenda: sideInCaseDetail.date_sending_agenda || '',
            birth_date: sideInCaseDetail.birth_date || '',
            gender: sideInCaseDetail.gender || '',
            document_type: sideInCaseDetail.document_type || '',
            document_number: sideInCaseDetail.document_number || '',
            document_series: sideInCaseDetail.document_series || '',
            document_issued_by: sideInCaseDetail.document_issued_by || '',
            document_issue_date: sideInCaseDetail.document_issue_date || '',
            inn: sideInCaseDetail.inn || '',
            kpp: sideInCaseDetail.kpp || '',
            ogrn: sideInCaseDetail.ogrn || '',
            legal_address: sideInCaseDetail.legal_address || '',
            director_name: sideInCaseDetail.director_name || '',
            address: sideInCaseDetail.address || '',
            phone: sideInCaseDetail.phone || '',
            email: sideInCaseDetail.email || '',
            additional_info: sideInCaseDetail.additional_info || ''
          });
          
          setPersonType(sideInCaseDetail.status || 'individual');
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
  }, [materialId, sideId]);

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
    if (newType !== 'individual') {
      setActiveTab('main');
    }
  };

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
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

      Object.keys(sidesCaseInCaseData).forEach(key => {
        if (sidesCaseInCaseData[key] === '' || sidesCaseInCaseData[key] === null || sidesCaseInCaseData[key] === undefined) {
          delete sidesCaseInCaseData[key];
        }
      });

      const sideData = {
        sides_case_role: formData.sides_case_role,
        sides_case_incase_data: sidesCaseInCaseData
      };

      if (sideId && sideId !== 'create' && sideId !== 'undefined' && sideId !== 'null') {
        await OtherMaterialService.updateSide(materialId, sideId, sideData);
      } else {
        await OtherMaterialService.createSide(materialId, sideData);
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
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
          <h1 className={styles.title}>
            {sideId && sideId !== 'create' ? 'Редактирование стороны' : 'Добавление стороны'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button onClick={handleSubmit} className={styles.saveButton} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button onClick={() => navigate(-1)} className={styles.cancelButton}>
            Отмена
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
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
                {activeTab === 'main' && (
                  <div className={styles.tabContent}>
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
                      </div>
                    </div>

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
                          onChange={(e) => handleDateChange('date_sending_agenda', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {(personType === 'legal') && (
                      <div className={styles.fieldGroup}>
                        <h3 className={styles.subsectionTitle}>Данные юридического лица</h3>
                        
                        <div className={styles.field}>
                          <label>ИНН</label>
                          <input type="text" name="inn" value={formData.inn || ''} onChange={handleInputChange} className={styles.input} />
                        </div>
                        <div className={styles.field}>
                          <label>КПП</label>
                          <input type="text" name="kpp" value={formData.kpp || ''} onChange={handleInputChange} className={styles.input} />
                        </div>
                        <div className={styles.field}>
                          <label>ОГРН</label>
                          <input type="text" name="ogrn" value={formData.ogrn || ''} onChange={handleInputChange} className={styles.input} />
                        </div>
                        <div className={styles.field}>
                          <label>Юридический адрес</label>
                          <input type="text" name="legal_address" value={formData.legal_address || ''} onChange={handleInputChange} className={styles.input} />
                        </div>
                        <div className={styles.field}>
                          <label>ФИО руководителя</label>
                          <input type="text" name="director_name" value={formData.director_name || ''} onChange={handleInputChange} className={styles.input} />
                        </div>
                      </div>
                    )}

                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Контактная информация</h3>
                      
                      <div className={styles.field}>
                        <label>Адрес</label>
                        <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className={styles.input} />
                      </div>
                      <div className={styles.field}>
                        <label>Телефон</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className={styles.input} />
                      </div>
                      <div className={styles.field}>
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className={styles.input} />
                      </div>
                      <div className={styles.field}>
                        <label>Дополнительная информация</label>
                        <textarea name="additional_info" value={formData.additional_info || ''} onChange={handleInputChange} className={styles.textarea} rows={3} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'physical' && personType === 'individual' && (
                  <div className={styles.tabContent}>
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Данные физического лица</h3>
                      
                      <div className={styles.field}>
                        <label>Дата рождения</label>
                        <input type="date" name="birth_date" value={formData.birth_date || ''} onChange={(e) => handleDateChange('birth_date', e.target.value)} className={styles.input} />
                      </div>

                      <div className={styles.field}>
                        <label>Пол</label>
                        <select name="gender" value={formData.gender || ''} onChange={handleInputChange} className={styles.select}>
                          <option value="">Не указан</option>
                          <option value="male">Мужской</option>
                          <option value="female">Женский</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Документ</label>
                        <input type="text" name="document_type" value={formData.document_type || ''} onChange={handleInputChange} className={styles.input} placeholder="Паспорт, в/у и т.д." />
                      </div>
                      <div className={styles.field}>
                        <label>Серия</label>
                        <input type="text" name="document_series" value={formData.document_series || ''} onChange={handleInputChange} className={styles.input} />
                      </div>
                      <div className={styles.field}>
                        <label>Номер</label>
                        <input type="text" name="document_number" value={formData.document_number || ''} onChange={handleInputChange} className={styles.input} />
                      </div>
                      <div className={styles.field}>
                        <label>Кем выдан</label>
                        <input type="text" name="document_issued_by" value={formData.document_issued_by || ''} onChange={handleInputChange} className={styles.input} />
                      </div>
                      <div className={styles.field}>
                        <label>Дата выдачи</label>
                        <input type="date" name="document_issue_date" value={formData.document_issue_date || ''} onChange={(e) => handleDateChange('document_issue_date', e.target.value)} className={styles.input} />
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

export default OtherMaterialSideDetail;