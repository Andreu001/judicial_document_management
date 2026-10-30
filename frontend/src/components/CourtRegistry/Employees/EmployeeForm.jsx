// src/components/CourtRegistry/Employees/EmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getEmployee, createEmployee, updateEmployee,
  getDepartments, getUsers, getMyCourt,
} from '../../../API/courtRegistryService';
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
  const [courtId, setCourtId] = useState(null);

  // Режим пользователя: 'existing' — выбрать из списка, 'new' — создать нового
  const [userMode, setUserMode] = useState('existing');

  // Данные нового пользователя (когда userMode === 'new')
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    role: 'secretary',
    phone: '',
    subject_level: '',
  });

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

  // ---------------------------------------------------------------------
  // 1. Определяем courtId (из ?court=... или из my_court) и грузим данные
  // ---------------------------------------------------------------------
  useEffect(() => {
    const loadInitial = async () => {
      setLoadingData(true);
      setError(null);

      // --- courtId ---
      const queryParams = new URLSearchParams(location.search);
      let cid = queryParams.get('court');
      if (cid) {
        cid = parseInt(cid);
        setCourtId(cid);
      } else {
        try {
          const courtRes = await getMyCourt();
          if (courtRes.data?.id) {
            cid = courtRes.data.id;
            setCourtId(cid);
          }
        } catch (e) {
          console.warn('my_court не доступен:', e.response?.status);
        }
      }

      // --- отделы (только текущего суда) ---
      try {
        const params = {};
        if (cid) params.court = cid;
        const deptsRes = await getDepartments(params);
        setDepartments(deptsRes.data.results || deptsRes.data || []);
      } catch (err) {
        console.error('Ошибка загрузки отделов:', err);
      }

      // --- пользователи ---
      try {
        const usersRes = await getUsers();
        setUsers(usersRes.data.results || usersRes.data || []);
      } catch (err) {
        console.error('Ошибка загрузки пользователей:', err);
      }

      // --- если редактируем — грузим сотрудника ---
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
          // При редактировании всегда режим "существующий"
          setUserMode('existing');
          if (e.department && e.department.court) {
            setCourtId(e.department.court);
          }
        } catch (err) {
          setError('Не удалось загрузить сотрудника');
        } finally {
          setLoading(false);
        }
      }

      setLoadingData(false);
    };

    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, location.search]);

  // ---------------------------------------------------------------------
  // Обработчики
  // ---------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Базовые поля сотрудника
      const data = {
        department: parseInt(form.department),
        position: form.position,
        is_head_of_department: form.is_head_of_department,
        phone_internal: form.phone_internal || null,
        phone_mobile: form.phone_mobile || null,
        room: form.room || null,
        is_active: form.is_active,
        date_started: form.date_started || null,
        date_ended: form.date_ended || null,
      };

      // Пользователь: существующий ИЛИ новый
      if (userMode === 'existing') {
        if (!form.employee) {
          setError('Выберите пользователя или создайте нового');
          setLoading(false);
          return;
        }
        data.employee = parseInt(form.employee);
      } else {
        // Валидация обязательных полей нового пользователя
        if (!newUser.username || !newUser.password) {
          setError('Для нового пользователя обязательны логин и пароль');
          setLoading(false);
          return;
        }
        data.new_user = {
          username: newUser.username,
          password: newUser.password,
          email: newUser.email || '',
          first_name: newUser.first_name || '',
          last_name: newUser.last_name || '',
          middle_name: newUser.middle_name || '',
          role: newUser.role || 'secretary',
          phone: newUser.phone || '',
          subject_level: newUser.subject_level || '',
        };
      }

      if (isEdit && id) {
        await updateEmployee(id, data);
      } else {
        await createEmployee(data);
      }

      // Возврат на страницу суда с активной вкладкой "Сотрудники"
      if (courtId) {
        navigate(`/court-registry/courts/${courtId}?tab=employees`);
      } else {
        navigate('/court-registry/employees');
      }
    } catch (err) {
      let msg;
      if (err.response?.data) {
        msg = Object.entries(err.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('; ');
      } else {
        msg = err.message;
      }
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

  // ---------------------------------------------------------------------
  // Рендер
  // ---------------------------------------------------------------------
  if (loadingData || (loading && isEdit)) {
    return (
      <div className="cr-container">
        <div className="cr-loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">
            {isEdit ? 'Редактирование сотрудника' : 'Добавление сотрудника'}
          </h1>
          <p className="cr-page-subtitle">
            {isEdit ? form.position : 'Заполните данные сотрудника'}
          </p>
        </div>
      </div>

      {error && <div className="cr-error">{error}</div>}

      <form className="cr-form" onSubmit={handleSubmit}>
        <div className="cr-card">
          <div className="cr-card-body">
            {/* =====================================================
                Блок пользователя
            ===================================================== */}
            <div className="cr-form-group">
              <label className="cr-required">Пользователь</label>

              {!isEdit && (
                <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="userMode"
                      checked={userMode === 'existing'}
                      onChange={() => setUserMode('existing')}
                    />
                    Существующий
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="userMode"
                      checked={userMode === 'new'}
                      onChange={() => setUserMode('new')}
                    />
                    Создать нового
                  </label>
                </div>
              )}

              {userMode === 'existing' ? (
                <select
                  className="cr-select"
                  name="employee"
                  value={form.employee}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите пользователя</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.last_name} {u.first_name} ({u.username})
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <div className="cr-form-row">
                    <div className="cr-form-group">
                      <label className="cr-required">Логин</label>
                      <input
                        className="cr-input"
                        name="username"
                        value={newUser.username}
                        onChange={handleNewUserChange}
                        required
                        placeholder="ivanov"
                      />
                    </div>
                    <div className="cr-form-group">
                      <label className="cr-required">Пароль</label>
                      <input
                        className="cr-input"
                        type="password"
                        name="password"
                        value={newUser.password}
                        onChange={handleNewUserChange}
                        required
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  <div className="cr-form-row">
                    <div className="cr-form-group">
                      <label>Фамилия</label>
                      <input
                        className="cr-input"
                        name="last_name"
                        value={newUser.last_name}
                        onChange={handleNewUserChange}
                        placeholder="Иванов"
                      />
                    </div>
                    <div className="cr-form-group">
                      <label>Имя</label>
                      <input
                        className="cr-input"
                        name="first_name"
                        value={newUser.first_name}
                        onChange={handleNewUserChange}
                        placeholder="Иван"
                      />
                    </div>
                  </div>

                  <div className="cr-form-row">
                    <div className="cr-form-group">
                      <label>Отчество</label>
                      <input
                        className="cr-input"
                        name="middle_name"
                        value={newUser.middle_name}
                        onChange={handleNewUserChange}
                        placeholder="Иванович"
                      />
                    </div>
                    <div className="cr-form-group">
                      <label>Email</label>
                      <input
                        className="cr-input"
                        type="email"
                        name="email"
                        value={newUser.email}
                        onChange={handleNewUserChange}
                        placeholder="ivanov@court.ru"
                      />
                    </div>
                  </div>

                  <div className="cr-form-row">
                    <div className="cr-form-group">
                      <label className="cr-required">Роль</label>
                      <select
                        className="cr-select"
                        name="role"
                        value={newUser.role}
                        onChange={handleNewUserChange}
                      >
                        <option value="secretary">Секретарь</option>
                        <option value="judge">Судья</option>
                        <option value="assistant_referee">Помощник судьи</option>
                        <option value="admin">Администратор</option>
                        <option value="hr">Кадры</option>
                      </select>
                    </div>
                    <div className="cr-form-group">
                      <label>Телефон</label>
                      <input
                        className="cr-input"
                        name="phone"
                        value={newUser.phone}
                        onChange={handleNewUserChange}
                        placeholder="+7 999 123-45-67"
                      />
                    </div>
                  </div>

                  <div className="cr-form-group">
                    <label>Суд</label>
                    <select
                      className="cr-select"
                      name="subject_level"
                      value={newUser.subject_level}
                      onChange={handleNewUserChange}
                    >
                      <option value="">— не указан —</option>
                      <option value="magistrate">Мировой суд</option>
                      <option value="city_district">Городской/районный суд</option>
                      <option value="subject_level">Суд уровня субъекта</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================
                Отдел + должность
            ===================================================== */}
            <div className="cr-form-row">
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
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <small style={{ color: 'var(--cr-warning, #b45309)' }}>
                    Отделы не найдены. Создайте отдел на странице суда.
                  </small>
                )}
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
            </div>

            {/* =====================================================
                Телефоны + кабинет
            ===================================================== */}
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

            {/* =====================================================
                Даты
            ===================================================== */}
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

            {/* =====================================================
                Чекбоксы
            ===================================================== */}
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
          <button
            type="submit"
            className="cr-btn cr-btn-primary"
            disabled={loading}
          >
            {loading
              ? 'Сохранение...'
              : isEdit
              ? 'Сохранить изменения'
              : 'Создать сотрудника'}
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