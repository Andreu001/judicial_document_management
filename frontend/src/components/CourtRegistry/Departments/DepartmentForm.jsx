// src/components/CourtRegistry/Departments/DepartmentForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDepartment, createDepartment, updateDepartment, getMyCourt } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const DepartmentForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [courtId, setCourtId] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    phone_internal: '',
    room: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    // Получаем courtId из query параметров
    const queryParams = new URLSearchParams(location.search);
    const courtFromQuery = queryParams.get('court');
    if (courtFromQuery) {
      setCourtId(parseInt(courtFromQuery));
    } else {
      // Если court не передан, получаем текущий суд
      getMyCourt().then(res => {
        if (res.data) {
          setCourtId(res.data.id);
        }
      }).catch(() => {});
    }

    if (isEdit && id) {
      setLoading(true);
      getDepartment(id).then(res => {
        const d = res.data;
        setForm({
          name: d.name || '',
          phone_internal: d.phone_internal || '',
          room: d.room || '',
          description: d.description || '',
          is_active: d.is_active !== undefined ? d.is_active : true,
          sort_order: d.sort_order || 0,
        });
        setCourtId(d.court);
      }).catch(() => setError('Не удалось загрузить отдел'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, location]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = { ...form };
      if (courtId) data.court = parseInt(courtId);
      
      if (isEdit && id) {
        await updateDepartment(id, data);
      } else {
        await createDepartment(data);
      }
      // Возвращаемся на страницу суда с активной вкладкой "Отделы"
      navigate(`/court-registry/courts/${courtId}?tab=departments`);
    } catch (err) {
      const msg = err.response?.data
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (courtId) {
      navigate(`/court-registry/courts/${courtId}?tab=departments`);
    } else {
      navigate('/court-registry/departments');
    }
  };

  if (loading && isEdit) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">{isEdit ? 'Редактирование отдела' : 'Добавление отдела'}</h1>
          <p className="cr-page-subtitle">{isEdit ? form.name : 'Заполните данные отдела'}</p>
        </div>
      </div>

      {error && <div className="cr-error">{error}</div>}

      <form className="cr-form" onSubmit={handleSubmit}>
        <div className="cr-card">
          <div className="cr-card-body">
            <div className="cr-form-group">
              <label className="cr-required">Название отдела</label>
              <input
                className="cr-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Например: Общий отдел"
              />
            </div>

            <div className="cr-form-row">
              <div className="cr-form-group">
                <label>Внутренний телефон</label>
                <input
                  className="cr-input"
                  name="phone_internal"
                  value={form.phone_internal}
                  onChange={handleChange}
                  placeholder="2-345"
                />
              </div>
              <div className="cr-form-group">
                <label>Кабинет</label>
                <input
                  className="cr-input"
                  name="room"
                  value={form.room}
                  onChange={handleChange}
                  placeholder="101"
                />
              </div>
            </div>

            <div className="cr-form-group">
              <label>Описание</label>
              <textarea
                className="cr-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Описание функций отдела..."
              />
            </div>

            <div className="cr-form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  style={{ marginRight: 8 }}
                />
                Отдел активен
              </label>
            </div>

            <div className="cr-form-group">
              <label>Порядок сортировки</label>
              <input
                className="cr-input"
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="cr-form-actions">
          <button type="submit" className="cr-btn cr-btn-primary" disabled={loading}>
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать отдел'}
          </button>
          <button
            type="button"
            className="cr-btn cr-btn-secondary"
            onClick={handleBack}
          >
            Назад
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentForm;