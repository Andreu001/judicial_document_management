// src/components/Coap/AppointmentWizardCoap/StepSelectDate.jsx

import React from 'react';
import styles from './AppointmentWizardCoap.module.css';

const StepSelectDate = ({ wizardData, updateWizardData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateWizardData({ [name]: value });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Выберите дату и время заседания</h3>
      <p className={styles.stepDescription}>
        Укажите дату и время рассмотрения дела об административном правонарушении
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
          step="900"
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
          <p><strong>Сроки по КоАП РФ:</strong></p>
          <ul>
            <li>Подготовка к рассмотрению: не позднее 15 суток (ст. 29.1 КоАП)</li>
            <li>Рассмотрение дела: в течение 15 суток (ст. 29.6 КоАП)</li>
            <li>Дата заседания должна быть не ранее чем за 3 рабочих дня до уведомления</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StepSelectDate;