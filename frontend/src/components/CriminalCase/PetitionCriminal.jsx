import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import baseService from '../../API/baseService';
import styles from './CriminalDetail.module.css'; // Используем единый файл стилей

const PetitionCriminal = () => {
  const { proceedingId, petitionId } = useParams();
  const navigate = useNavigate();
  const [petitionData, setPetitionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    criminal_proceedings: proceedingId,
    date_application: '',
    date_decision: '',
    notation: '',
    petition_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [availablePetitions, setAvailablePetitions] = useState([]);
  const [proceedingInfo, setProceedingInfo] = useState(null);

  const isCreateMode = !petitionId || petitionId === 'create' || petitionId === 'undefined';
  const [petitionerOptions, setPetitionerOptions] = useState([]);
  const [selectedPetitioner, setSelectedPetitioner] = useState({ type: '', id: '' });

  useEffect(() => {
    const fetchSides = async () => {
      try {
        const sides = await CriminalCaseService.getAllSides(proceedingId);
        setPetitionerOptions(sides);
      } catch (err) {
        console.error('Не удалось загрузить список сторон:', err);
      }
    };
    if (proceedingId) {
      fetchSides();
    }
  }, [proceedingId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const proceeding = await CriminalCaseService.getCriminalProceedingById(proceedingId);
        setProceedingInfo(proceeding);

        await loadPetitionsFromBusinessCard();

        if (isCreateMode) {
          setIsEditing(true);
          setLoading(false);
          return;
        }

        if (petitionId && petitionId !== 'create' && petitionId !== 'undefined') {
          await loadPetitionData();
        }

        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Не удалось загрузить данные');
        setLoading(false);
      }
    };

    fetchData();
  }, [proceedingId, petitionId, isCreateMode]);

  const loadPetitionsFromBusinessCard = async () => {
    try {
      const response = await baseService.get('/business_card/petitions/');
      const petitionsData = response.data;
      
      const formattedPetitions = petitionsData.map(petition => ({
        id: petition.id,
        name: petition.petitions || petition.name || `Ходатайство #${petition.id}`,
        petitions: petition.petitions || petition.name || `Ходатайство #${petition.id}`
      }));
      
      setAvailablePetitions(formattedPetitions);
    } catch (err) {
      console.warn('Не удалось загрузить типы ходатайств из business_card:', err);
      setAvailablePetitions([]);
    }
  };

  const loadPetitionData = async () => {
    try {
      const data = await CriminalCaseService.getPetitionById(proceedingId, petitionId);
      setPetitionData(data);

      const petitionIdValue = data.petition_id && data.petition_id.length > 0
        ? data.petition_id[0]
        : (data.petition_detail?.id || '');
        
      setFormData({
        criminal_proceedings: proceedingId,
        date_application: data.date_application || '',
        date_decision: data.date_decision || '',
        notation: data.notation || '',
        petition_id: petitionIdValue,
        petitioner_type: data.petitioner_info?.type || '',
        petitioner_id: data.petitioner_info?.id || null
      });

      if (data.petitioner_info) {
        setSelectedPetitioner({
          type: data.petitioner_info.type,
          id: data.petitioner_info.id
        });
      }

    } catch (err) {
      console.error('Ошибка загрузки ходатайства:', err);
      setError('Ходатайство не найдено');
    }
  };

  const handlePetitionerChange = (e) => {
    const [type, id] = e.target.value.split('|');
    setSelectedPetitioner({ type, id: parseInt(id) });
    setFormData(prev => ({
      ...prev,
      petitioner_type: type,
      petitioner_id: parseInt(id)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.petition_id) {
        setError('Необходимо выбрать тип ходатайства');
        setSaving(false);
        return;
      }

      const dataToSend = {
        petition_id: parseInt(formData.petition_id)
      };

      if (formData.date_application) {
        dataToSend.date_application = formData.date_application;
      }
      if (formData.date_decision) {
        dataToSend.date_decision = formData.date_decision;
      }
      if (formData.notation && formData.notation.trim() !== '') {
        dataToSend.notation = formData.notation;
      }

      if (formData.petitioner_type && formData.petitioner_id) {
        dataToSend.petitioner_type = formData.petitioner_type;
        dataToSend.petitioner_id = formData.petitioner_id;
      }

      if (isCreateMode) {
        await CriminalCaseService.createPetition(proceedingId, dataToSend);
        navigate(-1);
      } else {
        await CriminalCaseService.updatePetition(proceedingId, petitionId, dataToSend);
        setIsEditing(false);
      }

      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить ходатайство');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getPetitionName = (petitionId) => {
    const petition = availablePetitions.find(p => p.id == petitionId);
    return petition ? petition.name : `Ходатайство #${petitionId}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
          <h1 className={styles.title}>
            {isCreateMode ? 'Добавление ходатайства' : 'Ходатайство по делу'}
          </h1>
          {proceedingInfo && (
            <div className={styles.caseInfo}>
              Дело №{proceedingInfo.case_number_criminal}
            </div>
          )}
        </div>

        <div className={styles.headerRight}>
          {!isCreateMode && !isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          ) : (
            <>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabContentWrapper}>
              <div className={styles.tabContent}>
                <div className={styles.fieldGroup}>
                  <h3 className={styles.subsectionTitle}>
                    {isCreateMode ? 'Сведения о ходатайстве' : 'Информация о ходатайстве'}
                  </h3>

                  <div className={styles.tabGrid}>
                    <div className={styles.field}>
                      <label>Виды ходатайств {isCreateMode && '*'}</label>
                      {isEditing || isCreateMode ? (
                        <select
                          name="petition_id"
                          value={formData.petition_id}
                          onChange={handleInputChange}
                          className={styles.select}
                          required={isCreateMode}
                        >
                          <option value="">-- Выберите тип ходатайства --</option>
                          {availablePetitions.map(petition => (
                            <option key={petition.id} value={petition.id}>
                              {petition.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={styles.staticValue}>
                          {formData.petition_id ? getPetitionName(formData.petition_id) : 'Не указано'}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сторона, заявившая ходатайство</label>
                      {isEditing || isCreateMode ? (
                        <select
                          name="petitioner"
                          value={selectedPetitioner.type ? `${selectedPetitioner.type}|${selectedPetitioner.id}` : ''}
                          onChange={handlePetitionerChange}
                          className={styles.select}
                        >
                          <option value="">-- Не выбрано --</option>
                          {petitionerOptions.filter(p => p.type === 'defendant').length > 0 && (
                            <optgroup label="Обвиняемые">
                              {petitionerOptions
                                .filter(p => p.type === 'defendant')
                                .map(p => (
                                  <option key={`defendant-${p.id}`} value={`defendant|${p.id}`}>
                                    {p.name} ({p.details})
                                  </option>
                                ))}
                            </optgroup>
                          )}
                          {petitionerOptions.filter(p => p.type === 'lawyer').length > 0 && (
                            <optgroup label="Адвокаты">
                              {petitionerOptions
                                .filter(p => p.type === 'lawyer')
                                .map(p => (
                                  <option key={`lawyer-${p.id}`} value={`lawyer|${p.id}`}>
                                    {p.name}
                                  </option>
                                ))}
                            </optgroup>
                          )}
                          {petitionerOptions.filter(p => p.type === 'side').length > 0 && (
                            <optgroup label="Иные стороны">
                              {petitionerOptions
                                .filter(p => p.type === 'side')
                                .map(p => (
                                  <option key={`side-${p.id}`} value={`side|${p.id}`}>
                                    {p.name} ({p.role})
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </select>
                      ) : (
                        <span className={styles.staticValue}>
                          {petitionData?.petitioner_info?.name || 'Не указано'}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата ходатайства</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="date"
                          name="date_application"
                          value={formData.date_application}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span className={styles.staticValue}>
                          {formatDate(formData.date_application)}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата решения по ходатайству</label>
                      {isEditing || isCreateMode ? (
                        <input
                          type="date"
                          name="date_decision"
                          value={formData.date_decision}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span className={styles.staticValue}>
                          {formatDate(formData.date_decision)}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Примечания</label>
                      {isEditing || isCreateMode ? (
                        <textarea
                          name="notation"
                          value={formData.notation}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={4}
                          placeholder="Введите примечания к ходатайству..."
                        />
                      ) : (
                        <span className={styles.staticValue}>
                          {formData.notation || 'Не указаны'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isCreateMode && petitionData && (
          <div className={styles.sidebar}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Информация о записи</h2>
              <div className={styles.infoField}>
                <label>Дата создания:</label>
                <span>
                  {petitionData.created_at ? new Date(petitionData.created_at).toLocaleDateString('ru-RU') : 'Не указано'}
                </span>
              </div>
              <div className={styles.infoField}>
                <label>Последнее обновление:</label>
                <span>
                  {petitionData.updated_at ? new Date(petitionData.updated_at).toLocaleDateString('ru-RU') : 'Не указано'}
                </span>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Связанное производство</h2>
              {proceedingInfo && (
                <>
                  <div className={styles.infoField}>
                    <label>Номер дела:</label>
                    <span>{proceedingInfo.case_number_criminal}</span>
                  </div>
                  <div className={styles.infoField}>
                    <label>Дата поступления:</label>
                    <span>{formatDate(proceedingInfo.incoming_date)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetitionCriminal;