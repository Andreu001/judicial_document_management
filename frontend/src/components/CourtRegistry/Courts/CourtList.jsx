import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCourts, deleteCourt, getRegions, getCourtLevels,
  getMyCourt
} from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';
import styles from './CourtList.module.css';

const CourtList = () => {
  const navigate = useNavigate();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [regions, setRegions] = useState([]);
  const [levels, setLevels] = useState([]);
  const [myCourt, setMyCourt] = useState(null);
  const pageSize = 20;

  const loadCourts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (regionFilter) params.region = regionFilter;
      if (levelFilter) params.level = levelFilter;

      const res = await getCourts(params);
      setCourts(res.data.results || res.data);
      setTotalCount(res.data.count || (Array.isArray(res.data) ? res.data.length : 0));
    } catch (err) {
      setError('Не удалось загрузить список судов: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  }, [page, search, regionFilter, levelFilter]);

  useEffect(() => {
    loadCourts();
    getRegions().then(r => setRegions(r.data.results || r.data)).catch(() => {});
    getCourtLevels().then(l => setLevels(l.data)).catch(() => {});
    getMyCourt().then(m => setMyCourt(m.data)).catch(() => {});
  }, [loadCourts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Удалить суд «${name}»? Это действие необратимо.`)) return;
    try {
      await deleteCourt(id);
      loadCourts();
    } catch (err) {
      alert('Ошибка при удалении: ' + (err.response?.data?.detail || err.message));
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Реестр судов</h1>
          <p className="cr-page-subtitle">
            {totalCount} судов в системе
            {myCourt && <span> · Ваш суд: <strong>{myCourt.name_short || myCourt.name}</strong></span>}
          </p>
        </div>
        <Link to="/court-registry/courts/new" className="cr-btn cr-btn-primary">
          + Добавить суд
        </Link>
      </div>

      <div className="cr-card">
        <div className="cr-card-body">
          <div className="cr-toolbar">
            <input
              className="cr-search-input"
              type="text"
              placeholder="Поиск по названию, коду, адресу..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <select
              className="cr-filter-select"
              value={regionFilter}
              onChange={e => { setRegionFilter(e.target.value); setPage(1); }}
            >
              <option value="">Все регионы</option>
              {regions.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
            </select>
            <select
              className="cr-filter-select"
              value={levelFilter}
              onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
            >
              <option value="">Все уровни</option>
              {levels.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>

          {error && <div className="cr-error">{error}</div>}

          {loading ? (
            <div className="cr-loading">Загрузка списка судов...</div>
          ) : courts.length === 0 ? (
            <div className="cr-empty">
              <div className="cr-empty-icon">🏛️</div>
              <div className="cr-empty-title">Суды не найдены</div>
              <div className="cr-empty-text">Измените параметры поиска или добавьте новый суд</div>
            </div>
          ) : (
            <div className="cr-table-wrap">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>Код</th>
                    <th>Наименование</th>
                    <th>Регион</th>
                    <th>Уровень</th>
                    <th>Сотрудники</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {courts.map(court => (
                    <tr key={court.id}>
                      <td><code>{court.code}</code></td>
                      <td>
                        <Link to={`/court-registry/courts/${court.id}`} style={{ color: 'var(--cr-accent)', fontWeight: 500, textDecoration: 'none' }}>
                          {court.name_short || court.name}
                        </Link>
                        {court.is_online && (
                          <span className="cr-badge cr-badge-success" style={{ marginLeft: 8, fontSize: 11 }}>
                            онлайн
                          </span>
                        )}
                      </td>
                      <td>{court.region_name}</td>
                      <td>
                        <span className="cr-badge cr-badge-neutral">{court.level_name}</span>
                      </td>
                      <td>
                        <span title="Сотрудников">{court.employees_count || 0}</span>
                        {court.judges_count > 0 && (
                          <span style={{ color: 'var(--cr-text-muted)', fontSize: 12 }}> / {court.judges_count} судей</span>
                        )}
                      </td>
                      <td>
                        {court.is_active ? (
                          <span className="cr-badge cr-badge-success">Активен</span>
                        ) : (
                          <span className="cr-badge cr-badge-neutral">Неактивен</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="cr-btn cr-btn-sm cr-btn-outline" onClick={() => navigate(`/court-registry/courts/${court.id}`)}>
                            Открыть
                          </button>
                          <button className="cr-btn cr-btn-sm cr-btn-outline" onClick={() => navigate(`/court-registry/courts/${court.id}/edit`)}>
                            Ред.
                          </button>
                          <button className="cr-btn cr-btn-sm cr-btn-danger" onClick={() => handleDelete(court.id, court.name)}>
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

          {totalPages > 1 && (
            <div className="cr-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const start = Math.max(1, page - 5);
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtList;
