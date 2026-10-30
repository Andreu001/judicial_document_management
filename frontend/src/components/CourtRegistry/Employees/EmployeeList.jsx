// src/components/CourtRegistry/Employees/EmployeeList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getEmployees, deleteEmployee } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const EmployeeList = ({ embedded = false, courtId: courtIdProp = null }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const courtIdFromQuery = queryParams.get('court');
  const courtId = courtIdProp ?? courtIdFromQuery;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, [search, courtId]);

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (courtId) params.court = courtId;

      const res = await getEmployees(params);
      setEmployees(res.data.results || res.data || []);
    } catch (err) {
      setError('Не удалось загрузить сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const buildEmployeeUrl = (empId, suffix = '') => {
    const base = `/court-registry/employees/${empId}${suffix}`;
    return courtId ? `${base}?court=${courtId}` : base;
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Удалить сотрудника «${name}»?\n\nДействие необратимо.`)) return;

    setDeletingId(id);
    try {
      await deleteEmployee(id);
      await loadEmployees();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Не удалось удалить сотрудника';

      if (data) {
        if (typeof data === 'string') {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.non_field_errors) {
          msg = Array.isArray(data.non_field_errors)
            ? data.non_field_errors.join('; ')
            : data.non_field_errors;
        } else {
          msg = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('; ');
        }
      } else if (err.response?.status === 404) {
        msg = 'Сотрудник не найден (возможно, уже удалён)';
        await loadEmployees();
      } else if (err.response?.status === 403) {
        msg = 'Недостаточно прав для удаления сотрудника';
      }

      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const toolbar = (
    <div className="cr-toolbar">
      <input
        className="cr-search-input"
        type="text"
        placeholder="Поиск по ФИО, должности..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
  );

  const table = loading ? (
    <div className="cr-loading">Загрузка...</div>
  ) : employees.length === 0 ? (
    <div className="cr-empty">
      <div className="cr-empty-title">Сотрудники не найдены</div>
      <div className="cr-empty-text">Добавьте нового сотрудника</div>
    </div>
  ) : (
    <div className="cr-table-wrap">
      <table className="cr-table">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Должность</th>
            <th>Отдел</th>
            <th>Руководитель</th>
            <th>Телефон</th>
            <th>Статус</th>
            <th className="cr-actions-col">Действия</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td>
                <strong>{emp.employee_info?.last_name} {emp.employee_info?.first_name}</strong>
              </td>
              <td>{emp.position}</td>
              <td>{emp.department_name || '—'}</td>
              <td>
                {emp.is_head_of_department ? (
                  <span className="cr-badge cr-badge-success">Да</span>
                ) : '—'}
              </td>
              <td>{emp.phone_internal || emp.phone_mobile || '—'}</td>
              <td>
                {emp.is_active ? (
                  <span className="cr-badge cr-badge-success">Активен</span>
                ) : (
                  <span className="cr-badge cr-badge-neutral">Неактивен</span>
                )}
              </td>
              <td className="cr-actions-col">
                <div className="cr-actions">
                  <button
                    type="button"
                    className="cr-btn cr-btn-sm cr-btn-outline"
                    onClick={() => navigate(buildEmployeeUrl(emp.id, '/edit'))}
                  >
                    Ред.
                  </button>
                  <button
                    type="button"
                    className="cr-btn cr-btn-sm cr-btn-danger"
                    disabled={deletingId === emp.id}
                    onClick={() => handleDelete(emp.id, emp.employee_info?.last_name || 'сотрудника')}
                  >
                    {deletingId === emp.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (embedded) {
    return (
      <div>
        {toolbar}
        {error && <div className="cr-error">{error}</div>}
        {table}
      </div>
    );
  }

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Сотрудники суда</h1>
          <p className="cr-page-subtitle">{employees.length} сотрудников</p>
        </div>
        <Link
          to={`/court-registry/employees/new${courtId ? `?court=${courtId}` : ''}`}
          className="cr-btn cr-btn-primary"
        >
          + Добавить сотрудника
        </Link>
      </div>

      <div className="cr-card">
        <div className="cr-card-body">
          {toolbar}
          {error && <div className="cr-error">{error}</div>}
          {table}
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;