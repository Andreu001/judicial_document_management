import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import baseService from '../../API/baseService';
import styles from './CivilPetition.module.css';

const CivilPetition = () => {
  const { proceedingId, petitionId } = useParams();
  const navigate = useNavigate();
  const [petitionData, setPetitionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    civil_proceedings: proceedingId,
    date_application: '',
    date_decision: '',
    notation: '',
    petition_id: '',
    petitioner_type: '',
    petitioner_id: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [availablePetitions, setAvailablePetitions] = useState([]);
  const [proceedingInfo, setProceedingInfo] = useState(null);
  const [petitionerOptions, setPetitionerOptions] = useState([]);
  const [selectedPetitioner, setSelectedPetitioner] = useState({ type: '', id: '' });

  const isCreateMode = !petitionId || petitionId === 'create' || petitionId === 'undefined';

  useEffect(() => {
    const fetchSides = async () => {
      try {
        // Загружаем все стороны по гражданскому делу
        const sides = await CivilCaseService.getSides(proceedingId);
        const lawyers = await CivilCaseService.getLawyers(proceedingId);
        
        const options = [];
        
        // Форматируем стороны
        sides.forEach(side => {
          let name = '';
          if (side.sides_case_incase_detail) {
            name = side.sides_case_incase_detail.name || 'Не указано';
          } else if (side.plaintiff_name || side.defendant_name) {
            name = side.plaintiff_name || side.defendant_name || 'Сторона';
          }
          
          const role = side.sides_case_role_detail?.name || 
                      (side.plaintiff_name ? 'Истец' : side.defendant_name ? 'Ответчик' : 'Третье лицо');
          
          options.push({
            id: side.id,
            type: 'civil_sides',
            name: name,
            role: role,
            details: role
          });
        });
        
        // Форматируем адвокатов
        lawyers.forEach(lawyer => {
          const name = lawyer.lawyer_detail?.name || lawyer.law_firm_name || 'Адвокат';
          options.push({
            id: lawyer.id,
            type: 'civil_lawyer',
            name: name,
            role: 'Адвокат',
            details: 'Адвокат'
          });
        });
        
        setPetitionerOptions(options);
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

        // Загрузка информации о производстве
        const proceeding = await CivilCaseService.getCivilProceedingById(proceedingId);
        setProceedingInfo(proceeding);

        // Загрузка типов ходатайств из business_card
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
      const data = await CivilCaseService.getPetitionById(proceedingId, petitionId);
      setPetitionData(data);

      // Устанавливаем ID ходатайства
      const petitionIdValue = data.petition_id && data.petition_id.length > 0
        ? data.petition_id[0]
        : (data.petitions_incase_detail?.id || '');

      // Получаем информацию о заявителе из данных
      let petitionerType = '';
      let petitionerId = null;
      
      if (data.petitioner_info) {
        petitionerType = data.petitioner_info.type;
        petitionerId = data.petitioner_info.id;
      }

      setFormData({
        civil_proceedings: proceedingId,
        date_application: data.date_application || '',
        date_decision: data.date_decision || '',
        notation: data.notation || '',
        petition_id: petitionIdValue,
        petitioner_type: petitionerType,
        petitioner_id: petitionerId
      });

      // Устанавливаем selectedPetitioner для отображения в select
      if (petitionerType && petitionerId) {
        setSelectedPetitioner({
          type: petitionerType,
          id: petitionerId
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

      // Опциональные поля
      if (formData.date_application) {
        dataToSend.date_application = formData.date_application;
      }
      if (formData.date_decision) {
        dataToSend.date_decision = formData.date_decision;
      }
      if (formData.notation && formData.notation.trim() !== '') {
        dataToSend.notation = formData.notation;
      }

      // Добавляем информацию о заявителе, если выбрана сторона
      if (formData.petitioner_type && formData.petitioner_id) {
        dataToSend.petitioner_type = formData.petitioner_type;
        dataToSend.petitioner_id = formData.petitioner_id;
      }

      console.log('Отправка данных гражданского ходатайства:', dataToSend);

      if (isCreateMode) {
        await CivilCaseService.createPetition(proceedingId, dataToSend);
        navigate(-1);
      } else {
        await CivilCaseService.updatePetition(proceedingId, petitionId, dataToSend);
        setIsEditing(false);
      }

      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить ходатайство');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить это ходатайство?')) {
      return;
    }

    try {
      await CivilCaseService.deletePetition(proceedingId, petitionId);
      navigate(`/civil-proceedings/${proceedingId}`);
    } catch (err) {
      console.error('Ошибка удаления:', err);
      setError('Не удалось удалить ходатайство');
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
              Дело №{proceedingInfo.case_number_civil}
            </div>
          )}
        </div>

        <div className={styles.headerRight}>
          {!isCreateMode && !isEditing ? (
            <div className={styles.actionButtons}>
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                Редактировать
              </button>
              <button onClick={handleDelete} className={styles.deleteButton}>
                Удалить
              </button>
            </div>
          ) : (
            <div className={styles.editButtons}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : (isCreateMode ? 'Создать ходатайство' : 'Сохранить')}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          {error}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            {isCreateMode ? 'Сведения о ходатайстве' : 'Информация о ходатайстве'}
          </h2>

          <div className={styles.formGrid}>
            {/* Выбор ходатайства */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Виды ходатайств {isCreateMode && '*'}</label>
              {isEditing || isCreateMode ? (
                <select
                  name="petition_id"
                  value={formData.petition_id}
                  onChange={handleInputChange}
                  className={styles.input}
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
                <div className={styles.readOnlyField}>
                  {formData.petition_id ? getPetitionName(formData.petition_id) : 'Не указано'}
                </div>
              )}
            </div>

            {/* Блок выбора стороны */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Сторона, заявившая ходатайство</label>
              {isEditing || isCreateMode ? (
                <select
                  name="petitioner"
                  value={selectedPetitioner.type ? `${selectedPetitioner.type}|${selectedPetitioner.id}` : ''}
                  onChange={handlePetitionerChange}
                  className={styles.select}
                >
                  <option value="">-- Не выбрано --</option>
                  {/* Группировка по типам сторон */}
                  {petitionerOptions.filter(p => p.type === 'civil_sides').length > 0 && (
                    <optgroup label="Стороны">
                      {petitionerOptions
                        .filter(p => p.type === 'civil_sides')
                        .map(p => (
                          <option key={`side-${p.id}`} value={`civil_sides|${p.id}`}>
                            {p.name} ({p.role})
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {petitionerOptions.filter(p => p.type === 'civil_lawyer').length > 0 && (
                    <optgroup label="Адвокаты">
                      {petitionerOptions
                        .filter(p => p.type === 'civil_lawyer')
                        .map(p => (
                          <option key={`lawyer-${p.id}`} value={`civil_lawyer|${p.id}`}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              ) : (
                <div className={styles.readOnlyField}>
                  {petitionData?.petitioner_info?.name || 'Не указано'}
                </div>
              )}
            </div>

            {/* Дата ходатайства */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Дата ходатайства</label>
              {isEditing || isCreateMode ? (
                <input
                  type="date"
                  name="date_application"
                  value={formData.date_application}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <div className={styles.readOnlyField}>
                  {formatDate(formData.date_application)}
                </div>
              )}
            </div>

            {/* Дата решения */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Дата решения по ходатайству</label>
              {isEditing || isCreateMode ? (
                <input
                  type="date"
                  name="date_decision"
                  value={formData.date_decision}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <div className={styles.readOnlyField}>
                  {formatDate(formData.date_decision)}
                </div>
              )}
            </div>

            {/* Примечания */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Примечания</label>
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
                <div className={styles.readOnlyField}>
                  {formData.notation || 'Не указаны'}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isCreateMode && petitionData && (
          <div className={styles.sidebar}>
            <div className={styles.infoSection}>
              <h3 className={styles.infoTitle}>Информация о записи</h3>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Дата создания:</span>
                <span className={styles.infoValue}>
                  {petitionData.created_at ? new Date(petitionData.created_at).toLocaleDateString('ru-RU') : 'Не указано'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Последнее обновление:</span>
                <span className={styles.infoValue}>
                  {petitionData.updated_at ? new Date(petitionData.updated_at).toLocaleDateString('ru-RU') : 'Не указано'}
                </span>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h3 className={styles.infoTitle}>Связанное производство</h3>
              {proceedingInfo && (
                <>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Номер дела:</span>
                    <span className={styles.infoValue}>
                      {proceedingInfo.case_number_civil}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Дата поступления:</span>
                    <span className={styles.infoValue}>
                      {formatDate(proceedingInfo.incoming_date)}
                    </span>
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

export default CivilPetition;