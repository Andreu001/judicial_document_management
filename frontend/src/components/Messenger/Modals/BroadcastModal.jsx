// communication-frontend/src/components/Messenger/Modals/BroadcastModal.jsx
import React, { useState } from 'react';
import { useMessenger } from '../context/MessengerContext';
import styles from '../MessengerApp.module.css';

const BroadcastModal = ({ onClose }) => {
  const { sendBroadcast } = useMessenger();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [broadcastType, setBroadcastType] = useState('all_staff');
  const [targetRoles, setTargetRoles] = useState([]);
  const [importance, setImportance] = useState('normal');
  const [requiresConfirm, setRequiresConfirm] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    'judge', 'assistant_judge', 'secretary', 'clerk',
    'archivist', 'administrator', 'head_of_department', 'specialist',
  ];

  const toggleRole = (role) => {
    setTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSend = async () => {
    if (!title.trim() || !text.trim()) return;
    setLoading(true);
    try {
      await sendBroadcast({
        title, text, broadcast_type: broadcastType,
        target_roles: targetRoles,
        importance, requires_confirmation: requiresConfirm,
        deadline: deadline || undefined,
      });
      onClose();
    } catch (e) {
      alert('Ошибка отправки рассылки');
    }
    setLoading(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span>Новая рассылка</span>
          <button className={styles.closePanelBtn} onClick={onClose}>&#x2715;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Заголовок</label>
            <input className={styles.formInput} value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Текст рассылки</label>
            <textarea className={styles.formTextarea} value={text} onChange={e => setText(e.target.value)} rows={5} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Тип рассылки</label>
            <select className={styles.formSelect} value={broadcastType} onChange={e => setBroadcastType(e.target.value)}>
              <option value="all_staff">Всему штату</option>
              <option value="by_role">По ролям</option>
              <option value="by_department">По отделам</option>
            </select>
          </div>

          {broadcastType === 'by_role' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Роли получателей</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {roles.map(role => (
                  <span
                    key={role}
                    className={styles.recipientChip}
                    style={{
                      cursor: 'pointer',
                      background: targetRoles.includes(role) ? '#e8f0fe' : '#f0f2f5',
                    }}
                    onClick={() => toggleRole(role)}
                  >
                    {role}
                    {targetRoles.includes(role) && ' ✓'}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Важность</label>
            <select className={styles.formSelect} value={importance} onChange={e => setImportance(e.target.value)}>
              <option value="normal">Обычная</option>
              <option value="important">Важная</option>
              <option value="urgent">Срочная</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={requiresConfirm} onChange={e => setRequiresConfirm(e.target.checked)} />
              Требовать подтверждения прочтения
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Срок (для поручений)</label>
            <input className={styles.formInput} type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary + ' ' + styles.btn} onClick={onClose}>Отмена</button>
          <button className={styles.btnPrimary + ' ' + styles.btn} onClick={handleSend} disabled={loading || !title.trim() || !text.trim()}>
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
