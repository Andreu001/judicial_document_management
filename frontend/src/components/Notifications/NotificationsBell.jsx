// UI/NotificationBell/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import NotificationService from '../../API/NotificationService';
import { useAuth } from '../../context/AuthContext';
import styles from './NotificationBell.module.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, high_priority: 0 });
  const { isAuthenticated } = useAuth();
  
  const containerRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated()) {
      loadNotifications();
      loadStats();
      
      const interval = setInterval(() => {
        if (isAuthenticated()) {
          loadNotifications();
          loadStats();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setStats({ total: 0, unread: 0, high_priority: 0 });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    if (!isAuthenticated()) return;
    
    try {
      const data = await NotificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Ошибка загрузки уведомлений:', error);
      }
    }
  };

  const loadStats = async () => {
    if (!isAuthenticated()) return;
    
    try {
      const data = await NotificationService.getStats();
      setStats(data);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Ошибка загрузки статистики:', error);
      }
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    if (!isAuthenticated()) return;
    
    try {
      await NotificationService.markAsRead(notificationId);
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Ошибка при отметке прочитанным:', error);
    }
  };

  const handleMarkAsCompleted = async (notificationId) => {
    if (!isAuthenticated()) return;
    
    try {
      await NotificationService.markAsCompleted(notificationId);
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Ошибка при отметке выполненным:', error);
    }
  };

  // ИСПРАВЛЕНО: Реальное удаление без confirm
  const handleDeleteNotification = async (notificationId) => {
    if (!isAuthenticated()) return;
    
    try {
      await NotificationService.deleteNotification(notificationId);
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error);
    }
  };

  // ИСПРАВЛЕНО: Очистка всех уведомлений без confirm
  const handleClearAll = async () => {
    if (!isAuthenticated()) return;
    
    try {
      // Удаляем все уведомления по одному
      await Promise.all(
        notifications.map(n => NotificationService.deleteNotification(n.id))
      );
      await loadNotifications();
      await loadStats();
      // Закрываем окно после очистки
      setIsOpen(false);
    } catch (error) {
      console.error('Ошибка при очистке уведомлений:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'только что';
      if (diffMins < 60) return `${diffMins} мин. назад`;
      if (diffHours < 24) return `${diffHours} ч. назад`;
      if (diffDays === 1) return 'вчера';
      if (diffDays < 7) return `${diffDays} дн. назад`;
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'critical': return 'Критичный';
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return '';
    }
  };

  const getNotificationIcon = (notification) => {
    if (notification.notification_type === 'incoming_correspondence') {
      return '📥';
    } else if (notification.notification_type === 'outgoing_correspondence') {
      return '📤';
    } else if (notification.priority === 'critical' || notification.priority === 'high') {
      return '⚠️';
    } else {
      return '📋';
    }
  };

  const getCaseLink = (notification) => {
    if (notification.criminal_proceeding) {
      return `/criminal-proceedings/${notification.criminal_proceeding}`;
    } else if (notification.civil_proceeding) {
      return `/civil-proceedings/${notification.civil_proceeding}`;
    } else if (notification.admin_proceeding) {
      return `/admin-proceedings/${notification.admin_proceeding}`;
    } else if (notification.kas_proceeding) {
      return `/kas-proceedings/${notification.kas_proceeding}`;
    }
    return null;
  };

  if (!isAuthenticated()) {
    return (
      <div className={styles.notificationContainer}>
        <button 
          className={styles.notificationButton}
          disabled
        >
          Уведомления
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.notificationContainer}>
      <button 
        className={styles.notificationButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        Уведомления
        {stats.unread > 0 && (
          <span className={styles.badge}>{stats.unread}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.notificationDropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Уведомления</h3>
            <div className={styles.headerActions}>
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className={styles.clearAllButton}
                  title="Удалить все"
                >
                  🗑️
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
          </div>

          <div className={styles.statsBar}>
            <span className={styles.statItem}>
              <span className={styles.statLabel}>Новых:</span>
              <span className={styles.statValue}>{stats.unread}</span>
            </span>
            <span className={styles.statItem}>
              <span className={styles.statLabel}>Всего:</span>
              <span className={styles.statValue}>{stats.total}</span>
            </span>
            {stats.high_priority > 0 && (
              <span className={`${styles.statItem} ${styles.highPriority}`}>
                <span className={styles.statLabel}>⚠️ Важных:</span>
                <span className={styles.statValue}>{stats.high_priority}</span>
              </span>
            )}
          </div>

          <div className={styles.notificationList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Нет уведомлений</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`${styles.notificationItem} ${
                    !notification.is_read ? styles.unread : ''
                  } ${styles[notification.priority]}`}
                >
                  <div className={styles.notificationHeader}>
                    <span className={styles.notificationTitle}>
                      <span className={styles.notificationIcon}>
                        {getNotificationIcon(notification)}
                      </span>
                      {notification.title}
                    </span>
                    <div className={styles.headerRight}>
                      <span className={styles.notificationDate}>
                        {formatDate(notification.created_at)}
                      </span>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className={styles.deleteButton}
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.notificationMessage}>
                    {notification.message?.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>

                  {notification.case_display_name && (
                    <div className={styles.caseLink}>
                      <a 
                        href={getCaseLink(notification)} 
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🔗 {notification.case_display_name}
                      </a>
                    </div>
                  )}

                  {notification.deadline && (
                    <div className={styles.deadline}>
                      <span className={styles.deadlineIcon}>⏰</span>
                      Срок: {formatDate(notification.deadline)}
                    </div>
                  )}

                  {notification.priority && notification.priority !== 'medium' && (
                    <div className={`${styles.priority} ${styles[notification.priority]}`}>
                      {getPriorityLabel(notification.priority)}
                    </div>
                  )}

                  <div className={styles.notificationActions}>
                    {!notification.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className={styles.readButton}
                      >
                        ✓ Прочитано
                      </button>
                    )}
                    {!notification.is_completed && (
                      <button 
                        onClick={() => handleMarkAsCompleted(notification.id)}
                        className={styles.completeButton}
                      >
                        ✓ Выполнено
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.dropdownFooter}>
            <button className={styles.viewAllButton}>
              Все уведомления
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;