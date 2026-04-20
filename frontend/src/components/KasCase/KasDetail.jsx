import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KasCaseService from '../../API/KasCaseService';
import styles from './KasDetail.module.css';
import ConfirmDialog from '../../pages/ConfirmDialog';
import {
  BasicInfoTab,
  MovementTab,
  DeadlinesTab,
  AdditionalInfoTab
} from './KasTabComponents';
import NotificationsPanel from '../CaseManagement/NotificationsPanel';
import ProgressLog from '../CaseManagement/ProgressLog';

const KasDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kasData, setKasData] = useState(null);
  const [sides, setSides] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [options, setOptions] = useState({
    admission_order: [],
    postponement_reason: [],
    outcome: [],
    appeal_result: [],
    preliminary_protection: [],
    suspension_reason: [],
  });
  const [isArchived, setIsArchived] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Подтверждение',
    message: '',
    onConfirm: null
  });
  const [judges, setJudges] = useState([]);
  const [collapsedNotifications, setCollapsedNotifications] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);

  // Состояния для сворачивания блоков в сайдбаре
  const [collapsedSections, setCollapsedSections] = useState({
    sides: true,
    decisions: true,
    petitions: true
  });

  useEffect(() => {
    const fetchKasDetails = async () => {
      try {
        setLoading(true);
        
        console.log('Loading KAS details for ID:', id);

        const kasResponse = await KasCaseService.getKasProceedingById(id);
        
        if (kasResponse) {
          console.log('KAS data loaded:', kasResponse);
          setKasData(kasResponse);
          setFormData(kasResponse);
          setIsArchived(kasResponse.status === 'archived');
          
          // Загружаем связанные данные
          const sidesResponse = await KasCaseService.getSides(kasResponse.id);
          setSides(sidesResponse);
          
          const decisionsResponse = await KasCaseService.getDecisions(kasResponse.id);
          setDecisions(decisionsResponse);
          
          const petitionsResponse = await KasCaseService.getPetitions(kasResponse.id);
          setPetitions(petitionsResponse);
        } else {
          setError('Административное дело не найдено');
        }

        // Загружаем опции и судей параллельно
        await Promise.all([
          loadOptions(),
          loadJudges()
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных административного дела:', err);
        setError('Не удалось загрузить данные административного дела');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchKasDetails();
    }
  }, [id]);

  const loadJudges = async () => {
    try {
      const judgesData = await KasCaseService.getJudges();
      setJudges(judgesData);
    } catch (error) {
      console.error('Ошибка загрузки списка судей:', error);
      setJudges([]);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await KasCaseService.getKasOptions();
      setOptions({
        admission_order: response.admissionOrder || [],
        postponement_reason: response.postponementReason || [],
        outcome: response.outcome || [],
        appeal_result: response.appealResult || [],
        preliminary_protection: response.preliminaryProtection || [],
        suspension_reason: response.suspensionReason || [],
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
    }
  };

  const handleFieldChange = useCallback((name, value) => {
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'archived_date', 'status'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном деле');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, [isArchived, isEditing]);

  // Функция для переключения сворачивания секций
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'archived_date', 'status'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном деле');
        return;
      }
    }
    
    handleFieldChange(name, type === 'checkbox' ? checked : value);
  }, [handleFieldChange, isArchived, isEditing]);

  const handleDateChange = useCallback((name, dateString) => {
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'archived_date', 'status'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном деле');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  }, [isArchived, isEditing]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend = { ...formData };

      delete dataToSend.sides;
      delete dataToSend.decisions;
      delete dataToSend.petitions;
      delete dataToSend.id;

      if (isArchived) {
        const allowedFields = ['archive_notes', 'archived_date', 'status'];
        Object.keys(dataToSend).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete dataToSend[key];
          }
        });
      }

      const proceedingId = kasData.id;
      const updatedData = await KasCaseService.updateKasProceedings(proceedingId, dataToSend);
      
      setKasData(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
      setSaving(false);
      
      setIsArchived(updatedData.status === 'archived');
      
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить данные');
      setSaving(false);
      alert('Ошибка при сохранении данных');
    }
  };

  const handleArchive = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Отправка в архив',
      message: 'Отправить дело в архив? После архивации дело будет доступно только в разделе "Архив".',
      onConfirm: async () => {
        try {
          await KasCaseService.archiveKasProceeding(id);
          navigate('/archive');
        } catch (err) {
          console.error('Error archiving:', err);
          alert('Ошибка отправки в архив: ' + (err.response?.data?.error || err.message));
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUnarchive = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Возврат из архива',
      message: 'Вернуть дело из архива?',
      onConfirm: async () => {
        try {
          await KasCaseService.unarchiveKasProceeding(id);
          const updatedData = await KasCaseService.getKasProceedingById(id);
          setKasData(updatedData);
          setFormData(updatedData);
          setIsArchived(false);
          alert('Дело возвращено из архива');
        } catch (err) {
          console.error('Error unarchiving:', err);
          alert('Ошибка возврата из архива: ' + (err.response?.data?.error || err.message));
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCancel = () => {
    setFormData(kasData);
    setIsEditing(false);
  };

  const handleAddSide = () => {
    navigate(`/kas-proceedings/${id}/sides/create`);
  };

  const handleAddDecision = () => {
    navigate(`/kas-proceedings/${id}/decisions/create`);
  };

  const handleAddPetition = () => {
    navigate(`/kas-proceedings/${id}/petitions/create`);
  };

  const handleEditSide = (sideId) => {
    navigate(`/kas-proceedings/${id}/sides/${sideId}`);
  };

  const handleEditDecision = (decisionId) => {
    navigate(`/kas-proceedings/${id}/decisions/${decisionId}`);
  };

  const handleEditPetition = (petitionId) => {
    navigate(`/kas-proceedings/${id}/petitions/${petitionId}`);
  };

  const handleDeleteSide = async (sideId) => {
    if (window.confirm('Удалить сторону по делу?')) {
      try {
        await KasCaseService.deleteSide(id, sideId);
        setSides(sides.filter(s => s.id !== sideId));
      } catch (error) {
        console.error('Ошибка удаления стороны:', error);
        alert('Не удалось удалить сторону');
      }
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    if (window.confirm('Удалить решение по делу?')) {
      try {
        await KasCaseService.deleteDecision(id, decisionId);
        setDecisions(decisions.filter(d => d.id !== decisionId));
      } catch (error) {
        console.error('Ошибка удаления решения:', error);
        alert('Не удалось удалить решение');
      }
    }
  };

  const handleDeletePetition = async (petitionId) => {
    if (window.confirm('Удалить ходатайство?')) {
      try {
        await KasCaseService.deletePetition(id, petitionId);
        setPetitions(petitions.filter(p => p.id !== petitionId));
      } catch (error) {
        console.error('Ошибка удаления ходатайства:', error);
        alert('Не удалось удалить ходатайство');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getOptionLabel = (optionsArray, value) => {
    if (!optionsArray || !value) return 'Не указано';
    const option = optionsArray.find(opt => opt.value === value);
    return option?.label || 'Не указано';
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!kasData) {
    return <div className={styles.error}>Данные не найдены</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(-1)} 
            className={styles.backButton}
          >
            ← Назад
          </button>
          <h1 className={styles.title}>
            Административное дело №{kasData.case_number_kas || 'Не указано'}
            {isArchived && <span className={styles.archiveBadge}>АРХИВ</span>}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          {isArchived ? (
            <button 
              onClick={handleUnarchive}
              className={styles.unarchiveButton}
            >
              📤 Вернуть из архива
            </button>
          ) : (
            <button 
              onClick={handleArchive}
              className={styles.archiveButton}
            >
              📁 Сдать в архив
            </button>
          )}
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              className={styles.editButton}
              disabled={isArchived}
              title={isArchived ? "Редактирование архивных дел ограничено" : ""}
            >
              Редактировать
            </button>
          ) : (
            <div className={styles.editButtons}>
              <button 
                onClick={handleSave} 
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                onClick={handleCancel} 
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Основной контент с вкладками */}
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('basic')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Основные сведения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'movement' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('movement')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Движение дела
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'deadlines' ? styles.activeTab : ''} ${isArchived && isEditing ? styles.disabledTab : ''}`}
                onClick={() => !(isArchived && isEditing) && setActiveTab('deadlines')}
                disabled={isArchived && isEditing}
                title={isArchived && isEditing ? "Эта вкладка недоступна для редактирования в архивном деле" : ""}
              >
                Сроки и делопроизводство
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'additional' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                Дополнительно
              </button>
            </div>
            <div className={styles.tabContentWrapper}>
              {activeTab === 'basic' && (
                <BasicInfoTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  kasData={kasData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                  judges={judges}
                />
              )}
              {activeTab === 'movement' && (
                <MovementTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  kasData={kasData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                />
              )}
              {activeTab === 'deadlines' && (
                <DeadlinesTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  kasData={kasData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                />
              )}
              {activeTab === 'additional' && (
                <AdditionalInfoTab
                  isEditing={isEditing}
                  formData={formData}
                  kasData={kasData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  formatDate={formatDate}
                  isArchived={isArchived}
                />
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - обновленный сайдбар в стиле уголовных дел */}
        <div className={styles.sidebar}>

            <ProgressLog 
              caseType="kas"
              caseId={id}
              onRefresh={refreshProgress}
            />

          <NotificationsPanel
            caseType="kas"
            caseId={id}
            caseNumber={kasData?.case_number_kas}
            collapsed={collapsedNotifications}
            onToggle={setCollapsedNotifications}
          />
          {/* Стороны по делу */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection('sides')}
            >
              <h2 className={styles.sectionTitle}>
                <span>Стороны по делу</span>
                <span className={styles.expandIcon}>
                  {collapsedSections.sides ? 'Развернуть' : 'Свернуть'}
                </span>
              </h2>
            </div>
            
            {!collapsedSections.sides && (
              <div className={styles.sectionContent}>
                <button 
                  onClick={handleAddSide}
                  className={styles.addButton}
                >
                  + Добавить сторону
                </button>
                
                {sides.length > 0 ? (
                  <div className={styles.sidesList}>
                    {sides.map(side => (
                      <div 
                        key={side.id} 
                        className={styles.sideItem}
                        onClick={() => handleEditSide(side.id)}
                      >
                        <div className={styles.sideHeader}>
                          <h4>
                            {side.sides_case_incase_detail?.name || 'Сторона по делу'}
                          </h4>
                          <span className={styles.sideRole}>
                            {side.sides_case_role_detail?.sides_case || 'Сторона'}
                          </span>
                        </div>
                        {side.sides_case_incase_detail?.phone && (
                          <p className={styles.sideDetails}>
                            <strong>Телефон:</strong> {side.sides_case_incase_detail.phone}
                          </p>
                        )}
                        <div className={styles.sideActions}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSide(side.id);
                            }}
                            className={styles.editButton}
                          >
                            Просмотр
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSide(side.id);
                            }}
                            className={styles.dangerButton}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>Стороны не добавлены</p>
                )}
              </div>
            )}
          </div>

          {/* Решения по делу */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection('decisions')}
            >
              <h2 className={styles.sectionTitle}>
                <span>Решения по делу</span>
                <span className={styles.expandIcon}>
                  {collapsedSections.decisions ? 'Развернуть' : 'Свернуть'}
                </span>
              </h2>
            </div>
            
            {!collapsedSections.decisions && (
              <div className={styles.sectionContent}>
                <button 
                  onClick={handleAddDecision}
                  className={styles.addButton}
                >
                  + Добавить решение
                </button>
                
                {decisions.length > 0 ? (
                  <div className={styles.sidesList}>
                    {decisions.map(decision => (
                      <div 
                        key={decision.id} 
                        className={styles.sideItem}
                        onClick={() => handleEditDecision(decision.id)}
                      >
                        <div className={styles.sideHeader}>
                          <h4>
                            {getOptionLabel(options.outcome, decision.outcome)}
                          </h4>
                          <span className={styles.sideRole}>
                            {formatDate(decision.decision_date)}
                          </span>
                        </div>
                        <div className={styles.sideActions}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDecision(decision.id);
                            }}
                            className={styles.editButton}
                          >
                            Просмотр
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDecision(decision.id);
                            }}
                            className={styles.dangerButton}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>Решения не добавлены</p>
                )}
              </div>
            )}
          </div>

          {/* Ходатайства */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection('petitions')}
            >
              <h2 className={styles.sectionTitle}>
                <span>Ходатайства</span>
                <span className={styles.expandIcon}>
                  {collapsedSections.petitions ? 'Развернуть' : 'Свернуть'}
                </span>
              </h2>
            </div>
            
            {!collapsedSections.petitions && (
              <div className={styles.sectionContent}>
                <button 
                  onClick={handleAddPetition}
                  className={styles.addButton}
                >
                  + Добавить ходатайство
                </button>
                
                {petitions.length > 0 ? (
                  <div className={styles.sidesList}>
                    {petitions.map(petition => (
                      <div 
                        key={petition.id} 
                        className={styles.sideItem}
                        onClick={() => handleEditPetition(petition.id)}
                      >
                        <div className={styles.sideHeader}>
                          <h4>Ходатайство</h4>
                          <span className={styles.sideRole}>
                            {formatDate(petition.petitions_incase_detail?.date_application)}
                          </span>
                        </div>
                        {petition.petitions_incase_detail?.petitions_name && (
                          <p className={styles.sideDetails}>
                            {petition.petitions_incase_detail.petitions_name.map(p => p.name).join(', ')}
                          </p>
                        )}
                        <div className={styles.sideActions}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPetition(petition.id);
                            }}
                            className={styles.editButton}
                          >
                            Просмотр
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePetition(petition.id);
                            }}
                            className={styles.dangerButton}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>Ходатайства не добавлены</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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

export default KasDetail;