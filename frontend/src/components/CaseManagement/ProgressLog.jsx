// ProgressLog.jsx - исправленная версия с возможностью сохранять пустой комментарий

import React, { useState, useEffect } from 'react';
import CaseManagementService from '../../API/CaseManagementService';
import CriminalCaseService from '../../API/CriminalCaseService';
import ConfirmModal from '../UI/Modal/ConfirmModal';
import styles from './ProgressLog.module.css';

const ProgressLog = ({ criminalCaseId, onRefresh }) => {
  const [progressEntries, setProgressEntries] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    action_type: '',
    description: '',
    action_date: new Date().toISOString().split('T')[0]
  });
  const [deadlines, setDeadlines] = useState({
    daysInProduction: null,
    appointmentDeadline: null,
    appointmentViolation: false
  });
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, entryId: null });

  const loadData = async () => {
    if (!criminalCaseId) return;
    try {
      setLoading(true);
      const [entries, types, caseData] = await Promise.all([
        CaseManagementService.getProgressEntries(criminalCaseId),
        CaseManagementService.getProgressActionTypes(),
        CriminalCaseService.getCriminalProceedingById(criminalCaseId)
      ]);
      setProgressEntries(entries);
      setActionTypes(types);
      calculateDeadlines(caseData);
    } catch (error) {
      console.error('Error loading progress log data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeadlines = (caseData) => {
    if (!caseData) return;

    const incomingDate = caseData.incoming_date ? new Date(caseData.incoming_date) : null;
    const judgeAcceptanceDate = caseData.judge_acceptance_date ? new Date(caseData.judge_acceptance_date) : null;
    const today = new Date();

    let daysInProduction = null;
    if (incomingDate) {
      daysInProduction = Math.floor((today - incomingDate) / (1000 * 60 * 60 * 24));
    }

    let appointmentDeadline = null;
    let appointmentViolation = false;
    if (incomingDate && judgeAcceptanceDate) {
      const daysToAppointment = Math.floor((judgeAcceptanceDate - incomingDate) / (1000 * 60 * 60 * 24));
      const maxDays = caseData.case_category === '1' ? 14 : 30;
      appointmentDeadline = maxDays;
      appointmentViolation = daysToAppointment > maxDays;
    } else if (incomingDate && !judgeAcceptanceDate) {
      const daysSinceIncoming = Math.floor((today - incomingDate) / (1000 * 60 * 60 * 24));
      const maxDays = caseData.case_category === '1' ? 14 : 30;
      appointmentDeadline = maxDays;
      appointmentViolation = daysSinceIncoming > maxDays;
    }

    setDeadlines({
      daysInProduction,
      appointmentDeadline,
      appointmentViolation
    });
  };

  useEffect(() => {
    loadData();
  }, [criminalCaseId, onRefresh]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.action_type || !formData.action_date) {
      alert('Заполните обязательные поля');
      return;
    }

    try {
      // Исправление: отправляем description как пустую строку, если поле пустое
      const dataToSend = {
        action_type: formData.action_type,
        action_date: formData.action_date,
        description: formData.description || ''  // Пустая строка вместо null/undefined
      };
      
      if (editingEntry) {
        await CaseManagementService.updateProgressEntry(criminalCaseId, editingEntry.id, dataToSend);
      } else {
        await CaseManagementService.createProgressEntry(criminalCaseId, dataToSend);
      }
      setShowAddForm(false);
      setEditingEntry(null);
      setFormData({
        action_type: '',
        description: '',
        action_date: new Date().toISOString().split('T')[0]
      });
      await loadData();
    } catch (error) {
      console.error('Error saving progress entry:', error);
      alert('Ошибка сохранения записи');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      action_type: entry.action_type?.id || entry.action_type,
      description: entry.description || '',
      action_date: entry.action_date || new Date().toISOString().split('T')[0]
    });
    setShowAddForm(true);
  };

  const openDeleteModal = (entryId) => {
    setDeleteModal({ isOpen: true, entryId });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, entryId: null });
  };

  const confirmDelete = async () => {
    if (deleteModal.entryId) {
      try {
        await CaseManagementService.deleteProgressEntry(criminalCaseId, deleteModal.entryId);
        await loadData();
      } catch (error) {
        console.error('Error deleting progress entry:', error);
        alert('Ошибка удаления записи');
      } finally {
        closeDeleteModal();
      }
    }
  };

  const getActionTypeName = (entry) => {
    if (entry.action_type_name) return entry.action_type_name;
    if (entry.action_type?.name) return entry.action_type.name;
    const found = actionTypes.find(t => t.id === entry.action_type);
    return found?.name || 'Действие';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading && progressEntries.length === 0) {
    return <div className={styles.loading}>Загрузка хода дела...</div>;
  }

  return (
    <div className={styles.progressLog}>
      <div className={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3 className={styles.title}>
          Ход дела (Справочный лист)
          <span className={styles.count}>{progressEntries.length}</span>
        </h3>
        <span className={styles.toggleIndicator}>{isCollapsed ? 'Развернуть' : 'Свернуть'}</span>
      </div>

      {!isCollapsed && (
        <>
          <div className={styles.deadlinesBlock}>
            <div className={styles.deadlineItem}>
              <span className={styles.deadlineLabel}>В производстве:</span>
              <span className={`${styles.deadlineValue} ${deadlines.daysInProduction > 30 ? styles.warning : ''}`}>
                {deadlines.daysInProduction !== null ? `${deadlines.daysInProduction} дн.` : '—'}
              </span>
            </div>
            <div className={styles.deadlineItem}>
              <span className={styles.deadlineLabel}>Срок назначения:</span>
              <span className={`${styles.deadlineValue} ${deadlines.appointmentViolation ? styles.violation : ''}`}>
                {deadlines.appointmentDeadline ? `${deadlines.appointmentDeadline} дн.` : '—'}
                {deadlines.appointmentViolation && <span className={styles.violationBadge}>Нарушен</span>}
              </span>
            </div>
          </div>

          <button 
            className={styles.addButton}
            onClick={() => {
              setEditingEntry(null);
              setFormData({
                action_type: '',
                description: '',
                action_date: new Date().toISOString().split('T')[0]
              });
              setShowAddForm(true);
            }}
          >
            + Добавить запись
          </button>

          {showAddForm && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <select
                name="action_type"
                value={formData.action_type}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="">Выберите действие</option>
                {actionTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <input
                type="date"
                name="action_date"
                value={formData.action_date}
                onChange={handleInputChange}
                className={styles.dateInput}
                required
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Описание (необязательно)"
                rows={2}
              />
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  {editingEntry ? 'Сохранить' : 'Добавить'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingEntry(null);
                  }}
                  className={styles.cancelButton}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}

          <div className={styles.entriesList}>
            {progressEntries.length === 0 && !showAddForm && (
              <div className={styles.emptyState}>Нет записей о ходе дела</div>
            )}
            {progressEntries.map(entry => (
              <div key={entry.id} className={styles.entryItem}>
                <div className={styles.entryRow}>
                  <div className={styles.entryInfo}>
                    <span className={styles.entryDate}>{formatDate(entry.action_date)}</span>
                    <span className={styles.entryType}>{getActionTypeName(entry)}</span>
                    {entry.description && (
                      <span className={styles.entryDescription}>{entry.description}</span>
                    )}
                    {entry.author_name && (
                      <span className={styles.entryAuthor}>{entry.author_name}</span>
                    )}
                  </div>
                  <div className={styles.entryControls}>
                    <button 
                      onClick={() => handleEdit(entry)} 
                      className={styles.editButton}
                      title="Редактировать"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={() => openDeleteModal(entry.id)} 
                      className={styles.deleteButton}
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        message="Вы уверены, что хотите удалить эту запись?"
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
};

export default ProgressLog;