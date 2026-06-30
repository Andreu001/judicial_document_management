// communication-frontend/src/components/Messenger/Broadcast/BroadcastPanel.jsx
import React, { useEffect, useState } from 'react';
import { useMessenger } from '../context/MessengerContext';
import { broadcastService } from '../services/messengerService';
import styles from '../MessengerApp.module.css';

const BroadcastPanel = () => {
  const { broadcasts, loadBroadcasts } = useMessenger();
  const [myBroadcasts, setMyBroadcasts] = useState([]);

  useEffect(() => {
    loadBroadcasts();
    broadcastService.myBroadcasts().then(r => setMyBroadcasts(r.data)).catch(() => {});
  }, [loadBroadcasts]);

  const handleMarkRead = async (id) => {
    try {
      await broadcastService.markRead(id);
      setMyBroadcasts(prev => prev.map(b => b.id === id ? { ...b, is_read: true } : b));
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>&#x1F4E2; Рассылки</h3>

      {broadcasts.map(b => (
        <div key={b.id} className={styles.taskItem}>
          <div className={styles.taskHeader}>
            <div className={styles.taskTitle}>
              {b.importance === 'urgent' && '\uD83D\uDD34 '}
              {b.title}
            </div>
            <span style={{ fontSize: 11, color: '#999' }}>{new Date(b.created_at).toLocaleDateString()}</span>
          </div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>{b.text?.substring(0, 150)}</div>
          <div style={{ fontSize: 11, color: '#999' }}>
            Статус: {b.status} | Прочитано: {b.read_count}/{b.sent_count}
            {b.read_percentage > 0 && ` (${b.read_percentage}%)`}
          </div>
        </div>
      ))}

      {broadcasts.length === 0 && (
        <div style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>Нет рассылок</div>
      )}
    </div>
  );
};

export default BroadcastPanel;
