// src/components/CourtRegistry/Employees/EmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getEmployee, createEmployee, updateEmployee, getDepartments, getUsers } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const EmployeeForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const queryParams = new URLSearchParams(location.search);
  const courtId = queryParams.get('court');

  const [form, setForm] = useState({
    department: '',
    employee: '',
    position: '',
    is_head_of_department: false,
    phone_internal: '',
    phone_mobile: '',
    room: '',
    is_active: true,
    date_started: '',
    date_ended: '',
  });

  useEffect(() => {
    loadInitialData();
  }, [courtId]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const [deptsRes, usersRes] = await Promise.all([
        getDepartments({ court: courtId }),
        getUsers()
      ]);
      setDepartments(deptsRes.data.results || deptsRes.data || []);
      setUsers(usersRes.data.results || usersRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }

    if (isEdit && id) {
      setLoading(true);
      try {
        const res = await getEmployee(id);
        const e = res.data;
        setForm({
          department: e.department || '',
          employee: e.employee || '',
          position: e.position || '',
          is_head_of_department: e.is_head_of_department || false,
          phone_internal: e.phone_internal || '',
          phone_mobile: e.phone_mobile || '',
          room: e.room || '',
          is_active: e.is_active !== undefined ? e.is_active : true,
          date_started: e.date_started || '',
          date_ended: e.date_ended || '',
        });
      } catch (err) {
        setError('Не удалось загрузить сотрудника');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...form,
        department: parseInt(form.department),
        employee: parseInt(form.employee),
      };
      
      if (isEdit && id) {
        await updateEmployee(id, data);
      } else {
        await createEmployee(data);
      }
      // Возвращаемся на страницу суда с активной вкладкой "Сотрудники"
      navigate(`/court-registry/courts/${courtId}?tab=employees`);
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
      navigate(`/court-registry/courts/${courtId}?tab=employees`);
    } else {
      navigate('/court-registry/employees');
    }
  };

  if (loadingData || (loading && isEdit)) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">{isEdit ? 'Редактирование сотрудника' : 'Добавление сотрудника'}</h1>
          <p className="cr-page-subtitle">{isEdit ? form.position : 'Заполните данные сотрудника'}</p>
        </div>
      </div>

      {error && <div className="cr-error">{error}</div>}

      <form className="cr-form" onSubmit={handleSubmit}>
        <div className="cr-card">
          <div className="cr-card-body">
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Пользователь</label>
                <select
                  className="cr-select"
                  name="employee"
                  value={form.employee}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите пользователя</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.last_name} {u.first_name} ({u.username})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cr-form-group">
                <label className="cr-required">Отдел</label>
                <select
                  className="cr-select"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите отдел</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cr-form-group">
              <label className="cr-required">Должность</label>
              <input
                className="cr-input"
                name="position"
                value={form.position}
                onChange={handleChange}
                required
                placeholder="Судья, Секретарь, Помощник судьи..."
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
                <label>Мобильный телефон</label>
                <input
                  className="cr-input"
                  name="phone_mobile"
                  value={form.phone_mobile}
                  onChange={handleChange}
                  placeholder="+7 999 123-45-67"
                />
              </div>
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

            <div className="cr-form-row">
              <div className="cr-form-group">
                <label>Дата начала работы</label>
                <input
                  className="cr-input"
                  type="date"
                  name="date_started"
                  value={form.date_started}
                  onChange={handleChange}
                />
              </div>
              <div className="cr-form-group">
                <label>Дата окончания работы</label>
                <input
                  className="cr-input"
                  type="date"
                  name="date_ended"
                  value={form.date_ended}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="cr-form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_head_of_department"
                  checked={form.is_head_of_department}
                  onChange={handleChange}
                  style={{ marginRight: 8 }}
                />
                Руководитель отдела
              </label>
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
                Сотрудник активен
              </label>
            </div>
          </div>
        </div>

        <div className="cr-form-actions">
          <button type="submit" className="cr-btn cr-btn-primary" disabled={loading}>
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать сотрудника'}
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

export default EmployeeForm;