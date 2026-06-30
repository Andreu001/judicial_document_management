import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getMyCourt, getTransfers, getNotifications,
  getPendingTransfers, getVCSRequests, getPendingNotificationCount,
} from '../../API/courtRegistryService';
import './courtRegistry.shared.css';
import styles from './CourtRegistryDashboard.module.css';

const CourtRegistryDashboard = () => {
  const navigate = useNavigate();
  const [myCourt, setMyCourt] = useState(null);
  const [stats, setStats] = useState({
    transfers: 0, notifications: 0,
    pendingTransfers: 0, vcsRequests: 0,
    departments: 0, employees: 0, judges: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Получаем суд текущего пользователя
      let court = null;
      try {
        const courtRes = await getMyCourt();
        court = courtRes.data;
        setMyCourt(court);
      } catch (courtErr) {
        console.warn('my_court not available:', courtErr.response?.status);
        setMyCourt(null);
      }

      const [transfersRes, notifRes, pendingRes, vcsRes] = await Promise.all([
        getTransfers({ page_size: 1 }),
        getPendingNotificationCount(),
        getPendingTransfers({ page_size: 1 }),
        getVCSRequests({ page_size: 1 }),
      ]);

      setStats({
        transfers: transfersRes.data.count || 0,
        notifications: notifRes.data.pending_count || 0,
        pendingTransfers: pendingRes.data.count || 0,
        vcsRequests: vcsRes.data.count || 0,
        departments: court?.departments_count || 0,
        employees: court?.employees_count || 0,
        judges: court?.judges_count || 0,
      });

      try {
        const recentT = await getTransfers({ page_size: 5, ordering: '-created_at' });
        setRecentTransfers(recentT.data.results || recentT.data || []);
      } catch {}

      try {
        const recentN = await getNotifications({ page_size: 5 });
        setRecentNotifications(recentN.data.results || recentN.data || []);
      } catch {}

    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="cr-container"><div className="cr-loading">Загрузка данных суда...</div></div>;

  const statCards = [
    { icon: '📋', value: stats.transfers, label: 'Передач дел', link: '/court-registry/transfers', color: '#4299e1' },
    { icon: '🔔', value: stats.notifications, label: 'Входящих уведомлений', link: '/court-registry/notifications', color: stats.notifications > 0 ? '#ed8936' : '#a0aec0' },
    { icon: '⏳', value: stats.pendingTransfers, label: 'Ожидают передачи', link: '/court-registry/pending-transfers', color: '#ed8936' },
    { icon: '📹', value: stats.vcsRequests, label: 'Запросов ВКС', link: '/court-registry/vcs', color: '#805ad5' },
    { icon: '👥', value: stats.employees, label: 'Сотрудников', link: myCourt ? `/court-registry/courts/${myCourt.id}` : '/court-registry/courts', color: '#48bb78' },
  ];

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Межсудебное взаимодействие</h1>
          <p className="cr-page-subtitle">
            {myCourt ? (
              <>Суд: <strong>{myCourt.name_short || myCourt.name}</strong> · {myCourt.region_detail?.name} · {myCourt.level_detail?.name}
              {myCourt.is_registered_in_network ? (
                <span className="cr-badge cr-badge-success" style={{ marginLeft: 8 }}>В сети</span>
              ) : (
                <span className="cr-badge cr-badge-warning" style={{ marginLeft: 8 }}>Не в сети</span>
              )}</>
            ) : (
              <span style={{ color: 'var(--cr-warning)' }}>⚠️ Вы не привязаны к суду. Создайте сотрудника в своём суде.</span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="cr-loading">Загрузка показателей...</div>
      ) : (
        <>
          <div className="cr-grid-3" style={{ marginBottom: 32 }}>
            {statCards.map((card, i) => (
              <Link to={card.link} key={i} className="cr-stat-card">
                <div className="cr-stat-icon">{card.icon}</div>
                <div className="cr-stat-value" style={{ color: card.color }}>{card.value}</div>
                <div className="cr-stat-label">{card.label}</div>
              </Link>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="cr-card">
              <div className="cr-card-header">
                <h3>Последние передачи дел</h3>
                <Link to="/court-registry/transfers" className="cr-btn-link">Все передачи →</Link>
              </div>
              <div className="cr-card-body">
                {recentTransfers.length === 0 ? (
                  <div className="cr-empty"><div className="cr-empty-text">Передач пока нет</div></div>
                ) : (
                  <div className="cr-table-wrap">
                    <table className="cr-table">
                      <thead>
                        <tr><th>Тип</th><th>Направление</th><th>Статус</th><th>Дел</th><th>Дата</th></tr>
                      </thead>
                      <tbody>
                        {recentTransfers.map(t => (
                          <tr key={t.id} onClick={() => navigate(`/court-registry/transfers/${t.id}`)} style={{ cursor: 'pointer' }}>
                            <td><span className="cr-badge cr-badge-neutral">{t.transfer_type_name}</span></td>
                            <td>{t.source_court_name} → {t.destination_court_name}</td>
                            <td><span className="cr-badge cr-badge-info">{t.status_name}</span></td>
                            <td>{t.items_count}</td>
                            <td style={{ fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('ru-RU')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="cr-card">
              <div className="cr-card-header">
                <h3>Входящие уведомления</h3>
                <Link to="/court-registry/notifications" className="cr-btn-link">Все уведомления →</Link>
              </div>
              <div className="cr-card-body">
                {recentNotifications.length === 0 ? (
                  <div className="cr-empty"><div className="cr-empty-text">Уведомлений нет</div></div>
                ) : (
                  <div className="cr-table-wrap">
                    <table className="cr-table">
                      <thead><tr><th>Отправитель</th><th>Дел</th><th>Статус</th><th>Дата</th></tr></thead>
                      <tbody>
                        {recentNotifications.map(n => (
                          <tr key={n.id}>
                            <td>{n.source_court_name}</td>
                            <td>{n.total_count}</td>
                            <td>
                              {n.status === 'pending' ? <span className="cr-badge cr-badge-warning">Ожидает</span>
                                : n.status === 'accepted' ? <span className="cr-badge cr-badge-success">Принято</span>
                                : <span className="cr-badge cr-badge-neutral">{n.status_display}</span>}
                            </td>
                            <td style={{ fontSize: 12 }}>{new Date(n.created_at).toLocaleDateString('ru-RU')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="cr-card" style={{ marginTop: 24 }}>
            <div className="cr-card-header"><h3>Быстрые действия</h3></div>
            <div className="cr-card-body">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/court-registry/transfers/new" className="cr-btn cr-btn-primary">+ Новая передача дел</Link>
                <Link to="/court-registry/vcs/new" className="cr-btn cr-btn-secondary">+ Запросить ВКС</Link>
                <Link to="/court-registry/pending-transfers" className="cr-btn cr-btn-secondary">🔍 Сканировать дела к передаче</Link>
                <Link to="/court-registry/messenger" className="cr-btn cr-btn-outline">Настройки мессенджера</Link>
                <Link to="/court-registry/audit" className="cr-btn cr-btn-outline">Журнал аудита</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CourtRegistryDashboard;