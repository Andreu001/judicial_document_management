import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getVCSRequests, confirmVCS, rejectVCS, completeVCS } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const STATUS_LABELS = {
  draft: 'Черновик', sent: 'Отправлен', confirmed: 'Подтвержден',
  rejected: 'Отклонен', completed: 'Проведен', cancelled: 'Отменен',
};
const STATUS_CLASS = {
  draft: 'cr-badge-draft', sent: 'cr-badge-info', confirmed: 'cr-badge-success',
  rejected: 'cr-badge-danger', completed: 'cr-badge-success', cancelled: 'cr-badge-neutral',
};

const VCSList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVCSRequests();
      setRequests(res.data.results || res.data);
    } catch (err) { setError('Не удалось загрузить запросы ВКС'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      if (action === 'confirm') await confirmVCS(id);
      else if (action === 'reject') { const r = window.prompt('Причина отклонения:'); if (r) await rejectVCS(id, r); else return; }
      else if (action === 'complete') await completeVCS(id);
      load();
    } catch (err) { alert('Ошибка: ' + (err.response?.data?.detail || err.message)); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Запросы ВКС</h1>
          <p className="cr-page-subtitle">{requests.length} запросов</p>
        </div>
        <Link to="/court-registry/vcs/new" className="cr-btn cr-btn-primary">+ Новый запрос ВКС</Link>
      </div>

      {error && <div className="cr-error">{error}</div>}

      <div className="cr-card">
        <div className="cr-card-body">
          {requests.length === 0 ? (
            <div className="cr-empty">
              <div className="cr-empty-icon">📹</div>
              <div className="cr-empty-title">Запросов ВКС нет</div>
              <div className="cr-empty-text">Создайте запрос на видеоконференцсвязь между судами</div>
            </div>
          ) : (
            <div className="cr-table-wrap">
              <table className="cr-table">
                <thead>
                  <tr><th>Тема</th><th>Инициатор</th><th>Запланировано</th><th>Длит.</th><th>Участников</th><th>Статус</th><th>Действия</th></tr>
                </thead>
                <tbody>
                  {requests.map(vcs => {
                    const st = vcs.status;
                    return (
                      <tr key={vcs.id}>
                        <td><Link to={`/court-registry/vcs/${vcs.id}`} style={{ color: 'var(--cr-accent)', fontWeight: 500, textDecoration: 'none' }}>{vcs.title}</Link></td>
                        <td>{vcs.initiator_court_name}</td>
                        <td>{new Date(vcs.scheduled_at).toLocaleString('ru-RU')}</td>
                        <td>{vcs.estimated_duration_minutes} мин</td>
                        <td>{vcs.participant_courts_names?.length || 0}</td>
                        <td><span className={`cr-badge ${STATUS_CLASS[st] || 'cr-badge-neutral'}`}>{STATUS_LABELS[st] || vcs.status_display}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="cr-btn cr-btn-sm cr-btn-outline" onClick={() => navigate(`/court-registry/vcs/${vcs.id}`)}>Детали</button>
                            {st === 'draft' && <button className="cr-btn cr-btn-sm cr-btn-primary" disabled={actionLoading === vcs.id} onClick={() => handleAction(vcs.id, 'confirm')}>Подтв.</button>}
                            {st === 'confirmed' && <button className="cr-btn cr-btn-sm cr-btn-primary" disabled={actionLoading === vcs.id} onClick={() => handleAction(vcs.id, 'complete')}>Заверш.</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VCSList;
