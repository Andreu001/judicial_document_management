import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getTransfer, sendTransfer, acceptTransfer,
  rejectTransfer, returnTransfer
} from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

// Функция для получения отображаемого названия суда
const getCourtDisplayName = (court) => {
  if (!court) return '—';
  if (typeof court === 'object') {
    return court.name_short || court.name || court.code || '—';
  }
  return court;
};

const TransferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    getTransfer(id).then(r => setTransfer(r.data)).catch(() => setError('Не удалось загрузить'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSend = async () => {
    if (!window.confirm('Отправить передачу?')) return;
    setActionLoading(true);
    try { await sendTransfer(id); alert('Передача отправлена'); window.location.reload(); }
    catch (err) { alert('Ошибка: ' + (err.response?.data?.detail || err.message)); }
    finally { setActionLoading(false); }
  };

  const handleAccept = async () => {
    if (!window.confirm('Принять все дела? Они будут автоматически зарегистрированы.')) return;
    setActionLoading(true);
    try { await acceptTransfer(id, true); alert('Дела приняты и зарегистрированы'); window.location.reload(); }
    catch (err) { alert('Ошибка: ' + (err.response?.data?.detail || err.message)); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { alert('Укажите причину отклонения'); return; }
    setActionLoading(true);
    try { await rejectTransfer(id, rejectReason); alert('Передача отклонена'); window.location.reload(); }
    catch (err) { alert('Ошибка: ' + (err.response?.data?.detail || err.message)); }
    finally { setActionLoading(false); setShowReject(false); }
  };

  if (loading) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;
  if (error) return <div className="cr-container"><div className="cr-error">{error}</div></div>;
  if (!transfer) return <div className="cr-container"><div className="cr-empty"><div className="cr-empty-title">Передача не найдена</div></div></div>;

  const canSend = transfer.status_code === 'draft' || transfer.status_name === 'Черновик';
  const canAcceptReject = transfer.status_code === 'sent' || transfer.status_name === 'Отправлено';

  // Получаем названия судов
  const sourceName = getCourtDisplayName(transfer.source_court_detail || transfer.source_court);
  const sourceCode = transfer.source_court_detail?.code || transfer.source_court_code || '';
  const destName = getCourtDisplayName(transfer.destination_court_detail || transfer.destination_court);
  const destCode = transfer.destination_court_detail?.code || transfer.destination_court_code || '';

  return (
    <div className="cr-container">
      <div className="cr-breadcrumbs">
        <Link to="/court-registry/transfers">Передачи дел</Link>
        <span>›</span>
        <span>{transfer.uuid?.substring(0, 8)}</span>
      </div>

      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Передача дел</h1>
          <p className="cr-page-subtitle">
            <code>{transfer.uuid}</code> · {transfer.transfer_type_name} · <span className="cr-badge cr-badge-info">{transfer.status_name}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canSend && (
            <button className="cr-btn cr-btn-primary" onClick={handleSend} disabled={actionLoading}>
              📤 Отправить
            </button>
          )}
          {canAcceptReject && (
            <>
              <button className="cr-btn cr-btn-primary" onClick={handleAccept} disabled={actionLoading}>
                ✅ Принять все
              </button>
              <button className="cr-btn cr-btn-danger" onClick={() => setShowReject(true)} disabled={actionLoading}>
                ❌ Отклонить
              </button>
            </>
          )}
        </div>
      </div>

      {showReject && (
        <div className="cr-modal-overlay" onClick={() => setShowReject(false)}>
          <div className="cr-modal" onClick={e => e.stopPropagation()}>
            <div className="cr-modal-header">
              <h2>Отклонить передачу</h2>
              <button className="cr-modal-close" onClick={() => setShowReject(false)}>×</button>
            </div>
            <div className="cr-modal-body">
              <div className="cr-form-group">
                <label>Причина отклонения</label>
                <textarea className="cr-textarea" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Укажите причину..." />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="cr-btn cr-btn-danger" onClick={handleReject} disabled={actionLoading}>Отклонить</button>
                <button className="cr-btn cr-btn-secondary" onClick={() => setShowReject(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Детали */}
      <div className="cr-grid-2" style={{ marginBottom: 24 }}>
        <div className="cr-card">
          <div className="cr-card-header"><h3>Отправитель</h3></div>
          <div className="cr-card-body">
            <div className="cr-detail-grid">
              <div className="cr-detail-item">
                <span className="cr-detail-label">Суд</span>
                <span className="cr-detail-value">
                  {sourceName}
                  {sourceCode && <span style={{ color: 'var(--cr-text-muted)', fontSize: 13, marginLeft: 8 }}>({sourceCode})</span>}
                </span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Отдел</span>
                <span className="cr-detail-value">{transfer.source_department_name || '—'}</span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Сотрудник</span>
                <span className="cr-detail-value">{transfer.source_employee_name || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cr-card">
          <div className="cr-card-header"><h3>Получатель</h3></div>
          <div className="cr-card-body">
            <div className="cr-detail-grid">
              <div className="cr-detail-item">
                <span className="cr-detail-label">Суд</span>
                <span className="cr-detail-value">
                  {destName}
                  {destCode && <span style={{ color: 'var(--cr-text-muted)', fontSize: 13, marginLeft: 8 }}>({destCode})</span>}
                </span>
              </div>
              <div className="cr-detail-item">
                <span className="cr-detail-label">Отдел</span>
                <span className="cr-detail-value">{transfer.destination_department_name || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cr-card" style={{ marginBottom: 24 }}>
        <div className="cr-card-header"><h3>Основание передачи</h3></div>
        <div className="cr-card-body">
          <div className="cr-detail-grid">
            <div className="cr-detail-item"><span className="cr-detail-label">Тип</span><span className="cr-detail-value">{transfer.transfer_type_name}</span></div>
            <div className="cr-detail-item"><span className="cr-detail-label">Основание</span><span className="cr-detail-value">{transfer.basis}</span></div>
            <div className="cr-detail-item"><span className="cr-detail-label">Документ</span><span className="cr-detail-value">{transfer.basis_document || '—'}</span></div>
            {transfer.basis_judge_info && (
              <div className="cr-detail-item"><span className="cr-detail-label">Судья</span><span className="cr-detail-value">{transfer.basis_judge_info.last_name} {transfer.basis_judge_info.first_name || ''}</span></div>
            )}
            <div className="cr-detail-item"><span className="cr-detail-label">Создана</span><span className="cr-detail-value">{new Date(transfer.created_at).toLocaleString('ru-RU')}</span></div>
            {transfer.sent_at && <div className="cr-detail-item"><span className="cr-detail-label">Отправлена</span><span className="cr-detail-value">{new Date(transfer.sent_at).toLocaleString('ru-RU')}</span></div>}
            {transfer.received_at && <div className="cr-detail-item"><span className="cr-detail-label">Получена</span><span className="cr-detail-value">{new Date(transfer.received_at).toLocaleString('ru-RU')}</span></div>}
          </div>
        </div>
      </div>

      {/* Список дел */}
      <div className="cr-card">
        <div className="cr-card-header">
          <h3>Дела в передаче ({transfer.items?.length || 0})</h3>
          {transfer.items_summary && (
            <span style={{ fontSize: 13, color: 'var(--cr-text-muted)' }}>
              Уг: {transfer.items_summary.criminal} | Гр: {transfer.items_summary.civil} | АП: {transfer.items_summary.admin_code} | КАС: {transfer.items_summary.kas}
            </span>
          )}
        </div>
        <div className="cr-card-body">
          {transfer.items && transfer.items.length > 0 ? (
            <div className="cr-table-wrap">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>Номер дела</th>
                    <th>Категория</th>
                    <th>Описание</th>
                    <th>Принято</th>
                    <th>Новый номер</th>
                    <th>Документов</th>
                    <th>Сторон</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.items.map(item => (
                    <tr key={item.id}>
                      <td><code>{item.case_number}</code></td>
                      <td><span className="cr-badge cr-badge-neutral">{item.case_type_display || item.case_category}</span></td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.case_description || '—'}</td>
                      <td>{item.is_accepted ? <span className="cr-badge cr-badge-success">Да</span> : <span className="cr-badge cr-badge-neutral">Нет</span>}</td>
                      <td>{item.new_case_number ? <code>{item.new_case_number}</code> : '—'}</td>
                      <td>{item.documents_count || 0}</td>
                      <td>{item.sides_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="cr-empty"><div className="cr-empty-text">Дела не добавлены</div></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferDetail;