import React from 'react';
import styles from './CivilNotifications.module.css';

const CivilNotifications = ({ civilData, deadlines }) => {
  if (!civilData) return null;

  const getNotifications = () => {
    const notifications = [];

    // Проверка сроков принятия к производству
    if (deadlines?.acceptance?.violation) {
      notifications.push({
        type: 'warning',
        title: 'Нарушен срок принятия к производству',
        message: `Прошло ${deadlines.acceptance.days} дней при допустимом сроке 5 дней`,
        date: civilData.application_date
      });
    }

    // Проверка сроков рассмотрения
    if (deadlines?.consideration?.violation) {
      notifications.push({
        type: 'error',
        title: 'Нарушен срок рассмотрения дела',
        message: `Прошло ${deadlines.consideration.days} дней при установленном сроке ${deadlines.consideration.statutory} дней`,
        date: civilData.decisions?.[0]?.considered_date || new Date().toISOString()
      });
    }

    // Проверка на приостановление
    if (civilData.suspension_date) {
      const suspensionDate = new Date(civilData.suspension_date);
      const today = new Date();
      const daysSuspended = Math.floor((today - suspensionDate) / (1000 * 60 * 60 * 24));
      
      if (daysSuspended > 90) {
        notifications.push({
          type: 'warning',
          title: 'Длительное приостановление дела',
          message: `Дело приостановлено на ${daysSuspended} дней`,
          date: civilData.suspension_date
        });
      }
    }

    // Проверка на отложение
    if (civilData.postponed_date || civilData.postponed_date_2 || civilData.postponed_date_3) {
      const lastPostponement = civilData.postponed_date_3 || civilData.postponed_date_2 || civilData.postponed_date;
      const postponementDate = new Date(lastPostponement);
      const today = new Date();
      const daysSincePostponement = Math.floor((today - postponementDate) / (1000 * 60 * 60 * 24));
      
      if (daysSincePostponement > 30) {
        notifications.push({
          type: 'info',
          title: 'Дело отложено',
          message: `Прошло ${daysSincePostponement} дней с последнего отложения`,
          date: lastPostponement
        });
      }
    }

    // Проверка на необходимость мотивированного решения
    if (civilData.decisions?.[0]?.considered_date && !civilData.decisions[0].motivated_decision_date) {
      const considerationDate = new Date(civilData.decisions[0].considered_date);
      const today = new Date();
      const daysSinceConsideration = Math.floor((today - considerationDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceConsideration > 5) {
        notifications.push({
          type: 'warning',
          title: 'Требуется составить мотивированное решение',
          message: `Прошло ${daysSinceConsideration} дней с момента рассмотрения дела`,
          date: civilData.decisions[0].considered_date
        });
      }
    }

    // Проверка на вступление в силу
    if (civilData.decisions?.[0]?.considered_date && !civilData.decisions[0].effective_date) {
      const considerationDate = new Date(civilData.decisions[0].considered_date);
      const today = new Date();
      const daysSinceConsideration = Math.floor((today - considerationDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceConsideration > 30) {
        notifications.push({
          type: 'info',
          title: 'Решение должно вступить в силу',
          message: `Прошло ${daysSinceConsideration} дней с момента вынесения решения`,
          date: civilData.decisions[0].considered_date
        });
      }
    }

    return notifications;
  };

  const notifications = getNotifications();

  if (notifications.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Уведомления</h2>
        <div className={styles.noNotifications}>
          <p>Нарушений сроков не обнаружено</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Уведомления</h2>
      <div className={styles.notificationsList}>
        {notifications.map((notification, index) => (
          <div 
            key={index} 
            className={`${styles.notification} ${styles[notification.type]}`}
          >
            <div className={styles.notificationHeader}>
              <h4>{notification.title}</h4>
              <span className={styles.notificationDate}>
                {formatDate(notification.date)}
              </span>
            </div>
            <p className={styles.notificationMessage}>{notification.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CivilNotifications;
