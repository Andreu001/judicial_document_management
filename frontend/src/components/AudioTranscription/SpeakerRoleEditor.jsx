// audio_transcription/SpeakerRoleEditor.jsx
import React, { useState, useEffect } from 'react';
import styles from './SpeakerRoleEditor.module.css';
import ModalDialog from '../UI/Modal/ModalDialog';
import ConfirmModal from '../UI/Modal/ConfirmModal';

const SpeakerRoleEditor = ({ 
  speakersSummary, 
  transcriptionId, 
  onSave, 
  onClose,
  caseParticipants = []
}) => {
  const [speakers, setSpeakers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Модальные окна
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'confirm', // 'confirm' | 'prompt' | 'alert'
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    onConfirm: null,
    onCancel: null,
    inputValue: '',
    inputPlaceholder: '',
    isDestructive: false
  });

  const ROLE_OPTIONS = [
    { value: 'judge', label: 'Судья' },
    { value: 'prosecutor', label: 'Прокурор' },
    { value: 'defense', label: 'Защитник' },
    { value: 'defendant', label: 'Подсудимый' },
    { value: 'victim', label: 'Потерпевший' },
    { value: 'witness', label: 'Свидетель' },
    { value: 'expert', label: 'Эксперт' },
    { value: 'interpreter', label: 'Переводчик' },
    { value: 'secretary', label: 'Секретарь' },
    { value: 'other', label: 'Другое' },
  ];

  const ROLE_COLORS = {
    judge: '#2c5282',
    prosecutor: '#c53030',
    defense: '#2f855a',
    defendant: '#744210',
    victim: '#6b46c1',
    witness: '#2b6cb0',
    expert: '#319795',
    interpreter: '#6b7280',
    secretary: '#718096',
    other: '#a0aec0',
  };

  useEffect(() => {
    if (speakersSummary) {
      const speakerList = Object.entries(speakersSummary).map(([role, count]) => ({
        id: role,
        role: role,
        count: count,
        displayName: role,
        isAutoDetected: role.startsWith('speaker_'),
        customName: '',
        customRole: '',
        selectedRole: role.startsWith('speaker_') ? null : role,
        color: ROLE_COLORS[role] || '#a0aec0'
      }));
      setSpeakers(speakerList);
    }
  }, [speakersSummary]);

  // ========== МОДАЛЬНЫЕ ОКНА ==========
  const showModal = (options) => {
    setModalState({
      isOpen: true,
      type: options.type || 'confirm',
      title: options.title || 'Подтверждение',
      message: options.message || '',
      confirmText: options.confirmText || 'Подтвердить',
      cancelText: options.cancelText || 'Отмена',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
      inputValue: options.inputValue || '',
      inputPlaceholder: options.inputPlaceholder || '',
      isDestructive: options.isDestructive || false
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleModalConfirm = () => {
    if (modalState.type === 'prompt') {
      // Для prompt передаём введённое значение
      const input = document.getElementById('modal-input')?.value || '';
      if (modalState.onConfirm) {
        modalState.onConfirm(input);
      }
    } else {
      if (modalState.onConfirm) {
        modalState.onConfirm();
      }
    }
    closeModal();
  };

  const handleModalCancel = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    closeModal();
  };

  // ========== ЛОГИКА РЕДАКТОРА ==========

  const handleRoleChange = (speakerId, newRole) => {
    setSpeakers(prev => prev.map(s => {
      if (s.id === speakerId) {
        // Если выбрали "Другое", сбрасываем кастомную роль
        const updated = {
          ...s,
          selectedRole: newRole,
          color: ROLE_COLORS[newRole] || '#a0aec0'
        };
        if (newRole !== 'other') {
          updated.customRole = '';
        }
        return updated;
      }
      return s;
    }));
  };

  const handleCustomRoleChange = (speakerId, value) => {
    setSpeakers(prev => prev.map(s => {
      if (s.id === speakerId) {
        return { ...s, customRole: value };
      }
      return s;
    }));
  };

  const handleNameChange = (speakerId, newName) => {
    setSpeakers(prev => prev.map(s => {
      if (s.id === speakerId) {
        return { ...s, customName: newName };
      }
      return s;
    }));
  };

  // Сброс данных спикера
  const resetSpeaker = (speakerId) => {
    showModal({
      type: 'confirm',
      title: 'Сброс данных',
      message: 'Вы уверены, что хотите сбросить все изменения для этого спикера? Роль и имя будут очищены.',
      confirmText: 'Сбросить',
      cancelText: 'Отмена',
      isDestructive: true,
      onConfirm: () => {
        setSpeakers(prev => prev.map(s => {
          if (s.id === speakerId) {
            return {
              ...s,
              selectedRole: null,
              customName: '',
              customRole: '',
              color: '#a0aec0'
            };
          }
          return s;
        }));
      }
    });
  };

  // Удалить спикера (полностью убрать из списка)
  const removeSpeaker = (speakerId) => {
    const speaker = speakers.find(s => s.id === speakerId);
    if (!speaker) return;

    showModal({
      type: 'confirm',
      title: 'Удаление спикера',
      message: `Вы уверены, что хотите удалить спикера "${getDisplayName(speaker)}"? Все его реплики будут удалены.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      isDestructive: true,
      onConfirm: () => {
        setSpeakers(prev => prev.filter(s => s.id !== speakerId));
      }
    });
  };

  // Объединить спикеров
  const handleMergeSpeakers = (sourceId) => {
    const source = speakers.find(s => s.id === sourceId);
    if (!source) return;

    // Показываем список других спикеров для выбора
    const otherSpeakers = speakers.filter(s => s.id !== sourceId);
    
    if (otherSpeakers.length === 0) {
      showModal({
        type: 'alert',
        title: 'Нет спикеров',
        message: 'Нет других спикеров для объединения.',
        confirmText: 'ОК',
        onConfirm: () => closeModal()
      });
      return;
    }

    // Формируем список для выбора через модальное окно с prompt
    const speakerOptions = otherSpeakers.map((s, index) => 
      `${index + 1}. ${getDisplayName(s)} (${s.count} реплик)`
    ).join('\n');

    showModal({
      type: 'prompt',
      title: 'Объединение спикеров',
      message: `Выберите спикера для объединения с "${getDisplayName(source)}":\n\n${speakerOptions}\n\nВведите номер или ID спикера:`,
      inputPlaceholder: 'Введите номер или ID (например: 1 или speaker_2)',
      confirmText: 'Объединить',
      cancelText: 'Отмена',
      isDestructive: false,
      onConfirm: (input) => {
        if (!input) return;
        
        let targetId = null;
        
        // Проверяем, введён ли номер
        const num = parseInt(input);
        if (!isNaN(num) && num >= 1 && num <= otherSpeakers.length) {
          targetId = otherSpeakers[num - 1].id;
        } else {
          // Ищем по ID
          const found = otherSpeakers.find(s => s.id === input);
          if (found) {
            targetId = found.id;
          } else {
            showModal({
              type: 'alert',
              title: 'Ошибка',
              message: `Спикер "${input}" не найден. Попробуйте ещё раз.`,
              confirmText: 'ОК',
              onConfirm: () => closeModal()
            });
            return;
          }
        }

        if (targetId && targetId !== sourceId) {
          performMerge(sourceId, targetId);
        }
      }
    });
  };

  const performMerge = (sourceId, targetId) => {
    setSpeakers(prev => {
      const source = prev.find(s => s.id === sourceId);
      const target = prev.find(s => s.id === targetId);
      
      if (!source || !target) return prev;
      
      const mergedCount = source.count + target.count;
      
      return prev
        .filter(s => s.id !== sourceId)
        .map(s => {
          if (s.id === targetId) {
            return {
              ...s,
              count: mergedCount,
              // Сохраняем имя и роль целевого спикера
            };
          }
          return s;
        });
    });
  };

  // Разделить спикера
  const handleSplitSpeaker = (speakerId) => {
    const speaker = speakers.find(s => s.id === speakerId);
    if (!speaker) return;
    
    if (speaker.count < 2) {
      showModal({
        type: 'alert',
        title: 'Нельзя разделить',
        message: 'У этого спикера слишком мало реплик для разделения (нужно минимум 2).',
        confirmText: 'ОК',
        onConfirm: () => closeModal()
      });
      return;
    }

    showModal({
      type: 'prompt',
      title: 'Разделение спикера',
      message: `Выберите роль для нового спикера (будет создан из части реплик "${getDisplayName(speaker)}"):\n\nДоступные роли: судья, прокурор, защитник, подсудимый, потерпевший, свидетель, эксперт, переводчик, секретарь, другое`,
      inputPlaceholder: 'Введите роль (например: свидетель)',
      confirmText: 'Разделить',
      cancelText: 'Отмена',
      isDestructive: false,
      onConfirm: (roleInput) => {
        if (!roleInput) return;
        
        // Сопоставляем ввод с ролями
        let newRole = 'other';
        const roleMap = {
          'судья': 'judge',
          'прокурор': 'prosecutor',
          'защитник': 'defense',
          'подсудимый': 'defendant',
          'потерпевший': 'victim',
          'свидетель': 'witness',
          'эксперт': 'expert',
          'переводчик': 'interpreter',
          'секретарь': 'secretary',
          'другое': 'other'
        };
        
        const lowerInput = roleInput.toLowerCase().trim();
        if (roleMap[lowerInput]) {
          newRole = roleMap[lowerInput];
        } else {
          // Если не найдено, используем как кастомную роль
          newRole = 'other';
        }

        // Запрашиваем имя нового спикера
        showModal({
          type: 'prompt',
          title: 'Имя нового спикера',
          message: `Введите имя (ФИО) для нового спикера с ролью "${lowerInput || 'другое'}":`,
          inputPlaceholder: 'Введите имя',
          confirmText: 'Продолжить',
          cancelText: 'Отмена',
          onConfirm: (nameInput) => {
            performSplit(speakerId, newRole, nameInput || 'Новый спикер', lowerInput || 'другое');
          }
        });
      }
    });
  };

  const performSplit = (speakerId, newRole, newName, customRoleLabel) => {
    const speaker = speakers.find(s => s.id === speakerId);
    if (!speaker || speaker.count < 2) return;

    const halfCount = Math.floor(speaker.count / 2);
    const remainingCount = speaker.count - halfCount;

    setSpeakers(prev => {
      const updated = prev.map(s => {
        if (s.id === speakerId) {
          return {
            ...s,
            count: remainingCount,
          };
        }
        return s;
      });

      const newSpeaker = {
        id: `speaker_new_${Date.now()}`,
        role: newRole,
        count: halfCount,
        displayName: newName || 'Новый спикер',
        isAutoDetected: false,
        customName: newName || '',
        selectedRole: newRole,
        customRole: newRole === 'other' ? customRoleLabel : '',
        color: ROLE_COLORS[newRole] || '#a0aec0'
      };

      return [...updated, newSpeaker];
    });
  };

  const getDisplayName = (speaker) => {
    if (speaker.customName) return speaker.customName;
    if (speaker.selectedRole) {
      if (speaker.selectedRole === 'other' && speaker.customRole) {
        return speaker.customRole;
      }
      const option = ROLE_OPTIONS.find(o => o.value === speaker.selectedRole);
      return option ? option.label : speaker.selectedRole;
    }
    return speaker.id;
  };

  const getRoleLabel = (roleValue) => {
    if (roleValue === 'other') {
      // Для "Другое" возвращаем кастомное значение
      return 'Другое';
    }
    const option = ROLE_OPTIONS.find(o => o.value === roleValue);
    return option ? option.label : roleValue;
  };

  const getFinalRole = (speaker) => {
    if (speaker.selectedRole === 'other' && speaker.customRole) {
      return speaker.customRole;
    }
    return speaker.selectedRole || 'Не указана';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      const mapping = speakers.reduce((acc, s) => {
        const role = s.selectedRole || s.id;
        acc[s.id] = {
          original: s.id,
          role: role,
          customName: s.customName || '',
          customRole: s.customRole || '',
          count: s.count
        };
        return acc;
      }, {});

      await onSave(transcriptionId, mapping, speakers);
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const participantOptions = caseParticipants.map(p => ({
    id: p.id,
    name: p.full_name || p.name || 'Участник',
    role: p.role || 'other',
    label: `${p.full_name || p.name || 'Участник'} (${getRoleLabel(p.role || 'other')})`
  }));

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <h3 className={styles.editorTitle}>Редактор участников протокола</h3>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className={styles.editorBody}>
        <p className={styles.helpText}>
          Назначьте роли для автоматически обнаруженных спикеров или настройте их вручную.
          Используйте кнопки <strong>Объединить</strong> и <strong>Разделить</strong> для управления спикерами.
        </p>

        <div className={styles.speakerList}>
          {speakers.map((speaker, index) => (
            <div key={speaker.id} className={styles.speakerCard}>
              <div className={styles.speakerHeader}>
                <span className={styles.speakerId}>
                  #{index + 1} {speaker.isAutoDetected ? '🔍' : '✏️'}
                </span>
                <span className={styles.speakerCount}>
                  {speaker.count} реплик
                </span>
                
                {/* Кнопки всегда присутствуют */}
                <button 
                  className={styles.mergeButton}
                  onClick={() => handleMergeSpeakers(speaker.id)}
                  title="Объединить с другим спикером"
                >
                  🔗 Объединить
                </button>
                <button 
                  className={styles.splitButton}
                  onClick={() => handleSplitSpeaker(speaker.id)}
                  title="Разделить на двух спикеров"
                >
                  ✂️ Разделить
                </button>
                
                {/* Кнопка сброса */}
                <button 
                  className={styles.resetSpeakerButton}
                  onClick={() => resetSpeaker(speaker.id)}
                  title="Сбросить все изменения для этого спикера"
                >
                  ↩️ Сбросить
                </button>
                
                {/* Кнопка удаления */}
                <button 
                  className={styles.removeSpeakerButton}
                  onClick={() => removeSpeaker(speaker.id)}
                  title="Удалить спикера"
                >
                  🗑️ Удалить
                </button>
              </div>

              <div className={styles.speakerFields}>
                <div className={styles.field}>
                  <label>Роль</label>
                  <select
                    value={speaker.selectedRole || ''}
                    onChange={(e) => handleRoleChange(speaker.id, e.target.value)}
                    className={styles.select}
                    style={{ borderColor: speaker.color }}
                  >
                    <option value="">Выберите роль</option>
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Поле для кастомной роли при выборе "Другое" */}
                {speaker.selectedRole === 'other' && (
                  <div className={styles.field}>
                    <label>Укажите роль</label>
                    <input
                      type="text"
                      value={speaker.customRole || ''}
                      onChange={(e) => handleCustomRoleChange(speaker.id, e.target.value)}
                      placeholder="Например: секретарь, помощник..."
                      className={styles.input}
                    />
                  </div>
                )}

                <div className={styles.field}>
                  <label>ФИО / Имя</label>
                  <div className={styles.nameInputWrapper}>
                    <input
                      type="text"
                      value={speaker.customName || ''}
                      onChange={(e) => handleNameChange(speaker.id, e.target.value)}
                      placeholder="Введите ФИО участника"
                      className={styles.input}
                    />
                    {participantOptions.length > 0 && (
                      <button 
                        className={styles.participantSelectBtn}
                        onClick={() => {
                          // Показываем список участников через модальное окно
                          const participantList = participantOptions.map((p, idx) => 
                            `${idx + 1}. ${p.label}`
                          ).join('\n');
                          
                          showModal({
                            type: 'prompt',
                            title: 'Выберите участника',
                            message: `Выберите участника из списка:\n\n${participantList}\n\nВведите номер:`,
                            inputPlaceholder: 'Введите номер',
                            confirmText: 'Выбрать',
                            cancelText: 'Отмена',
                            onConfirm: (input) => {
                              const num = parseInt(input);
                              if (!isNaN(num) && num >= 1 && num <= participantOptions.length) {
                                const selected = participantOptions[num - 1];
                                handleNameChange(speaker.id, selected.name);
                                handleRoleChange(speaker.id, selected.role);
                              } else {
                                showModal({
                                  type: 'alert',
                                  title: 'Ошибка',
                                  message: 'Неверный номер. Попробуйте ещё раз.',
                                  confirmText: 'ОК',
                                  onConfirm: () => closeModal()
                                });
                              }
                            }
                          });
                        }}
                        title="Выбрать из участников дела"
                      >
                        📋
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {speaker.selectedRole && (
                <div className={styles.speakerPreview}>
                  <span 
                    className={styles.roleBadge}
                    style={{ backgroundColor: speaker.color }}
                  >
                    {getFinalRole(speaker)}
                  </span>
                  {speaker.customName && (
                    <span className={styles.nameBadge}>
                      {speaker.customName}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.editorFooter}>
        <div className={styles.footerStats}>
          <span>Всего спикеров: {speakers.length}</span>
          <span>Всего реплик: {speakers.reduce((sum, s) => sum + s.count, 0)}</span>
        </div>
        <div className={styles.footerActions}>
          <button 
            className={styles.resetAllButton}
            onClick={() => {
              showModal({
                type: 'confirm',
                title: 'Сбросить всё',
                message: 'Вы уверены, что хотите сбросить все изменения? Все настройки спикеров будут возвращены к исходным.',
                confirmText: 'Сбросить всё',
                cancelText: 'Отмена',
                isDestructive: true,
                onConfirm: () => {
                  const initialSpeakers = Object.entries(speakersSummary).map(([role, count]) => ({
                    id: role,
                    role: role,
                    count: count,
                    displayName: role,
                    isAutoDetected: role.startsWith('speaker_'),
                    customName: '',
                    customRole: '',
                    selectedRole: role.startsWith('speaker_') ? null : role,
                    color: ROLE_COLORS[role] || '#a0aec0'
                  }));
                  setSpeakers(initialSpeakers);
                }
              });
            }}
          >
            Сбросить всё
          </button>
          <button 
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </div>

      {/* Модальное окно */}
      {modalState.isOpen && (
        <ModalDialog
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
          confirmText={modalState.confirmText}
          cancelText={modalState.cancelText}
          inputPlaceholder={modalState.inputPlaceholder}
          inputValue={modalState.inputValue}
          isDestructive={modalState.isDestructive}
        />
      )}
    </div>
  );
};

export default SpeakerRoleEditor;