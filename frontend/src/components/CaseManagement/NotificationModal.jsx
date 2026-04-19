// components/CaseManagement/NotificationModal.jsx
import React, { useState, useEffect } from 'react';
import CaseManagementService from '../../API/CaseManagementService';
import styles from './NotificationModal.module.css';

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  caseType, 
  caseId, 
  caseNumber,
  editingNotification,
  channels,
  statuses
}) => {
  const [participants, setParticipants] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    participant_type: '',
    participant_id: '',
    channel: '',
    template: '',
    hearing_date: '',
    hearing_time: '',
    hearing_room: '',
    message_text: '',
    status: ''
  });

  useEffect(() => {
    if (isOpen && caseType && caseId) {
      loadParticipants();
      loadTemplates();
      
      if (editingNotification) {
        loadEditingData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, caseType, caseId, editingNotification]);

  const loadParticipants = async () => {
    try {
      const data = await CaseManagementService.getCaseParticipants(caseType, caseId);
      setParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await CaseManagementService.getNotificationTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadEditingData = () => {
    setFormData({
      participant_type: editingNotification.participant_info?.type || '',
      participant_id: editingNotification.participant_object_id || '',
      channel: editingNotification.channel?.id || '',
      template: editingNotification.template?.id || '',
      hearing_date: editingNotification.hearing_date || '',
      hearing_time: editingNotification.hearing_time || '',
      hearing_room: editingNotification.hearing_room || '',
      message_text: editingNotification.message_text || '',
      status: editingNotification.status?.id || ''
    });
    
    if (editingNotification.message_text) {
      setPreview({ message_text: editingNotification.message_text });
      setShowPreview(true);
    }
  };

  const resetForm = () => {
    setFormData({
      participant_type: '',
      participant_id: '',
      channel: '',
      template: '',
      hearing_date: new Date().toISOString().split('T')[0],
      hearing_time: '10:00',
      hearing_room: '',
      message_text: '',
      status: ''
    });
    setPreview(null);
    setShowPreview(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'participant_id' || name === 'template' || name === 'hearing_date' || name === 'hearing_time' || name === 'hearing_room') {
      setPreview(null);
      setShowPreview(false);
    }
  };

  const handleParticipantChange = (e) => {
    const value = e.target.value;
    if (!value) {
      setFormData(prev => ({ 
        ...prev, 
        participant_type: '', 
        participant_id: '',
        template: ''
      }));
      setPreview(null);
      setShowPreview(false);
      return;
    }
    
    const parts = value.split('_');
    const type = parts[0];
    const id = parts[1];
    
    setFormData(prev => ({ 
      ...prev, 
      participant_type: type,
      participant_id: id,
      template: ''
    }));
    setPreview(null);
    setShowPreview(false);
  };

  const handleGeneratePreview = async () => {
    if (!formData.template || !formData.participant_id || !formData.hearing_date) {
      alert('Выберите шаблон, участника и укажите дату заседания');
      return;
    }

    try {
      setLoading(true);
      
      const participantType = formData.participant_type;
      const participantId = formData.participant_id;
      
      const previewData = {
        template_id: formData.template,
        case_type: caseType,
        case_id: parseInt(caseId, 10),
        participant_type: participantType,
        participant_id: parseInt(participantId, 10),
        hearing_date: formData.hearing_date,
        hearing_time: formData.hearing_time,
        hearing_room: formData.hearing_room
      };
      
      const result = await CaseManagementService.generatePreview(previewData);
      setPreview(result);
      setShowPreview(true);
      setFormData(prev => ({ 
        ...prev, 
        message_text: result.message_text,
        participant_name: result.participant_name
      }));
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Ошибка при формировании предпросмотра');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.participant_id || !formData.hearing_date) {
      alert('Заполните обязательные поля');
      return;
    }

    try {
      setLoading(true);
      
      const participantType = formData.participant_type;
      const participantId = parseInt(formData.participant_id, 10);
      
      if (isNaN(participantId)) {
        alert('Некорректный ID участника');
        return;
      }
      
      const notificationData = {
        case_type: caseType,
        case_id: parseInt(caseId, 10),
        participant_type: participantType,
        participant_id: participantId,
        channel_id: formData.channel ? parseInt(formData.channel, 10) : null,
        template_id: formData.template ? parseInt(formData.template, 10) : null,
        hearing_date: formData.hearing_date,
        hearing_time: formData.hearing_time,
        hearing_room: formData.hearing_room,
        message_text: formData.message_text,
        status_id: formData.status ? parseInt(formData.status, 10) : null
      };
      
      if (editingNotification) {
        await CaseManagementService.updateNotification(editingNotification.id, notificationData);
      } else {
        await CaseManagementService.createNotification(notificationData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving notification:', error);
      if (error.response) {
        alert('Ошибка при сохранении уведомления: ' + JSON.stringify(error.response.data));
      } else {
        alert('Ошибка при сохранении уведомления');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTemplates = () => {
    // Исправлено: проверяем, что participant_id существует и является строкой
    if (!formData.participant_id || typeof formData.participant_id !== 'string') return templates;
    
    const participantType = formData.participant_type;
    
    const templateTypeMap = {
      'side': 'side',
      'lawyer': 'lawyer',
      'defendant': 'defendant'
    };
    
    const mappedType = templateTypeMap[participantType];
    if (!mappedType) return templates;
    
    return templates.filter(t => t.participant_type === mappedType);
  };

  const getParticipantDisplay = (participant) => {
    if (participant.type === 'defendant') {
      return `${participant.name} (Подсудимый/Обвиняемый)`;
    } else if (participant.type === 'side') {
      const roleText = participant.role === 'Истец' || participant.role === 'Ответчик' 
        ? participant.role 
        : (participant.role || 'Сторона');
      return `${participant.name} (${roleText})`;
    } else if (participant.type === 'lawyer') {
      return `${participant.name} (Представитель/Защитник)`;
    }
    return participant.name || 'Участник';
  };

  if (!isOpen) return null;

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{editingNotification ? 'Редактирование уведомления' : 'Создание повестки/уведомления'}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Участник дела *</label>
            <select
              value={formData.participant_id ? `${formData.participant_type}_${formData.participant_id}` : ''}
              onChange={handleParticipantChange}
              className={styles.select}
              required
            >
              <option value="">Выберите участника</option>
              {participants.map(p => (
                <option key={`${p.type}_${p.id}`} value={`${p.type}_${p.id}`}>
                  {getParticipantDisplay(p)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>Дата заседания *</label>
              <input
                type="date"
                name="hearing_date"
                value={formData.hearing_date}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>Время</label>
              <input
                type="time"
                name="hearing_time"
                value={formData.hearing_time}
                onChange={handleInputChange}
                className={styles.input}
                step="60"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Зал судебного заседания</label>
            <input
              type="text"
              name="hearing_room"
              value={formData.hearing_room}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="№ зала"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>Канал уведомления</label>
              <select
                name="channel"
                value={formData.channel}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Не выбран</option>
                {channels.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>Статус</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Черновик</option>
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Шаблон повестки</label>
            <select
              name="template"
              value={formData.template}
              onChange={handleInputChange}
              className={styles.select}
              disabled={!formData.participant_id}
            >
              <option value="">Выберите шаблон</option>
              {filteredTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {!formData.participant_id && (
              <div className={styles.hint}>Сначала выберите участника</div>
            )}
          </div>

          <button 
            type="button" 
            onClick={handleGeneratePreview}
            className={styles.previewButton}
            disabled={loading || !formData.template || !formData.participant_id}
          >
            {loading ? 'Формирование...' : 'Сформировать предпросмотр'}
          </button>

          {showPreview && preview && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <span>Предпросмотр уведомления</span>
                <button 
                  type="button" 
                  onClick={() => setShowPreview(false)}
                  className={styles.previewClose}
                >
                  ×
                </button>
              </div>
              <div className={styles.previewContent}>
                <div className={styles.previewText}>
                  {preview.message_text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className={styles.previewNote}>
                <small>Текст можно редактировать в поле ниже</small>
              </div>
            </div>
          )}

          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Текст уведомления</label>
            <textarea
              name="message_text"
              value={formData.message_text}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={8}
              placeholder="Текст уведомления будет сформирован автоматически при выборе шаблона"
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Сохранение...' : (editingNotification ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationModal;