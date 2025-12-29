import React, { useState } from 'react';
import styles from './Correspondence.module.css';

const InlineStatusEdit = ({ currentStatus, correspondenceType, onSave, disabled = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const handleStartEdit = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setStatus(currentStatus);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (status !== currentStatus) {
      setSaving(true);
      try {
        await onSave(status);
        setIsEditing(false);
      } catch (error) {
        console.error('Ошибка сохранения статуса:', error);
      } finally {
        setSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Опции статусов в зависимости от типа корреспонденции
  const statusOptions = correspondenceType === 'incoming' 
    ? [
        { value: 'received', label: 'Получено' },
        { value: 'registered', label: 'Зарегистрировано' },
        { value: 'processed', label: 'Обработано' },
        { value: 'archived', label: 'В архиве' }
      ]
    : [
        { value: 'registered', label: 'Зарегистрировано' },
        { value: 'sent', label: 'Отправлено' },
        { value: 'archived', label: 'В архиве' }
      ];

  if (isEditing) {
    return (
      <div className={styles.inlineEditContainer}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.inlineSelect}
          autoFocus
          disabled={saving}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className={styles.inlineEditButtons}>
          <button 
            onClick={handleSave}
            className={styles.inlineSaveButton}
            disabled={saving}
          >
            {saving ? '...' : '✓'}
          </button>
          <button 
            onClick={handleCancel}
            className={styles.inlineCancelButton}
            disabled={saving}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  const statusText = statusOptions.find(opt => opt.value === status)?.label || status;

  return (
    <div 
      className={`${styles.status} ${styles[currentStatus] || ''} ${styles.clickableStatus}`}
      onClick={handleStartEdit}
      title="Кликните для изменения статуса"
    >
      {statusText}
    </div>
  );
};

export default InlineStatusEdit;