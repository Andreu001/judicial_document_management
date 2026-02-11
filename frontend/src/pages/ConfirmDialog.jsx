import React from 'react';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Да
          </button>
          <button className={styles.cancelButton} onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;