// src/components/Kas/AppointmentWizardKas/StepSelectType.jsx

import React from 'react';
import styles from './AppointmentWizardKas.module.css';

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
      <h3 className={styles.stepTitle}>Параметры заседания по КАС РФ</h3>
      <p className={styles.stepDescription}>
        Настройте параметры заседания в соответствии с КАС РФ
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
              <strong>Подготовка дела к судебному разбирательству</strong>
              <span className={styles.radioDescription}>Глава 11 КАС РФ (ст. 132-140)</span>
            </div>
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.hearingType === 'preliminary' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="hearingType"
              value="preliminary"
              checked={wizardData.hearingType === 'preliminary'}
              onChange={() => handleRadioChange('hearingType', 'preliminary')}
            />
            <div>
              <strong>Предварительное судебное заседание</strong>
              <span className={styles.radioDescription}>ст. 138 КАС РФ</span>
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
              <strong>Судебное разбирательство</strong>
              <span className={styles.radioDescription}>Главы 12-14 КАС РФ (ст. 141-195)</span>
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
            Открытое (ст. 11 КАС РФ)
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.sessionType === 'closed' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="sessionType"
              value="closed"
              checked={wizardData.sessionType === 'closed'}
              onChange={() => handleRadioChange('sessionType', 'closed')}
            />
            Закрытое (ст. 11 КАС РФ)
          </label>
        </div>
        {wizardData.sessionType === 'closed' && (
          <div className={styles.infoBox}>
            <span className={styles.infoIcon}>ℹ️</span>
            <div className={styles.infoText}>
              <p><strong>Основания для закрытого заседания (ст. 11 КАС РФ):</strong></p>
              <ul>
                <li>Государственная тайна</li>
                <li>Необходимость обеспечения безопасности</li>
                <li>Иные случаи, предусмотренные законом</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Состав суда</h4>
        <div className={styles.radioGroup}>
          <label className={`${styles.radioLabel} ${wizardData.courtComposition === 'single' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="courtComposition"
              value="single"
              checked={wizardData.courtComposition === 'single'}
              onChange={() => handleRadioChange('courtComposition', 'single')}
            />
            Единолично судьей (ст. 7 КАС РФ)
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.courtComposition === 'collegium' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="courtComposition"
              value="collegium"
              checked={wizardData.courtComposition === 'collegium'}
              onChange={() => handleRadioChange('courtComposition', 'collegium')}
            />
            Коллегией судей (ст. 7 КАС РФ)
          </label>
        </div>
      </div>

      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>⚖️</span>
        <div className={styles.infoText}>
          <p><strong>Важно:</strong></p>
          <ul>
            <li>Подготовка дела обязательна по каждому административному делу (ст. 132 КАС РФ)</li>
            <li>Срок подготовки - не более 15 суток (ст. 132 КАС РФ)</li>
            <li>Общий срок рассмотрения - 60 дней (ст. 141 КАС РФ)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StepSelectType;