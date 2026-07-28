// src/components/Criminal/AppointmentWizard/StepSelectType.jsx
import React from 'react';
import styles from './AppointmentWizard.module.css';

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
      <h3 className={styles.stepTitle}>Параметры судебного заседания</h3>
      <p className={styles.stepDescription}>
        Настройте параметры заседания в соответствии с УПК РФ
      </p>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Тип заседания</h4>
        <div className={styles.radioGroup}>
          <label className={`${styles.radioLabel} ${wizardData.hearingType === 'preliminary' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="hearingType"
              value="preliminary"
              checked={wizardData.hearingType === 'preliminary'}
              onChange={() => handleRadioChange('hearingType', 'preliminary')}
            />
            <div>
              <strong>Предварительное слушание</strong>
              <span className={styles.radioDescription}>Глава 34 УПК РФ (ст. 229-236)</span>
            </div>
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.hearingType === 'court_session' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="hearingType"
              value="court_session"
              checked={wizardData.hearingType === 'court_session'}
              onChange={() => handleRadioChange('hearingType', 'court_session')}
            />
            <div>
              <strong>Судебное заседание</strong>
              <span className={styles.radioDescription}>ст. 231 УПК РФ</span>
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
            Открытое
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.sessionType === 'closed' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="sessionType"
              value="closed"
              checked={wizardData.sessionType === 'closed'}
              onChange={() => handleRadioChange('sessionType', 'closed')}
            />
            Закрытое
          </label>
        </div>
        {wizardData.sessionType === 'closed' && (
          <div className={styles.infoBox}>
            <span className={styles.infoIcon}>ℹ️</span>
            <div className={styles.infoText}>
              <p><strong>Основания для закрытого заседания:</strong></p>
              <ul>
                <li>Гласность может привести к разглашению государственной тайны</li>
                <li>Рассмотрение дел о преступлениях против половой неприкосновенности</li>
                <li>Обеспечение безопасности участников процесса</li>
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
            Единолично судьей
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.courtComposition === 'collegium' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="courtComposition"
              value="collegium"
              checked={wizardData.courtComposition === 'collegium'}
              onChange={() => handleRadioChange('courtComposition', 'collegium')}
            />
            Коллегией судей
          </label>
          
          <label className={`${styles.radioLabel} ${wizardData.courtComposition === 'jury' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="courtComposition"
              value="jury"
              checked={wizardData.courtComposition === 'jury'}
              onChange={() => handleRadioChange('courtComposition', 'jury')}
              disabled={wizardData.hearingType === 'preliminary'}
            />
            С участием присяжных заседателей
            {wizardData.hearingType === 'preliminary' && (
              <span className={styles.disabledHint}> (недоступно для предварительного слушания)</span>
            )}
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Участники процесса</h4>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="needsLawyer"
              checked={wizardData.needsLawyer}
              onChange={handleChange}
            />
            Обеспечить участие защитника (ст. 51 УПК РФ)
          </label>
          
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="needsProsecutor"
              checked={wizardData.needsProsecutor}
              onChange={handleChange}
            />
            Уведомить прокурора
          </label>
        </div>
      </div>
    </div>
  );
};

export default StepSelectType;