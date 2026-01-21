import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Building,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Calendar,
  Award,
  Edit2,
  Save,
  X,
  ArrowLeft,
  DollarSign,
  Banknote,
  FileCheck
} from 'lucide-react';
import baseService from '../../API/baseService';
import './LawyerDetails.module.css';

const LawyerDetails = () => {
  const { businesscardId, lawyerId } = useParams();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLawyerDetails();
  }, [businesscardId, lawyerId]);

  const loadLawyerDetails = async () => {
    try {
      setLoading(true);
      // Вам нужно будет создать соответствующий endpoint для получения данных адвоката
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
      // Вам нужно будет создать соответствующий endpoint для обновления данных адвоката
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
      <div className="lawyer-details loading">
        <div className="loading-spinner"></div>
        <p>Загрузка данных адвоката...</p>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="lawyer-details not-found">
        <h2>Адвокат не найден</h2>
        <button 
          onClick={() => navigate(`/cases/${businesscardId}`)}
          className="back-button"
        >
          ← Вернуться к делу
        </button>
      </div>
    );
  }

  return (
    <div className="lawyer-details">
      <div className="lawyer-header">
        <div className="header-left">
          <button 
            onClick={() => navigate(`/cases/${businesscardId}`)}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Назад к делу
          </button>
          <h1>
            <User size={24} />
            {lawyer.sides_case_incase?.name || 'Адвокат'}
          </h1>
          <span className="lawyer-id">ID: {lawyer.id}</span>
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

      <div className="lawyer-content">
        {/* Левая колонка - Основная информация об адвокате */}
        <div className="main-info">
          {/* Информация об адвокатском образовании */}
          <div className="info-card">
            <div className="card-header">
              <h2><Building size={20} /> Адвокатское образование</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Название адвокатского образования</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="law_firm_name"
                      value={formData.law_firm_name || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.law_firm_name || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Адрес</label>
                  {isEditing ? (
                    <textarea
                      name="law_firm_address"
                      value={formData.law_firm_address || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      rows="2"
                    />
                  ) : (
                    <div className="display-value">{lawyer.law_firm_address || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label><Phone size={16} /> Телефон</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="law_firm_phone"
                      value={formData.law_firm_phone || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.law_firm_phone || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label><Mail size={16} /> Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="law_firm_email"
                      value={formData.law_firm_email || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.law_firm_email || 'Не указано'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Информация об адвокатском удостоверении */}
          <div className="info-card">
            <div className="card-header">
              <h2><Award size={20} /> Адвокатское удостоверение</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Номер удостоверения</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lawyer_certificate_number"
                      value={formData.lawyer_certificate_number || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.lawyer_certificate_number || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Дата выдачи</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="lawyer_certificate_date"
                      value={formData.lawyer_certificate_date || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{formatDate(lawyer.lawyer_certificate_date)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Примечания */}
          <div className="info-card">
            <div className="card-header">
              <h2><FileText size={20} /> Примечания</h2>
            </div>
            <div className="card-body">
              <div className="form-group full-width">
                <label>Дополнительная информация</label>
                {isEditing ? (
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="4"
                  />
                ) : (
                  <div className="display-value">{lawyer.notes || 'Нет примечаний'}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - Финансовая информация */}
        <div className="side-info">
          {/* Реквизиты для оплаты */}
          <div className="info-card">
            <div className="card-header">
              <h2><CreditCard size={20} /> Банковские реквизиты</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Наименование банка</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.bank_name || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>БИК банка</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="bank_bik"
                      value={formData.bank_bik || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.bank_bik || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Корреспондентский счет</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="correspondent_account"
                      value={formData.correspondent_account || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.correspondent_account || 'Не указано'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Расчетный счет</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="payment_account"
                      value={formData.payment_account || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.payment_account || 'Не указано'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Информация об оплате */}
          <div className="info-card">
            <div className="card-header">
              <h2><DollarSign size={20} /> Информация об оплате</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Количество дней для оплаты</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="days_for_payment"
                      value={formData.days_for_payment || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{lawyer.days_for_payment || '0'} дней</div>
                  )}
                </div>

                <div className="form-group">
                  <label><Banknote size={16} /> Сумма оплаты</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      name="payment_amount"
                      value={formData.payment_amount || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{formatCurrency(lawyer.payment_amount)}</div>
                  )}
                </div>

                <div className="form-group">
                  <label><Calendar size={16} /> Дата постановления</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="payment_date"
                      value={formData.payment_date || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <div className="display-value">{formatDate(lawyer.payment_date)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Связанная сторона по делу */}
          {lawyer.sides_case_incase && (
            <div className="info-card">
              <div className="card-header">
                <h2><User size={20} /> Связанная сторона</h2>
              </div>
              <div className="card-body">
                <div className="related-party">
                  <div className="party-info">
                    <div className="info-row">
                      <strong>Имя:</strong> {lawyer.sides_case_incase.name}
                    </div>
                    <div className="info-row">
                      <strong>Статус:</strong> {lawyer.sides_case_incase.get_status_display || lawyer.sides_case_incase.status}
                    </div>
                    {lawyer.sides_case_incase.phone && (
                      <div className="info-row">
                        <strong>Телефон:</strong> {lawyer.sides_case_incase.phone}
                      </div>
                    )}
                    {lawyer.sides_case_incase.email && (
                      <div className="info-row">
                        <strong>Email:</strong> {lawyer.sides_case_incase.email}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/cases/${businesscardId}/sides/${lawyer.sides_case_incase.id}`)}
                    className="view-party-button"
                  >
                    <FileCheck size={16} />
                    Просмотреть сторону
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

export default LawyerDetails;
