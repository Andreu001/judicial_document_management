// NotificationPanel.jsx - УНИВЕРСАЛЬНАЯ ВЕРСИЯ для любых типов дел и участников

import React, { useState, useEffect } from 'react';
import CaseManagementService from '../../API/CaseManagementService';
import ConfirmModal from '../UI/Modal/ConfirmModal';
import styles from './NotificationPanel.module.css';

const NotificationPanel = ({ 
  caseId,
  caseType,
  participant,
  onNotificationCreated, 
  refreshTrigger 
}) => {
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, notificationId: null });
  
  const [formData, setFormData] = useState({
    notification_type: '',
    delivery_method: 'post',
    template_id: '',
    recipient_address: '',
    recipient_phone: '',
    recipient_email: '',
    hearing_date: '',
    hearing_time: '',
    hearing_room: '',
    consent_sms: false,
    consent_email: false,
    notes: ''
  });
  
  const [previewText, setPreviewText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);

  // ✅ ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ВЫЗВАНЫ ДО ЛЮБЫХ УСЛОВНЫХ RETURN
  useEffect(() => {
    // Проверяем наличие необходимых данных внутри эффекта
    if (caseId && participant) {
      loadNotificationTypes();
      loadTemplates();
      loadNotifications();
    }
  }, [caseId, caseType, participant, refreshTrigger]);

  const loadNotificationTypes = async () => {
    const types = await CaseManagementService.getNotificationTypes();
    setNotificationTypes(types);
  };

  const loadTemplates = async () => {
    const params = {};
    if (caseType) {
      // Маппинг типа дела в категорию для шаблонов
      const categoryMap = {
        'criminal': 'criminal',
        'civil': 'civil',
        'admin': 'coap',
        'kas': 'administrative',
        'other': 'criminal'
      };
      params.case_category = categoryMap[caseType] || 'criminal';
    }
    const allTemplates = await CaseManagementService.getNotificationTemplates(params);
    setTemplates(allTemplates);
  };

  const loadNotifications = async () => {
    if (!caseId || !participant) return;
    try {
      const allNotifications = await CaseManagementService.getNotifications(caseId);
      // Фильтруем по participant_id и participant_type
      const filtered = allNotifications.filter(n => 
        String(n.participant_id) === String(participant.id) && 
        n.participant_type === participant.type
      );
      setNotifications(filtered);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTemplateChange = async (templateId) => {
    setFormData(prev => ({ ...prev, template_id: templateId }));
    
    if (templateId && participant && caseId) {
      setPreviewLoading(true);
      try {
        let hearingDateTime = null;
        if (formData.hearing_date) {
          hearingDateTime = formData.hearing_time 
            ? `${formData.hearing_date}T${formData.hearing_time}`
            : `${formData.hearing_date}T00:00`;
        }
        
        const preview = await CaseManagementService.previewNotificationTemplate(
          templateId,
          caseId,
          participant.type,
          participant.id,
          hearingDateTime,
          formData.hearing_room
        );
        
        setPreviewText(preview.rendered_text);
        setEditedText(preview.rendered_text);
        setIsEditingText(false);
      } catch (error) {
        console.error('Error previewing template:', error);
        setPreviewText('Ошибка загрузки предпросмотра');
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const updatePreview = async () => {
    if (formData.template_id && participant && caseId) {
      setPreviewLoading(true);
      try {
        let hearingDateTime = null;
        if (formData.hearing_date) {
          hearingDateTime = formData.hearing_time 
            ? `${formData.hearing_date}T${formData.hearing_time}`
            : `${formData.hearing_date}T00:00`;
        }
        
        const preview = await CaseManagementService.previewNotificationTemplate(
          formData.template_id,
          caseId,
          participant.type,
          participant.id,
          hearingDateTime,
          formData.hearing_room
        );
        
        if (!isEditingText) {
          setPreviewText(preview.rendered_text);
          setEditedText(preview.rendered_text);
        }
      } catch (error) {
        console.error('Error updating preview:', error);
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  // ✅ ВТОРОЙ useEffect ТОЖЕ ПЕРЕМЕЩЁН В БЕЗОПАСНОЕ МЕСТО (ДО УСЛОВНОГО RETURN)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (formData.template_id && (formData.hearing_date || formData.hearing_time || formData.hearing_room)) {
        updatePreview();
      }
    }, 500);
    
    return () => clearTimeout(delayDebounce);
  }, [formData.hearing_date, formData.hearing_time, formData.hearing_room]);

  // ✅ ПРОВЕРКА В КОНЦЕ, ПОСЛЕ ВСЕХ ХУКОВ
  if (!caseId || !participant) {
    console.warn('NotificationPanel: missing caseId or participant', { caseId, participant });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.notification_type) {
      alert('Выберите тип уведомления');
      return;
    }
    
    if (!formData.template_id && !editedText) {
      alert('Выберите шаблон повестки или введите текст');
      return;
    }

    setLoading(true);
    try {
      let hearingDateTime = null;
      if (formData.hearing_date) {
        hearingDateTime = formData.hearing_time 
          ? `${formData.hearing_date}T${formData.hearing_time}`
          : `${formData.hearing_date}T00:00`;
      }
      
      const notificationData = {
        notification_type: parseInt(formData.notification_type, 10),
        delivery_method: formData.delivery_method,
        template_id: formData.template_id ? parseInt(formData.template_id, 10) : null,
        notification_text_edited: isEditingText ? editedText : null,
        recipient_address: formData.recipient_address || '',
        recipient_phone: formData.recipient_phone || '',
        recipient_email: formData.recipient_email || '',
        hearing_date: hearingDateTime,
        hearing_room: formData.hearing_room || '',
        consent_sms: formData.consent_sms,
        consent_email: formData.consent_email,
        notes: formData.notes || '',
        participant_type: participant.type,
        participant_id: participant.id
      };
      
      await CaseManagementService.createNotification(caseId, notificationData);
      
      if (onNotificationCreated && typeof onNotificationCreated === 'function') {
        onNotificationCreated();
      }
      
      resetForm();
      setShowModal(false);
      await loadNotifications();
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

  const resetForm = () => {
    setFormData({
      notification_type: '',
      delivery_method: 'post',
      template_id: '',
      recipient_address: '',
      recipient_phone: '',
      recipient_email: '',
      hearing_date: '',
      hearing_time: '',
      hearing_room: '',
      consent_sms: false,
      consent_email: false,
      notes: ''
    });
    setPreviewText('');
    setEditedText('');
    setIsEditingText(false);
  };

  const openDeleteModal = (notificationId) => {
    setDeleteModal({ isOpen: true, notificationId });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, notificationId: null });
  };

  const confirmDelete = async () => {
    if (deleteModal.notificationId) {
      try {
        await CaseManagementService.deleteNotification(caseId, deleteModal.notificationId);
        await loadNotifications();
        if (onNotificationCreated && typeof onNotificationCreated === 'function') {
          onNotificationCreated();
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Ошибка удаления уведомления');
      } finally {
        closeDeleteModal();
      }
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
      'fax': 'Факс',
      'in_person': 'Вручено лично',
      'via_representative': 'Через представителя',
      'electronic_summon': 'Электронная повестка',
      'vks': 'ВКС',
      'detention_facility': 'Требование в СИЗО'
    };
    return methods[method] || method;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      'pending': 'Ожидает',
      'sent': 'Отправлено',
      'delivered': 'Вручено',
      'failed': 'Ошибка'
    };
    return statuses[status] || status;
  };

  const getTemplatesByCategory = () => {
    const grouped = {};
    templates.forEach(template => {
      const category = template.case_category_display || template.case_category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(template);
    });
    return grouped;
  };

  return (
    <div className={styles.notificationPanel}>
      <div className={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <h4 className={styles.title}>
          Уведомления и повестки
          <span className={styles.count}>{notifications.length}</span>
        </h4>
        <span className={styles.toggleIndicator}>{isCollapsed ? 'Развернуть' : 'Свернуть'}</span>
      </div>

      {!isCollapsed && (
        <>
          <div style={{ padding: '12px 18px 0 18px' }}>
            <button 
              className={styles.addNotificationButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              Направить извещение
            </button>
          </div>

          <div className={styles.notificationsList}>
            {notifications.length === 0 && (
              <div className={styles.emptyState}>Нет отправленных уведомлений</div>
            )}
            {notifications.map(notification => (
              <div key={notification.id} className={styles.notificationItem}>
                <div className={styles.notificationHeader}>
                  <span className={styles.notificationType}>
                    {notification.notification_template_form_number && 
                      `Форма №${notification.notification_template_form_number} - `}
                    {notification.notification_type_name || 'Уведомление'}
                  </span>
                  <span className={styles.notificationDate}>
                    {formatDate(notification.sent_date)}
                  </span>
                  <button 
                    onClick={() => openDeleteModal(notification.id)}
                    className={styles.deleteNotificationButton}
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.notificationDetails}>
                  <span className={styles.deliveryMethod}>
                    {getDeliveryMethodLabel(notification.delivery_method)}
                  </span>
                  <span className={`${styles.statusBadge} ${styles[notification.status]}`}>
                    {getStatusLabel(notification.status)}
                  </span>
                </div>
                {notification.hearing_date && (
                  <div className={styles.hearingInfo}>
                    Заседание: {formatDate(notification.hearing_date)}
                    {notification.hearing_room && `, зал ${notification.hearing_room}`}
                  </div>
                )}
                {notification.recipient_address && (
                  <div className={styles.notificationAddress}>{notification.recipient_address}</div>
                )}
                {notification.recipient_phone && (
                  <div className={styles.notificationPhone}>{notification.recipient_phone}</div>
                )}
                {notification.recipient_email && (
                  <div className={styles.notificationEmail}>{notification.recipient_email}</div>
                )}
                {notification.notes && (
                  <div className={styles.notificationNotes}>{notification.notes}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        message="Вы уверены, что хотите удалить это уведомление?"
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Направление извещения для {participant.name || participant.type}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formSection}>
                <h4>Основная информация</h4>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label>Тип уведомления</label>
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
                      <option value="fax">Факс</option>
                      <option value="in_person">Вручено лично</option>
                      <option value="via_representative">Через представителя</option>
                      <option value="electronic_summon">Электронная повестка</option>
                      <option value="vks">ВКС</option>
                      <option value="detention_facility">Требование в СИЗО</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Шаблон повестки</h4>
                <div className={styles.field}>
                  <label>Выберите шаблон</label>
                  <select
                    name="template_id"
                    value={formData.template_id}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">-- Выберите шаблон --</option>
                    {Object.entries(getTemplatesByCategory()).map(([category, categoryTemplates]) => (
                      <optgroup key={category} label={category}>
                        {categoryTemplates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.participant_type_display} {template.form_number && `(ф.№${template.form_number})`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Информация о заседании</h4>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label>Дата заседания</label>
                    <input
                      type="date"
                      name="hearing_date"
                      value={formData.hearing_date}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Время</label>
                    <input
                      type="time"
                      name="hearing_time"
                      value={formData.hearing_time}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Зал суда</label>
                    <input
                      type="text"
                      name="hearing_room"
                      value={formData.hearing_room}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="№ зала"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Контактные данные получателя</h4>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label>Почтовый адрес</label>
                    <input
                      type="text"
                      name="recipient_address"
                      value={formData.recipient_address}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Индекс, город, улица, дом, кв."
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
                      placeholder="+7 (XXX) XXX-XX-XX"
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
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="consent_sms"
                      checked={formData.consent_sms}
                      onChange={handleInputChange}
                    />
                    Есть согласие на СМС-уведомление
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="consent_email"
                      checked={formData.consent_email}
                      onChange={handleInputChange}
                    />
                    Есть согласие на Email-уведомление
                  </label>
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Текст повестки</h4>
                {previewLoading && <div className={styles.previewLoading}>Загрузка предпросмотра...</div>}
                
                {!isEditingText ? (
                  <div className={styles.previewText}>
                    <div className={styles.previewHeader}>
                      <span>Предпросмотр</span>
                      <button 
                        type="button"
                        onClick={() => setIsEditingText(true)}
                        className={styles.editTextButton}
                      >
                        Редактировать
                      </button>
                    </div>
                    <div className={styles.previewContent}>{previewText || 'Выберите шаблон для предпросмотра'}</div>
                  </div>
                ) : (
                  <div className={styles.editTextArea}>
                    <div className={styles.previewHeader}>
                      <span>Редактирование текста</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingText(false);
                          setEditedText(previewText);
                        }}
                        className={styles.cancelEditButton}
                      >
                        Отменить
                      </button>
                    </div>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className={styles.textarea}
                      rows={15}
                    />
                  </div>
                )}
              </div>

              <div className={styles.formSection}>
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
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Отправка...' : 'Отправить уведомление'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;