// components/OtherMaterial/OtherMaterialPetitionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OtherMaterialService from '../../API/OtherMaterialService';
import styles from './OtherMaterialDetail.module.css';

const OtherMaterialPetitionDetail = () => {
  const { materialId, petitionId } = useParams();
  const navigate = useNavigate();
  const [petitionData, setPetitionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    petitioner_type: '',
    petitioner_id: null,
    petitions_name: [],
    date_application: '',
    decision_rendered: null,
    date_decision: '',
    notation: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [petitionTypes, setPetitionTypes] = useState([]);
  const [sidesList, setSidesList] = useState([]);
  const [lawyersList, setLawyersList] = useState([]);
  const [decisionsList, setDecisionsList] = useState([]);

  useEffect(() => {
    const fetchPetitionData = async () => {
      try {
        setLoading(true);
        
        // Загружаем типы ходатайств
        const typesResponse = await OtherMaterialService.getPetitionTypes?.() || [];
        setPetitionTypes(typesResponse);
        
        // Загружаем стороны и представителей для выбора заявителя
        const sides = await OtherMaterialService.getSides(materialId);
        setSidesList(sides);
        
        const lawyers = await OtherMaterialService.getLawyers(materialId);
        setLawyersList(lawyers);
        
        if (petitionId && petitionId !== 'create' && petitionId !== 'undefined' && petitionId !== 'null') {
          const data = await OtherMaterialService.getPetitionById(materialId, petitionId);
          setPetitionData(data);
          
          const petitionDetail = data.petitions_incase_detail || {};
          
          setFormData({
            petitioner_type: data.petitioner_type || '',
            petitioner_id: data.petitioner_id || null,
            petitions_name: petitionDetail.petitions_name?.map(p => p.id) || [],
            date_application: petitionDetail.date_application || '',
            decision_rendered: petitionDetail.decision_rendered?.id || null,
            date_decision: petitionDetail.date_decision || '',
            notation: petitionDetail.notation || ''
          });
          setIsEditing(false);
        } else {
          setFormData({
            petitioner_type: '',
            petitioner_id: null,
            petitions_name: [],
            date_application: '',
            decision_rendered: null,
            date_decision: '',
            notation: ''
          });
          setIsEditing(true);
        }
      } catch (err) {
        console.error('Error fetching petition data:', err);
        setError('Не удалось загрузить данные ходатайства');
      } finally {
        setLoading(false);
      }
    };

    fetchPetitionData();
  }, [materialId, petitionId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handlePetitionTypesChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      petitions_name: selectedOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const petitionData = {
        petitioner_type: formData.petitioner_type || null,
        petitioner_id: formData.petitioner_id || null,
        petitions_name: formData.petitions_name,
        date_application: formData.date_application,
        decision_rendered: formData.decision_rendered,
        date_decision: formData.date_decision || null,
        notation: formData.notation || ''
      };

      if (petitionId && petitionId !== 'create' && petitionId !== 'undefined' && petitionId !== 'null') {
        await OtherMaterialService.updatePetition(materialId, petitionId, petitionData);
      } else {
        await OtherMaterialService.createPetition(materialId, petitionData);
      }
      
      navigate(-1);
    } catch (err) {
      console.error('Error saving petition:', err);
      setError('Ошибка при сохранении ходатайства: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const getPetitionerOptions = () => {
    const options = [];
    
    if (sidesList.length > 0) {
      sidesList.forEach(side => {
        const sideDetail = side.sides_case_incase_detail || {};
        options.push({
          value: `side_${side.id}`,
          type: 'admin_sides',
          id: side.id,
          label: `[Сторона] ${sideDetail.name || 'Без имени'} - ${side.sides_case_role_detail?.name || 'Сторона'}`
        });
      });
    }
    
    if (lawyersList.length > 0) {
      lawyersList.forEach(lawyer => {
        const lawyerDetail = lawyer.lawyer_detail || {};
        options.push({
          value: `lawyer_${lawyer.id}`,
          type: 'admin_lawyer',
          id: lawyer.id,
          label: `[Представитель] ${lawyerDetail.law_firm_name || 'Без названия'}`
        });
      });
    }
    
    return options;
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
          <h1 className={styles.title}>
            {petitionId && petitionId !== 'create' ? 'Редактирование ходатайства/заявления' : 'Добавление ходатайства/заявления'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button onClick={handleSubmit} className={styles.saveButton} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          {(!petitionId || petitionId === 'create') && (
            <button onClick={() => navigate(-1)} className={styles.cancelButton}>
              Отмена
            </button>
          )}
          {petitionId && petitionId !== 'create' && !isEditing && (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabContentWrapper}>
              <form onSubmit={handleSubmit}>
                <div className={styles.tabGrid}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Информация о ходатайстве</h3>
                    
                    <div className={styles.field}>
                      <label>Заявитель</label>
                      {isEditing ? (
                        <select
                          name="petitioner"
                          value={formData.petitioner_type && formData.petitioner_id ? `${formData.petitioner_type}_${formData.petitioner_id}` : ''}
                          onChange={(e) => {
                            const [type, id] = e.target.value.split('_');
                            setFormData(prev => ({
                              ...prev,
                              petitioner_type: type || null,
                              petitioner_id: id ? parseInt(id) : null
                            }));
                          }}
                          className={styles.select}
                        >
                          <option value="">Выберите заявителя</option>
                          {getPetitionerOptions().map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>
                          {(() => {
                            if (!formData.petitioner_type) return 'Не указано';
                            const petitioner = formData.petitioner_type === 'admin_sides' 
                              ? sidesList.find(s => s.id === formData.petitioner_id)
                              : lawyersList.find(l => l.id === formData.petitioner_id);
                            if (!petitioner) return 'Не указано';
                            const detail = formData.petitioner_type === 'admin_sides'
                              ? petitioner.sides_case_incase_detail
                              : petitioner.lawyer_detail;
                            return detail?.name || detail?.law_firm_name || 'Не указано';
                          })()}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Тип ходатайства/заявления *</label>
                      {isEditing ? (
                        <select
                          multiple
                          value={formData.petitions_name || []}
                          onChange={handlePetitionTypesChange}
                          className={styles.select}
                          required
                          size="4"
                        >
                          {petitionTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.petitions || type.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>
                          {formData.petitions_name?.map(id => {
                            const type = petitionTypes.find(t => t.id === id);
                            return type?.petitions || type?.name || id;
                          }).join(', ') || 'Не указано'}
                        </span>
                      )}
                      {isEditing && (
                        <small style={{ color: '#718096', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
                          Для выбора нескольких удерживайте Ctrl (Cmd на Mac)
                        </small>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата подачи *</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="date_application"
                          value={formData.date_application || ''}
                          onChange={(e) => handleDateChange('date_application', e.target.value)}
                          className={styles.input}
                          required
                        />
                      ) : (
                        <span>{formData.date_application ? new Date(formData.date_application).toLocaleDateString('ru-RU') : 'Не указано'}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Решение по ходатайству</h3>
                    
                    <div className={styles.field}>
                      <label>Решение по ходатайству</label>
                      {isEditing ? (
                        <select
                          name="decision_rendered"
                          value={formData.decision_rendered || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Не выбрано</option>
                          {decisionsList.map(decision => (
                            <option key={decision.id} value={decision.id}>
                              {decision.name_case || `Решение ${decision.id}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>
                          {formData.decision_rendered 
                            ? decisionsList.find(d => d.id === formData.decision_rendered)?.name_case || `Решение ${formData.decision_rendered}`
                            : 'Не указано'}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата решения</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="date_decision"
                          value={formData.date_decision || ''}
                          onChange={(e) => handleDateChange('date_decision', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formData.date_decision ? new Date(formData.date_decision).toLocaleDateString('ru-RU') : 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Примечания</label>
                      {isEditing ? (
                        <textarea
                          name="notation"
                          value={formData.notation || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={3}
                          placeholder="Дополнительные примечания..."
                        />
                      ) : (
                        <span>{formData.notation || 'Нет'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherMaterialPetitionDetail;