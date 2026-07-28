// FloatingActionButtons.jsx - обновленная версия без эмодзи
import React, { useState, useEffect } from 'react';
import styles from './FloatingActionButtons.module.css';

const FloatingActionButtons = ({ 
  onSave, 
  onEdit, 
  onCancel, 
  onArchive, 
  onUnarchive,
  isEditing = false,
  isArchived = false,
  saving = false,
  showEdit = true,
  showArchive = true,
  showSaveCancel = true,
  customButtons = []
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100);
      setIsVisible(scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  // Функция для получения текста кнопки
  const getButtonText = (type, customLabel) => {
    if (customLabel) return customLabel;
    switch (type) {
      case 'save': return saving ? 'Сохранение...' : 'Сохранить';
      case 'edit': return 'Редактировать';
      case 'cancel': return 'Отмена';
      case 'archive': return 'Архив';
      case 'unarchive': return 'Восстановить';
      default: return '';
    }
  };

  return (
    <div className={`${styles.floatingBar} ${isScrolled ? styles.visible : ''}`}>
      <div className={styles.floatingContainer}>
        {showArchive && !isArchived && onArchive && (
          <button onClick={onArchive} className={styles.archiveButton}>
            {getButtonText('archive')}
          </button>
        )}
        
        {showArchive && isArchived && onUnarchive && (
          <button onClick={onUnarchive} className={styles.unarchiveButton}>
            {getButtonText('unarchive')}
          </button>
        )}
        
        {customButtons.map((btn, idx) => (
          <button 
            key={idx} 
            onClick={btn.onClick} 
            className={styles.customButton}
            disabled={btn.disabled}
          >
            {btn.label}
          </button>
        ))}

        {!isEditing && showEdit && onEdit && (
          <button onClick={onEdit} className={styles.editButton}>
            {getButtonText('edit')}
          </button>
        )}

        {isEditing && showSaveCancel && (
          <>
            <button onClick={onSave} disabled={saving} className={styles.saveButton}>
              {getButtonText('save')}
            </button>
            <button onClick={onCancel} className={styles.cancelButton}>
              {getButtonText('cancel')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FloatingActionButtons;