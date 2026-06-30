// src/components/UI/NotificationBadge/NotificationBadge.jsx
import React from 'react';
import styles from './NotificationBadge.module.css';

const NotificationBadge = ({ count, hasNotification, className = '' }) => {
  if (!hasNotification || count === 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span className={`${styles.badge} ${className}`}>
      {displayCount}
    </span>
  );
};

export default NotificationBadge;