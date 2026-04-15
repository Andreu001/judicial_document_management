import React, { useState, useEffect } from 'react';
import CaseManagementService from '../../API/CaseManagementService';
import styles from './NotificationPanel.module.css';

const NotificationPanel = ({ criminalCaseId, participant, onNotificationCreated }) => {
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    notification_type: '',
    delivery_method: 'post',
    recipient_address: '',
    recipient_phone: '',
    recipient_email: '',
    notes: ''
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotificationTypes();
    loadNotifications();
  }, [criminalCaseId, participant]);

  const loadNotificationTypes = async () => {
    const types = await CaseManagementService.getNotificationTypes();
    setNotificationTypes(types);
  };

  const loadNotifications = async () => {
    if (!criminalCaseId || !participant) return;
    try {
      const allNotifications = await CaseManagementService.getNotifications(criminalCaseId);
      // Фильтруем уведомления по текущему участнику
      const filtered = allNotifications.filter(n => 
        n.participant_id === participant.id && 
        n.participant_type === participant.type
      );
      setNotifications(filtered);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.notification_type) {
      alert('Выберите тип уведомления');
      return;
    }

    setLoading(true);
    try {
      // Отправляем данные в формате, который ожидает бэкенд
      const notificationData = {
        notification_type: formData.notification_type,
        delivery_method: formData.delivery_method,
        recipient_address: formData.recipient_address || '',
        recipient_phone: formData.recipient_phone || '',
        recipient_email: formData.recipient_email || '',
        notes: formData.notes || '',
        participant_type: participant.type,
        participant_id: participant.id
      };
      
      await CaseManagementService.createNotification(criminalCaseId, notificationData);
      
      // Уведомляем родительский компонент о необходимости обновить ход дела
      if (onNotificationCreated) {
        onNotificationCreated();
      }
      
      // Сбрасываем форму
      setFormData({
        notification_type: '',
        delivery_method: 'post',
        recipient_address: '',
        recipient_phone: '',
        recipient_email: '',
        notes: ''
      });
      setShowForm(false);
      await loadNotifications();
      alert('Уведомление успешно создано');
    } catch (error) {
      console.error('Error creating notification:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          JSON.stringify(error.response?.data) ||
                          'Ошибка создания уведомления';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliveryMethodLabel = (method) => {
    const methods = {
      'post': 'Почта России',
      'email': 'Эл. почта',
      'sms': 'СМС',
      'phone_call': 'Телефонограмма',
      'telegram': 'Телеграмма',
      'in_person': 'Вручено лично',
      'via_representative': 'Через представителя'
    };
    return methods[method] || method;
  };

  return (
    <div className={styles.notificationPanel}>
      <div className={styles.header}>
        <h4 className={styles.title}>📬 Уведомления и повестки</h4>
        <button 
          className={styles.addNotificationButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕' : '+ Направить извещение'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label>Тип уведомления *</label>
              <select
                name="notification_type"
                value={formData.notification_type}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="">Выберите тип</option>
                {notificationTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Способ доставки</label>
              <select
                name="delivery_method"
                value={formData.delivery_method}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="post">Почта России</option>
                <option value="email">Электронная почта</option>
                <option value="sms">СМС-сообщение</option>
                <option value="phone_call">Телефонограмма</option>
                <option value="telegram">Телеграмма</option>
                <option value="in_person">Вручено лично</option>
                <option value="via_representative">Через представителя</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label>Адрес (для почты)</label>
              <input
                type="text"
                name="recipient_address"
                value={formData.recipient_address}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Почтовый адрес"
              />
            </div>
            <div className={styles.field}>
              <label>Телефон</label>
              <input
                type="tel"
                name="recipient_phone"
                value={formData.recipient_phone}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Номер телефона"
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                name="recipient_email"
                value={formData.recipient_email}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Примечания</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={2}
              placeholder="Дополнительная информация"
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить уведомление'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className={styles.notificationsList}>
        {notifications.length === 0 && !showForm && (
          <div className={styles.emptyState}>Нет отправленных уведомлений</div>
        )}
        {notifications.map(notification => (
          <div key={notification.id} className={styles.notificationItem}>
            <div className={styles.notificationHeader}>
              <span className={styles.notificationType}>
                {notification.notification_type_name || 'Уведомление'}
              </span>
              <span className={styles.notificationDate}>
                {formatDate(notification.sent_date)}
              </span>
            </div>
            <div className={styles.notificationDetails}>
              <span className={styles.deliveryMethod}>
                {getDeliveryMethodLabel(notification.delivery_method)}
              </span>
              {notification.status === 'delivered' && (
                <span className={styles.deliveredBadge}>
                  Вручено: {formatDate(notification.delivery_date)}
                </span>
              )}
            </div>
            {notification.recipient_address && (
              <div className={styles.notificationAddress}>Адрес: {notification.recipient_address}</div>
            )}
            {notification.recipient_phone && (
              <div className={styles.notificationPhone}>Тел.: {notification.recipient_phone}</div>
            )}
            {notification.recipient_email && (
              <div className={styles.notificationEmail}>Email: {notification.recipient_email}</div>
            )}
            {notification.notes && (
              <div className={styles.notificationNotes}>{notification.notes}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPanel;