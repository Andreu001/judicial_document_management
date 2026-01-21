import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Users,
  Briefcase,
  Home,
  Globe,
  Edit2,
  Save,
  X,
  ArrowLeft,
  UserCheck,
  Shield,
  Award
} from 'lucide-react';
import baseService from '../../API/baseService';
import SideService from '../../API/SideService';
import './SideDetails.module.css';

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
      const response = await SideService.getSideById(cardId, sideId);
      setSide(response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных стороны:', error);
      setLoading(false);
    }
  };

  const loadSidesCaseOptions = async () => {
    try {
      const response = await baseService.get('/business_card/sides/');
      setSidesCaseOptions(response.data);
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
      <div className="side-details loading">
        <div className="loading-spinner"></div>
        <p>Загрузка данных стороны...</p>
      </div>
    );
  }

  if (!side) {
    return (
      <div className="side-details not-found">
        <h2>Сторона не найдена</h2>
        <button 
          onClick={() => navigate(`/cases/${cardId}`)}
          className="back-button"
        >
          ← Вернуться к списку
        </button>
      </div>
    );
  }

  return (
    <div className="side-details">
      <div className="side-header">
        <div className="header-left">
          <button 
            onClick={() => navigate(`/cases/${cardId}`)}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Назад к списку
          </button>
          <h1>
            <User size={24} />
            {side.name}
            <span className="side-status">
              <Shield size={14} />
              {getStatusDisplay(side.status)}
            </span>
          </h1>
          <div className="side-roles">
            {side.sides_case?.map((role, index) => (
              <span key={index} className="role-badge">
                <UserCheck size={12} />
                {role.sides_case}
              </span>
            ))}
          </div>
        </div>
        
        <div className="header-right">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="edit-button"
            >
              <Edit2 size={18} />
              Редактировать
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="save-button"
              >
                <Save size={18} />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                onClick={handleCancel}
                className="cancel-button"
              >
                <X size={18} />
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="side-content">
        {/* Левая колонка - Основная информация */}
        <div className="main-info">
          {/* Общая информация */}
          <div className="info-card">
            <div className="card-header">
              <h2><User size={20} /> Основная информация</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>ФИО / Наименование</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{side.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Статус лица</label>
                  {isEditing ? (
                    <select
                      name="status"
                      value={formData.status || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="individual">Физическое лицо</option>
                      <option value="legal">Юридическое лицо</option>
                      <option value="government">Орган власти</option>
                      <option value="other">Иное</option>
                    </select>
                  ) : (
                    <div className="display-value">{getStatusDisplay(side.status)}</div>
                  )}
                </div>

                <div className="form-group">
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
                      className="form-control"
                    >
                      {sidesCaseOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.sides_case}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="display-value">
                      {side.sides_case?.map(role => role.sides_case).join(', ') || 'Не указано'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label><Calendar size={16} /> Дата направления повестки</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="date_sending_agenda"
                      value={formData.date_sending_agenda || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{formatDate(side.date_sending_agenda)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="info-card">
            <div className="card-header">
              <h2><Phone size={20} /> Контактная информация</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label><Phone size={16} /> Телефон</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{side.phone || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label><Mail size={16} /> Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{side.email || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label><MapPin size={16} /> Адрес</label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      rows="2"
                    />
                  ) : (
                    <div className="display-value">{side.address || 'Не указано'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Для физических лиц */}
          {side.status === 'individual' && (
            <div className="info-card">
              <div className="card-header">
                <h2><User size={20} /> Данные физического лица</h2>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label><Calendar size={16} /> Дата рождения</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{formatDate(side.birth_date)}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Пол</label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="">Выберите пол</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                      </select>
                    ) : (
                      <div className="display-value">{getGenderDisplay(side.gender)}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Тип документа</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="document_type"
                        value={formData.document_type || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{side.document_type || 'Не указано'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Серия документа</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="document_series"
                        value={formData.document_series || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{side.document_series || 'Не указано'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Номер документа</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="document_number"
                        value={formData.document_number || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{side.document_number || 'Не указано'}</div>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Кем выдан</label>
                    {isEditing ? (
                      <textarea
                        name="document_issued_by"
                        value={formData.document_issued_by || ''}
                        onChange={handleInputChange}
                        className="form-control"
                        rows="2"
                      />
                    ) : (
                      <div className="display-value">{side.document_issued_by || 'Не указано'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Дата выдачи</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="document_issue_date"
                        value={formData.document_issue_date || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{formatDate(side.document_issue_date)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка - Дополнительная информация */}
        <div className="side-info">
          {/* Для юридических лиц */}
          {side.status === 'legal' && (
            <div className="info-card">
              <div className="card-header">
                <h2><Building size={20} /> Данные юридического лица</h2>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>ИНН</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="inn"
                        value={formData.inn || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{side.inn || 'Не указано'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>КПП</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="kpp"
                        value={formData.kpp || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{side.kpp || 'Не указано'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>ОГРН</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="ogrn"
                        value={formData.ogrn || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{side.ogrn || 'Не указано'}</div>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Юридический адрес</label>
                    {isEditing ? (
                      <textarea
                        name="legal_address"
                        value={formData.legal_address || ''}
                        onChange={handleInputChange}
                        className="form-control"
                        rows="2"
                      />
                    ) : (
                      <div className="display-value">{side.legal_address || 'Не указано'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>ФИО руководителя</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="director_name"
                        value={formData.director_name || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      <div className="display-value">{side.director_name || 'Не указано'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Дополнительная информация */}
          <div className="info-card">
            <div className="card-header">
              <h2><FileText size={20} /> Дополнительная информация</h2>
            </div>
            <div className="card-body">
              <div className="form-group full-width">
                <label>Примечания</label>
                {isEditing ? (
                  <textarea
                    name="additional_info"
                    value={formData.additional_info || ''}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="4"
                  />
                ) : (
                  <div className="display-value">{side.additional_info || 'Нет дополнительной информации'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Информация о связанном деле */}
          <div className="info-card">
            <div className="card-header">
              <h2><Briefcase size={20} /> Информация о деле</h2>
            </div>
            <div className="card-body">
              <div className="case-info">
                <div className="info-row">
                  <strong>ID дела:</strong> {side.business_card?.id}
                </div>
                <div className="info-row">
                  <strong>Номер дела:</strong> {side.business_card?.original_name}
                </div>
                <div className="info-row">
                  <strong>Категория:</strong> {side.business_card?.case_category?.title_category || 'Не указано'}
                </div>
                <button 
                  onClick={() => navigate(`/cases/${side.business_card?.id}`)}
                  className="view-case-button"
                >
                  <Globe size={16} />
                  Перейти к делу
                </button>
              </div>
            </div>
          </div>

          {/* Связанный адвокат */}
          {side.lawyer_info && (
            <div className="info-card">
              <div className="card-header">
                <h2><Award size={20} /> Связанный адвокат</h2>
              </div>
              <div className="card-body">
                <div className="lawyer-info">
                  <div className="info-row">
                    <strong>Адвокатское образование:</strong> {side.lawyer_info.law_firm_name}
                  </div>
                  {side.lawyer_info.lawyer_certificate_number && (
                    <div className="info-row">
                      <strong>Номер удостоверения:</strong> {side.lawyer_info.lawyer_certificate_number}
                    </div>
                  )}
                  <button 
                    onClick={() => navigate(`/cases/${cardId}/lawyers/${side.lawyer_info.id}`)}
                    className="view-lawyer-button"
                  >
                    <Award size={16} />
                    Просмотреть адвоката
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideDetails;
