// src/hooks/useCaseNotifications.js
import { useState, useEffect, useCallback } from 'react';
import NotificationService from '../API/NotificationService';

const useCaseNotifications = (caseType, caseId) => {
  const [notificationStatus, setNotificationStatus] = useState({ has_unread: false, total_unread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStatus = useCallback(async () => {
    if (!caseId || !caseType) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const status = await NotificationService.getCaseNotificationStatus(caseType, caseId);
      setNotificationStatus(status);
      setError(null);
    } catch (err) {
      console.error('Error loading notification status:', err);
      setError(err.message);
      setNotificationStatus({ has_unread: false, total_unread: 0 });
    } finally {
      setLoading(false);
    }
  }, [caseType, caseId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return { notificationStatus, loading, error, refreshStatus: loadStatus };
};

export default useCaseNotifications;