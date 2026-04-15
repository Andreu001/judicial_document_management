// components/OtherMaterial/OtherMaterialDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OtherMaterialService from '../../API/OtherMaterialService';
import styles from './OtherMaterialDetail.module.css';
import ConfirmDialog from '../../pages/ConfirmDialog';
import {
  BasicInfoTab,
  ConsiderationTab,
  AdditionalInfoTab
} from './OtherMaterialTabComponents';

const OtherMaterialDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [materialData, setMaterialData] = useState(null);
  const [sides, setSides] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [movements, setMovements] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [options, setOptions] = useState({
    status: [],
    responsiblePersonRoles: []
  });
  const [isArchived, setIsArchived] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Подтверждение',
    message: '',
    onConfirm: null
  });
  const [responsiblePersons, setResponsiblePersons] = useState([]);
  
  const [collapsedSections, setCollapsedSections] = useState({
    sides: true,
    lawyers: true,
    movements: true,
    petitions: true
  });

  useEffect(() => {
    const fetchMaterialDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const materialResponse = await OtherMaterialService.getOtherMaterialById(id);
        
        if (materialResponse) {
          setMaterialData(materialResponse);
          setFormData(materialResponse);
          setIsArchived(materialResponse.status === 'archived');
          
          const sidesResponse = await OtherMaterialService.getSides(materialResponse.id);
          setSides(sidesResponse);
          
          const lawyersResponse = await OtherMaterialService.getLawyers(materialResponse.id);
          setLawyers(lawyersResponse);
          
          const movementsResponse = await OtherMaterialService.getMovements(materialResponse.id);
          setMovements(movementsResponse);
          
          const petitionsResponse = await OtherMaterialService.getPetitions(materialResponse.id);
          setPetitions(petitionsResponse);
        } else {
          setError('Материал не найден');
        }

        await Promise.all([
          loadOptions(),
          loadResponsiblePersons()
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Не удалось загрузить данные материала');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMaterialDetails();
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      const optionsData = await OtherMaterialService.getOtherMaterialOptions();
      setOptions(optionsData);
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
    }
  };

  const loadResponsiblePersons = async () => {
    try {
      const persons = await OtherMaterialService.getResponsiblePersons();
      setResponsiblePersons(persons);
    } catch (error) {
      console.error('Ошибка загрузки судьи:', error);
      setResponsiblePersons([]);
    }
  };

  const handleFieldChange = useCallback((name, value) => {
    if (isArchived && isEditing) {
      const editableFields = ['archive_notes', 'archived_date', 'status', 'special_notes'];
      if (!editableFields.includes(name)) {
        alert('Это поле нельзя редактировать в архивном материале');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, [isArchived, isEditing]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    handleFieldChange(name, type === 'checkbox' ? checked : value);
  }, [handleFieldChange]);

  const handleDateChange = useCallback((name, dateString) => {
    handleFieldChange(name, dateString || null);
  }, [handleFieldChange]);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend = { ...formData };
      
      delete dataToSend.sides;
      delete dataToSend.lawyers;
      delete dataToSend.movements;
      delete dataToSend.petitions;
      delete dataToSend.id;
      delete dataToSend.responsible_person_full_name;
      delete dataToSend.status_display;
      delete dataToSend.registered_case_info;
      delete dataToSend.documents_count;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;

      if (isArchived) {
        const allowedFields = ['archive_notes', 'archived_date', 'status', 'special_notes'];
        Object.keys(dataToSend).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete dataToSend[key];
          }
        });
      }

      const updatedData = await OtherMaterialService.updateOtherMaterial(id, dataToSend);
      
      setMaterialData(updatedData);
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
      message: 'Отправить материал в архив? После архивации материал будет доступен только в разделе "Архив".',
      onConfirm: async () => {
        try {
          await OtherMaterialService.archiveOtherMaterial(id);
          navigate('/archive');
        } catch (err) {
          console.error('Error archiving:', err);
          alert('Ошибка отправки в архив');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUnarchive = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Возврат из архива',
      message: 'Вернуть материал из архива?',
      onConfirm: async () => {
        try {
          await OtherMaterialService.unarchiveOtherMaterial(id);
          const updatedData = await OtherMaterialService.getOtherMaterialById(id);
          setMaterialData(updatedData);
          setFormData(updatedData);
          setIsArchived(false);
          alert('Материал возвращен из архива');
        } catch (err) {
          console.error('Error unarchiving:', err);
          alert('Ошибка возврата из архива');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCancel = () => {
    setFormData(materialData);
    setIsEditing(false);
  };

  // Навигация для создания
  const handleAddSide = () => navigate(`/other-materials/${id}/sides/create`);
  const handleAddLawyer = () => navigate(`/other-materials/${id}/lawyers/create`);
  const handleAddMovement = () => navigate(`/other-materials/${id}/movements/create`);
  const handleAddPetition = () => navigate(`/other-materials/${id}/petitions/create`);

  // Навигация для просмотра
  const handleViewSide = (sideId) => navigate(`/other-materials/${id}/sides/${sideId}`);
  const handleViewLawyer = (lawyerId) => navigate(`/other-materials/${id}/lawyers/${lawyerId}`);
  const handleViewMovement = (movementId) => navigate(`/other-materials/${id}/movements/${movementId}`);
  const handleViewPetition = (petitionId) => navigate(`/other-materials/${id}/petitions/${petitionId}`);

  // Удаление
  const handleDeleteSide = async (sideId) => {
    if (window.confirm('Удалить сторону?')) {
      try {
        await OtherMaterialService.deleteSide(id, sideId);
        setSides(sides.filter(s => s.id !== sideId));
      } catch (error) {
        console.error('Ошибка удаления стороны:', error);
        alert('Не удалось удалить сторону');
      }
    }
  };

  const handleDeleteLawyer = async (lawyerId) => {
    if (window.confirm('Удалить представителя?')) {
      try {
        await OtherMaterialService.deleteLawyer(id, lawyerId);
        setLawyers(lawyers.filter(l => l.id !== lawyerId));
      } catch (error) {
        console.error('Ошибка удаления представителя:', error);
        alert('Не удалось удалить представителя');
      }
    }
  };

  const handleDeleteMovement = async (movementId) => {
    if (window.confirm('Удалить движение?')) {
      try {
        await OtherMaterialService.deleteMovement(id, movementId);
        setMovements(movements.filter(m => m.id !== movementId));
      } catch (error) {
        console.error('Ошибка удаления движения:', error);
        alert('Не удалось удалить движение');
      }
    }
  };

  const handleDeletePetition = async (petitionId) => {
    if (window.confirm('Удалить ходатайство/заявление?')) {
      try {
        await OtherMaterialService.deletePetition(id, petitionId);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOptionLabel = (optionsArray, value) => {
    if (!optionsArray || !value) return 'Не указано';
    const option = optionsArray.find(opt => opt.value === value);
    return option?.label || 'Не указано';
  };

  // Объединяем всех участников для отображения
  const allParticipants = [
    ...sides.map(s => ({ 
      ...s, 
      type: 'side', 
      typeLabel: 'Сторона',
      displayName: s.sides_case_incase_detail?.name || 'Сторона',
      roleText: s.sides_case_role_detail?.name || 'Сторона',
      detailPath: `/other-materials/${id}/sides/${s.id}`
    })),
    ...lawyers.map(l => ({ 
      ...l, 
      type: 'lawyer', 
      typeLabel: 'Представитель',
      displayName: l.lawyer_detail?.law_firm_name || 'Представитель',
      roleText: 'Представитель',
      detailPath: `/other-materials/${id}/lawyers/${l.id}`
    }))
  ];

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!materialData && id) {
    return <div className={styles.error}>Материал не найден</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
          <h1 className={styles.title}>
            Иной материал №{materialData?.registration_number || 'Не указано'}
            {isArchived && <span className={styles.archiveBadge}>АРХИВ</span>}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          {isArchived ? (
            <button onClick={handleUnarchive} className={styles.unarchiveButton}>
              📤 Вернуть из архива
            </button>
          ) : (
            <button onClick={handleArchive} className={styles.archiveButton}>
              📁 Сдать в архив
            </button>
          )}
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              className={styles.editButton}
              disabled={isArchived}
              title={isArchived ? "Редактирование архивных материалов ограничено" : ""}
            >
              Редактировать
            </button>
          ) : (
            <div className={styles.editButtons}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Основные сведения
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'consideration' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('consideration')}
              >
                Рассмотрение
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
                  materialData={materialData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  getOptionLabel={getOptionLabel}
                  formatDate={formatDate}
                  isArchived={isArchived}
                  responsiblePersons={responsiblePersons}
                />
              )}
              {activeTab === 'consideration' && (
                <ConsiderationTab
                  isEditing={isEditing && !isArchived}
                  formData={formData}
                  options={options}
                  materialData={materialData}
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
                  materialData={materialData}
                  handleDateChange={handleDateChange}
                  handleInputChange={handleInputChange}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  isArchived={isArchived}
                />
              )}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          {/* Блок "Участники" */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionHeader} onClick={() => toggleSection('sides')}>
              <h2 className={styles.sidebarSectionTitle}>
                Участники 
                <span className={styles.sidebarSectionCount}>{allParticipants.length}</span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.sides ? '▶' : '▼'}
              </button>
            </div>
            
            {!collapsedSections.sides && (
              <div className={styles.sidebarSectionContent}>
                <button onClick={handleAddSide} className={styles.addButton}>
                  + Добавить сторону
                </button>
                <button onClick={handleAddLawyer} className={styles.addButton} style={{ marginTop: '8px' }}>
                  + Добавить представителя
                </button>
                
                {allParticipants.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {allParticipants.slice(0, 5).map(participant => (
                      <div 
                        key={`${participant.type}-${participant.id}`} 
                        className={`${styles.sidebarListItem} ${styles[`participantType-${participant.type}`]}`}
                        onClick={() => navigate(participant.detailPath)}
                      >
                        <div className={styles.sidebarListItemHeader}>
                          <span className={styles.sidebarListItemTitle}>
                            {participant.displayName}
                          </span>
                          <span className={`${styles.participantType} ${styles[`participantType-${participant.type}`]}`}>
                            {participant.typeLabel}
                          </span>
                        </div>
                        <div className={styles.sidebarListItemSubtitle}>
                          {participant.roleText}
                        </div>
                        <div className={styles.sidebarListItemHint}>
                          Нажмите для просмотра →
                        </div>
                      </div>
                    ))}
                    {allParticipants.length > 5 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {allParticipants.length - 5} участников
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Нет данных об участниках</p>
                )}
              </div>
            )}
          </div>

          {/* Блок "Движения" */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionHeader} onClick={() => toggleSection('movements')}>
              <h2 className={styles.sidebarSectionTitle}>
                Движения 
                <span className={styles.sidebarSectionCount}>{movements.length}</span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.movements ? '▶' : '▼'}
              </button>
            </div>
            
            {!collapsedSections.movements && (
              <div className={styles.sidebarSectionContent}>
                <button onClick={handleAddMovement} className={styles.addButton}>
                  + Добавить движение
                </button>
                
                {movements.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {movements.slice(0, 3).map(movement => {
                      const movementData = movement.business_movement_detail || movement;
                      return (
                        <div 
                          key={movement.id} 
                          className={`${styles.sidebarListItem} ${styles.participantType-movement}`}
                          onClick={() => handleViewMovement(movement.id)}
                        >
                          <div className={styles.sidebarListItemHeader}>
                            <span className={styles.sidebarListItemTitle}>
                              {movementData.date_meeting ? formatDate(movementData.date_meeting) : 'Движение'}
                            </span>
                            <span className={`${styles.participantType} ${styles.participantType-movement}`}>
                              Движение
                            </span>
                          </div>
                          {movementData.result_court_session && (
                            <div className={styles.sidebarListItemSubtitle}>
                              {movementData.result_court_session.slice(0, 50)}
                              {movementData.result_court_session.length > 50 && '...'}
                            </div>
                          )}
                          <div className={styles.sidebarListItemHint}>
                            Нажмите для просмотра →
                          </div>
                        </div>
                      );
                    })}
                    {movements.length > 3 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {movements.length - 3} движений
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Движения не добавлены</p>
                )}
              </div>
            )}
          </div>

          {/* Блок "Ходатайства/заявления" */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionHeader} onClick={() => toggleSection('petitions')}>
              <h2 className={styles.sidebarSectionTitle}>
                Ходатайства/заявления 
                <span className={styles.sidebarSectionCount}>{petitions.length}</span>
              </h2>
              <button className={styles.sidebarToggleButton}>
                {collapsedSections.petitions ? '▶' : '▼'}
              </button>
            </div>
            
            {!collapsedSections.petitions && (
              <div className={styles.sidebarSectionContent}>
                <button onClick={handleAddPetition} className={styles.addButton}>
                  + Добавить ходатайство/заявление
                </button>
                
                {petitions.length > 0 ? (
                  <div className={styles.sidebarList}>
                    {petitions.slice(0, 3).map(petition => {
                      const petitionDetail = petition.petitions_incase_detail || {};
                      return (
                        <div 
                          key={petition.id} 
                          className={`${styles.sidebarListItem} ${styles.participantType-petition}`}
                          onClick={() => handleViewPetition(petition.id)}
                        >
                          <div className={styles.sidebarListItemHeader}>
                            <span className={styles.sidebarListItemTitle}>
                              {petitionDetail.date_application ? formatDate(petitionDetail.date_application) : 'Ходатайство'}
                            </span>
                            <span className={`${styles.participantType} ${styles.participantType-petition}`}>
                              Ходатайство
                            </span>
                          </div>
                          {petitionDetail.petitions_name && petitionDetail.petitions_name.length > 0 && (
                            <div className={styles.sidebarListItemSubtitle}>
                              Тип: {petitionDetail.petitions_name.map(p => p.name).join(', ')}
                            </div>
                          )}
                          <div className={styles.sidebarListItemHint}>
                            Нажмите для просмотра →
                          </div>
                        </div>
                      );
                    })}
                    {petitions.length > 3 && (
                      <div className={styles.sidebarListItemMore}>
                        + еще {petitions.length - 3} ходатайств
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.sidebarNoData}>Ходатайства/заявления не добавлены</p>
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

export default OtherMaterialDetail;