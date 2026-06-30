import React, { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const ACTION_LABELS = {
  transfer_created: 'Создана передача', transfer_sent: 'Передача отправлена',
  transfer_received: 'Передача получена', transfer_accepted: 'Дела приняты',
  transfer_rejected: 'Дела отклонены', transfer_returned: 'Дело возвращено',
  case_registered: 'Дело зарегистрировано', notification_created: 'Уведомление создано',
  notification_processed: 'Уведомление обработано', message_sent: 'Сообщение отправлено',
  message_read: 'Сообщение прочитано', vcs_created: 'ВКС создана',
  vcs_confirmed: 'ВКС подтверждена', vcs_completed: 'ВКС проведена',
  messenger_registered: 'Мессенджер зарегистрирован', messenger_ping: 'Ping',
  court_created: 'Суд создан', court_updated: 'Суд обновлён',
  department_created: 'Отдел создан', employee_added: 'Сотрудник добавлен',
  employee_removed: 'Сотрудник удалён',
};

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [courtFilter, setCourtFilter] = useState('');
  const pageSize = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize, ordering: '-created_at' };
      if (actionFilter) params.action = actionFilter;
      if (courtFilter) params.court = courtFilter;
      const res = await getAuditLogs(params);
      setLogs(res.data.results || res.data);
      setTotalCount(res.data.count || 0);
    } catch (err) { setError('Не удалось загрузить журнал аудита'); }
    finally { setLoading(false); }
  }, [page, actionFilter, courtFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Журнал аудита</h1>
          <p className="cr-page-subtitle">{totalCount} записей</p>
        </div>
      </div>

      {error && <div className="cr-error">{error}</div>}

      <div className="cr-card">
        <div className="cr-card-body">
          <div className="cr-toolbar">
            <select className="cr-filter-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">Все действия</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="cr-loading">Загрузка...</div>
          ) : logs.length === 0 ? (
            <div className="cr-empty"><div className="cr-empty-icon">📝</div><div className="cr-empty-title">Записей аудита нет</div></div>
          ) : (
            <div className="cr-table-wrap">
              <table className="cr-table">
                <thead>
                  <tr><th>Действие</th><th>Суд</th><th>Пользователь</th><th>Объект</th><th>Детали</th><th>IP</th><th>Дата</th></tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td><span className="cr-badge cr-badge-neutral">{ACTION_LABELS[log.action] || log.action_display}</span></td>
                      <td>{log.court_name || '—'}</td>
                      <td>{log.user_name || '—'}</td>
                      <td>{log.object_type ? `${log.object_type}#${log.object_id}` : '—'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--cr-text-muted)' }}>{log.ip_address || '—'}</td>
                      <td style={{ fontSize: 12 }}>{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="cr-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
              <span style={{ fontSize: 14, color: 'var(--cr-text-muted)' }}>Стр. {page} из {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
