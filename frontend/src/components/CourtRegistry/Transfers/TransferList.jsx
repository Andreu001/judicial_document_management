import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTransfers } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const STATUS_MAP = {
  'draft': { className: 'cr-badge-draft', label: 'Черновик' },
  'sent': { className: 'cr-badge-info', label: 'Отправлено' },
  'received': { className: 'cr-badge-info', label: 'Получено' },
  'accepted': { className: 'cr-badge-success', label: 'Принято' },
  'rejected': { className: 'cr-badge-danger', label: 'Отклонено' },
  'completed': { className: 'cr-badge-success', label: 'Завершено' },
};

const TransferList = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, outgoing, incoming
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      const params = { page, page_size: pageSize };
      if (filter === 'outgoing') {
        res = await getTransfers({ ...params });
      } else if (filter === 'incoming') {
        res = await getTransfers({ ...params });
      } else {
        res = await getTransfers(params);
      }
      setTransfers(res.data.results || res.data);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      setError('Не удалось загрузить передачи: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Функция для получения отображаемого названия суда
  const getCourtDisplayName = (court) => {
    if (!court) return '—';
    // Если пришёл объект с названием
    if (typeof court === 'object') {
      return court.name_short || court.name || court.code || '—';
    }
    // Если пришла строка
    return court;
  };

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Передачи дел</h1>
          <p className="cr-page-subtitle">{totalCount} передач</p>
        </div>
        <Link to="/court-registry/transfers/new" className="cr-btn cr-btn-primary">+ Новая передача</Link>
      </div>

      <div className="cr-card">
        <div className="cr-card-body">
          <div className="cr-toolbar" style={{ marginBottom: 16 }}>
            <select className="cr-filter-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
              <option value="all">Все передачи</option>
              <option value="outgoing">Исходящие</option>
              <option value="incoming">Входящие</option>
            </select>
          </div>

          {error && <div className="cr-error">{error}</div>}

          {loading ? (
            <div className="cr-loading">Загрузка...</div>
          ) : transfers.length === 0 ? (
            <div className="cr-empty">
              <div className="cr-empty-icon">📋</div>
              <div className="cr-empty-title">Передачи не найдены</div>
              <div className="cr-empty-text">Создайте новую передачу дел между судами</div>
            </div>
          ) : (
            <div className="cr-table-wrap">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>Тип</th>
                    <th>Отправитель</th>
                    <th>Получатель</th>
                    <th>Основание</th>
                    <th>Дел</th>
                    <th>Статус</th>
                    <th>Создана</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map(t => {
                    const st = STATUS_MAP[t.status_code || t.status_name] || { className: 'cr-badge-neutral', label: t.status_name };
                    
                    // Получаем названия судов
                    const sourceName = t.source_court_detail?.name_short || 
                                      t.source_court_detail?.name || 
                                      t.source_court_name || 
                                      t.source_court_code || 
                                      '—';
                    
                    const destName = t.destination_court_detail?.name_short || 
                                    t.destination_court_detail?.name || 
                                    t.destination_court_name || 
                                    t.destination_court_code || 
                                    '—';
                    
                    const sourceCode = t.source_court_detail?.code || t.source_court_code || '';
                    const destCode = t.destination_court_detail?.code || t.destination_court_code || '';

                    return (
                      <tr key={t.id}>
                        <td><span className="cr-badge cr-badge-neutral">{t.transfer_type_name}</span></td>
                        <td>
                          {sourceName}
                          {sourceCode && <span style={{ color: 'var(--cr-text-muted)', fontSize: 12, marginLeft: 4 }}>({sourceCode})</span>}
                        </td>
                        <td>
                          {destName}
                          {destCode && <span style={{ color: 'var(--cr-text-muted)', fontSize: 12, marginLeft: 4 }}>({destCode})</span>}
                        </td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.basis}</td>
                        <td>
                          {t.items_summary ? (
                            <span title={`Уг:${t.items_summary.criminal} Гр:${t.items_summary.civil} АП:${t.items_summary.admin_code} КАС:${t.items_summary.kas}`}>
                              {t.items_summary.total || t.items_count}
                            </span>
                          ) : t.items_count}
                        </td>
                        <td><span className={`cr-badge ${st.className}`}>{st.label}</span></td>
                        <td>{new Date(t.created_at).toLocaleDateString('ru-RU')}</td>
                        <td>
                          <button className="cr-btn cr-btn-sm cr-btn-outline" onClick={() => navigate(`/court-registry/transfers/${t.id}`)}>
                            Открыть
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

export default TransferList;