// CriminalNotifications.jsx
import React, { useState, useEffect } from 'react';
import NotificationService from '../../API/NotificationService';
import styles from './CriminalNotifications.module.css';

const CriminalNotifications = ({ cardId, criminalData }) => {
  const [notifications, setNotifications] = useState([]);
  const [caseStats, setCaseStats] = useState({
    daysInProgress: 0,
    hearingScheduledDays: 0,
    caseAppointmentDeadline: null,
    caseAppointmentViolation: false,
    trialStartDays: 0,
    petitions: { total: 0, considered: 0, granted: 0, denied: 0 }
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (criminalData) {
      loadCaseNotifications();
      calculateCaseStats();
    }
  }, [criminalData, cardId]);

  const loadCaseNotifications = async () => {
    try {
      const allNotifications = await NotificationService.getNotifications();
      const caseNotifications = allNotifications.filter(
        notification => notification.criminal_proceeding === criminalData.id
      );
      setNotifications(caseNotifications);
    } catch (error) {
      console.error('Error loading case notifications:', error);
    }
  };

  const calculateCaseStats = () => {
    if (!criminalData) return;

    const incomingDate = criminalData.incoming_date ? new Date(criminalData.incoming_date) : null;
    const judgeAcceptanceDate = criminalData.judge_acceptance_date ? new Date(criminalData.judge_acceptance_date) : null;
    const firstHearingDate = criminalData.first_hearing_date ? new Date(criminalData.first_hearing_date) : null;
    const today = new Date();

    const daysInProgress = incomingDate ? 
      Math.floor((today - incomingDate) / (1000 * 60 * 60 * 24)) : 0;

    let caseAppointmentDeadline = 30;
    if (criminalData.case_category === '1') {
      caseAppointmentDeadline = 14;
    }

    const hearingScheduledDays = judgeAcceptanceDate && incomingDate ? 
      Math.floor((judgeAcceptanceDate - incomingDate) / (1000 * 60 * 60 * 24)) : 0;
    
    const caseAppointmentViolation = hearingScheduledDays > caseAppointmentDeadline;

    const trialStartDays = firstHearingDate && judgeAcceptanceDate ? 
      Math.floor((firstHearingDate - judgeAcceptanceDate) / (1000 * 60 * 60 * 24)) : 0;
    
    setCaseStats(prevStats => ({
      ...prevStats,
      daysInProgress,
      hearingScheduledDays,
      caseAppointmentDeadline,
      caseAppointmentViolation,
      trialStartDays,
    }));
  };

  const handleMarkAsRead = async (notificationId) => {
    await NotificationService.markAsRead(notificationId);
    loadCaseNotifications();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={styles.notificationsPanel}>
      <div className={styles.panelHeader} onClick={toggleCollapse}>
        <h3 className={styles.panelTitle}>📊 Ход дела</h3>
        <button className={styles.toggleButton}>
          {isCollapsed ? '▶' : '▼'}
        </button>
      </div>

      <div className={`${styles.panelContent} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* Статистика */}
        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Общий срок:</span>
            <span className={styles.statValue}>{caseStats.daysInProgress} дней</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Срок назначения:</span>
            <span className={`${styles.statValue} ${
              caseStats.caseAppointmentViolation ? styles.violation : ''
            }`}>
              {caseStats.hearingScheduledDays > 0 
                ? `${caseStats.hearingScheduledDays} из ${caseStats.caseAppointmentDeadline}` 
                : 'не назначено'}
              {caseStats.caseAppointmentViolation && ' ⚠'}
            </span>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statLabel}>Ходатайства:</span>
            <span className={styles.statValue}>
              {caseStats.petitions.total}/{caseStats.petitions.considered}
            </span>
          </div>
        </div>

        {/* Уведомления по делу */}
        <div className={styles.caseNotifications}>
          <h4>Уведомления:</h4>
          {notifications.length === 0 ? (
            <div className={styles.noNotifications}>Нет уведомлений</div>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} className={styles.caseNotification}>
                <div className={styles.notificationHeader}>
                  <span className={styles.notificationTitle}>
                    {notification.title}
                  </span>
                  {!notification.is_read && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className={styles.markReadButton}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className={styles.notificationMessage}>
                  {notification.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CriminalNotifications;