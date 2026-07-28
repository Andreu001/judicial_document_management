// src/components/Criminal/AppointmentWizard/StepSelectDate.jsx
import React from 'react';
import styles from './AppointmentWizard.module.css';

const StepSelectDate = ({ wizardData, updateWizardData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateWizardData({ [name]: value });
  };

  // Минимальная дата - сегодня
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Выберите дату и время заседания</h3>
      <p className={styles.stepDescription}>
        Укажите дату и время, на которое будет назначено судебное заседание
      </p>

      <div className={styles.formGroup}>
        <label className={styles.label}>Дата заседания *</label>
        <input
          type="date"
          name="hearingDate"
          value={wizardData.hearingDate}
          onChange={handleChange}
          min={minDate}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Время заседания *</label>
        <input
          type="time"
          name="hearingTime"
          value={wizardData.hearingTime}
          onChange={handleChange}
          step="900" // 15 минут
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Номер зала</label>
        <input
          type="text"
          name="hearingRoom"
          value={wizardData.hearingRoom || ''}
          onChange={handleChange}
          placeholder="Например: 302"
          className={styles.input}
        />
      </div>

      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>ℹ️</span>
        <div className={styles.infoText}>
          <p><strong>Обратите внимание:</strong></p>
          <p>Дата заседания должна быть не ранее чем через 7 рабочих дней для обеспечения надлежащего уведомления сторон.</p>
          <p>Рекомендуемое время: 10:00, 11:00, 14:00, 15:00</p>
        </div>
      </div>
    </div>
  );
};

export default StepSelectDate;