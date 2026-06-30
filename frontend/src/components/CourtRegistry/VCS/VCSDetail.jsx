import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVCSRequest } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const STATUS_LABELS = {
  draft: 'Черновик', sent: 'Отправлен', confirmed: 'Подтвержден',
  rejected: 'Отклонен', completed: 'Проведен', cancelled: 'Отменен',
};

const VCSDetail = () => {
  const { id } = useParams();
  const [vcs, setVCS] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVCSRequest(id).then(r => setVCS(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;
  if (!vcs) return <div className="cr-container"><div className="cr-empty"><div className="cr-empty-title">Запрос ВКС не найден</div></div></div>;

  return (
    <div className="cr-container">
      <div className="cr-breadcrumbs">
        <Link to="/court-registry/vcs">Запросы ВКС</Link>
        <span>›</span>
        <span>{vcs.title}</span>
      </div>

      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">{vcs.title}</h1>
          <p className="cr-page-subtitle">
            Статус: <span className="cr-badge cr-badge-info">{STATUS_LABELS[vcs.status] || vcs.status_display}</span>
            {vcs.related_case_number && <span> · Дело: <code>{vcs.related_case_number}</code></span>}
          </p>
        </div>
      </div>

      <div className="cr-grid-2" style={{ marginBottom: 24 }}>
        <div className="cr-card">
          <div className="cr-card-header"><h3>Детали ВКС</h3></div>
          <div className="cr-card-body">
            <div className="cr-detail-grid">
              <div className="cr-detail-item"><span className="cr-detail-label">Запланировано</span><span className="cr-detail-value">{new Date(vcs.scheduled_at).toLocaleString('ru-RU')}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Длительность</span><span className="cr-detail-value">{vcs.estimated_duration_minutes} минут</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Инициатор</span><span className="cr-detail-value">{vcs.initiator_court_name}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Отдел</span><span className="cr-detail-value">{vcs.initiator_department_name || '—'}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Сотрудник</span><span className="cr-detail-value">{vcs.initiator_employee_name || '—'}</span></div>
              {vcs.external_system && <div className="cr-detail-item"><span className="cr-detail-label">Внешняя система</span><span className="cr-detail-value">{vcs.external_system}</span></div>}
              {vcs.external_link && <div className="cr-detail-item"><span className="cr-detail-label">Ссылка</span><span className="cr-detail-value"><a href={vcs.external_link} target="_blank" rel="noreferrer">{vcs.external_link}</a></span></div>}
            </div>
          </div>
        </div>

        <div className="cr-card">
          <div className="cr-card-header"><h3>Суды-участники</h3></div>
          <div className="cr-card-body">
            {vcs.participant_courts_detail && vcs.participant_courts_detail.length > 0 ? (
              vcs.participant_courts_detail.map(c => (
                <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--cr-border)' }}>
                  <strong>{c.name_short || c.name}</strong>
                  <span style={{ color: 'var(--cr-text-muted)', fontSize: 12, marginLeft: 8 }}>{c.code}</span>
                  {c.is_online && <span className="cr-badge cr-badge-success" style={{ marginLeft: 8, fontSize: 11 }}>онлайн</span>}
                </div>
              ))
            ) : (
              <p className="cr-empty-text">Участники не указаны</p>
            )}
          </div>
        </div>
      </div>

      {vcs.description && (
        <div className="cr-card" style={{ marginBottom: 24 }}>
          <div className="cr-card-header"><h3>Описание / Повестка</h3></div>
          <div className="cr-card-body">
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{vcs.description}</div>
          </div>
        </div>
      )}

      {vcs.rejection_reason && (
        <div className="cr-card">
          <div className="cr-card-header"><h3>Причина отклонения</h3></div>
          <div className="cr-card-body">
            <div className="cr-error" style={{ margin: 0 }}>{vcs.rejection_reason}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VCSDetail;
