// communication-frontend/src/components/Messenger/RightPanel/RightPanel.jsx
import React from 'react';
import { useMessenger } from '../context/MessengerContext';
import styles from '../MessengerApp.module.css';

const RightPanel = () => {
  const { rightPanel, setRightPanel, activeChat, dashboard, tasks } = useMessenger();

  const getChatInfo = () => (
    <div>
      <div className={styles.formGroup}>
        <div className={styles.formLabel}>Тип чата</div>
        <div style={{ fontSize: 13 }}>{activeChat.chat_type_display || activeChat.chat_type}</div>
      </div>
      {activeChat.description && (
        <div className={styles.formGroup}>
          <div className={styles.formLabel}>Описание</div>
          <div style={{ fontSize: 13 }}>{activeChat.description}</div>
        </div>
      )}
      <div className={styles.formGroup}>
        <div className={styles.formLabel}>Участников</div>
        <div style={{ fontSize: 13 }}>{activeChat.member_count || 0}</div>
      </div>
      {activeChat.court_info?.target_court_name && (
        <div className={styles.formGroup}>
          <div className={styles.formLabel}>Суд-корреспондент</div>
          <div style={{ fontSize: 13 }}>{activeChat.court_info.target_court_name}</div>
        </div>
      )}
    </div>
  );

  const getDashboard = () => (
    <div>
      {dashboard && (
        <>
          <div className={styles.taskItem}>
            <div className={styles.taskTitle}>Мои чаты</div>
            <div className={styles.taskMeta}>{dashboard.total_chats} чатов, {dashboard.unread_chats} непрочитанных</div>
          </div>
          <div className={styles.taskItem}>
            <div className={styles.taskTitle}>Поручения</div>
            <div className={styles.taskMeta}>
              {dashboard.tasks_new} новых, {dashboard.tasks_in_progress} в работе, {dashboard.tasks_overdue} просрочено
            </div>
          </div>
          <div className={styles.taskItem}>
            <div className={styles.taskTitle}>Рассылки</div>
            <div className={styles.taskMeta}>{dashboard.broadcasts_unread} непрочитанных</div>
          </div>
          {dashboard.incoming_documents > 0 && (
            <div className={styles.taskItem}>
              <div className={styles.taskTitle}>Входящие документы</div>
              <div className={styles.taskMeta}>{dashboard.incoming_documents} документов</div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const getTasks = () => (
    <div>
      {tasks.length === 0 && <div style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>Нет поручений</div>}
      {tasks.map(task => (
        <div key={task.id} className={styles.taskItem}>
          <div className={styles.taskHeader}>
            <div className={styles.taskTitle}>{task.title}</div>
            <span className={`${styles.taskStatus} ${styles[task.status]}`}>
              {task.status_display}
            </span>
          </div>
          <div className={styles.taskMeta}>
            От: {task.created_by?.display_name || 'Система'}<br/>
            Кому: {task.assigned_to?.display_name || '—'}<br/>
            {task.deadline && <>Срок: {new Date(task.deadline).toLocaleDateString()}<br/></>}
            {task.is_overdue && <span style={{ color: '#c5221f' }}>ПРОСРОЧЕНО</span>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.rightPanel}>
      <div className={styles.rightPanelHeader}>
        <span>
          {rightPanel === 'info' && 'Информация'}
          {rightPanel === 'dashboard' && 'Сводка'}
          {rightPanel === 'tasks' && 'Поручения'}
        </span>
        <button className={styles.closePanelBtn} onClick={() => setRightPanel(null)}>&#x2715;</button>
      </div>
      <div className={styles.rightPanelBody}>
        {rightPanel === 'info' && getChatInfo()}
        {rightPanel === 'dashboard' && getDashboard()}
        {rightPanel === 'tasks' && getTasks()}
      </div>
    </div>
  );
};

export default RightPanel;
