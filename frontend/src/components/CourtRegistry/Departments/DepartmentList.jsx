// src/components/CourtRegistry/Departments/DepartmentList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getDepartments, deleteDepartment } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const DepartmentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Получаем courtId из query параметров
  const queryParams = new URLSearchParams(location.search);
  const courtId = queryParams.get('court');

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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Удалить отдел «${name}»?`)) return;
    try {
      await deleteDepartment(id);
      loadDepartments();
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Отделы суда</h1>
          <p className="cr-page-subtitle">{departments.length} отделов</p>
        </div>
        <Link to={`/court-registry/departments/new${courtId ? `?court=${courtId}` : ''}`} className="cr-btn cr-btn-primary">
          + Добавить отдел
        </Link>
      </div>

      <div className="cr-card">
        <div className="cr-card-body">
          <div className="cr-toolbar">
            <input
              className="cr-search-input"
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {error && <div className="cr-error">{error}</div>}

          {loading ? (
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
                    <th>Действия</th>
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
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="cr-btn cr-btn-sm cr-btn-outline" onClick={() => navigate(`/court-registry/departments/${dept.id}`)}>
                            Открыть
                          </button>
                          <button className="cr-btn cr-btn-sm cr-btn-outline" onClick={() => navigate(`/court-registry/departments/${dept.id}/edit`)}>
                            Ред.
                          </button>
                          <button className="cr-btn cr-btn-sm cr-btn-danger" onClick={() => handleDelete(dept.id, dept.name)}>
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentList;