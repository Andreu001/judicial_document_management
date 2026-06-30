// communication-frontend/src/components/Messenger/Modals/TaskModal.jsx
import React, { useState, useEffect } from 'react';
import { useMessenger } from '../context/MessengerContext';
import { searchService } from '../services/messengerService';
import styles from '../MessengerApp.module.css';

const TaskModal = ({ onClose }) => {
  const { createTask } = useMessenger();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [deadline, setDeadline] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      const res = await searchService.employees({ q: search });
      setResults(res.data);
    } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    if (!title.trim() || !assignedToId) return;
    setLoading(true);
    try {
      await createTask({
        title,
        description,
        assigned_to_id: parseInt(assignedToId),
        priority,
        deadline: deadline || undefined,
      });
      onClose();
    } catch (e) {
      alert('Ошибка создания поручения');
    }
    setLoading(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span>Новое поручение</span>
          <button className={styles.closePanelBtn} onClick={onClose}>&#x2715;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Заголовок</label>
            <input className={styles.formInput} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Описание</label>
            <textarea className={styles.formTextarea} value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Исполнитель</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className={styles.formInput}
                placeholder="Поиск сотрудника..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={handleSearch}>Найти</button>
            </div>
            {selectedUser && (
              <div className={styles.recipientChip} style={{ marginTop: 8 }}>
                {selectedUser.name}
                <button onClick={() => { setSelectedUser(null); setAssignedToId(''); }}>&#x2715;</button>
              </div>
            )}
            {results.map(emp => (
              <div
                key={emp.id}
                className={styles.searchResultItem}
                onClick={() => { setSelectedUser(emp); setAssignedToId(emp.id.toString()); setResults([]); }}
              >
                <div className={styles.chatAvatar} style={{ width: 32, height: 32, fontSize: 12 }}>{emp.name?.charAt(0)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{emp.position} · {emp.department}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>Приоритет</label>
              <select className={styles.formSelect} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Низкий</option>
                <option value="normal">Обычный</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочный</option>
              </select>
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>Срок</label>
              <input className={styles.formInput} type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary + ' ' + styles.btn} onClick={onClose}>Отмена</button>
          <button className={styles.btnPrimary + ' ' + styles.btn} onClick={handleCreate} disabled={loading || !title.trim() || !assignedToId}>
            {loading ? 'Создание...' : 'Создать поручение'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
