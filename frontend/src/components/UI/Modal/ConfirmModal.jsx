import React from 'react';
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button 
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            Да
          </button>
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Нет
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;