// Обновленный Archive.jsx - с поддержкой КАС
import React, { useState, useEffect } from 'react';
import CriminalCaseService from '../API/CriminalCaseService';
import CivilCaseService from '../API/CivilCaseService';
import AdministrativeCaseService from '../API/AdministrativeCaseService';
import KasCaseService from '../API/KasCaseService'; // Добавляем импорт
import styles from './Archive.module.css';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';

const Archive = () => {
    const [archivedProceedings, setArchivedProceedings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedYears, setExpandedYears] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({
        archive_notes: '',
        special_notes: '',
        case_to_archive_date: ''
    });
    const [updating, setUpdating] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // all, criminal, civil, administrative, kas
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
            
            // Загружаем все категории
            const [criminalData, civilData, administrativeData, kasData] = await Promise.all([
                CriminalCaseService.getArchivedProceedings().catch(() => []),
                CivilCaseService.getArchivedProceedings().catch(() => []),
                AdministrativeCaseService.getArchivedProceedings().catch(() => []),
                KasCaseService.getArchivedProceedings().catch(() => []) // Добавляем загрузку КАС
            ]);

            // Преобразуем данные
            const transformed = [
                ...criminalData.map(item => ({
                    ...item,
                    category: 'criminal',
                    caseNumber: item.case_number_criminal || 'б/н',
                    caseInfo: item.article_criminal || '—',
                    result: item.case_result || '—',
                    archivedDate: item.archived_date || item.case_to_archive_date,
                    incomingDate: item.incoming_date,
                    archiveNotes: item.archive_notes || '',
                    specialNotes: item.special_notes || ''
                })),
                ...civilData.map(item => ({
                    ...item,
                    category: 'civil',
                    caseNumber: item.case_number_civil || 'б/н',
                    caseInfo: item.category || '—',
                    result: item.case_result || '—',
                    archivedDate: item.archived_date || item.case_to_archive_date,
                    incomingDate: item.incoming_date,
                    archiveNotes: item.archive_notes || '',
                    specialNotes: item.special_notes || ''
                })),
                ...administrativeData.map(item => ({
                    ...item,
                    category: 'administrative',
                    caseNumber: item.case_number_admin || 'б/н',
                    caseInfo: item.article_number ? `Ст. ${item.article_number}` : '—',
                    result: item.status_display || item.status || '—',
                    archivedDate: item.archived_date || item.case_to_archive_date,
                    incomingDate: item.incoming_date,
                    archiveNotes: item.archive_notes || '',
                    specialNotes: item.special_notes || ''
                })),
                ...kasData.map(item => ({ // Добавляем преобразование для КАС
                    ...item,
                    category: 'kas',
                    caseNumber: item.case_number_kas || 'б/н',
                    caseInfo: item.case_category || '—',
                    result: item.status_display || item.status || '—',
                    archivedDate: item.archived_date || item.case_to_archive_date,
                    incomingDate: item.incoming_date,
                    archiveNotes: item.archive_notes || '',
                    specialNotes: item.special_notes || ''
                }))
            ];

            // Сортируем по дате архивации (новые сверху)
            transformed.sort((a, b) => {
                const dateA = a.archivedDate ? new Date(a.archivedDate) : new Date(0);
                const dateB = b.archivedDate ? new Date(b.archivedDate) : new Date(0);
                return dateB - dateA;
            });

            setArchivedProceedings(transformed);
            
            // По умолчанию раскрываем текущий год
            const years = {};
            const currentYear = new Date().getFullYear();
            transformed.forEach(p => {
                if (p.archivedDate) {
                    const year = new Date(p.archivedDate).getFullYear();
                    years[year] = year === currentYear;
                }
            });
            setExpandedYears(years);
            
        } catch (err) {
            setError('Ошибка загрузки архива: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleYear = (year) => {
        setExpandedYears(prev => ({
            ...prev,
            [year]: !prev[year]
        }));
    };

    const handleEdit = (proceeding) => {
        setEditingId(`${proceeding.category}-${proceeding.id}`);
        setEditData({
            archive_notes: proceeding.archiveNotes || '',
            special_notes: proceeding.specialNotes || '',
            case_to_archive_date: proceeding.archivedDate ? proceeding.archivedDate.split('T')[0] : ''
        });
    };

    const handleSave = async (proceeding) => {
        try {
            setUpdating(true);
            
            const service = {
                criminal: CriminalCaseService,
                civil: CivilCaseService,
                administrative: AdministrativeCaseService,
                kas: KasCaseService // Добавляем сервис для КАС
            }[proceeding.category];

            const updateMethod = {
                criminal: 'updateCriminalProceedings',
                civil: 'updateCivilProceedings',
                administrative: 'updateAdministrativeProceedings',
                kas: 'updateKasProceedings' // Добавляем метод для КАС
            }[proceeding.category];

            await service[updateMethod](proceeding.id, {
                archive_notes: editData.archive_notes,
                special_notes: editData.special_notes,
                case_to_archive_date: editData.case_to_archive_date
            });

            // Обновляем локальное состояние
            setArchivedProceedings(prev => 
                prev.map(p => 
                    p.id === proceeding.id && p.category === proceeding.category
                        ? {
                            ...p,
                            archiveNotes: editData.archive_notes,
                            specialNotes: editData.special_notes,
                            archivedDate: editData.case_to_archive_date || p.archivedDate
                          }
                        : p
                )
            );

            setEditingId(null);
        } catch (err) {
            alert('Ошибка сохранения: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData({ archive_notes: '', special_notes: '', case_to_archive_date: '' });
    };

    const handleUnarchive = (proceeding) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Возврат из архива',
            message: `Вернуть дело №${proceeding.caseNumber} из архива?`,
            onConfirm: async () => {
                try {
                    const service = {
                        criminal: CriminalCaseService,
                        civil: CivilCaseService,
                        administrative: AdministrativeCaseService,
                        kas: KasCaseService // Добавляем сервис для КАС
                    }[proceeding.category];

                    const unarchiveMethod = {
                        criminal: 'unarchiveCriminalProceeding',
                        civil: 'unarchiveCivilProceeding',
                        administrative: 'unarchiveAdministrativeProceeding',
                        kas: 'unarchiveKasProceeding' // Добавляем метод для КАС
                    }[proceeding.category];

                    await service[unarchiveMethod](proceeding.id);
                    
                    // Удаляем из списка
                    setArchivedProceedings(prev => 
                        prev.filter(p => !(p.id === proceeding.id && p.category === proceeding.category))
                    );
                } catch (err) {
                    alert('Ошибка возврата из архива: ' + err.message);
                }
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleView = (proceeding) => {
        const routes = {
            criminal: '/criminal-proceedings/',
            civil: '/civil-proceedings/',
            administrative: '/admin-proceedings/',
            kas: '/kas-proceedings/' // Добавляем маршрут для КАС
        };
        navigate(`${routes[proceeding.category]}${proceeding.id}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        } catch {
            return '—';
        }
    };

    // Фильтрация по категории
    const filteredProceedings = archivedProceedings.filter(p => 
        activeFilter === 'all' ? true : p.category === activeFilter
    );

    // Группировка по годам
    const groupedByYear = filteredProceedings.reduce((acc, proceeding) => {
        if (!proceeding.archivedDate) return acc;
        const year = new Date(proceeding.archivedDate).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(proceeding);
        return acc;
    }, {});

    // Сортируем годы по убыванию
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

    // Подсчет статистики
    const counts = {
        all: archivedProceedings.length,
        criminal: archivedProceedings.filter(p => p.category === 'criminal').length,
        civil: archivedProceedings.filter(p => p.category === 'civil').length,
        administrative: archivedProceedings.filter(p => p.category === 'administrative').length,
        kas: archivedProceedings.filter(p => p.category === 'kas').length // Добавляем статистику для КАС
    };

    const getCategoryLabel = (category) => {
        const labels = {
            criminal: 'Уголовное',
            civil: 'Гражданское',
            administrative: 'Административное (КоАП)',
            kas: 'Административное (КАС)'
        };
        return labels[category] || category;
    };

    const getCategoryShortLabel = (category) => {
        const labels = {
            criminal: 'Уг',
            civil: 'Гр',
            administrative: 'АП',
            kas: 'КАС'
        };
        return labels[category] || category;
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка архива...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Архив дел</h1>

            {/* Статистика */}
            <div className={styles.statsBar}>
                <button 
                    className={`${styles.statBadge} ${activeFilter === 'all' ? styles.active : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    Все ({counts.all})
                </button>
                <button 
                    className={`${styles.statBadge} ${activeFilter === 'criminal' ? styles.active : ''}`}
                    onClick={() => setActiveFilter('criminal')}
                >
                    Уголовные ({counts.criminal})
                </button>
                <button 
                    className={`${styles.statBadge} ${activeFilter === 'civil' ? styles.active : ''}`}
                    onClick={() => setActiveFilter('civil')}
                >
                    Гражданские ({counts.civil})
                </button>
                <button 
                    className={`${styles.statBadge} ${activeFilter === 'administrative' ? styles.active : ''}`}
                    onClick={() => setActiveFilter('administrative')}
                >
                    Адм. (КоАП) ({counts.administrative})
                </button>
                <button 
                    className={`${styles.statBadge} ${activeFilter === 'kas' ? styles.active : ''}`}
                    onClick={() => setActiveFilter('kas')}
                >
                    Адм. (КАС) ({counts.kas})
                </button>
            </div>

            {filteredProceedings.length === 0 ? (
                <div className={styles.emptyArchive}>
                    <p>В архиве нет дел</p>
                </div>
            ) : (
                <div className={styles.archiveContent}>
                    {sortedYears.map(year => (
                        <div key={year} className={styles.yearGroup}>
                            <div 
                                className={styles.yearHeader}
                                onClick={() => toggleYear(year)}
                            >
                                <span className={styles.yearTitle}>
                                    {year} год
                                    <span className={styles.expandIcon}>
                                        {expandedYears[year] ? '▼' : '▶'}
                                    </span>
                                </span>
                                <span className={styles.yearCount}>
                                    {groupedByYear[year].length} дел
                                </span>
                            </div>

                            {expandedYears[year] && (
                                <div className={styles.cardsGrid}>
                                    {groupedByYear[year].map(proceeding => {
                                        const isEditing = editingId === `${proceeding.category}-${proceeding.id}`;
                                        const categoryClass = {
                                            criminal: styles.criminalCard,
                                            civil: styles.civilCard,
                                            administrative: styles.adminCard,
                                            kas: styles.kasCard
                                        }[proceeding.category];

                                        const headerClass = {
                                            criminal: styles.criminalHeader,
                                            civil: styles.civilHeader,
                                            administrative: styles.adminHeader,
                                            kas: styles.kasHeader
                                        }[proceeding.category];

                                        return (
                                            <div 
                                                key={`${proceeding.category}-${proceeding.id}`}
                                                className={`${styles.archiveCard} ${categoryClass}`}
                                            >
                                                <div className={`${styles.cardHeader} ${headerClass}`}>
                                                    <span className={styles.caseType}>
                                                        {getCategoryShortLabel(proceeding.category)}
                                                    </span>
                                                    <span className={styles.caseNumber}>
                                                        №{proceeding.caseNumber}
                                                    </span>
                                                </div>

                                                <div className={styles.cardBody}>
                                                    <div className={styles.infoRow}>
                                                        <span className={styles.infoLabel}>Сдано:</span>
                                                        <span className={styles.infoValue}>
                                                            {formatDate(proceeding.archivedDate)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoRow}>
                                                        <span className={styles.infoLabel}>Поступило:</span>
                                                        <span className={styles.infoValue}>
                                                            {formatDate(proceeding.incomingDate)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoRow}>
                                                        <span className={styles.infoLabel}>
                                                            {proceeding.category === 'criminal' ? 'Статья:' :
                                                             proceeding.category === 'civil' ? 'Категория:' :
                                                             proceeding.category === 'administrative' ? 'Статья:' :
                                                             'Категория:'}
                                                        </span>
                                                        <span className={styles.infoValue}>
                                                            {proceeding.caseInfo}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoRow}>
                                                        <span className={styles.infoLabel}>Результат:</span>
                                                        <span className={styles.infoValue}>
                                                            {proceeding.result}
                                                        </span>
                                                    </div>

                                                    {isEditing ? (
                                                        <div className={styles.editContainer}>
                                                            <div className={styles.editField}>
                                                                <label className={styles.editLabel}>
                                                                    Архивные примечания
                                                                </label>
                                                                <textarea
                                                                    className={styles.editTextarea}
                                                                    value={editData.archive_notes}
                                                                    onChange={(e) => setEditData(prev => ({ 
                                                                        ...prev, 
                                                                        archive_notes: e.target.value 
                                                                    }))}
                                                                    rows={2}
                                                                    disabled={updating}
                                                                />
                                                            </div>
                                                            <div className={styles.editField}>
                                                                <label className={styles.editLabel}>
                                                                    Особые примечания
                                                                </label>
                                                                <textarea
                                                                    className={styles.editTextarea}
                                                                    value={editData.special_notes}
                                                                    onChange={(e) => setEditData(prev => ({ 
                                                                        ...prev, 
                                                                        special_notes: e.target.value 
                                                                    }))}
                                                                    rows={2}
                                                                    disabled={updating}
                                                                />
                                                            </div>
                                                            <div className={styles.editField}>
                                                                <label className={styles.editLabel}>
                                                                    Дата передачи в архив
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    className={styles.editInput}
                                                                    value={editData.case_to_archive_date}
                                                                    onChange={(e) => setEditData(prev => ({ 
                                                                        ...prev, 
                                                                        case_to_archive_date: e.target.value 
                                                                    }))}
                                                                    disabled={updating}
                                                                />
                                                            </div>
                                                            <div className={styles.editActions}>
                                                                <button 
                                                                    className={styles.saveBtn}
                                                                    onClick={() => handleSave(proceeding)}
                                                                    disabled={updating}
                                                                >
                                                                    {updating ? '...' : 'Сохранить'}
                                                                </button>
                                                                <button 
                                                                    className={styles.cancelBtn}
                                                                    onClick={handleCancel}
                                                                    disabled={updating}
                                                                >
                                                                    Отмена
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {(proceeding.archiveNotes || proceeding.specialNotes) && (
                                                                <div className={styles.notesSection}>
                                                                    {proceeding.archiveNotes && (
                                                                        <div className={styles.notesItem}>
                                                                            <span className={styles.notesLabel}>
                                                                                Архивные:
                                                                            </span>
                                                                            <span className={styles.notesText}>
                                                                                {proceeding.archiveNotes}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {proceeding.specialNotes && (
                                                                        <div className={styles.notesItem}>
                                                                            <span className={styles.notesLabel}>
                                                                                Особые:
                                                                            </span>
                                                                            <span className={styles.notesText}>
                                                                                {proceeding.specialNotes}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <button 
                                                                className={styles.editNotesBtn}
                                                                onClick={() => handleEdit(proceeding)}
                                                            >
                                                                ✎ Редактировать примечания
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                <div className={styles.cardActions}>
                                                    <button 
                                                        className={styles.viewBtn}
                                                        onClick={() => handleView(proceeding)}
                                                    >
                                                        Открыть
                                                    </button>
                                                    <button 
                                                        className={styles.unarchiveBtn}
                                                        onClick={() => handleUnarchive(proceeding)}
                                                    >
                                                        Вернуть
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

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