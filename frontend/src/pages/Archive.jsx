import React, { useState, useEffect } from 'react';
import CriminalCaseService from '../API/CriminalCaseService';
import styles from './Archive.module.css';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';

const Archive = () => {
    const [archivedProceedings, setArchivedProceedings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editedFields, setEditedFields] = useState({
        archive_notes: '',
        special_notes: '',
        case_to_archive_date: ''
    });
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Подтверждение',
        message: '',
        onConfirm: null
    });

    useEffect(() => {
        loadArchivedProceedings();
    }, []);

    const loadArchivedProceedings = async () => {
        try {
            setLoading(true);
            const data = await CriminalCaseService.getArchivedProceedings();
            console.log('Archived data loaded:', data);
            setArchivedProceedings(data);
            setLoading(false);
        } catch (err) {
            console.error('Error loading archived proceedings:', err);
            setError('Ошибка загрузки архивных дел: ' + err.message);
            setLoading(false);
        }
    };

    const handleUnarchive = (proceedingId) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Возврат из архива',
            message: 'Вернуть дело из архива?',
            onConfirm: async () => {
                try {
                    console.log('Unarchiving proceeding ID:', proceedingId);
                    await CriminalCaseService.unarchiveCriminalProceeding(proceedingId);
                    loadArchivedProceedings();
                } catch (err) {
                    console.error('Error unarchiving:', err);
                    alert('Ошибка возврата из архива: ' + (err.response?.data?.error || err.message));
                }
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleViewCase = (proceedingId) => {
        console.log('Viewing case ID:', proceedingId);
        navigate(`/criminal-proceedings/${proceedingId}`);
    };

    const handleEditNotes = (proceedingId, proceedingData) => {
        setEditingNoteId(proceedingId);
        setEditedFields({
            archive_notes: proceedingData.archive_notes || '',
            special_notes: proceedingData.special_notes || '',
            case_to_archive_date: proceedingData.case_to_archive_date || ''
        });
    };

    const handleFieldChange = (fieldName, value) => {
        setEditedFields(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleSaveNotes = async (proceedingId) => {
        const isEmpty = Object.values(editedFields).every(value => !value.trim());
        if (isEmpty) {
            setConfirmDialog({
                isOpen: true,
                title: 'Сохранение пустых полей',
                message: 'Сохранить все пустые поля?',
                onConfirm: async () => {
                    await saveNotes(proceedingId);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            });
            return;
        }
        await saveNotes(proceedingId);
    };

    const saveNotes = async (proceedingId) => {
        try {
            setUpdating(true);
            console.log('Saving notes for proceeding:', proceedingId, 'Fields:', editedFields);

            const proceeding = archivedProceedings.find(p => p.id === proceedingId);
            if (!proceeding) {
                throw new Error('Дело не найдено');
            }

            const updatedData = {
                archive_notes: editedFields.archive_notes,
                special_notes: editedFields.special_notes,
                case_to_archive_date: editedFields.case_to_archive_date
            };

            await CriminalCaseService.updateCriminalProceedings(proceedingId, updatedData);

            setArchivedProceedings(prev => 
                prev.map(p => 
                    p.id === proceedingId 
                        ? { 
                            ...p, 
                            archive_notes: editedFields.archive_notes,
                            special_notes: editedFields.special_notes,
                            case_to_archive_date: editedFields.case_to_archive_date
                        } 
                        : p
                )
            );
            
            setEditingNoteId(null);
            setEditedFields({
                archive_notes: '',
                special_notes: '',
                case_to_archive_date: ''
            });
        } catch (err) {
            console.error('Error saving notes:', err);
            alert('Ошибка сохранения примечаний: ' + (err.response?.data?.error || err.message));
        } finally {
            setUpdating(false);
        }
    };


    const handleCancelEdit = () => {
        setEditingNoteId(null);
        setEditedFields({
            archive_notes: '',
            special_notes: '',
            case_to_archive_date: ''
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка архива...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Архив уголовных дел</h1>
            
            {archivedProceedings.length === 0 ? (
                <div className={styles.emptyArchive}>
                    <p>Архив пуст</p>
                </div>
            ) : (
                <div className={styles.proceedingsList}>
                    {archivedProceedings.map(proceeding => (
                        <div key={proceeding.id} className={styles.archiveCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.caseNumber}>
                                    Дело №{proceeding.case_number_criminal || 'Без номера'}
                                </div>
                                <div className={styles.archiveDate}>
                                    Сдано в архив: {formatDate(proceeding.archived_date)}
                                </div>
                            </div>
                            
                            <div className={styles.cardContent}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Дата поступления:</span>
                                    <span>{formatDate(proceeding.incoming_date)}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Статья:</span>
                                    <span>{proceeding.article_criminal || '—'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Результат:</span>
                                    <span>{proceeding.case_result || '—'}</span>
                                </div>
                                
                                {/* Поля для редактирования */}
                                <div className={styles.editableFields}>
                                    {editingNoteId === proceeding.id ? (
                                        <div className={styles.notesEditContainer}>
                                            {/* Архивные примечания */}
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>
                                                    Архивные примечания:
                                                </label>
                                                <textarea
                                                    value={editedFields.archive_notes}
                                                    onChange={(e) => handleFieldChange('archive_notes', e.target.value)}
                                                    className={styles.notesTextarea}
                                                    rows={3}
                                                    placeholder="Введите архивные примечания..."
                                                    disabled={updating}
                                                />
                                            </div>
                                            
                                            {/* Особые примечания */}
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>
                                                    Особые примечания:
                                                </label>
                                                <textarea
                                                    value={editedFields.special_notes}
                                                    onChange={(e) => handleFieldChange('special_notes', e.target.value)}
                                                    className={styles.notesTextarea}
                                                    rows={3}
                                                    placeholder="Введите особые примечания..."
                                                    disabled={updating}
                                                />
                                            </div>
                                            
                                            {/* Дата передачи в архив */}
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>
                                                    Дата передачи в архив:
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(editedFields.archived_date)}
                                                    onChange={(e) => handleFieldChange('archived_date', e.target.value)}
                                                    className={styles.dateInput}
                                                    disabled={updating}
                                                />
                                            </div>
                                            
                                            <div className={styles.notesEditActions}>
                                                <button
                                                    onClick={() => handleSaveNotes(proceeding.id)}
                                                    className={styles.saveButton}
                                                    disabled={updating}
                                                >
                                                    {updating ? 'Сохранение...' : 'Сохранить все'}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className={styles.cancelButton}
                                                    disabled={updating}
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.notesDisplay}>
                                            {/* Архивные примечания */}
                                            <div className={styles.notesRow}>
                                                <span className={styles.label}>Архивные примечания:</span>
                                                <span className={styles.notesText}>
                                                    {proceeding.archive_notes || '—'}
                                                </span>
                                            </div>
                                            
                                            {/* Особые примечания */}
                                            <div className={styles.notesRow}>
                                                <span className={styles.label}>Особые примечания:</span>
                                                <span className={styles.notesText}>
                                                    {proceeding.special_notes || '—'}
                                                </span>
                                            </div>
                                            
                                            {/* Дата передачи в архив */}
                                            <div className={styles.notesRow}>
                                                <span className={styles.label}>Дата передачи в архив:</span>
                                                <span className={styles.notesText}>
                                                    {formatDate(proceeding.archived_date) || '—'}
                                                </span>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleEditNotes(proceeding.id, proceeding)}
                                                className={styles.editNotesButton}
                                            >
                                                ✏️ Редактировать примечания
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className={styles.cardActions}>
                                <button 
                                    onClick={() => handleViewCase(proceeding.id)}
                                    className={styles.viewButton}
                                >
                                    Просмотреть дело
                                </button>
                                <button 
                                    onClick={() => handleUnarchive(proceeding.id)}
                                    className={styles.unarchiveButton}
                                >
                                    Вернуть из архива
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно подтверждения */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default Archive;