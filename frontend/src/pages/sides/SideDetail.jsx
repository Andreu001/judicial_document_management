import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import baseService from '../../API/baseService';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import CivilCaseService from '../../API/CivilCaseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import KasCaseService from '../../API/KasCaseService';
import styles from './SideDetails.module.css';

const SideDetail = () => {
  const { proceedingId, sideId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [side, setSide] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidesCaseOptions, setSidesCaseOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('main');
  const [personType, setPersonType] = useState('individual');
  const [sideRoles, setSideRoles] = useState([]);
  const [error, setError] = useState(null);

  // Определяем тип дела по пути URL
  const getCaseType = () => {
    if (location.pathname.includes('/criminal-proceedings/')) return 'criminal';
    if (location.pathname.includes('/civil-proceedings/')) return 'civil';
    if (location.pathname.includes('/admin-proceedings/')) return 'admin';
    if (location.pathname.includes('/kas-proceedings/')) return 'kas';
    if (location.pathname.includes('/other-materials/')) return 'other';
    return 'unknown';
  };

  const caseType = getCaseType();
  const isCreateMode = !sideId || sideId === 'create';

  const getParticipantType = () => {
    switch (caseType) {
      case 'criminal': return 'CriminalSidesCaseInCase';
      case 'civil': return 'CivilSidesCaseInCase';
      case 'admin': return 'AdministrativeSidesCaseInCase';
      case 'kas': return 'KasSidesCaseInCase';
      default: return 'SidesCaseInCase';
    }
  };

  // Получаем соответствующий сервис
  const getService = () => {
    switch (caseType) {
      case 'criminal': return CriminalCaseService;
      case 'civil': return CivilCaseService;
      case 'admin': return AdministrativeCaseService;
      case 'kas': return KasCaseService;
      default: return null;
    }
  };

  const service = getService();

  useEffect(() => {
    if (proceedingId) {
      loadSideRoles();
      if (isCreateMode) {
        setLoading(false);
        setSide(null);
        setFormData(getEmptyFormData());
        setIsEditing(true);
      } else if (sideId) {
        loadSideDetails();
      }
    }
  }, [proceedingId, sideId, caseType]);

  const getEmptyFormData = () => ({
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
    additional_info: '',
    citizenship: ''
  });

  const loadSideRoles = async () => {
    try {
      let roles = [];
      if (caseType === 'criminal') {
        const response = await baseService.get('/business_card/sides/');
        roles = response.data || [];
      } else if (service && service.getSideRoles) {
        roles = await service.getSideRoles();
      } else {
        const response = await baseService.get('/business_card/sides/');
        roles = response.data || [];
      }
      setSideRoles(roles);
    } catch (error) {
      console.error('Error fetching side roles:', error);
      setSideRoles([]);
    }
  };

  const loadSideDetails = async () => {
    try {
      setLoading(true);
      let data;
      
      switch (caseType) {
        case 'criminal':
          data = await CriminalCaseService.getSideById(proceedingId, sideId);
          break;
        case 'civil':
          data = await CivilCaseService.getSideById(proceedingId, sideId);
          break;
        case 'admin':
          data = await AdministrativeCaseService.getSideById(proceedingId, sideId);
          break;
        case 'kas':
          data = await KasCaseService.getSideById(proceedingId, sideId);
          break;
        default:
          throw new Error('Unknown case type');
      }
      
      console.log('Side data received:', data);
      setSide(data);

      // Извлекаем данные в зависимости от структуры
      const sideInCaseDetail = data.sides_case_incase_detail || data.criminal_side_case_detail || {};
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
        additional_info: sideInCaseDetail.additional_info || data.additional_info || '',
        citizenship: sideInCaseDetail.citizenship || data.citizenship || ''
      });
      
      setPersonType(sideInCaseDetail.status || data.status || 'individual');
      setLoading(false);
    } catch (error) {
      console.error('Error loading side details:', error);
      setError('Не удалось загрузить данные стороны');
      setLoading(false);
    }
  };

  const loadSidesCaseOptions = async () => {
    try {
      const response = await baseService.get('/business_card/sides/');
      setSidesCaseOptions(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки опций сторон:', error);
    }
  };

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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

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
        additional_info: formData.additional_info || null,
        citizenship: formData.citizenship || null
      };

      // Удаляем пустые значения
      Object.keys(sidesCaseInCaseData).forEach(key => {
        if (sidesCaseInCaseData[key] === '' || sidesCaseInCaseData[key] === null || sidesCaseInCaseData[key] === undefined) {
          delete sidesCaseInCaseData[key];
        }
      });

      let sideData;
      
      // Формируем данные в зависимости от типа дела
      if (caseType === 'criminal') {
        sideData = {
          sides_case_criminal: formData.sides_case_role ? parseInt(formData.sides_case_role, 10) : null,
          criminal_side_case_data: sidesCaseInCaseData
        };
      } else {
        sideData = {
          sides_case_role: formData.sides_case_role,
          sides_case_incase_data: sidesCaseInCaseData
        };
      }

      console.log('Sending data:', sideData);

      if (!isCreateMode) {
        // Обновление существующей стороны
        switch (caseType) {
          case 'criminal':
            await CriminalCaseService.updateSide(proceedingId, sideId, sideData);
            break;
          case 'civil':
            await CivilCaseService.updateSide(proceedingId, sideId, sideData);
            break;
          case 'admin':
            await AdministrativeCaseService.updateSide(proceedingId, sideId, sideData);
            break;
          case 'kas':
            await KasCaseService.updateSide(proceedingId, sideId, sideData);
            break;
        }
        setIsEditing(false);
        await loadSideDetails();
      } else {
        // Создание новой стороны
        switch (caseType) {
          case 'criminal':
            await CriminalCaseService.createSide(proceedingId, sideData);
            break;
          case 'civil':
            await CivilCaseService.createSide(proceedingId, sideData);
            break;
          case 'admin':
            await AdministrativeCaseService.createSide(proceedingId, sideData);
            break;
          case 'kas':
            await KasCaseService.createSide(proceedingId, sideData);
            break;
        }
        navigate(-1);
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Error saving side:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          JSON.stringify(error.response?.data) || 
                          error.message;
      setError('Ошибка при сохранении стороны: ' + errorMessage);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate(-1);
    } else {
      setFormData(side);
      setIsEditing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getSideTypeName = (roleId) => {
    if (!roleId) return 'Не указан';
    const role = sideRoles.find(option => option.id == roleId);
    return role ? role.sides_case : `ID: ${roleId}`;
  };

  // Получаем имя стороны для отображения
  const getSideName = () => {
    if (formData?.name) {
      return formData.name;
    }
    if (side?.sides_case_incase_detail?.name) {
      return side.sides_case_incase_detail.name;
    }
    if (side?.criminal_side_case_detail?.name) {
      return side.criminal_side_case_detail.name;
    }
    return 'Сторона по делу';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка данных стороны...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'main', label: 'Основная информация' },
    { id: 'physical', label: 'Данные физического лица' },
    { id: 'contacts', label: 'Контактная информация' },
    { id: 'additional', label: 'Дополнительно' }
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
              {isCreateMode ? 'Новая сторона' : (formData.name || 'Сторона по делу')}
            </h1>
            {!isCreateMode && side && (
              <div className={styles.subtitle}>
                <span>Вид стороны: {getSideTypeName(side.sides_case_role)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.headerRight}>
          {isCreateMode ? (
            <>
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
            </>
          ) : (
            !isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className={styles.editButton}
              >
                Редактировать
              </button>
            ) : (
              <>
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
              </>
            )
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''} ${tab.id === 'physical' && personType !== 'individual' ? styles.disabledTab : ''}`}
                  onClick={() => (tab.id === 'physical' ? personType === 'individual' : true) && setActiveTab(tab.id)}
                  disabled={tab.id === 'physical' && personType !== 'individual'}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.tabContentWrapper}>
              <div className={styles.tabContent}>
                {/* Вкладка: Основная информация */}
                {activeTab === 'main' && (
                  <>
                    {/* Выбор роли */}
                    <div className={styles.fieldGroup}>
                      <h3 className={styles.subsectionTitle}>Роль в деле</h3>
                      <div className={styles.field}>
                        <label>Вид стороны *</label>
                        {(isEditing || isCreateMode) ? (
                          <select
                            name="sides_case_role"
                            value={formData.sides_case_role || ''}
                            onChange={handleInputChange}
                            className={styles.select}
                            required
                          >
                            <option value="">Выберите вид стороны</option>
                            {sideRoles.map(role => (
                              <option key={role.id} value={role.id}>
                                {role.sides_case || role.name || 'Без названия'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{getSideTypeName(formData.sides_case_role)}</span>
                        )}
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
                      <div className={styles.tabGrid}>
                        <div className={styles.field}>
                          <label>ФИО / Наименование *</label>
                          {(isEditing || isCreateMode) ? (
                            <input
                              type="text"
                              name="name"
                              value={formData.name || ''}
                              onChange={handleInputChange}
                              className={styles.input}
                              placeholder="Введите ФИО или наименование"
                              required
                            />
                          ) : (
                            <span>{formData.name || 'Не указано'}</span>
                          )}
                        </div>

                        <div className={styles.field}>
                          <label>Статус лица</label>
                          {(isEditing || isCreateMode) ? (
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
                          ) : (
                            <span>
                              {personType === 'individual' ? 'Физическое лицо' : 
                               personType === 'legal' ? 'Юридическое лицо' : 
                               personType === 'government' ? 'Орган власти' :
                               personType === 'other' ? 'Иное' : 
                               personType || 'Не указано'}
                            </span>
                          )}
                        </div>

                        <div className={styles.field}>
                          <label>Дата направления повестки</label>
                          {(isEditing || isCreateMode) ? (
                            <input
                              type="date"
                              name="date_sending_agenda"
                              value={formData.date_sending_agenda || ''}
                              onChange={(e) => handleDateChange('date_sending_agenda', e.target.value)}
                              className={styles.input}
                            />
                          ) : (
                            <span>{formatDate(formData.date_sending_agenda)}</span>
                          )}
                        </div>

                        <div className={styles.field}>
                          <label>Гражданство</label>
                          {(isEditing || isCreateMode) ? (
                            <input
                              type="text"
                              name="citizenship"
                              value={formData.citizenship || ''}
                              onChange={handleInputChange}
                              className={styles.input}
                              placeholder="Гражданство"
                            />
                          ) : (
                            <span>{formData.citizenship || 'Не указано'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Юридическое лицо */}
                    {(personType === 'legal') && (
                      <div className={styles.fieldGroup}>
                        <h3 className={styles.subsectionTitle}>Данные юридического лица</h3>
                        <div className={styles.tabGrid}>
                          <div className={styles.field}>
                            <label>ИНН</label>
                            {(isEditing || isCreateMode) ? (
                              <input
                                type="text"
                                name="inn"
                                value={formData.inn || ''}
                                onChange={handleInputChange}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formData.inn || 'Не указано'}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>КПП</label>
                            {(isEditing || isCreateMode) ? (
                              <input
                                type="text"
                                name="kpp"
                                value={formData.kpp || ''}
                                onChange={handleInputChange}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formData.kpp || 'Не указано'}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>ОГРН</label>
                            {(isEditing || isCreateMode) ? (
                              <input
                                type="text"
                                name="ogrn"
                                value={formData.ogrn || ''}
                                onChange={handleInputChange}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formData.ogrn || 'Не указано'}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>Юридический адрес</label>
                            {(isEditing || isCreateMode) ? (
                              <textarea
                                name="legal_address"
                                value={formData.legal_address || ''}
                                onChange={handleInputChange}
                                className={styles.textarea}
                                rows={2}
                              />
                            ) : (
                              <span>{formData.legal_address || 'Не указано'}</span>
                            )}
                          </div>

                          <div className={styles.field}>
                            <label>ФИО руководителя</label>
                            {(isEditing || isCreateMode) ? (
                              <input
                                type="text"
                                name="director_name"
                                value={formData.director_name || ''}
                                onChange={handleInputChange}
                                className={styles.input}
                              />
                            ) : (
                              <span>{formData.director_name || 'Не указано'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Орган власти / Иное */}
                    {(personType === 'government' || personType === 'other') && (
                      <div className={styles.fieldGroup}>
                        <h3 className={styles.subsectionTitle}>
                          {personType === 'government' ? 'Данные органа власти' : 'Дополнительные данные'}
                        </h3>
                        <div className={styles.field}>
                          <label>Полное наименование</label>
                          {(isEditing || isCreateMode) ? (
                            <input
                              type="text"
                              name="name"
                              value={formData.name || ''}
                              onChange={handleInputChange}
                              className={styles.input}
                              placeholder="Введите полное наименование"
                            />
                          ) : (
                            <span>{formData.name || 'Не указано'}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Вкладка: Данные физического лица */}
                {activeTab === 'physical' && personType === 'individual' && (
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Данные физического лица</h3>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Дата рождения</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="date"
                            name="birth_date"
                            value={formData.birth_date || ''}
                            onChange={(e) => handleDateChange('birth_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(formData.birth_date)}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Пол</label>
                        {(isEditing || isCreateMode) ? (
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
                        ) : (
                          <span>
                            {formData.gender === 'male' ? 'Мужской' : 
                             formData.gender === 'female' ? 'Женский' : 
                             'Не указан'}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Тип документа</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="text"
                            name="document_type"
                            value={formData.document_type || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Паспорт, в/у и т.д."
                          />
                        ) : (
                          <span>{formData.document_type || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Серия документа</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="text"
                            name="document_series"
                            value={formData.document_series || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formData.document_series || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Номер документа</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="text"
                            name="document_number"
                            value={formData.document_number || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formData.document_number || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Кем выдан</label>
                        {(isEditing || isCreateMode) ? (
                          <textarea
                            name="document_issued_by"
                            value={formData.document_issued_by || ''}
                            onChange={handleInputChange}
                            className={styles.textarea}
                            rows={2}
                          />
                        ) : (
                          <span>{formData.document_issued_by || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Дата выдачи</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="date"
                            name="document_issue_date"
                            value={formData.document_issue_date || ''}
                            onChange={(e) => handleDateChange('document_issue_date', e.target.value)}
                            className={styles.input}
                          />
                        ) : (
                          <span>{formatDate(formData.document_issue_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Вкладка: Контактная информация */}
                {activeTab === 'contacts' && (
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Контактная информация</h3>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>Адрес</label>
                        {(isEditing || isCreateMode) ? (
                          <textarea
                            name="address"
                            value={formData.address || ''}
                            onChange={handleInputChange}
                            className={styles.textarea}
                            rows={2}
                            placeholder="Адрес проживания/нахождения"
                          />
                        ) : (
                          <span>{formData.address || 'Не указано'}</span>
                        )}
                      </div>

                      {personType === 'legal' && (
                        <div className={styles.field}>
                          <label>Юридический адрес</label>
                          {(isEditing || isCreateMode) ? (
                            <textarea
                              name="legal_address"
                              value={formData.legal_address || ''}
                              onChange={handleInputChange}
                              className={styles.textarea}
                              rows={2}
                              placeholder="Юридический адрес"
                            />
                          ) : (
                            <span>{formData.legal_address || 'Не указано'}</span>
                          )}
                        </div>
                      )}

                      <div className={styles.field}>
                        <label>Телефон</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="+7 (___) ___-__-__"
                          />
                        ) : (
                          <span>{formData.phone || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Email</label>
                        {(isEditing || isCreateMode) ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="email@example.com"
                          />
                        ) : (
                          <span>{formData.email || 'Не указано'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Вкладка: Дополнительно */}
                {activeTab === 'additional' && (
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Дополнительная информация</h3>
                    <div className={styles.field}>
                      <label>Дополнительная информация</label>
                      {(isEditing || isCreateMode) ? (
                        <textarea
                          name="additional_info"
                          value={formData.additional_info || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={4}
                          placeholder="Примечания, комментарии..."
                        />
                      ) : (
                        <span>{formData.additional_info || 'Нет дополнительной информации'}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SideDetail;