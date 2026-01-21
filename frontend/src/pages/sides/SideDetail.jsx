import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Edit2,
  Save,
  X
} from 'lucide-react';
import baseService from '../../API/baseService';
import SideService from '../../API/SideService';
import styles from './SideDetails.module.css'; // Исправленный импорт

const SideDetails = () => {
  const { cardId, sideId } = useParams();
  const navigate = useNavigate();
  const [side, setSide] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidesCaseOptions, setSidesCaseOptions] = useState([]);

  useEffect(() => {
    if (cardId && sideId) {
      loadSideDetails();
      loadSidesCaseOptions();
    }
  }, [cardId, sideId]);

  const loadSideDetails = async () => {
    try {
      setLoading(true);
      const response = await SideService.getAllSide(cardId);
      const sideData = response.data.find(s => s.id === parseInt(sideId));
      setSide(sideData);
      setFormData(sideData || {});
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных стороны:', error);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      await SideService.updateSide(cardId, sideId, formData);
      setIsEditing(false);
      await loadSideDetails();
      setSaving(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(side);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'individual': 'Физическое лицо',
      'legal': 'Юридическое лицо',
      'government': 'Орган власти',
      'other': 'Иное'
    };
    return statusMap[status] || status;
  };

  const getGenderDisplay = (gender) => {
    const genderMap = {
      'male': 'Мужской',
      'female': 'Женский'
    };
    return genderMap[gender] || gender;
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

  if (!side) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Сторона не найдена</h2>
          <button 
            onClick={() => navigate(`/cases/${cardId}`)}
            className={styles.backButton}
          >
            <ArrowLeft size={20} />
            Вернуться к делу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            <ArrowLeft size={20} />
            Назад к делу
          </button>
          <h1 className={styles.title}>
            <User size={24} />
            {side.name || 'Сторона по делу'}
          </h1>
          <span className={styles.defendantId}>ID: {side.id}</span>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className={styles.editButton}
            >
              <Edit2 size={18} />
              Редактировать
            </button>
          ) : (
            <div className={styles.editActions}>
              <button 
                onClick={handleSave}
                disabled={saving}
                className={styles.saveButton}
              >
                <Save size={18} />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                onClick={handleCancel}
                className={styles.cancelButton}
              >
                <X size={18} />
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.activeTab}`}>
            <User size={18} />
            Основная информация
          </button>
        </div>

        <div className={styles.tabContentWrapper}>
          <div className={styles.tabContent}>
            {/* Основная информация */}
            <div className={styles.fieldGroup}>
              <h3 className={styles.subsectionTitle}>
                <User size={20} />
                Основные данные
              </h3>
              <div className={styles.tabGrid}>
                <div className={styles.field}>
                  <label>ФИО / Наименование</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  ) : (
                    <span>{side.name || 'Не указано'}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Статус лица</label>
                  {isEditing ? (
                    <select
                      name="status"
                      value={formData.status || ''}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="">Выберите статус</option>
                      <option value="individual">Физическое лицо</option>
                      <option value="legal">Юридическое лицо</option>
                      <option value="government">Орган власти</option>
                      <option value="other">Иное</option>
                    </select>
                  ) : (
                    <span>{getStatusDisplay(side.status)}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Стороны по делу</label>
                  {isEditing ? (
                    <select
                      multiple
                      name="sides_case"
                      value={formData.sides_case || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData(prev => ({ ...prev, sides_case: selected }));
                      }}
                      className={styles.select}
                    >
                      {sidesCaseOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.sides_case}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>
                      {Array.isArray(side.sides_case) 
                        ? side.sides_case.map(role => 
                            typeof role === 'object' ? role.sides_case : role
                          ).join(', ') 
                        : 'Не указано'}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Дата направления повестки</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="date_sending_agenda"
                      value={formData.date_sending_agenda || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  ) : (
                    <span>{formatDate(side.date_sending_agenda)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Контактная информация */}
            <div className={styles.fieldGroup}>
              <h3 className={styles.subsectionTitle}>
                Контактная информация
              </h3>
              <div className={styles.tabGrid}>
                <div className={styles.field}>
                  <label>Телефон</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  ) : (
                    <span>{side.phone || 'Не указано'}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  ) : (
                    <span>{side.email || 'Не указано'}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Адрес</label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      rows="2"
                    />
                  ) : (
                    <span>{side.address || 'Не указано'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Данные физического лица */}
            {side.status === 'individual' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Данные физического лица
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>Дата рождения</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{formatDate(side.birth_date)}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Пол</label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleInputChange}
                        className={styles.select}
                      >
                        <option value="">Выберите пол</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                      </select>
                    ) : (
                      <span>{getGenderDisplay(side.gender)}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Тип документа</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="document_type"
                        value={formData.document_type || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{side.document_type || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Серия документа</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="document_series"
                        value={formData.document_series || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{side.document_series || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Номер документа</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="document_number"
                        value={formData.document_number || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{side.document_number || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Кем выдан</label>
                    {isEditing ? (
                      <textarea
                        name="document_issued_by"
                        value={formData.document_issued_by || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows="2"
                      />
                    ) : (
                      <span>{side.document_issued_by || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Дата выдачи</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="document_issue_date"
                        value={formData.document_issue_date || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{formatDate(side.document_issue_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Данные юридического лица */}
            {side.status === 'legal' && (
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>
                  Данные юридического лица
                </h3>
                <div className={styles.tabGrid}>
                  <div className={styles.field}>
                    <label>ИНН</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="inn"
                        value={formData.inn || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{side.inn || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>КПП</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="kpp"
                        value={formData.kpp || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{side.kpp || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>ОГРН</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="ogrn"
                        value={formData.ogrn || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{side.ogrn || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>Юридический адрес</label>
                    {isEditing ? (
                      <textarea
                        name="legal_address"
                        value={formData.legal_address || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows="2"
                      />
                    ) : (
                      <span>{side.legal_address || 'Не указано'}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>ФИО руководителя</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="director_name"
                        value={formData.director_name || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{side.director_name || 'Не указано'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className={styles.fieldGroup}>
              <h3 className={styles.subsectionTitle}>
                Дополнительная информация
              </h3>
              <div className={styles.tabGrid}>
                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                  <label>Примечания</label>
                  {isEditing ? (
                    <textarea
                      name="additional_info"
                      value={formData.additional_info || ''}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      rows="4"
                    />
                  ) : (
                    <span>{side.additional_info || 'Нет дополнительной информации'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideDetails;