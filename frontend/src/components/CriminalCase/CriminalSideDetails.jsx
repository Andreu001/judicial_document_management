import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './SideDetails.module.css';

const CriminalSideDetails = () => {
  const { proceedingId, sideId } = useParams();
  const navigate = useNavigate();
  const [side, setSide] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [sidesCaseOptions, setSidesCaseOptions] = useState([]);
  const [selectedSideId, setSelectedSideId] = useState('');
  
  // Определяем режим создания
  const isCreateMode = !sideId || sideId === 'create';

  useEffect(() => {
    if (proceedingId) {
      if (isCreateMode) {
        // Режим создания
        setLoading(false);
        setSide(null);
        setFormData({});
        setIsEditing(true);
        loadSidesCaseOptions();
      } else if (sideId) {
        // Режим редактирования/просмотра
        loadSideDetails();
        loadSidesCaseOptions();
      }
    }
  }, [proceedingId, sideId]);

  const loadSideDetails = async () => {
    if (isCreateMode) {
      setLoading(false);
      setSide(null);
      setFormData({});
      setSelectedSideId('');
      return;
    }

    try {
      setLoading(true);
      const data = await CriminalCaseService.getSideById(proceedingId, sideId);
      
      // Обрабатываем вложенные данные стороны
      const sideDetails = data.criminal_side_case_detail || {};
      const sideData = {
        ...data,
        ...sideDetails,
        sides_case_criminal_id: data.sides_case_criminal_id || 
                                data.sides_case_criminal?.id || 
                                data.sides_case_criminal || 
                                null,
        sides_case_criminal_name: data.sides_case_criminal_name || 
                                 data.sides_case_criminal?.sides_case || 
                                 data.sides_case_criminal_detail?.sides_case || 
                                 'Не указан'
      };
      
      setSide(sideData);
      setFormData(sideData);
      setSelectedSideId(sideData.sides_case_criminal_id ? 
                       String(sideData.sides_case_criminal_id) : '');
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных стороны:', error);
      setLoading(false);
      setSide(null);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'sides_case_criminal') {
      setSelectedSideId(value);
      
      const selectedSide = sidesCaseOptions.find(option => 
        String(option.id) === String(value)
      );
      
      setFormData(prev => ({
        ...prev,
        sides_case_criminal: value ? parseInt(value, 10) : null,
        sides_case_criminal_name: selectedSide ? selectedSide.sides_case : ''
      }));
    } else {
      // Для всех полей стороны
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Собираем данные для связанной модели SidesCaseInCase
      const sideCaseData = {
        // Основная информация стороны
        name: formData.name || '',
        status: formData.status || 'individual',
        // Личные данные
        birth_date: formData.birth_date || null, // Исправляем: null вместо пустой строки
        gender: formData.gender || '',
        // Документы
        document_type: formData.document_type || '',
        document_number: formData.document_number || '',
        document_series: formData.document_series || '',
        document_issued_by: formData.document_issued_by || '',
        document_issue_date: formData.document_issue_date || null, // Исправляем: null вместо пустой строки
        // Для юридических лиц
        inn: formData.inn || '',
        kpp: formData.kpp || '',
        ogrn: formData.ogrn || '',
        legal_address: formData.legal_address || '',
        director_name: formData.director_name || '',
        // Контактная информация
        address: formData.address || '',
        phone: formData.phone || '',
        email: formData.email || '',
        // Дополнительная информация
        additional_info: formData.additional_info || '',
        // Для уголовного дела (специфичные поля)
        date_sending_agenda: formData.date_sending_agenda || null, // Исправляем: null вместо пустой строки
      };

      // Основные данные для CriminalSidesCaseInCase
      const sideData = {
        sides_case_criminal: selectedSideId ? parseInt(selectedSideId, 10) : null,
        criminal_side_case_data: sideCaseData
      };

      console.log('Отправляемые данные стороны:', sideData);

      // Проверка обязательных полей
      if (!sideData.sides_case_criminal) {
        alert('Пожалуйста, выберите вид стороны');
        setSaving(false);
        return;
      }
      
      if (!sideCaseData.name) {
        alert('Пожалуйста, укажите ФИО / Наименование');
        setSaving(false);
        return;
      }
      
      let savedSide;
      if (isCreateMode) {
        // Отправляем данные для создания
        savedSide = await CriminalCaseService.createSide(proceedingId, sideData);
        // После создания редиректим назад
        navigate(-1);
      } else {
        // Отправляем данные для обновления
        await CriminalCaseService.updateSide(proceedingId, sideId, sideData);
        setIsEditing(false);
        await loadSideDetails();
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Ошибка сохранения стороны:', error);
      console.error('Детали ошибки:', error.response?.data);
      setSaving(false);
      
      if (error.response?.data) {
        if (error.response.data.sides_case_criminal) {
          alert(`Ошибка в поле "Вид стороны": ${error.response.data.sides_case_criminal[0]}`);
        } else if (error.response.data.detail) {
          alert(`Ошибка: ${error.response.data.detail}`);
        } else {
          alert('Произошла ошибка при сохранении стороны');
        }
      }
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate(-1);
    } else {
      setFormData(side);
      setSelectedSideId(side?.sides_case_criminal_id ? 
                       String(side.sides_case_criminal_id) : '');
      setIsEditing(false);
    }
  };

  const handleEditStart = () => {
    if (formData.sides_case_criminal_id) {
      setSelectedSideId(String(formData.sides_case_criminal_id));
    } else {
      setSelectedSideId('');
    }
    setIsEditing(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getSideTypeName = (sideId) => {
    if (!sideId) return 'Не указан';
    const sideOption = sidesCaseOptions.find(option => option.id == sideId);
    return sideOption ? sideOption.sides_case : `ID: ${sideId}`;
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

  if (!side && !isCreateMode) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Сторона не найдена</h2>
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
    { id: 'personal', label: 'Личные данные' },
    { id: 'documents', label: 'Документы' },
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
              {!isCreateMode && (
                <span> | Вид стороны: {getSideTypeName(side?.sides_case_criminal_id)}</span>
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
                      name="sides_case_criminal"
                      value={selectedSideId || ''}
                      onChange={handleInputChange}
                      className={styles.select}
                      required
                      disabled={!isCreateMode && !isEditing}
                    >
                      <option value="">Выберите вид стороны</option>
                      {sidesCaseOptions.map(sideOption => (
                        <option key={sideOption.id} value={String(sideOption.id)}>
                          {sideOption.sides_case}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{getSideTypeName(side?.sides_case_criminal_id)}</span>
                  )}
                </div>

                <h3 className={styles.subsectionTitle} style={{ marginTop: '2rem' }}>
                  Общая информация
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>ФИО / Наименование *</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        required
                        placeholder="Полное имя или наименование организации"
                      />
                    ) : (
                      <span>{side?.name || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Статус *</label>
                    {isEditing || isCreateMode ? (
                      <select
                        name="status"
                        value={formData.status || 'individual'}
                        onChange={handleInputChange}
                        className={styles.select}
                      >
                        <option value="individual">Физическое лицо</option>
                        <option value="legal">Юридическое лицо</option>
                      </select>
                    ) : (
                      <span>
                        {formData.status === 'individual' ? 'Физическое лицо' : 
                         formData.status === 'legal' ? 'Юридическое лицо' : 
                         formData.status || 'Не указано'}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Дата отправки повестки</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="date"
                        name="date_sending_agenda"
                        value={formData.date_sending_agenda || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{formatDate(side?.date_sending_agenda)}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Гражданство</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="text"
                        name="citizenship"
                        value={formData.citizenship || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Гражданство"
                      />
                    ) : (
                      <span>{side?.citizenship || 'Не указано'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка: Личные данные */}
            {activeTab === 'personal' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Личные данные
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>Дата рождения</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{formatDate(side?.birth_date)}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Пол</label>
                    {isEditing || isCreateMode ? (
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
                </div>
              </div>
            )}

            {/* Вкладка: Документы */}
            {activeTab === 'documents' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Основной документ
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>Тип документа</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="text"
                        name="document_type"
                        value={formData.document_type || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Паспорт, Свидетельство и т.д."
                      />
                    ) : (
                      <span>{side?.document_type || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Серия</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="text"
                        name="document_series"
                        value={formData.document_series || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Серия документа"
                      />
                    ) : (
                      <span>{side?.document_series || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Номер</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="text"
                        name="document_number"
                        value={formData.document_number || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Номер документа"
                      />
                    ) : (
                      <span>{side?.document_number || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Кем выдан</label>
                    {isEditing || isCreateMode ? (
                      <textarea
                        name="document_issued_by"
                        value={formData.document_issued_by || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows="2"
                        placeholder="Кем выдан документ"
                      />
                    ) : (
                      <span>{side?.document_issued_by || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Дата выдачи</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="date"
                        name="document_issue_date"
                        value={formData.document_issue_date || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{formatDate(side?.document_issue_date)}</span>
                    )}
                  </div>
                </div>

                {formData.status === 'legal' && (
                  <>
                    <h3 className={styles.subsectionTitle} style={{ marginTop: '2rem' }}>
                      Реквизиты юридического лица
                    </h3>
                    <div className={styles.tabGrid}>
                      <div className={styles.field}>
                        <label>ИНН</label>
                        {isEditing || isCreateMode ? (
                          <input
                            type="text"
                            name="inn"
                            value={formData.inn || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Идентификационный номер налогоплательщика"
                          />
                        ) : (
                          <span>{side?.inn || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>КПП</label>
                        {isEditing || isCreateMode ? (
                          <input
                            type="text"
                            name="kpp"
                            value={formData.kpp || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Код причины постановки на учет"
                          />
                        ) : (
                          <span>{side?.kpp || 'Не указано'}</span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>ОГРН</label>
                        {isEditing || isCreateMode ? (
                          <input
                            type="text"
                            name="ogrn"
                            value={formData.ogrn || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Основной государственный регистрационный номер"
                          />
                        ) : (
                          <span>{side?.ogrn || 'Не указано'}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Вкладка: Контактная информация */}
            {activeTab === 'contacts' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Контактная информация
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>Адрес</label>
                    {isEditing || isCreateMode ? (
                      <textarea
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows="2"
                        placeholder="Фактический адрес проживания/нахождения"
                      />
                    ) : (
                      <span>{side?.address || 'Не указано'}</span>
                    )}
                  </div>

                  {formData.status === 'legal' && (
                    <div className={styles.field}>
                      <label>Юридический адрес</label>
                      {isEditing || isCreateMode ? (
                        <textarea
                          name="legal_address"
                          value={formData.legal_address || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows="2"
                          placeholder="Юридический адрес организации"
                        />
                      ) : (
                        <span>{side?.legal_address || 'Не указано'}</span>
                      )}
                    </div>
                  )}

                  <div className={styles.field}>
                    <label>Телефон</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Контактный телефон"
                      />
                    ) : (
                      <span>{side?.phone || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Email</label>
                    {isEditing || isCreateMode ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Электронная почта"
                      />
                    ) : (
                      <span>{side?.email || 'Не указано'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка: Дополнительно */}
            {activeTab === 'additional' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Дополнительная информация
                </h3>
                
                {formData.status === 'legal' && (
                  <div className={styles.tabGrid}>
                    <div className={styles.field}>
                      <label>ФИО руководителя</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="text"
                          name="director_name"
                          value={formData.director_name || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="ФИО руководителя организации"
                        />
                      ) : (
                        <span>{side?.director_name || 'Не указано'}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.field} style={{ marginTop: '2rem' }}>
                  <label>Дополнительная информация</label>
                  {isEditing || isCreateMode ? (
                    <textarea
                      name="additional_info"
                      value={formData.additional_info || ''}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      rows="4"
                      placeholder="Любая дополнительная информация о стороне..."
                    />
                  ) : (
                    <span>{side?.additional_info || 'Нет примечаний'}</span>
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

export default CriminalSideDetails;