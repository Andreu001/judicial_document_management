// src/components/UI/ModalDialog.jsx
import React from 'react';
import styles from './ModalDialog.module.css';

const ModalDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'confirm',
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  inputPlaceholder = '',
  inputValue = '',
  onInputChange = null,
  isDestructive = false
}) => {
  const [localInputValue, setLocalInputValue] = React.useState(inputValue);

  React.useEffect(() => {
    if (isOpen) {
      setLocalInputValue(inputValue);
    }
  }, [isOpen, inputValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt' && onInputChange) {
      onConfirm(localInputValue);
    } else {
      onConfirm();
    }
    onClose();
  };

  const modalClass = `${styles.modal} ${type === 'error' ? styles.errorModal : ''} ${type === 'success' ? styles.successModal : ''} ${type === 'warning' ? styles.warningModal : ''}`;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${type === 'error' ? styles.errorModal : ''}`}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <p>{message}</p>
          {type === 'prompt' && (
            <input
              type="text"
              className={styles.input}
              value={localInputValue}
              onChange={(e) => setLocalInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              autoFocus
            />
          )}
        </div>
        
        <div className={styles.footer}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`${styles.confirmButton} ${isDestructive ? styles.destructiveButton : ''}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDialog;