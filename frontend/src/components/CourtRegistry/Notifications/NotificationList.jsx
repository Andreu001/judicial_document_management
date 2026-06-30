import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, acceptAllNotification, rejectAllNotification } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data.results || res.data);
    } catch (err) {
      setError('Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (notifId) => {
    if (!window.confirm('Принять все дела и автоматически зарегистрировать?')) return;
    setActionLoading(notifId);
    try { await acceptAllNotification(notifId); alert('Дела приняты'); load(); }
    catch (err) { alert('Ошибка: ' + (err.response?.data?.detail || err.message)); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (notifId) => {
    const reason = window.prompt('Причина отклонения:');
    if (!reason) return;
    setActionLoading(notifId);
    try { await rejectAllNotification(notifId, reason); alert('Уведомление отклонено'); load(); }
    catch (err) { alert('Ошибка: ' + (err.response?.data?.detail || err.message)); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="cr-container"><div className="cr-loading">Загрузка уведомлений...</div></div>;
  if (error) return <div className="cr-container"><div className="cr-error">{error}</div></div>;

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Уведомления о поступлении дел</h1>
          <p className="cr-page-subtitle">{notifications.length} уведомлений</p>
        </div>
      </div>

      <div className="cr-card">
        <div className="cr-card-body">
          {notifications.length === 0 ? (
            <div className="cr-empty">
              <div className="cr-empty-icon">🔔</div>
              <div className="cr-empty-title">Уведомлений нет</div>
              <div className="cr-empty-text">Новые уведомления появятся при поступлении дел из других судов</div>
            </div>
          ) : (
            <div className="cr-table-wrap">
              <table className="cr-table">
                <thead>
                  <tr><th>Отправитель</th><th>Тип</th><th>Уг.</th><th>Гр.</th><th>АП</th><th>КАС</th><th>Всего</th><th>Статус</th><th>Дата</th><th>Действия</th></tr>
                </thead>
                <tbody>
                  {notifications.map(n => (
                    <tr key={n.id}>
                      <td><strong>{n.source_court_name}</strong> <span style={{color:'var(--cr-text-muted)',fontSize:12}}>{n.source_court_code}</span></td>
                      <td><span className="cr-badge cr-badge-neutral">{n.transfer_type_name}</span></td>
                      <td>{n.criminal_count}</td><td>{n.civil_count}</td><td>{n.admin_code_count}</td><td>{n.kas_count}</td>
                      <td><strong>{n.total_count}</strong></td>
                      <td>
                        {n.status === 'pending' ? <span className="cr-badge cr-badge-warning">Ожидает</span>
                          : n.status === 'accepted' ? <span className="cr-badge cr-badge-success">Принято</span>
                          : n.status === 'rejected' ? <span className="cr-badge cr-badge-danger">Отклонено</span>
                          : <span className="cr-badge cr-badge-neutral">{n.status_display}</span>}
                      </td>
                      <td>{new Date(n.created_at).toLocaleDateString('ru-RU')}</td>
                      <td>
                        {n.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="cr-btn cr-btn-sm cr-btn-primary" onClick={() => handleAccept(n.id)} disabled={actionLoading === n.id}>
                              {actionLoading === n.id ? '...' : 'Принять'}
                            </button>
                            <button className="cr-btn cr-btn-sm cr-btn-danger" onClick={() => handleReject(n.id)} disabled={actionLoading === n.id}>
                              Отклонить
                            </button>
                          </div>
                        )}
                        {n.processed_by && <span style={{fontSize:12,color:'var(--cr-text-muted)'}}>Обработано {new Date(n.processed_at).toLocaleDateString('ru-RU')}</span>}
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

export default NotificationList;
