// src/components/Kas/AppointmentWizardKas/StepSelectParticipants.jsx

import React, { useState } from 'react';
import styles from './AppointmentWizardKas.module.css';

const StepSelectParticipants = ({ 
  wizardData, 
  updateWizardData, 
  allSides 
}) => {
  const [filter, setFilter] = useState('all');

  const getParticipantKey = (participant) => {
    return `${participant.type}-${participant.id}`;
  };

  const toggleParticipant = (participantKey) => {
    const updated = wizardData.selectedParticipants.map(p => {
      const key = getParticipantKey(p);
      if (key === participantKey) {
        return { ...p, selected: !p.selected };
      }
      return p;
    });
    updateWizardData({ selectedParticipants: updated });
  };

  const handleChannelChange = (participantKey, channel) => {
    const participant = wizardData.selectedParticipants.find(p => getParticipantKey(p) === participantKey);
    if (participant) {
      updateWizardData({
        participantChannels: {
          ...wizardData.participantChannels,
          [participantKey]: channel
        }
      });
    }
  };

  const selectAll = () => {
    const updated = wizardData.selectedParticipants.map(p => ({
      ...p,
      selected: true
    }));
    updateWizardData({ selectedParticipants: updated });
  };

  const deselectAll = () => {
    const updated = wizardData.selectedParticipants.map(p => ({
      ...p,
      selected: false
    }));
    updateWizardData({ selectedParticipants: updated });
  };

  const getFilteredParticipants = () => {
    switch (filter) {
      case 'side':
        return wizardData.selectedParticipants.filter(p => p.type === 'side');
      case 'lawyer':
        return wizardData.selectedParticipants.filter(p => p.type === 'lawyer');
      case 'defendant':
        return wizardData.selectedParticipants.filter(p => p.type === 'defendant');
      default:
        return wizardData.selectedParticipants;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'side': 'Сторона',
      'lawyer': 'Представитель',
      'defendant': 'Административный ответчик',
      'plaintiff': 'Административный истец',
      'third_party': 'Заинтересованное лицо'
    };
    return labels[type] || type;
  };

  const getChannelOptions = () => [
    { value: 'online', label: 'Через портал (онлайн)' },
    { value: 'paper', label: 'Бумажная повестка' },
    { value: 'email', label: 'По электронной почте' },
    { value: 'phone', label: 'Телефонограмма' },
    { value: 'mail', label: 'Почтовое отправление' }
  ];

  const selectedCount = wizardData.selectedParticipants.filter(p => p.selected).length;
  const filteredParticipants = getFilteredParticipants();

  return (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Участники и способ уведомления</h3>
      <p className={styles.stepDescription}>
        Выберите участников, которым необходимо направить повестки, и способ уведомления
      </p>

      <div className={styles.participantControls}>
        <div className={styles.filterButtons}>
          <button 
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Все ({wizardData.selectedParticipants.length})
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'side' ? styles.active : ''}`}
            onClick={() => setFilter('side')}
          >
            Стороны
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'lawyer' ? styles.active : ''}`}
            onClick={() => setFilter('lawyer')}
          >
            Представители
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'defendant' ? styles.active : ''}`}
            onClick={() => setFilter('defendant')}
          >
            Ответчики
          </button>
        </div>
        
        <div className={styles.bulkActions}>
          <button onClick={selectAll} className={styles.bulkButton}>Выбрать всех</button>
          <button onClick={deselectAll} className={styles.bulkButton}>Снять всех</button>
          <span className={styles.selectedCount}>Выбрано: {selectedCount}</span>
        </div>
      </div>

      <div className={styles.participantsList}>
        {filteredParticipants.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Нет участников для отображения</p>
          </div>
        ) : (
          filteredParticipants.map((participant) => {
            const key = getParticipantKey(participant);
            return (
              <div key={key} className={styles.participantCard}>
                <label className={styles.participantCheckbox}>
                  <input
                    type="checkbox"
                    checked={participant.selected}
                    onChange={() => toggleParticipant(key)}
                  />
                  <div className={styles.participantInfo}>
                    <div className={styles.participantName}>
                      {participant.name}
                      <span className={styles.participantType}>
                        {getTypeLabel(participant.type)}
                      </span>
                    </div>
                    {participant.role && (
                      <div className={styles.participantRole}>
                        {participant.role}
                      </div>
                    )}
                    {participant.phone && (
                      <div className={styles.participantContact}>
                        📞 {participant.phone}
                      </div>
                    )}
                    {participant.email && (
                      <div className={styles.participantContact}>
                        ✉️ {participant.email}
                      </div>
                    )}
                  </div>
                </label>
                
                {participant.selected && (
                  <div className={styles.channelSelector}>
                    <label className={styles.channelLabel}>Способ уведомления:</label>
                    <select
                      value={wizardData.participantChannels[key] || 'online'}
                      onChange={(e) => handleChannelChange(key, e.target.value)}
                      className={styles.channelSelect}
                    >
                      {getChannelOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedCount > 0 && (
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>ℹ️</span>
          <div className={styles.infoText}>
            <p><strong>Будет создано {selectedCount} уведомлений</strong></p>
            <p>После подтверждения все выбранные участники получат повестки выбранным способом.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepSelectParticipants;