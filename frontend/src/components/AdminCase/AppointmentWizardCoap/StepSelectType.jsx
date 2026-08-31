// src/components/Coap/AppointmentWizardCoap/StepSelectType.jsx

import React from 'react';
import styles from './AppointmentWizardCoap.module.css';

const StepSelectType = ({ wizardData, updateWizardData, caseData }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateWizardData({ 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleRadioChange = (name, value) => {
    updateWizardData({ [name]: value });
  };

  return (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Параметры рассмотрения по КоАП РФ</h3>
      <p className={styles.stepDescription}>
        Настройте параметры рассмотрения дела об административном правонарушении
      </p>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Тип заседания</h4>
        <div className={styles.radioGroup}>
          <label className={`${styles.radioLabel} ${wizardData.hearingType === 'preparation' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="hearingType"
              value="preparation"
              checked={wizardData.hearingType === 'preparation'}
              onChange={() => handleRadioChange('hearingType', 'preparation')}
            />
            <div>
              <strong>Подготовка к рассмотрению</strong>
              <span className={styles.radioDescription}>ст. 29.1-29.2 КоАП РФ</span>
            </div>
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.hearingType === 'trial' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="hearingType"
              value="trial"
              checked={wizardData.hearingType === 'trial'}
              onChange={() => handleRadioChange('hearingType', 'trial')}
            />
            <div>
              <strong>Рассмотрение дела по существу</strong>
              <span className={styles.radioDescription}>ст. 29.7-29.11 КоАП РФ</span>
            </div>
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Режим заседания</h4>
        <div className={styles.radioGroup}>
          <label className={`${styles.radioLabel} ${wizardData.sessionType === 'open' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="sessionType"
              value="open"
              checked={wizardData.sessionType === 'open'}
              onChange={() => handleRadioChange('sessionType', 'open')}
            />
            Открытое (ст. 29.7 КоАП РФ)
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.sessionType === 'closed' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="sessionType"
              value="closed"
              checked={wizardData.sessionType === 'closed'}
              onChange={() => handleRadioChange('sessionType', 'closed')}
            />
            Закрытое (ст. 29.7 КоАП РФ)
          </label>
        </div>
        {wizardData.sessionType === 'closed' && (
          <div className={styles.infoBox}>
            <span className={styles.infoIcon}>ℹ️</span>
            <div className={styles.infoText}>
              <p><strong>Основания для закрытого заседания (ст. 29.7 КоАП РФ):</strong></p>
              <ul>
                <li>Необходимость обеспечения безопасности участников</li>
                <li>Государственная или иная охраняемая законом тайна</li>
                <li>Иные случаи, предусмотренные законом</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>⚖️</span>
        <div className={styles.infoText}>
          <p><strong>Особенности КоАП:</strong></p>
          <ul>
            <li>Срок рассмотрения - 15 суток (ст. 29.6 КоАП)</li>
            <li>Дело рассматривается судьей единолично</li>
            <li>Участие прокурора обязательно по делам, возбужденным прокурором</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StepSelectType;