// UI/NotificationBell/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import NotificationService from '../../API/NotificationService';
import styles from './NotificationBell.module.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, high_priority: 0 });

  /*useEffect(() => {
    loadNotifications();
    loadStats();
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(() => {
      loadNotifications();
      loadStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);*/

  const loadNotifications = async () => {
    const data = await NotificationService.getNotifications();
    setNotifications(data);
  };

  const loadStats = async () => {
    const data = await NotificationService.getStats();
    setStats(data);
  };

  const handleMarkAsRead = async (notificationId) => {
    await NotificationService.markAsRead(notificationId);
    loadNotifications();
    loadStats();
  };

  const handleMarkAsCompleted = async (notificationId) => {
    await NotificationService.markAsCompleted(notificationId);
    loadNotifications();
    loadStats();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className={styles.notificationContainer}>
      <button 
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {stats.unread > 0 && (
          <span className={styles.badge}>{stats.unread}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.notificationDropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Уведомления ({stats.unread} новых)</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>

          <div className={styles.notificationList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>Нет уведомлений</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`${styles.notificationItem} ${
                    !notification.is_read ? styles.unread : ''
                  } ${styles[notification.priority]}`}
                >
                  <div className={styles.notificationHeader}>
                    <span className={styles.priorityIcon}>
                      {getPriorityIcon(notification.priority)}
                    </span>
                    <span className={styles.notificationTitle}>
                      {notification.title}
                    </span>
                    <span className={styles.notificationDate}>
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  
                  <div className={styles.notificationMessage}>
                    {notification.message}
                  </div>

                  {notification.deadline && (
                    <div className={styles.deadline}>
                      📅 До: {formatDate(notification.deadline)}
                    </div>
                  )}

                  <div className={styles.notificationActions}>
                    {!notification.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className={styles.readButton}
                      >
                        Прочитано
                      </button>
                    )}
                    {!notification.is_completed && (
                      <button 
                        onClick={() => handleMarkAsCompleted(notification.id)}
                        className={styles.completeButton}
                      >
                        Выполнено
                      </button>
                    )}
                  </div>

                  {notification.legal_references && notification.legal_references.length > 0 && (
                    <div className={styles.legalReferences}>
                      <strong>Правовые ссылки:</strong>
                      {notification.legal_references.map(ref => (
                        <div key={ref.id} className={styles.legalRef}>
                          {ref.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className={styles.dropdownFooter}>
            <button className={styles.viewAllButton}>
              Просмотреть все уведомления
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;