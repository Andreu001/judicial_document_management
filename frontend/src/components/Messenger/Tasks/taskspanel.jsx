// communication-frontend/src/components/Messenger/Tasks/TasksPanel.jsx
import React, { useEffect, useState } from 'react';
import { useMessenger } from '../context/MessengerContext';
import { taskService } from '../services/messengerService';
import styles from '../MessengerApp.module.css';

const TasksPanel = () => {
  const { tasks, loadMyTasks, updateTaskStatus } = useMessenger();
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadMyTasks(); }, [loadMyTasks]);

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return t.is_overdue;
    return t.status === filter;
  });

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>&#x1F4CB; Поручения</h3>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { k: 'all', l: 'Все' },
          { k: 'new', l: 'Новые' },
          { k: 'in_progress', l: 'В работе' },
          { k: 'completed', l: 'Выполненные' },
          { k: 'overdue', l: 'Просроченные' },
        ].map(f => (
          <button
            key={f.k}
            className={`${styles.tab} ${filter === f.k ? styles.active : ''}`}
            onClick={() => setFilter(f.k)}
          >{f.l}</button>
        ))}
      </div>

      {filtered.map(task => (
        <div key={task.id} className={styles.taskItem} style={{ padding: 14 }}>
          <div className={styles.taskHeader}>
            <div className={styles.taskTitle}>{task.title}</div>
            <span className={`${styles.taskStatus} ${styles[task.status]}`}>
              {task.status_display}
            </span>
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
              {task.description.substring(0, 200)}
            </div>
          )}
          <div className={styles.taskMeta}>
            {task.assigned_to && <>Исполнитель: {task.assigned_to.display_name}<br/></>}
            {task.created_by && <>Постановщик: {task.created_by.display_name}<br/></>}
            {task.deadline && <>Срок: {new Date(task.deadline).toLocaleDateString()} {new Date(task.deadline).toLocaleTimeString()}<br/></>}
            {task.is_overdue && <span style={{ color: '#c5221f', fontWeight: 700 }}>ПРОСРОЧЕНО</span>}
          </div>

          {task.status === 'new' && task.assigned_to?.id === parseInt(localStorage.getItem('userId') || '0') && (
            <div className={styles.taskActions}>
              <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={() => updateTaskStatus(task.id, 'accept')}>Принять</button>
              <button className={styles.btnDanger + ' ' + styles.btnSmall} onClick={() => updateTaskStatus(task.id, 'reject')}>Отклонить</button>
            </div>
          )}
          {task.status === 'accepted' && (
            <div className={styles.taskActions}>
              <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={() => updateTaskStatus(task.id, 'start')}>Начать работу</button>
            </div>
          )}
          {task.status === 'in_progress' && (
            <div className={styles.taskActions}>
              <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={() => updateTaskStatus(task.id, 'complete')}>Выполнено</button>
            </div>
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>Нет поручений</div>
      )}
    </div>
  );
};

export default TasksPanel;
