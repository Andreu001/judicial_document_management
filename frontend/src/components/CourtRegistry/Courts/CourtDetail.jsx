import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCourt, registerCourtInNetwork } from '../../../API/courtRegistryService';
import DepartmentList from '../Departments/DepartmentList';
import EmployeeList from '../Employees/EmployeeList';
import '../courtRegistry.shared.css';
import styles from './CourtDetail.module.css';

const CourtDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadCourt();
  }, [id]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get('tab');
    if (tab === 'departments') {
      setActiveTab('departments');
    } else if (tab === 'employees') {
      setActiveTab('employees');
    }
  }, [location.search]);

  const loadCourt = async () => {
    setLoading(true);
    try {
      const res = await getCourt(id);
      setCourt(res.data);
    } catch (err) {
      setError('Не удалось загрузить данные суда');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await registerCourtInNetwork(id);
      alert('Суд зарегистрирован в сети');
      loadCourt();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;
  if (error) return <div className="cr-container"><div className="cr-error">{error}</div></div>;
  if (!court) return <div className="cr-container"><div className="cr-empty"><div className="cr-empty-title">Суд не найден</div></div></div>;

  const statusBadge = court.is_active
    ? <span className="cr-badge cr-badge-success">Активен</span>
    : <span className="cr-badge cr-badge-neutral">Неактивен</span>;

  const networkBadge = court.is_registered_in_network
    ? <span className="cr-badge cr-badge-success">В сети</span>
    : <span className="cr-badge cr-badge-warning">Не в сети</span>;

  return (
    <div className="cr-container">
      <div className="cr-breadcrumbs">
        <Link to="/court-registry/courts">Реестр судов</Link>
        <span>›</span>
        <span>{court.name_short || court.name}</span>
      </div>

      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">{court.name}</h1>
          <p className="cr-page-subtitle">
            Код: <code>{court.code}</code> · {court.region_detail?.name} · {court.level_detail?.name}
            {' '}{statusBadge}{' '}{networkBadge}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!court.is_registered_in_network && (
            <button className="cr-btn cr-btn-primary" onClick={handleRegister}>
              Зарегистрировать в сети
            </button>
          )}
          <button className="cr-btn cr-btn-secondary" onClick={() => navigate(`/court-registry/courts/${id}/edit`)}>
            Редактировать
          </button>
        </div>
      </div>

      <div className="cr-tabs">
        <button className={`cr-tab ${activeTab === 'info' ? 'cr-tab-active' : ''}`} onClick={() => setActiveTab('info')}>
          Основная информация
        </button>
        <button className={`cr-tab ${activeTab === 'departments' ? 'cr-tab-active' : ''}`} onClick={() => setActiveTab('departments')}>
          Отделы ({court.departments_count || 0})
        </button>
        <button className={`cr-tab ${activeTab === 'employees' ? 'cr-tab-active' : ''}`} onClick={() => setActiveTab('employees')}>
          Сотрудники ({court.employees_count || 0})
        </button>
        <button className={`cr-tab ${activeTab === 'contacts' ? 'cr-tab-active' : ''}`} onClick={() => setActiveTab('contacts')}>
          Контакты
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="cr-card">
          <div className="cr-card-body">
            <div className="cr-detail-grid">
              <div className="cr-detail-item">
                <span className="cr-detail-label">Полное наименование</span>
                <span className="cr-detail-value">{court.name}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Краткое наименование</span>
                <span className="cr-detail-value">{court.name_short || '—'}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Код</span>
                <span className="cr-detail-value"><code>{court.code}</code></span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Регион</span>
                <span className="cr-detail-value">{court.region_detail?.name}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Уровень</span>
                <span className="cr-detail-value">{court.level_detail?.name} (уровень {court.level_detail?.hierarchy_level})</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Почтовый адрес</span>
                <span className="cr-detail-value">{court.address}{court.postal_code ? `, ${court.postal_code}` : ''}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Юридический адрес</span>
                <span className="cr-detail-value">{court.address_juridical || '—'}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Email</span>
                <span className="cr-detail-value"><a href={`mailto:${court.email_main}`}>{court.email_main}</a></span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Сайт</span>
                <span className="cr-detail-value">{court.website ? <a href={court.website} target="_blank" rel="noreferrer">{court.website}</a> : '—'}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Председатель</span>
                <span className="cr-detail-value">{court.chairman_info ? `${court.chairman_info.last_name} ${court.chairman_info.first_name || ''}` : '—'}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Сотрудников / Судей</span>
                <span className="cr-detail-value">{court.employees_count || 0} / {court.judges_count || 0}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Создан</span>
                <span className="cr-detail-value">{new Date(court.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>

            {court.appeal_court && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 14, color: 'var(--cr-text-secondary)', marginBottom: 8 }}>Апелляционная инстанция</h4>
                <Link to={`/court-registry/courts/${court.appeal_court.id}`} style={{ color: 'var(--cr-accent)' }}>
                  {court.appeal_court.name} ({court.appeal_court.code})
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="cr-card">
          <div className="cr-card-header">
            <h3>Отделы суда</h3>
            <Link to={`/court-registry/departments/new?court=${id}`} className="cr-btn cr-btn-sm cr-btn-primary">+ Добавить отдел</Link>
          </div>
          <div className="cr-card-body">
            <DepartmentList embedded courtId={id} />
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="cr-card">
          <div className="cr-card-header">
            <h3>Сотрудники суда</h3>
            <Link to={`/court-registry/employees/new?court=${id}`} className="cr-btn cr-btn-sm cr-btn-primary">+ Добавить сотрудника</Link>
          </div>
          <div className="cr-card-body">
            <EmployeeList embedded courtId={id} />
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="cr-card">
          <div className="cr-card-body">
            <h4 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 600 }}>Телефоны</h4>
            {court.phones && court.phones.length > 0 ? (
              <div className="cr-table-wrap">
                <table className="cr-table">
                  <thead><tr><th>Телефон</th><th>Тип</th><th>Описание</th></tr></thead>
                  <tbody>
                    {court.phones.filter(p => p.is_active).map(p => (
                      <tr key={p.id}>
                        <td><a href={`tel:${p.phone}`}>{p.phone}</a></td>
                        <td><span className="cr-badge cr-badge-neutral">{p.phone_type}</span></td>
                        <td>{p.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="cr-empty-text">Телефоны не указаны</p>}

            <h4 style={{ margin: '24px 0 16px 0', fontSize: 14, fontWeight: 600 }}>Email-адреса</h4>
            {court.emails && court.emails.length > 0 ? (
              <div className="cr-table-wrap">
                <table className="cr-table">
                  <thead><tr><th>Email</th><th>Тип</th><th>Описание</th></tr></thead>
                  <tbody>
                    {court.emails.filter(e => e.is_active).map(e => (
                      <tr key={e.id}>
                        <td><a href={`mailto:${e.email}`}>{e.email}</a></td>
                        <td><span className="cr-badge cr-badge-neutral">{e.email_type}</span></td>
                        <td>{e.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="cr-empty-text">Дополнительные email не указаны</p>}

            <h4 style={{ margin: '24px 0 16px 0', fontSize: 14, fontWeight: 600 }}>Режим работы</h4>
            {court.working_hours && court.working_hours.length > 0 ? (
              <div className="cr-table-wrap">
                <table className="cr-table">
                  <thead><tr><th>День</th><th>Работа</th><th>Перерыв</th><th>Приём</th></tr></thead>
                  <tbody>
                    {court.working_hours.map(wh => (
                      <tr key={wh.id} style={{ opacity: wh.is_working_day ? 1 : 0.5 }}>
                        <td>{wh.day_of_week}</td>
                        <td>{wh.work_start} – {wh.work_end}</td>
                        <td>{wh.break_start && wh.break_end ? `${wh.break_start} – ${wh.break_end}` : '—'}</td>
                        <td>{wh.reception_start && wh.reception_end ? `${wh.reception_start} – ${wh.reception_end}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="cr-empty-text">Режим работы не указан</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtDetail;