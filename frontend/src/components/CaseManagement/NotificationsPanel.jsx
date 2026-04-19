// components/CaseManagement/NotificationsPanel.jsx
import React, { useState, useEffect } from 'react';
import NotificationService from '../../API/CaseManagementService';
import NotificationModal from './NotificationModal';
import ConfirmModal from '../UI/Modal/ConfirmModal';
import styles from './NotificationsPanel.module.css';

const NotificationsPanel = ({ 
  caseType, 
  caseId, 
  caseNumber,
  onRefresh
}) => {
  const [notifications, setNotifications] = useState([]);
  const [channels, setChannels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Модальные окна
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, notificationId: null });
  const [deliveryModal, setDeliveryModal] = useState({ isOpen: false, notificationId: null, deliveryDate: '' });
  const [undeliveredModal, setUndeliveredModal] = useState({ isOpen: false, notificationId: null, reason: '' });

  useEffect(() => {
    loadData();
  }, [caseType, caseId, onRefresh]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notificationsData, channelsData, statusesData] = await Promise.all([
        NotificationService.getNotifications(caseType, caseId),
        NotificationService.getNotificationChannels(),
        NotificationService.getNotificationStatuses()
      ]);
      setNotifications(notificationsData);
      setChannels(channelsData);
      setStatuses(statusesData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotification = () => {
    setEditingNotification(null);
    setShowModal(true);
  };

  const handleEditNotification = (notification) => {
    setEditingNotification(notification);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNotification(null);
  };

  const handleModalSuccess = () => {
    loadData();
    if (onRefresh) onRefresh();
  };

  // Удаление
  const openDeleteModal = (notificationId) => {
    setDeleteModal({ isOpen: true, notificationId });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, notificationId: null });
  };

  const confirmDelete = async () => {
    if (deleteModal.notificationId) {
      try {
        await NotificationService.deleteNotification(deleteModal.notificationId);
        loadData();
      } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Не удалось удалить уведомление');
      } finally {
        closeDeleteModal();
      }
    }
  };

  // Отметка как отправленное
  const handleMarkSent = async (notificationId) => {
    try {
      await NotificationService.markNotificationAsSent(notificationId);
      loadData();
    } catch (error) {
      console.error('Error marking as sent:', error);
      alert('Не удалось отметить уведомление как отправленное');
    }
  };

  // Вручено - открываем модальное окно с датой
  const openDeliveryModal = (notificationId) => {
    setDeliveryModal({
      isOpen: true,
      notificationId,
      deliveryDate: new Date().toISOString().split('T')[0]
    });
  };

  const closeDeliveryModal = () => {
    setDeliveryModal({ isOpen: false, notificationId: null, deliveryDate: '' });
  };

  const confirmDelivery = async () => {
    if (deliveryModal.notificationId && deliveryModal.deliveryDate) {
      try {
        await NotificationService.markNotificationAsDelivered(deliveryModal.notificationId, deliveryModal.deliveryDate);
        loadData();
        closeDeliveryModal();
      } catch (error) {
        console.error('Error marking as delivered:', error);
        alert('Не удалось отметить уведомление как врученное');
      }
    }
  };

  const handleDeliveryDateChange = (e) => {
    setDeliveryModal(prev => ({ ...prev, deliveryDate: e.target.value }));
  };

  // Невручено - открываем модальное окно с причиной
  const openUndeliveredModal = (notificationId) => {
    setUndeliveredModal({
      isOpen: true,
      notificationId,
      reason: ''
    });
  };

  const closeUndeliveredModal = () => {
    setUndeliveredModal({ isOpen: false, notificationId: null, reason: '' });
  };

  const confirmUndelivered = async () => {
    if (undeliveredModal.notificationId && undeliveredModal.reason.trim()) {
      try {
        await NotificationService.markNotificationAsUndelivered(undeliveredModal.notificationId, undeliveredModal.reason);
        loadData();
        closeUndeliveredModal();
      } catch (error) {
        console.error('Error marking as undelivered:', error);
        alert('Не удалось отметить уведомление как неврученное');
      }
    } else {
      alert('Пожалуйста, укажите причину невручения');
    }
  };

  const handleUndeliveredReasonChange = (e) => {
    setUndeliveredModal(prev => ({ ...prev, reason: e.target.value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (statusCode) => {
    switch (statusCode) {
      case 'draft': return styles.statusDraft;
      case 'sent': return styles.statusSent;
      case 'delivered': return styles.statusDelivered;
      case 'undelivered': return styles.statusUndelivered;
      default: return '';
    }
  };

  const getStatusName = (statusCode) => {
    const status = statuses.find(s => s.code === statusCode);
    return status?.name || statusCode;
  };

  const getChannelName = (channelName) => {
    return channelName || 'Не указан';
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.notificationSidebar}>
      <div className={styles.header} onClick={toggleExpand}>
        <h3 className={styles.title}>
          Уведомления и повестки
          <span className={styles.count}>{notifications.length}</span>
        </h3>
        <span className={styles.toggleIndicator}>{isExpanded ? '−' : '+'}</span>
      </div>

      {isExpanded && (
        <>
          <button onClick={handleAddNotification} className={styles.addButton}>
            + Создать повестку/уведомление
          </button>

          {loading ? (
            <div className={styles.loading}>Загрузка уведомлений...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Нет созданных уведомлений</p>
              <button onClick={handleAddNotification} className={styles.emptyButton}>
                Создать первое уведомление
              </button>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`${styles.notificationItem} ${getStatusClass(notification.status_code)}`}
                >
                  <div className={styles.notificationHeader}>
                    <div className={styles.notificationParticipant}>
                      <span className={styles.participantName}>
                        {notification.participant_name || 'Участник'}
                      </span>
                      {notification.participant_role && (
                        <span className={styles.participantRole}>
                          ({notification.participant_role})
                        </span>
                      )}
                    </div>
                    <div className={styles.notificationStatus}>
                      <span className={`${styles.statusBadge} ${getStatusClass(notification.status_code)}`}>
                        {getStatusName(notification.status_code)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.notificationDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Канал:</span>
                      <span className={styles.detailValue}>
                        {getChannelName(notification.channel_name)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Заседание:</span>
                      <span className={styles.detailValue}>
                        {formatDate(notification.hearing_date)} {notification.hearing_time?.slice(0,5) || ''}
                        {notification.hearing_room && `, зал ${notification.hearing_room}`}
                      </span>
                    </div>
                    {notification.sent_date && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Отправлено:</span>
                        <span className={styles.detailValue}>
                          {formatDateTime(notification.sent_date)}
                        </span>
                      </div>
                    )}
                    {notification.delivery_date && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Вручено:</span>
                        <span className={styles.detailValue}>
                          {formatDateTime(notification.delivery_date)}
                        </span>
                      </div>
                    )}
                    {notification.return_reason && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Причина невручения:</span>
                        <span className={styles.detailValueReason}>
                          {notification.return_reason}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.notificationActions}>
                    <button 
                      onClick={() => handleEditNotification(notification)}
                      className={styles.actionEdit}
                      title="Редактировать"
                    >
                      Редактировать
                    </button>
                    
                    {notification.status_code === 'draft' && (
                      <button 
                        onClick={() => handleMarkSent(notification.id)}
                        className={styles.actionSent}
                        title="Отметить как отправленное"
                      >
                        Отправить
                      </button>
                    )}
                    
                    {notification.status_code === 'sent' && (
                      <>
                        <button 
                          onClick={() => openDeliveryModal(notification.id)}
                          className={styles.actionDelivered}
                          title="Отметить как врученное"
                        >
                          Вручено
                        </button>
                        <button 
                          onClick={() => openUndeliveredModal(notification.id)}
                          className={styles.actionUndelivered}
                          title="Отметить как неврученное"
                        >
                          Не вручено
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => openDeleteModal(notification.id)}
                      className={styles.actionDelete}
                      title="Удалить"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <NotificationModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        caseType={caseType}
        caseId={caseId}
        caseNumber={caseNumber}
        editingNotification={editingNotification}
        channels={channels}
        statuses={statuses}
      />

      {/* Модальное окно подтверждения удаления */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        message="Вы уверены, что хотите удалить это уведомление?"
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />

      {/* Модальное окно для даты вручения */}
      <ConfirmModal
        isOpen={deliveryModal.isOpen}
        title="Отметка о вручении"
        message={
          <div className={styles.modalInputGroup}>
            <label className={styles.modalLabel}>Дата вручения:</label>
            <input
              type="date"
              value={deliveryModal.deliveryDate}
              onChange={handleDeliveryDateChange}
              className={styles.modalDateInput}
            />
          </div>
        }
        confirmText="Подтвердить"
        onConfirm={confirmDelivery}
        onCancel={closeDeliveryModal}
      />

      {/* Модальное окно для причины невручения */}
      <ConfirmModal
        isOpen={undeliveredModal.isOpen}
        title="Отметка о невручении"
        message={
          <div className={styles.modalInputGroup}>
            <label className={styles.modalLabel}>Причина невручения:</label>
            <textarea
              value={undeliveredModal.reason}
              onChange={handleUndeliveredReasonChange}
              className={styles.modalTextarea}
              placeholder="Укажите причину невручения..."
              rows={3}
            />
          </div>
        }
        confirmText="Подтвердить"
        onConfirm={confirmUndelivered}
        onCancel={closeUndeliveredModal}
      />
    </div>
  );
};

export default NotificationsPanel;