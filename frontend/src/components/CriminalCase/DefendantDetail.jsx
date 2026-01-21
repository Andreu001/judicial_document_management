import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  MapPin, 
  Scale, 
  Award, 
  Shield,
  FileText,
  Edit2,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import './DefendantDetail.module.css';

const DefendantDetails = () => {
  const { businesscardId, defendantId } = useParams();
  const navigate = useNavigate();
  const [defendant, setDefendant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({
    sex: [],
    restraint_measure: [],
    restraint_application: [],
    restraint_change: [],
    trial_result: []
  });

  useEffect(() => {
    loadDefendantDetails();
    loadOptions();
  }, [businesscardId, defendantId]);

  const loadDefendantDetails = async () => {
    try {
      setLoading(true);
      const data = await CriminalCaseService.getDefendantById(businesscardId, defendantId);
      setDefendant(data);
      setFormData(data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных подсудимого:', error);
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await baseService.get('/criminal_proceedings/defendant-options/');
      setOptions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (field, date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date || null
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await CriminalCaseService.updateDefendant(businesscardId, defendantId, formData);
      setIsEditing(false);
      await loadDefendantDetails();
      setSaving(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(defendant);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getDisplayValue = (value, optionsArray) => {
    if (!value) return 'Не указано';
    const option = optionsArray?.find(opt => opt.value === value);
    return option?.label || value;
  };

  if (loading) {
    return (
      <div className="defendant-details loading">
        <div className="loading-spinner"></div>
        <p>Загрузка данных подсудимого...</p>
      </div>
    );
  }

  if (!defendant) {
    return (
      <div className="defendant-details not-found">
        <h2>Подсудимый не найден</h2>
        <button 
          onClick={() => navigate(`/cases/${businesscardId}/defendants`)}
          className="back-button"
        >
          ← Вернуться к списку
        </button>
      </div>
    );
  }

  return (
    <div className="defendant-details">
      <div className="defendant-header">
        <div className="header-left">
          <button 
            onClick={() => navigate(`/cases/${businesscardId}/defendants`)}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Назад к списку
          </button>
          <h1>
            <User size={24} />
            {defendant.full_name}
          </h1>
          <span className="defendant-id">ID: {defendant.id}</span>
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

      <div className="defendant-content">
        {/* Левая колонка - Основная информация */}
        <div className="main-info">
          <div className="info-card">
            <div className="card-header">
              <h2><User size={20} /> Основные данные</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label><User size={16} /> Полное ФИО</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{defendant.full_name || 'Не указано'}</div>
                  )}
                </div>

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
                    <div className="display-value">{formatDate(defendant.birth_date)}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Пол</label>
                  {isEditing ? (
                    <select
                      name="sex"
                      value={formData.sex || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="">Выберите пол</option>
                      {options.sex?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="display-value">
                      {getDisplayValue(defendant.sex, options.sex)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Гражданство</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="citizenship"
                      value={formData.citizenship || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{defendant.citizenship || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label><MapPin size={16} /> Адрес проживания</label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      rows="3"
                    />
                  ) : (
                    <div className="display-value">{defendant.address || 'Не указано'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Меры пресечения */}
          <div className="info-card">
            <div className="card-header">
              <h2><Shield size={20} /> Меры пресечения</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Мера пресечения</label>
                  {isEditing ? (
                    <select
                      name="restraint_measure"
                      value={formData.restraint_measure || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="">Выберите меру</option>
                      {options.restraint_measure?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="display-value">
                      {getDisplayValue(defendant.restraint_measure, options.restraint_measure)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Дата избрания</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="restraint_date"
                      value={formData.restraint_date || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{formatDate(defendant.restraint_date)}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Мера применена</label>
                  {isEditing ? (
                    <select
                      name="restraint_application"
                      value={formData.restraint_application || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="">Выберите момент</option>
                      {options.restraint_application?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="display-value">
                      {getDisplayValue(defendant.restraint_application, options.restraint_application)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Изменение меры</label>
                  {isEditing ? (
                    <select
                      name="restraint_change"
                      value={formData.restraint_change || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="">Выберите статус</option>
                      {options.restraint_change?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="display-value">
                      {getDisplayValue(defendant.restraint_change, options.restraint_change)}
                    </div>
                  )}
                </div>

                {defendant.restraint_change === '1' && (
                  <>
                    <div className="form-group">
                      <label>Дата изменения</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="restraint_change_date"
                          value={formData.restraint_change_date || ''}
                          onChange={handleInputChange}
                          className="form-control"
                        />
                      ) : (
                        <div className="display-value">{formatDate(defendant.restraint_change_date)}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Изменена на меру</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="restraint_change_to"
                          value={formData.restraint_change_to || ''}
                          onChange={handleInputChange}
                          className="form-control"
                        />
                      ) : (
                        <div className="display-value">{defendant.restraint_change_to || 'Не указано'}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - Дополнительная информация */}
        <div className="side-info">
          {/* Уголовная статья */}
          <div className="info-card">
            <div className="card-header">
              <h2><Scale size={20} /> Уголовная статья</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Статья УК РФ</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="article"
                      value={formData.article || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">ст. {defendant.article || 'Не указана'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Максимальное наказание</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="maximum_penalty_article"
                      value={formData.maximum_penalty_article || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">
                      {defendant.maximum_penalty_article ? `${defendant.maximum_penalty_article} лет` : 'Не указано'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Наказание */}
          <div className="info-card">
            <div className="card-header">
              <h2><Award size={20} /> Наказание</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Статья по приговору</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="conviction_article"
                      value={formData.conviction_article || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{defendant.conviction_article || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Вид наказания</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="punishment_type"
                      value={formData.punishment_type || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{defendant.punishment_type || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Срок наказания</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="punishment_term"
                      value={formData.punishment_term || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{defendant.punishment_term || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Дополнительное наказание</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="additional_punishment"
                      value={formData.additional_punishment || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{defendant.additional_punishment || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Условно-досрочное освобождение</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="parole_info"
                      value={formData.parole_info || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{defendant.parole_info || 'Не указано'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Финансовые взыскания */}
          <div className="info-card">
            <div className="card-header">
              <h2><FileText size={20} /> Финансовые взыскания</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Сумма ущерба</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      name="property_damage"
                      value={formData.property_damage || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">
                      {defendant.property_damage ? `${defendant.property_damage} руб.` : 'Не указано'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Сумма морального вреда</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      name="moral_damage"
                      value={formData.moral_damage || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">
                      {defendant.moral_damage ? `${defendant.moral_damage} руб.` : 'Не указано'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Особые отметки */}
          <div className="info-card">
            <div className="card-header">
              <h2><FileText size={20} /> Особые отметки</h2>
            </div>
            <div className="card-body">
              <div className="form-group full-width">
                <label>Заметки по лицу</label>
                {isEditing ? (
                  <textarea
                    name="special_notes"
                    value={formData.special_notes || ''}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="4"
                  />
                ) : (
                  <div className="display-value">{defendant.special_notes || 'Нет особых отметок'}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefendantDetails;
