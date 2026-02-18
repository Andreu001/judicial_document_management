import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';
import ConfirmDialog from '../../pages/ConfirmDialog';
import {
  BasicInfoTab,
  MovementTab,
  DeadlinesTab,
  AdditionalInfoTab
} from './CivilTabComponents';

const CivilDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [civilData, setCivilData] = useState(null);
  const [sides, setSides] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [procedureActions, setProcedureActions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [options, setOptions] = useState({
    admission_order: [],
    postponed_reason: [],
    compliance_with_deadlines: [],
    ruling_type: [],
    consideration_result_main: [],
    consideration_result_additional: [],
    consideration_result_counter: [],
    second_instance_result: [],
    court_composition: []
  });
  const [isArchived, setIsArchived] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Подтверждение',
    message: '',
    onConfirm: null
  });
  const [judges, setJudges] = useState([]);

  useEffect(() => {
    const fetchCivilDetails = async () => {
      try {
        setLoading(true);
        
        console.log('Loading civil details for ID:', id);

        const civilResponse = await CivilCaseService.getCivilProceedingById(id);
        
        if (civilResponse) {
          console.log('Civil data loaded:', civilResponse);
          setCivilData(civilResponse);
          setFormData(civilResponse);
          setIsArchived(civilResponse.status === 'archived');
          
          // Загружаем связанные данные
          const sidesResponse = await CivilCaseService.getSides(civilResponse.id);
          setSides(sidesResponse);
          
          const decisionsResponse = await CivilCaseService.getDecisions(civilResponse.id);
          setDecisions(decisionsResponse);
          
          const actionsResponse = await CivilCaseService.getCivilProceedingById(civilResponse.id);
          setProcedureActions(actionsResponse);
        } else {
          setError('Гражданское дело не найдено');
        }

        // Загружаем опции и судей параллельно
        await Promise.all([
          loadOptions(),
          loadJudges()
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных гражданского дела:', err);
        setError('Не удалось загрузить данные гражданского дела');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCivilDetails();
    }
  }, [id]);

  const loadJudges = async () => {
    try {
      const judgesData = await CivilCaseService.getJudges();
      setJudges(judgesData);
    } catch (error) {
      console.error('Ошибка загрузки списка судей:', error);
      setJudges([]);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await CivilCaseService.getCivilOptions();
      setOptions(response);
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
      setOptions({
        admission_order: [],
        postponed_reason: [],
        compliance_with_deadlines: [],
        ruling_type: [],
        consideration_result_main: [],
        consideration_result_additional: [],
        consideration_result_counter: [],
        second_instance_result: [],
        court_composition: []
      });
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

  const [expandedSections, setExpandedSections] = useState({
    sides: true, // по умолчанию развернуто
    decisions: true,
    actions: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
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
      delete dataToSend.procedure_actions;
      delete dataToSend.id;

      if (isArchived) {
        const allowedFields = ['archive_notes', 'archived_date', 'status'];
        Object.keys(dataToSend).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete dataToSend[key];
          }
        });
      }

      const proceedingId = civilData.id;
      const updatedData = await CivilCaseService.updateCivilProceedings(proceedingId, dataToSend);
      
      setCivilData(updatedData);
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
          await CivilCaseService.archiveCivilProceeding(id);
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
          await CivilCaseService.unarchiveCivilProceeding(id);
          const updatedData = await CivilCaseService.getCivilProceedingById(id);
          setCivilData(updatedData);
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
    setFormData(civilData);
    setIsEditing(false);
  };

  const handleAddSide = () => {
    navigate(`/civil-proceedings/${id}/sides/create`);
  };

  const handleAddDecision = () => {
    navigate(`/civil-proceedings/${id}/decisions/create`);
  };

  const handleAddProcedureAction = () => {
    navigate(`/civil-proceedings/${id}/procedure-actions/create`);
  };

  const handleEditSide = (sideId) => {
    navigate(`/civil-proceedings/${id}/sides/${sideId}/edit`);
  };

  const handleEditDecision = (decisionId) => {
    navigate(`/civil-proceedings/${id}/decisions/${decisionId}/edit`);
  };

  const handleEditProcedureAction = (actionId) => {
    navigate(`/civil-proceedings/${id}/procedure-actions/${actionId}/edit`);
  };

  const handleDeleteSide = async (sideId) => {
    if (window.confirm('Удалить сторону по делу?')) {
      try {
        await CivilCaseService.deleteSide(id, sideId);
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
        await CivilCaseService.deleteDecision(id, decisionId);
        setDecisions(decisions.filter(d => d.id !== decisionId));
      } catch (error) {
        console.error('Ошибка удаления решения:', error);
        alert('Не удалось удалить решение');
      }
    }
  };

  const handleDeleteProcedureAction = async (actionId) => {
    if (window.confirm('Удалить процессуальное действие?')) {
      try {
        await CivilCaseService.deleteProcedureAction(id, actionId);
        setProcedureActions(procedureActions.filter(a => a.id !== actionId));
      } catch (error) {
        console.error('Ошибка удаления процессуального действия:', error);
        alert('Не удалось удалить действие');
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!civilData) {
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
            Гражданское дело №{civilData.case_number_civil || 'Не указано'}
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
                  civilData={civilData}
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
                  civilData={civilData}
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
                  civilData={civilData}
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
                  civilData={civilData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  formatDate={formatDate}
                  isArchived={isArchived}
                />
              )}
            </div>
          </div>
        </div>

{/* Правая колонка - стороны по делу */}
<div className={styles.sidebar}>
  {/* Стороны по делу */}
  <div className={styles.section}>
    <div 
      className={styles.sectionHeader}
      onClick={() => toggleSection('sides')}
    >
      <h2 className={styles.sectionTitle}>
        <span>Стороны по делу</span>
        <span className={styles.expandIcon}>
          {expandedSections.sides ? '▼' : '▶'}
        </span>
      </h2>
    </div>
    
    {expandedSections.sides && (
      <>
        <button 
          onClick={handleAddSide}
          className={styles.addButton}
        >
          + Добавить сторону
        </button>
        
        {sides.length > 0 ? (
          <div className={styles.sidesList}>
            {sides.map(side => (
              <div key={side.id} className={styles.sideItem}>
                <div className={styles.sideHeader}>
                  <h4>
                    {side.plaintiff_name || side.defendant_name || 'Сторона по делу'}
                  </h4>
                  <span className={styles.sideRole}>
                    {side.plaintiff_name ? 'Истец' : 
                     side.defendant_name ? 'Ответчик' : 
                     side.third_parties ? 'Третье лицо' : 'Сторона'}
                  </span>
                </div>
                {side.main_claim && (
                  <p className={styles.sideDetails}>
                    <strong>Требование:</strong> {side.main_claim.substring(0, 100)}
                    {side.main_claim.length > 100 && '...'}
                  </p>
                )}
                {side.main_claim_amount > 0 && (
                  <span className={styles.sideAmount}>
                    Сумма: {formatCurrency(side.main_claim_amount)}
                  </span>
                )}
                <div className={styles.sideActions}>
                  <button 
                    onClick={() => handleEditSide(side.id)}
                    className={styles.editButton}
                  >
                    Редактировать
                  </button>
                  <button 
                    onClick={() => handleDeleteSide(side.id)}
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
      </>
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
          {expandedSections.decisions ? '▼' : '▶'}
        </span>
      </h2>
    </div>
    
    {expandedSections.decisions && (
      <>
        <button 
          onClick={handleAddDecision}
          className={styles.addButton}
        >
          + Добавить решение
        </button>
        
        {decisions.length > 0 ? (
          <div className={styles.sidesList}>
            {decisions.map(decision => (
              <div key={decision.id} className={styles.sideItem}>
                <div className={styles.sideHeader}>
                  <h4>Решение #{decision.id}</h4>
                  <span className={styles.sideRole}>
                    {formatDate(decision.considered_date)}
                  </span>
                </div>
                {decision.ruling_type && (
                  <p className={styles.sideDetails}>
                    Вид: {decision.ruling_type}
                  </p>
                )}
                <div className={styles.sideActions}>
                  <button 
                    onClick={() => handleEditDecision(decision.id)}
                    className={styles.editButton}
                  >
                    Просмотр
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noData}>Решения не добавлены</p>
        )}
      </>
    )}
  </div>

          {/* Процессуальные действия */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection('actions')}
            >
              <h2 className={styles.sectionTitle}>
                <span>Процессуальные действия</span>
                <span className={styles.expandIcon}>
                  {expandedSections.actions ? '▼' : '▶'}
                </span>
              </h2>
            </div>
            
            {expandedSections.actions && (
              <>
                <button 
                  onClick={handleAddProcedureAction}
                  className={styles.addButton}
                >
                  + Добавить действие
                </button>
                
                {procedureActions.length > 0 ? (
                  <div className={styles.sidesList}>
                    {procedureActions.map(action => (
                      <div key={action.id} className={styles.sideItem}>
                        <div className={styles.sideHeader}>
                          <h4>
                            {action.preparation_order_date ? 'Подготовка дела' : 
                            action.preliminary_hearing_order_date ? 'Предварительное заседание' : 
                            'Процессуальное действие'}
                          </h4>
                        </div>
                        {action.control_date && (
                          <p className={styles.sideDetails}>
                            Контроль: {formatDate(action.control_date)}
                          </p>
                        )}
                        <div className={styles.sideActions}>
                          <button 
                            onClick={() => handleEditProcedureAction(action.id)}
                            className={styles.editButton}
                          >
                            Просмотр
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>Действия не добавлены</p>
                )}
              </>
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

export default CivilDetail;