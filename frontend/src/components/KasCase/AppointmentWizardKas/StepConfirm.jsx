// src/components/Kas/AppointmentWizardKas/StepConfirm.jsx

import React from 'react';
import styles from './AppointmentWizardKas.module.css';

const StepConfirm = ({ wizardData, caseData, onExecute, loading }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getHearingTypeLabel = () => {
    const labels = {
      'preparation': 'Подготовка дела к судебному разбирательству',
      'preliminary': 'Предварительное судебное заседание',
      'trial': 'Судебное разбирательство'
    };
    return labels[wizardData.hearingType] || 'Заседание';
  };

  const getSessionTypeLabel = () => {
    return wizardData.sessionType === 'open' ? 'Открытое' : 'Закрытое';
  };

  const getCompositionLabel = () => {
    const labels = {
      'single': 'Единолично судьей',
      'collegium': 'Коллегией судей'
    };
    return labels[wizardData.courtComposition] || 'Не указано';
  };

  const selectedParticipants = wizardData.selectedParticipants.filter(p => p.selected);
  
  const getParticipantKey = (p) => `${p.type}-${p.id}`;

  return (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Подтверждение назначки</h3>
      <p className={styles.stepDescription}>
        Проверьте все параметры перед выполнением
      </p>

      <div className={styles.confirmGrid}>
        <div className={styles.confirmSection}>
          <h4 className={styles.confirmTitle}>📅 Дата и время</h4>
          <div className={styles.confirmItem}>
            <span className={styles.confirmLabel}>Дата:</span>
            <span className={styles.confirmValue}>{formatDate(wizardData.hearingDate)}</span>
          </div>
          <div className={styles.confirmItem}>
            <span className={styles.confirmLabel}>Время:</span>
            <span className={styles.confirmValue}>{wizardData.hearingTime}</span>
          </div>
          {wizardData.hearingRoom && (
            <div className={styles.confirmItem}>
              <span className={styles.confirmLabel}>Зал:</span>
              <span className={styles.confirmValue}>{wizardData.hearingRoom}</span>
            </div>
          )}
        </div>

        <div className={styles.confirmSection}>
          <h4 className={styles.confirmTitle}>⚖️ Параметры заседания</h4>
          <div className={styles.confirmItem}>
            <span className={styles.confirmLabel}>Тип:</span>
            <span className={styles.confirmValue}>{getHearingTypeLabel()}</span>
          </div>
          <div className={styles.confirmItem}>
            <span className={styles.confirmLabel}>Режим:</span>
            <span className={styles.confirmValue}>{getSessionTypeLabel()}</span>
          </div>
          <div className={styles.confirmItem}>
            <span className={styles.confirmLabel}>Состав:</span>
            <span className={styles.confirmValue}>{getCompositionLabel()}</span>
          </div>
        </div>

        <div className={styles.confirmSection}>
          <h4 className={styles.confirmTitle}>📄 Определение</h4>
          <div className={styles.confirmItem}>
            <span className={styles.confirmLabel}>Шаблон:</span>
            <span className={styles.confirmValue}>
              {wizardData.documentTemplate?.name || 'Не выбран'}
            </span>
          </div>
          <div className={styles.confirmItem}>
            <span className={styles.confirmLabel}>Заголовок:</span>
            <span className={styles.confirmValue}>
              {wizardData.documentTitle || 'Не указан'}
            </span>
          </div>
        </div>

        <div className={styles.confirmSection}>
          <h4 className={styles.confirmTitle}>👥 Участники</h4>
          <div className={styles.confirmItem}>
            <span className={styles.confirmLabel}>Всего:</span>
            <span className={styles.confirmValue}>{selectedParticipants.length} участников</span>
          </div>
          <div className={styles.confirmParticipants}>
            {selectedParticipants.slice(0, 5).map(p => (
              <div key={getParticipantKey(p)} className={styles.confirmParticipant}>
                {p.name}
                <span className={styles.confirmChannel}>
                  ({wizardData.participantChannels[getParticipantKey(p)] || 'online'})
                </span>
              </div>
            ))}
            {selectedParticipants.length > 5 && (
              <div className={styles.confirmMore}>
                + еще {selectedParticipants.length - 5} участников
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.warningBox}>
        <span className={styles.warningIcon}>⚠️</span>
        <div className={styles.warningText}>
          <p><strong>Внимание!</strong></p>
          <ul>
            <li>После выполнения будут созданы: определение, повестки для всех выбранных участников</li>
            <li>В справочный лист будет добавлена запись о назначении заседания</li>
            <li>Дата рассмотрения дела будет обновлена</li>
            <li>Убедитесь, что соблюдены сроки по КАС РФ</li>
          </ul>
        </div>
      </div>

      <button 
        className={styles.executeButton}
        onClick={onExecute}
        disabled={loading}
      >
        {loading ? '⏳ Выполняется...' : '✅ Выполнить назначку'}
      </button>
    </div>
  );
};

export default StepConfirm;