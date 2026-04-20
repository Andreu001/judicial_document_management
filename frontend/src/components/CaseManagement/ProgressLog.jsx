// ProgressLog.jsx - универсальная версия для всех типов дел
import React, { useState, useEffect } from 'react';
import CaseManagementService from '../../API/CaseManagementService';
import styles from './ProgressLog.module.css';
import ConfirmModal from '../UI/Modal/ConfirmModal';

const ProgressLog = ({ caseType, caseId, onRefresh }) => {
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
  const [deadlines, setDeadlines] = useState({});
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, entryId: null });

  // Маппинг типов дел для API
  const getCaseTypePath = () => {
    const typeMap = {
      'criminal': 'criminal',
      'civil': 'civil',
      'coap': 'coap',
      'kas': 'kas',
      'other': 'other'
    };
    return typeMap[caseType] || caseType;
  };

  const loadData = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      
      const pathType = getCaseTypePath();
      const entries = await CaseManagementService.getProgressEntries(pathType, caseId);
      const types = await CaseManagementService.getProgressActionTypes();
      
      // Фильтруем типы действий по категории дела
      const filteredTypes = types.filter(t => 
        !t.case_category || t.case_category === 'common' || t.case_category === caseType
      );
      
      setProgressEntries(entries);
      setActionTypes(filteredTypes);
      
      // Загружаем данные для расчета сроков в зависимости от типа дела
      await loadCaseDataForDeadlines();
    } catch (error) {
      console.error('Error loading progress log data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDataForDeadlines = async () => {
    try {
      let caseData = null;
      
      switch (caseType) {
        case 'criminal':
          const CriminalCaseService = (await import('../../API/CriminalCaseService')).default;
          caseData = await CriminalCaseService.getCriminalProceedingById(caseId);
          calculateCriminalDeadlines(caseData);
          break;
        case 'civil':
          const CivilCaseService = (await import('../../API/CivilCaseService')).default;
          caseData = await CivilCaseService.getCivilProceedingById(caseId);
          calculateCivilDeadlines(caseData);
          break;
        case 'kas':
          const KasCaseService = (await import('../../API/KasCaseService')).default;
          caseData = await KasCaseService.getKasProceedingById(caseId);
          calculateKasDeadlines(caseData);
          break;
        case 'coap':
          const AdministrativeCaseService = (await import('../../API/AdministrativeCaseService')).default;
          caseData = await AdministrativeCaseService.getAdministrativeProceedingById(caseId);
          calculateCoapDeadlines(caseData);
          break;
        case 'other':
          const OtherMaterialService = (await import('../../API/OtherMaterialService')).default;
          caseData = await OtherMaterialService.getOtherMaterialById(caseId);
          calculateOtherDeadlines(caseData);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading case data for deadlines:', error);
    }
  };

  // Расчет сроков для уголовных дел
  const calculateCriminalDeadlines = (caseData) => {
    if (!caseData) return;

    const incomingDate = caseData.incoming_date ? new Date(caseData.incoming_date) : null;
    const judgeAcceptanceDate = caseData.judge_acceptance_date ? new Date(caseData.judge_acceptance_date) : null;
    const firstHearingDate = caseData.first_hearing_date ? new Date(caseData.first_hearing_date) : null;
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

    let trialStartDeadline = 14;
    let trialStartViolation = false;
    if (judgeAcceptanceDate && firstHearingDate) {
      const daysToTrial = Math.floor((firstHearingDate - judgeAcceptanceDate) / (1000 * 60 * 60 * 24));
      trialStartViolation = daysToTrial > trialStartDeadline;
    } else if (judgeAcceptanceDate && !firstHearingDate) {
      const daysSinceAcceptance = Math.floor((today - judgeAcceptanceDate) / (1000 * 60 * 60 * 24));
      trialStartViolation = daysSinceAcceptance > trialStartDeadline;
    }

    setDeadlines({
      daysInProduction,
      appointmentDeadline,
      appointmentViolation,
      trialStartDeadline,
      trialStartViolation
    });
  };

  // Расчет сроков для гражданских дел
  const calculateCivilDeadlines = (caseData) => {
    if (!caseData) return;

    const incomingDate = caseData.incoming_date ? new Date(caseData.incoming_date) : null;
    const judgeAcceptanceDate = caseData.judge_acceptance_date ? new Date(caseData.judge_acceptance_date) : null;
    const hearingDate = caseData.hearing_date ? new Date(caseData.hearing_date) : null;
    const today = new Date();

    let daysInProduction = null;
    if (incomingDate) {
      daysInProduction = Math.floor((today - incomingDate) / (1000 * 60 * 60 * 24));
    }

    let preparationDeadline = 30;
    let preparationViolation = false;
    if (incomingDate && judgeAcceptanceDate) {
      const daysToAcceptance = Math.floor((judgeAcceptanceDate - incomingDate) / (1000 * 60 * 60 * 24));
      preparationViolation = daysToAcceptance > preparationDeadline;
    }

    let considerationDeadline = 60;
    let considerationViolation = false;
    if (incomingDate && hearingDate) {
      const daysToHearing = Math.floor((hearingDate - incomingDate) / (1000 * 60 * 60 * 24));
      considerationViolation = daysToHearing > considerationDeadline;
    }

    setDeadlines({
      daysInProduction,
      preparationDeadline,
      preparationViolation,
      considerationDeadline,
      considerationViolation
    });
  };

  // Расчет сроков для КАС дел
  const calculateKasDeadlines = (caseData) => {
    if (!caseData) return;

    const incomingDate = caseData.incoming_date ? new Date(caseData.incoming_date) : null;
    const acceptanceDate = caseData.acceptance_date ? new Date(caseData.acceptance_date) : null;
    const hearingDate = caseData.hearing_date ? new Date(caseData.hearing_date) : null;
    const today = new Date();

    let daysInProduction = null;
    if (incomingDate) {
      daysInProduction = Math.floor((today - incomingDate) / (1000 * 60 * 60 * 24));
    }

    let acceptanceDeadline = 15;
    let acceptanceViolation = false;
    if (incomingDate && acceptanceDate) {
      const daysToAcceptance = Math.floor((acceptanceDate - incomingDate) / (1000 * 60 * 60 * 24));
      acceptanceViolation = daysToAcceptance > acceptanceDeadline;
    }

    let considerationDeadline = 30;
    let considerationViolation = false;
    if (acceptanceDate && hearingDate) {
      const daysToHearing = Math.floor((hearingDate - acceptanceDate) / (1000 * 60 * 60 * 24));
      considerationViolation = daysToHearing > considerationDeadline;
    }

    setDeadlines({
      daysInProduction,
      acceptanceDeadline,
      acceptanceViolation,
      considerationDeadline,
      considerationViolation
    });
  };

  // Расчет сроков для КоАП дел
  const calculateCoapDeadlines = (caseData) => {
    if (!caseData) return;

    const incomingDate = caseData.incoming_date ? new Date(caseData.incoming_date) : null;
    const judgeAcceptanceDate = caseData.judge_acceptance_date ? new Date(caseData.judge_acceptance_date) : null;
    const hearingDate = caseData.hearing_date ? new Date(caseData.hearing_date) : null;
    const today = new Date();

    let daysInProduction = null;
    if (incomingDate) {
      daysInProduction = Math.floor((today - incomingDate) / (1000 * 60 * 60 * 24));
    }

    let acceptanceDeadline = 15;
    let acceptanceViolation = false;
    if (incomingDate && judgeAcceptanceDate) {
      const daysToAcceptance = Math.floor((judgeAcceptanceDate - incomingDate) / (1000 * 60 * 60 * 24));
      acceptanceViolation = daysToAcceptance > acceptanceDeadline;
    }

    let considerationDeadline = 15;
    let considerationViolation = false;
    if (judgeAcceptanceDate && hearingDate) {
      const daysToHearing = Math.floor((hearingDate - judgeAcceptanceDate) / (1000 * 60 * 60 * 24));
      considerationViolation = daysToHearing > considerationDeadline;
    }

    setDeadlines({
      daysInProduction,
      acceptanceDeadline,
      acceptanceViolation,
      considerationDeadline,
      considerationViolation
    });
  };

  // Расчет сроков для иных материалов
  const calculateOtherDeadlines = (caseData) => {
    if (!caseData) return;

    const registrationDate = caseData.registration_date ? new Date(caseData.registration_date) : null;
    const considerationDate = caseData.consideration_date ? new Date(caseData.consideration_date) : null;
    const today = new Date();

    let daysInProduction = null;
    if (registrationDate) {
      daysInProduction = Math.floor((today - registrationDate) / (1000 * 60 * 60 * 24));
    }

    let considerationDeadline = 30;
    let considerationViolation = false;
    if (registrationDate && !considerationDate) {
      const daysSinceRegistration = Math.floor((today - registrationDate) / (1000 * 60 * 60 * 24));
      considerationViolation = daysSinceRegistration > considerationDeadline;
    }

    setDeadlines({
      daysInProduction,
      considerationDeadline,
      considerationViolation
    });
  };

  useEffect(() => {
    loadData();
  }, [caseId, onRefresh, caseType]);

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
      const dataToSend = {
        action_type: formData.action_type,
        action_date: formData.action_date,
        description: formData.description || ''
      };
      
      const pathType = getCaseTypePath();
      
      if (editingEntry) {
        await CaseManagementService.updateProgressEntry(pathType, caseId, editingEntry.id, dataToSend);
      } else {
        await CaseManagementService.createProgressEntry(pathType, caseId, dataToSend);
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
        const pathType = getCaseTypePath();
        await CaseManagementService.deleteProgressEntry(pathType, caseId, deleteModal.entryId);
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

  // Получение названий сроков в зависимости от типа дела
  const getDeadlineLabels = () => {
    const labels = {
      criminal: {
        daysInProduction: 'В производстве',
        appointmentDeadline: 'Срок назначения',
        trialStartDeadline: 'Срок начала разбирательства'
      },
      civil: {
        daysInProduction: 'В производстве',
        preparationDeadline: 'Срок подготовки',
        considerationDeadline: 'Срок рассмотрения'
      },
      kas: {
        daysInProduction: 'В производстве',
        acceptanceDeadline: 'Срок принятия',
        considerationDeadline: 'Срок рассмотрения'
      },
      coap: {
        daysInProduction: 'В производстве',
        acceptanceDeadline: 'Срок принятия',
        considerationDeadline: 'Срок рассмотрения'
      },
      other: {
        daysInProduction: 'В производстве',
        considerationDeadline: 'Срок рассмотрения'
      }
    };
    return labels[caseType] || labels.criminal;
  };

  const deadlineLabels = getDeadlineLabels();

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
            {deadlines.daysInProduction !== undefined && (
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineLabel}>{deadlineLabels.daysInProduction}:</span>
                <span className={`${styles.deadlineValue} ${deadlines.daysInProduction > 30 ? styles.warning : ''}`}>
                  {deadlines.daysInProduction !== null ? `${deadlines.daysInProduction} дн.` : '—'}
                </span>
              </div>
            )}
            
            {deadlines.appointmentDeadline !== undefined && (
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineLabel}>{deadlineLabels.appointmentDeadline}:</span>
                <span className={`${styles.deadlineValue} ${deadlines.appointmentViolation ? styles.violation : ''}`}>
                  {deadlines.appointmentDeadline ? `${deadlines.appointmentDeadline} дн.` : '—'}
                  {deadlines.appointmentViolation && <span className={styles.violationBadge}>Нарушен</span>}
                </span>
              </div>
            )}
            
            {deadlines.trialStartDeadline !== undefined && (
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineLabel}>{deadlineLabels.trialStartDeadline}:</span>
                <span className={`${styles.deadlineValue} ${deadlines.trialStartViolation ? styles.violation : ''}`}>
                  {deadlines.trialStartDeadline ? `${deadlines.trialStartDeadline} дн.` : '—'}
                  {deadlines.trialStartViolation && <span className={styles.violationBadge}>Нарушен</span>}
                </span>
              </div>
            )}
            
            {deadlines.preparationDeadline !== undefined && (
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineLabel}>{deadlineLabels.preparationDeadline}:</span>
                <span className={`${styles.deadlineValue} ${deadlines.preparationViolation ? styles.violation : ''}`}>
                  {deadlines.preparationDeadline ? `${deadlines.preparationDeadline} дн.` : '—'}
                  {deadlines.preparationViolation && <span className={styles.violationBadge}>Нарушен</span>}
                </span>
              </div>
            )}
            
            {deadlines.considerationDeadline !== undefined && (
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineLabel}>{deadlineLabels.considerationDeadline}:</span>
                <span className={`${styles.deadlineValue} ${deadlines.considerationViolation ? styles.violation : ''}`}>
                  {deadlines.considerationDeadline ? `${deadlines.considerationDeadline} дн.` : '—'}
                  {deadlines.considerationViolation && <span className={styles.violationBadge}>Нарушен</span>}
                </span>
              </div>
            )}
            
            {deadlines.acceptanceDeadline !== undefined && (
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineLabel}>{deadlineLabels.acceptanceDeadline}:</span>
                <span className={`${styles.deadlineValue} ${deadlines.acceptanceViolation ? styles.violation : ''}`}>
                  {deadlines.acceptanceDeadline ? `${deadlines.acceptanceDeadline} дн.` : '—'}
                  {deadlines.acceptanceViolation && <span className={styles.violationBadge}>Нарушен</span>}
                </span>
              </div>
            )}
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