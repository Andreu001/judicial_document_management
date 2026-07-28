// JudgeAssistant.jsx - исправленная версия

import React, { useState, useEffect, useCallback } from 'react';
import baseService from '../../API/baseService';
import styles from './JudgeAssistant.module.css';
import AppointmentWizard from './AppointmentWizard/AppointmentWizard';

const JudgeAssistant = ({ proceedingId }) => {
  const [showAppointmentWizard, setShowAppointmentWizard] = useState(false);
  const [caseData, setCaseData] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    note_type: 'general',
    importance: 2,
    external_links: ''
  });
  const [submittingNote, setSubmittingNote] = useState(false);

  // Базовый URL для API judge-assistant
  const getBaseUrl = () => `/judge-assistant/case-advisor/${proceedingId}`;

  // Загрузка анализа дела
  const loadAnalysis = useCallback(async () => {
    if (!proceedingId) return;
    try {
      setLoading(true);
      const response = await baseService.get(`${getBaseUrl()}/analysis/`);
      setAnalysis(response.data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки анализа дела:', err);
      setError('Не удалось загрузить анализ дела. Убедитесь, что приложение judge_assistant запущено.');
    } finally {
      setLoading(false);
    }
  }, [proceedingId]);

  // Обновление анализа (сброс кэша)
  const refreshAnalysis = async () => {
    try {
      setRefreshing(true);
      const response = await baseService.get(`${getBaseUrl()}/refresh/`);
      setAnalysis(response.data);
    } catch (err) {
      console.error('Ошибка обновления анализа:', err);
    } finally {
      setRefreshing(false);
    }
  };

    useEffect(() => {
    if (proceedingId) {
      loadCaseDataForWizard();
    }
  }, [proceedingId]);

  const loadCaseDataForWizard = async () => {
    try {
      const CriminalCaseService = (await import('../../API/CriminalCaseService')).default;
      const data = await CriminalCaseService.getCriminalProceedingById(proceedingId);
      setCaseData(data);
    } catch (error) {
      console.error('Error loading case data for wizard:', error);
    }
  };

  const handleAppointmentSuccess = () => {
    // Обновляем анализ после назначки
    refreshAnalysis();
  };

  // Создание заметки
  const createNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      alert('Заполните заголовок и содержание заметки');
      return;
    }

    try {
      setSubmittingNote(true);
      const response = await baseService.post(`${getBaseUrl()}/notes/`, noteForm);
      
      setAnalysis(prev => ({
        ...prev,
        judge_notes: [response.data, ...(prev?.judge_notes || [])]
      }));
      
      setNoteForm({
        title: '',
        content: '',
        note_type: 'general',
        importance: 2,
        external_links: ''
      });
      setShowNoteForm(false);
    } catch (err) {
      console.error('Ошибка создания заметки:', err);
      alert('Не удалось сохранить заметку');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Отметка заметки как выполненной
  const completeNote = async (noteId) => {
    try {
      await baseService.post(`${getBaseUrl()}/notes/${noteId}/complete/`);
      setAnalysis(prev => ({
        ...prev,
        judge_notes: prev.judge_notes.map(note =>
          note.id === noteId ? { ...note, is_completed: true } : note
        )
      }));
    } catch (err) {
      console.error('Ошибка обновления заметки:', err);
    }
  };

  // Удаление заметки
  const deleteNote = async (noteId) => {
    if (!window.confirm('Удалить заметку?')) return;
    try {
      await baseService.delete(`${getBaseUrl()}/notes/${noteId}/`);
      setAnalysis(prev => ({
        ...prev,
        judge_notes: prev.judge_notes.filter(note => note.id !== noteId)
      }));
    } catch (err) {
      console.error('Ошибка удаления заметки:', err);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  // Получение цвета для severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  // Получение класса для priority
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'critical': return styles.priorityCritical;
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      case 'low': return styles.priorityLow;
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка анализа дела...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadAnalysis} className={styles.retryButton}>
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { current_stage, deadline_violations, pending_petitions, unnotified_participants, recommended_actions, useful_links, next_stage_hint, statistics, judge_notes } = analysis;

  return (
    <div className={styles.container}>
            {/* Добавляем кнопку "Сделать назначку" */}
      <div className={styles.appointmentButtonContainer}>
        <button 
          className={styles.appointmentButton}
          onClick={() => setShowAppointmentWizard(true)}
        >
          ⚖️ Сделать назначку
        </button>
        <span className={styles.appointmentHint}>
          Назначить предварительное слушание или судебное заседание
        </span>
      </div>
      {/* Верхняя панель с текущим этапом */}
      <div className={styles.currentStageCard}>
        <div className={styles.stageHeader}>
          <span className={styles.stageLabel}>Текущий этап по УПК РФ</span>
          <button onClick={refreshAnalysis} disabled={refreshing} className={styles.refreshButton}>
            {refreshing ? 'Обновление...' : '⟳ Обновить'}
          </button>
        </div>
        <div className={styles.stageName}>{current_stage?.name || 'Не определен'}</div>
        {current_stage?.chapters?.length > 0 && (
          <div className={styles.stageChapters}>
            {current_stage.chapters.join(' • ')}
          </div>
        )}
        <div className={styles.stageDescription}>{current_stage?.description}</div>
        <div className={styles.nextStageHint}>
          <span className={styles.hintIcon}>💡</span>
          {next_stage_hint}
        </div>
      </div>

      {/* Статистика */}
      {statistics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statistics.total_days_in_progress || 0}</div>
            <div className={styles.statLabel}>дней в производстве</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statistics.hearing_count || 0}</div>
            <div className={styles.statLabel}>судебных заседаний</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statistics.postponement_count || 0}</div>
            <div className={styles.statLabel}>отложений</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {statistics.resolved_petitions || 0}/{statistics.total_petitions || 0}
            </div>
            <div className={styles.statLabel}>рассмотрено ходатайств</div>
          </div>
        </div>
      )}

      {/* Основная сетка */}
      <div className={styles.mainGrid}>
        {/* Левая колонка - Нарушения и рекомендации */}
        <div className={styles.leftColumn}>
          {/* Нарушения сроков */}
          {deadline_violations?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>⚠️</span>
                <h3 className={styles.sectionTitle}>Нарушения процессуальных сроков</h3>
              </div>
              <div className={styles.violationsList}>
                {deadline_violations.map((violation, idx) => (
                  <div key={idx} className={styles.violationItem} style={{ borderLeftColor: getSeverityColor(violation.severity) }}>
                    <div className={styles.violationTitle}>{violation.title}</div>
                    <div className={styles.violationDetails}>
                      Срок: {violation.deadline_days} дн. • Фактически: {violation.actual_days} дн.
                    </div>
                    <div className={styles.violationDescription}>{violation.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Рекомендуемые действия */}
          {recommended_actions?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>                
                <h3 className={styles.sectionTitle}>Рекомендуемые действия</h3>
              </div>
              <div className={styles.actionsList}>
                {recommended_actions.map((action, idx) => (
                  <div key={idx} className={`${styles.actionItem} ${getPriorityClass(action.priority)}`}>
                    <div className={styles.actionPriority}>
                      {action.priority === 'critical' && '🔴 Критично'}
                      {action.priority === 'high' && '🟠 Важно'}
                      {action.priority === 'medium' && '🟡 Средне'}
                      {action.priority === 'low' && '🟢 Низкий'}
                    </div>
                    <div className={styles.actionTitle}>{action.title}</div>
                    {action.details && <div className={styles.actionDetails}>{action.details}</div>}
                    {action.deadline_days && (
                      <div className={styles.actionDeadline}>Срок: {action.deadline_days} дней</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Нерассмотренные ходатайства */}
          {pending_petitions?.count > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>                
                <h3 className={styles.sectionTitle}>
                  Нерассмотренные ходатайства ({pending_petitions.count})
                </h3>
              </div>
              <div className={styles.petitionsList}>
                {pending_petitions.items.map((petition, idx) => (
                  <div key={idx} className={styles.petitionItem}>
                    <div className={styles.petitionTitle}>
                      {petition.petitioner} ({petition.petitioner_type})
                    </div>
                    <div className={styles.petitionDate}>
                      Подано: {petition.date_application ? new Date(petition.date_application).toLocaleDateString('ru-RU') : 'дата не указана'}
                    </div>
                    <div className={styles.petitionDescription}>{petition.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Неуведомленные участники */}
          {unnotified_participants?.count > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>                
                <h3 className={styles.sectionTitle}>
                  Неуведомленные участники ({unnotified_participants.count})
                </h3>
              </div>
              <div className={styles.participantsList}>
                {unnotified_participants.items.map((participant, idx) => (
                  <div key={idx} className={styles.participantItem}>
                    <div className={styles.participantName}>
                      {participant.name} ({participant.type_label})
                    </div>
                    <div className={styles.participantSuggestion}>{participant.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка - Заметки и ссылки */}
        <div className={styles.rightColumn}>
          {/* Полезные ссылки */}
          {useful_links?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🔗</span>
                <h3 className={styles.sectionTitle}>Полезные ссылки</h3>
              </div>
              <div className={styles.linksList}>
                {useful_links.map((link, idx) => (
                  <div key={idx} className={styles.linkItem}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.linkTitle}>
                      {link.title}
                    </a>
                    {link.description && <div className={styles.linkDescription}>{link.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Заметки судьи */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>              
              <h3 className={styles.sectionTitle}>Мои заметки</h3>
              <button onClick={() => setShowNoteForm(!showNoteForm)} className={styles.addNoteButton}>
                + Добавить заметку
              </button>
            </div>

            {showNoteForm && (
              <form onSubmit={createNote} className={styles.noteForm}>
                <input
                  type="text"
                  placeholder="Заголовок заметки"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className={styles.noteInput}
                  required
                />
                <textarea
                  placeholder="Содержание заметки..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className={styles.noteTextarea}
                  rows={3}
                  required
                />
                <div className={styles.noteRow}>
                  <select
                    value={noteForm.note_type}
                    onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })}
                    className={styles.noteSelect}
                  >
                    <option value="general">Общая заметка</option>
                    <option value="reminder">Напоминание</option>
                    <option value="strategy">Стратегия рассмотрения</option>
                    <option value="link">Ссылка на практику/статью</option>
                  </select>
                  <select
                    value={noteForm.importance}
                    onChange={(e) => setNoteForm({ ...noteForm, importance: parseInt(e.target.value) })}
                    className={styles.noteSelect}
                  >
                    <option value="1">Низкая важность</option>
                    <option value="2">Средняя важность</option>
                    <option value="3">Высокая важность</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Ссылки (по одной на строку)"
                  value={noteForm.external_links}
                  onChange={(e) => setNoteForm({ ...noteForm, external_links: e.target.value })}
                  className={styles.noteInput}
                />
                <div className={styles.noteActions}>
                  <button type="submit" disabled={submittingNote} className={styles.saveNoteButton}>
                    {submittingNote ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button type="button" onClick={() => setShowNoteForm(false)} className={styles.cancelNoteButton}>
                    Отмена
                  </button>
                </div>
              </form>
            )}

            {judge_notes?.length === 0 && !showNoteForm && (
              <div className={styles.emptyNotes}>Нет заметок. Добавьте первую заметку.</div>
            )}

            {judge_notes?.length > 0 && (
              <div className={styles.notesList}>
                {judge_notes.map((note) => (
                  <div key={note.id} className={`${styles.noteItem} ${note.is_completed ? styles.noteCompleted : ''}`}>
                    <div className={styles.noteHeader}>
                      <div className={styles.noteType}>
                        {note.note_type === 'general' && '📄 Общая'}
                        {note.note_type === 'reminder' && '⏰ Напоминание'}
                        {note.note_type === 'strategy' && '🎯 Стратегия'}
                        {note.note_type === 'link' && '🔗 Ссылка'}
                      </div>
                      <div className={styles.noteImportance}>
                        {'⭐'.repeat(note.importance)}
                      </div>
                      <div className={styles.noteActions}>
                        {!note.is_completed && (
                          <button onClick={() => completeNote(note.id)} className={styles.completeNoteButton} title="Отметить как выполненное">
                            ✓
                          </button>
                        )}
                        <button onClick={() => deleteNote(note.id)} className={styles.deleteNoteButton} title="Удалить">
                          ×
                        </button>
                      </div>
                    </div>
                    <div className={styles.noteTitle}>{note.title}</div>
                    <div className={styles.noteContent}>{note.content}</div>
                    {note.external_links && (
                      <div className={styles.noteLinks}>
                        {note.external_links.split('\n').map((link, idx) => link.trim() && (
                          <a key={idx} href={link.trim()} target="_blank" rel="noopener noreferrer" className={styles.noteLink}>
                            {link.trim()}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className={styles.noteMeta}>
                      Создано: {new Date(note.created_at).toLocaleDateString('ru-RU')}
                      {note.created_by_name && ` • ${note.created_by_name}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
            {/* Мастер назначки */}
      <AppointmentWizard
        isOpen={showAppointmentWizard}
        onClose={() => setShowAppointmentWizard(false)}
        caseId={proceedingId}
        caseNumber={caseData?.case_number_criminal}
        onSuccess={handleAppointmentSuccess}
      />

    </div>
  );
};

export default JudgeAssistant;