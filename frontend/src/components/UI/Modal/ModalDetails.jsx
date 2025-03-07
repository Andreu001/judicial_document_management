import React from 'react';
import styles from './ModalDetails.module.css';

const ModalDetails = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    // Закрытие окна при клике на темный фон (overlay)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <button className={styles.modalCloseButton} onClick={onClose}>
          &times;
        </button>
        <h2 className={styles.modalHeader}>{title}</h2>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};

export default ModalDetails;
