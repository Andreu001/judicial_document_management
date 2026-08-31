// src/components/CourtRegistry/Employees/EmployeeList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getEmployees, deleteEmployee } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const EmployeeList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  const queryParams = new URLSearchParams(location.search);
  const courtId = queryParams.get('court');

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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Удалить сотрудника «${name}»?`)) return;
    try {
      await deleteEmployee(id);
      loadEmployees();
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Сотрудники суда</h1>
          <p className="cr-page-subtitle">{employees.length} сотрудников</p>
        </div>
        <Link to={`/court-registry/employees/new${courtId ? `?court=${courtId}` : ''}`} className="cr-btn cr-btn-primary">
          + Добавить сотрудника
        </Link>
      </div>

      <div className="cr-card">
        <div className="cr-card-body">
          <div className="cr-toolbar">
            <input
              className="cr-search-input"
              type="text"
              placeholder="Поиск по ФИО, должности..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {error && <div className="cr-error">{error}</div>}

          {loading ? (
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
                    <th>Действия</th>
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
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="cr-btn cr-btn-sm cr-btn-outline" onClick={() => navigate(`/court-registry/employees/${emp.id}`)}>
                            Открыть
                          </button>
                          <button className="cr-btn cr-btn-sm cr-btn-outline" onClick={() => navigate(`/court-registry/employees/${emp.id}/edit`)}>
                            Ред.
                          </button>
                          <button className="cr-btn cr-btn-sm cr-btn-danger" onClick={() => handleDelete(emp.id, emp.employee_info?.last_name || 'сотрудника')}>
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

export default EmployeeList;