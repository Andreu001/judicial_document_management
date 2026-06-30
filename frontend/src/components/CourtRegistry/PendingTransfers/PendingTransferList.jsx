import React, { useState, useEffect, useCallback } from 'react';
import { getPendingTransfers, scanCasesForTransfer } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const REASON_LABELS = {
  jurisdiction: 'По подсудности', appeal: 'Апелляция',
  cassation: 'Кассация', return_appeal: 'Возврат из апелляции',
  return_cassation: 'Возврат из кассации',
};

const STATUS_LABELS = { detected: 'Обнаружено', ready: 'Готово', sent: 'Отправлено', completed: 'Завершено', cancelled: 'Отменено' };

// Функция для получения отображаемого названия суда
const getCourtDisplayName = (court) => {
  if (!court) return '—';
  if (typeof court === 'object') {
    return court.name_short || court.name || court.code || '—';
  }
  return court;
};

const PendingTransferList = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPendingTransfers();
      setCases(res.data.results || res.data);
    } catch (err) { setError('Не удалось загрузить'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await scanCasesForTransfer();
      alert(`Сканирование завершено. Обнаружено: ${res.data.detected_count} дел`);
      load();
    } catch (err) {
      alert('Ошибка сканирования: ' + (err.response?.data?.error || err.message));
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Дела, ожидающие передачи</h1>
          <p className="cr-page-subtitle">{cases.length} дел требуют передачи в другие инстанции</p>
        </div>
        <button className="cr-btn cr-btn-primary" onClick={handleScan} disabled={scanning}>
          {scanning ? 'Сканирование...' : '🔍 Сканировать дела'}
        </button>
      </div>

      {error && <div className="cr-error">{error}</div>}

      <div className="cr-card">
        <div className="cr-card-body">
          {cases.length === 0 ? (
            <div className="cr-empty">
              <div className="cr-empty-icon">⏳</div>
              <div className="cr-empty-title">Дел, ожидающих передачи, нет</div>
              <div className="cr-empty-text">Нажмите «Сканировать дела» для поиска дел, требующих передачи в апелляцию/кассацию или по подсудности</div>
            </div>
          ) : (
            <div className="cr-table-wrap">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>№ дела</th>
                    <th>Категория</th>
                    <th>Причина</th>
                    <th>Целевой суд</th>
                    <th>Дата основания</th>
                    <th>Статус</th>
                    <th>Просрочено</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => {
                    const targetName = getCourtDisplayName(c.target_court);
                    const targetCode = c.target_court?.code || '';
                    
                    return (
                      <tr key={c.id} style={c.is_overdue ? { background: 'var(--cr-danger-light)' } : {}}>
                        <td><code>{c.case_number}</code></td>
                        <td><span className="cr-badge cr-badge-neutral">{c.case_category}</span></td>
                        <td>{REASON_LABELS[c.transfer_reason] || c.transfer_reason_display}</td>
                        <td>
                          {targetName}
                          {targetCode && <span style={{ color: 'var(--cr-text-muted)', fontSize: 12, marginLeft: 4 }}>({targetCode})</span>}
                        </td>
                        <td>{c.relevant_date ? new Date(c.relevant_date).toLocaleDateString('ru-RU') : '—'}</td>
                        <td><span className="cr-badge cr-badge-neutral">{STATUS_LABELS[c.status] || c.status_display}</span></td>
                        <td>{c.is_overdue ? <span className="cr-badge cr-badge-danger">Просрочено!</span> : '—'}</td>
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

export default PendingTransferList;