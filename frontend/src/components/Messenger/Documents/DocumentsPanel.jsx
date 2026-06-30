// communication-frontend/src/components/Messenger/Documents/DocumentsPanel.jsx
import React, { useEffect, useState } from 'react';
import { documentExchangeService } from '../services/messengerService';
import styles from '../MessengerApp.module.css';

const DocumentsPanel = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [tab, setTab] = useState('incoming');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inc, out] = await Promise.all([
        documentExchangeService.incoming(),
        documentExchangeService.outgoing(),
      ]);
      setIncoming(inc.data);
      setOutgoing(out.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'accept') await documentExchangeService.accept(id);
      else if (action === 'reject') {
        const reason = prompt('Причина отклонения:');
        if (reason) await documentExchangeService.reject(id, reason);
        else return;
      }
      loadData();
    } catch (e) { console.error(e); }
  };

  const items = tab === 'incoming' ? incoming : outgoing;

  const statusColors = {
    sent: '#1967d2', received: '#f9ab00', accepted: '#137333',
    rejected: '#c5221f', processed: '#137333',
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>&#x1F4E4; Межсудебный обмен</h3>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button className={`${styles.tab} ${tab === 'incoming' ? styles.active : ''}`} onClick={() => setTab('incoming')}>
          Входящие ({incoming.length})
        </button>
        <button className={`${styles.tab} ${tab === 'outgoing' ? styles.active : ''}`} onClick={() => setTab('outgoing')}>
          Исходящие ({outgoing.length})
        </button>
      </div>

      {items.map(doc => (
        <div key={doc.id} className={styles.taskItem}>
          <div className={styles.taskHeader}>
            <div className={styles.taskTitle}>
              {doc.is_urgent && '\uD83D\uDD34 '}
              {doc.title}
            </div>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 10,
              background: statusColors[doc.status] + '20', color: statusColors[doc.status],
              fontWeight: 600,
            }}>{doc.status_display}</span>
          </div>
          <div className={styles.taskMeta}>
            {tab === 'incoming'
              ? `От: ${doc.source_court_name}`
              : `Кому: ${doc.target_court_name}`}<br/>
            Тип: {doc.document_type}<br/>
            {doc.reference_number && `Исх: ${doc.reference_number}`}<br/>
            {doc.case_number && `Дело: ${doc.case_number}`}<br/>
            {doc.created_at && `Создан: ${new Date(doc.created_at).toLocaleDateString()}`}
          </div>

          {tab === 'incoming' && doc.status === 'sent' && (
            <div className={styles.taskActions}>
              <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={() => handleAction(doc.id, 'accept')}>Принять</button>
              <button className={styles.btnDanger + ' ' + styles.btnSmall} onClick={() => handleAction(doc.id, 'reject')}>Отклонить</button>
            </div>
          )}
          {tab === 'outgoing' && doc.status === 'draft' && (
            <div className={styles.taskActions}>
              <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={() => handleAction(doc.id, 'send')}>Отправить</button>
            </div>
          )}
        </div>
      ))}

      {items.length === 0 && (
        <div style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>
          {tab === 'incoming' ? 'Нет входящих документов' : 'Нет исходящих документов'}
        </div>
      )}
    </div>
  );
};

export default DocumentsPanel;
