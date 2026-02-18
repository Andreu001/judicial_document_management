import React, { useState, useEffect } from 'react';
import CriminalCaseService from '../API/CriminalCaseService';
import CivilCaseService from '../API/CivilCaseService';
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
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'criminal', 'civil'
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
            
            // Загружаем архивные уголовные дела
            let criminalData = [];
            try {
                criminalData = await CriminalCaseService.getArchivedProceedings();
                console.log('Criminal archived data loaded:', criminalData);
            } catch (err) {
                console.error('Error loading criminal archived proceedings:', err);
            }
            
            // Загружаем архивные гражданские дела
            let civilData = [];
            try {
                civilData = await CivilCaseService.getArchivedProceedings();
                console.log('Civil archived data loaded:', civilData);
            } catch (err) {
                console.error('Error loading civil archived proceedings:', err);
            }
            
            // Преобразуем данные для единообразного отображения
            const transformedCriminalData = criminalData.map(item => ({
                ...item,
                case_type: 'criminal',
                case_number: item.case_number_criminal || 'Без номера',
                case_category: item.article_criminal || '—',
                case_result: item.case_result || '—',
                archived_date: item.archived_date || item.case_to_archive_date,
                archive_notes: item.archive_notes || '',
                special_notes: item.special_notes || '',
                incoming_date: item.incoming_date
            }));
            
            const transformedCivilData = civilData.map(item => ({
                ...item,
                case_type: 'civil',
                case_number: item.case_number_civil || 'Без номера',
                case_category: item.category || '—',
                case_result: item.case_result || '—',
                archived_date: item.archived_date || item.case_to_archive_date,
                archive_notes: item.archive_notes || '',
                special_notes: item.special_notes || '',
                incoming_date: item.incoming_date
            }));
            
            // Объединяем все дела
            const allData = [...transformedCriminalData, ...transformedCivilData];
            
            // Сортируем по дате архивации (от новых к старым)
            allData.sort((a, b) => {
                const dateA = a.archived_date ? new Date(a.archived_date) : new Date(0);
                const dateB = b.archived_date ? new Date(b.archived_date) : new Date(0);
                return dateB - dateA;
            });
            
            setArchivedProceedings(allData);
            setLoading(false);
        } catch (err) {
            console.error('Error loading archived proceedings:', err);
            setError('Ошибка загрузки архивных дел: ' + err.message);
            setLoading(false);
        }
    };

    const handleUnarchive = (proceeding) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Возврат из архива',
            message: `Вернуть ${proceeding.case_type === 'criminal' ? 'уголовное' : 'гражданское'} дело №${proceeding.case_number} из архива?`,
            onConfirm: async () => {
                try {
                    console.log('Unarchiving proceeding ID:', proceeding.id, 'Type:', proceeding.case_type);
                    
                    if (proceeding.case_type === 'criminal') {
                        await CriminalCaseService.unarchiveCriminalProceeding(proceeding.id);
                    } else {
                        await CivilCaseService.unarchiveCivilProceeding(proceeding.id);
                    }
                    
                    loadArchivedProceedings();
                } catch (err) {
                    console.error('Error unarchiving:', err);
                    alert('Ошибка возврата из архива: ' + (err.response?.data?.error || err.message));
                }
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleViewCase = (proceeding) => {
        console.log('Viewing case ID:', proceeding.id, 'Type:', proceeding.case_type);
        
        if (proceeding.case_type === 'criminal') {
            navigate(`/criminal-proceedings/${proceeding.id}`);
        } else {
            navigate(`/civil-proceedings/${proceeding.id}`);
        }
    };

    const handleEditNotes = (proceedingId, proceedingData) => {
        setEditingNoteId(proceedingId);
        setEditedFields({
            archive_notes: proceedingData.archive_notes || '',
            special_notes: proceedingData.special_notes || '',
            case_to_archive_date: proceedingData.case_to_archive_date || proceedingData.archived_date || ''
        });
    };

    const handleFieldChange = (fieldName, value) => {
        setEditedFields(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleSaveNotes = async (proceedingId) => {
        const proceeding = archivedProceedings.find(p => p.id === proceedingId);
        if (!proceeding) {
            alert('Дело не найдено');
            return;
        }

        const isEmpty = Object.values(editedFields).every(value => !value || !value.toString().trim());
        if (isEmpty) {
            setConfirmDialog({
                isOpen: true,
                title: 'Сохранение пустых полей',
                message: 'Сохранить все пустые поля?',
                onConfirm: async () => {
                    await saveNotes(proceedingId, proceeding.case_type);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            });
            return;
        }
        
        await saveNotes(proceedingId, proceeding.case_type);
    };

    const saveNotes = async (proceedingId, caseType) => {
        try {
            setUpdating(true);
            console.log('Saving notes for proceeding:', proceedingId, 'Type:', caseType, 'Fields:', editedFields);

            const proceeding = archivedProceedings.find(p => p.id === proceedingId);
            if (!proceeding) {
                throw new Error('Дело не найдено');
            }

            const updatedData = {
                archive_notes: editedFields.archive_notes,
                special_notes: editedFields.special_notes,
                case_to_archive_date: editedFields.case_to_archive_date
            };

            if (caseType === 'criminal') {
                await CriminalCaseService.updateCriminalProceedings(proceedingId, updatedData);
            } else {
                await CivilCaseService.updateCivilProceedings(proceedingId, updatedData);
            }

            setArchivedProceedings(prev => 
                prev.map(p => 
                    p.id === proceedingId 
                        ? { 
                            ...p, 
                            archive_notes: editedFields.archive_notes,
                            special_notes: editedFields.special_notes,
                            case_to_archive_date: editedFields.case_to_archive_date,
                            archived_date: editedFields.case_to_archive_date || p.archived_date
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
        try {
            return new Date(dateString).toLocaleDateString('ru-RU');
        } catch {
            return '—';
        }
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const getFilteredProceedings = () => {
        if (activeTab === 'criminal') {
            return archivedProceedings.filter(p => p.case_type === 'criminal');
        } else if (activeTab === 'civil') {
            return archivedProceedings.filter(p => p.case_type === 'civil');
        }
        return archivedProceedings;
    };

    const getCaseTypeLabel = (caseType) => {
        return caseType === 'criminal' ? 'Уголовное' : 'Гражданское';
    };

    const getCounts = () => {
        const criminalCount = archivedProceedings.filter(p => p.case_type === 'criminal').length;
        const civilCount = archivedProceedings.filter(p => p.case_type === 'civil').length;
        return { criminal: criminalCount, civil: civilCount, total: archivedProceedings.length };
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка архива...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    const counts = getCounts();
    const filteredProceedings = getFilteredProceedings();

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Архив дел</h1>
            
            {/* Табы для фильтрации */}
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Все дела ({counts.total})
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'criminal' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('criminal')}
                >
                    Уголовные ({counts.criminal})
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'civil' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('civil')}
                >
                    Гражданские ({counts.civil})
                </button>
            </div>
            
            {filteredProceedings.length === 0 ? (
                <div className={styles.emptyArchive}>
                    <p>В архиве нет {activeTab === 'criminal' ? 'уголовных' : activeTab === 'civil' ? 'гражданских' : ''} дел</p>
                </div>
            ) : (
                <div className={styles.proceedingsList}>
                    {filteredProceedings.map(proceeding => (
                        <div key={`${proceeding.case_type}-${proceeding.id}`} className={styles.archiveCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.caseType}>
                                    {getCaseTypeLabel(proceeding.case_type)}
                                </div>
                                <div className={styles.caseNumber}>
                                    Дело №{proceeding.case_number}
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
                                    <span className={styles.label}>
                                        {proceeding.case_type === 'criminal' ? 'Статья:' : 'Категория:'}
                                    </span>
                                    <span>{proceeding.case_category}</span>
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
                                                    value={formatDateForInput(editedFields.case_to_archive_date)}
                                                    onChange={(e) => handleFieldChange('case_to_archive_date', e.target.value)}
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
                                                    {formatDate(proceeding.case_to_archive_date || proceeding.archived_date) || '—'}
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
                                    onClick={() => handleViewCase(proceeding)}
                                    className={styles.viewButton}
                                >
                                    Просмотреть дело
                                </button>
                                <button 
                                    onClick={() => handleUnarchive(proceeding)}
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