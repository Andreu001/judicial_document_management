// src/components/CourtRegistry/Departments/DepartmentList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getDepartments, deleteDepartment } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const DepartmentList = ({ embedded = false, courtId: courtIdProp = null }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const courtIdFromQuery = queryParams.get('court');
  const courtId = courtIdProp ?? courtIdFromQuery;

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, [search, courtId]);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (courtId) params.court = courtId;

      const res = await getDepartments(params);
      setDepartments(res.data.results || res.data || []);
    } catch (err) {
      setError('Не удалось загрузить отделы');
    } finally {
      setLoading(false);
    }
  };

  const buildDeptUrl = (deptId, suffix = '') => {
    const base = `/court-registry/departments/${deptId}${suffix}`;
    return courtId ? `${base}?court=${courtId}` : base;
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Удалить отдел «${name}»?\n\nДействие необратимо.`)) return;

    setDeletingId(id);
    try {
      await deleteDepartment(id);
      await loadDepartments();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Не удалось удалить отдел';

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
        msg = 'Отдел не найден (возможно, уже удалён)';
        await loadDepartments();
      } else if (err.response?.status === 403) {
        msg = 'Недостаточно прав для удаления отдела';
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
        placeholder="Поиск по названию..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
  );

  const table = loading ? (
    <div className="cr-loading">Загрузка...</div>
  ) : departments.length === 0 ? (
    <div className="cr-empty">
      <div className="cr-empty-title">Отделы не найдены</div>
      <div className="cr-empty-text">Добавьте новый отдел</div>
    </div>
  ) : (
    <div className="cr-table-wrap">
      <table className="cr-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Телефон</th>
            <th>Кабинет</th>
            <th>Сотрудников</th>
            <th>Статус</th>
            <th className="cr-actions-col">Действия</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(dept => (
            <tr key={dept.id}>
              <td><strong>{dept.name}</strong></td>
              <td>{dept.phone_internal || '—'}</td>
              <td>{dept.room || '—'}</td>
              <td>{dept.employees_count || 0}</td>
              <td>
                {dept.is_active ? (
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
                    onClick={() => navigate(buildDeptUrl(dept.id, '/edit'))}
                  >
                    Ред.
                  </button>
                  <button
                    type="button"
                    className="cr-btn cr-btn-sm cr-btn-danger"
                    disabled={deletingId === dept.id}
                    onClick={() => handleDelete(dept.id, dept.name)}
                  >
                    {deletingId === dept.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Встроенный режим: без внешнего контейнера и заголовка
  if (embedded) {
    return (
      <div>
        {toolbar}
        {error && <div className="cr-error">{error}</div>}
        {table}
      </div>
    );
  }

  // Самостоятельная страница
  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Отделы суда</h1>
          <p className="cr-page-subtitle">{departments.length} отделов</p>
        </div>
        <Link
          to={`/court-registry/departments/new${courtId ? `?court=${courtId}` : ''}`}
          className="cr-btn cr-btn-primary"
        >
          + Добавить отдел
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

export default DepartmentList;