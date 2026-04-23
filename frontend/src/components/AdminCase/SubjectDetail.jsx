import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import styles from './AdministrativeDetail.module.css';

const SubjectDetail = () => {
  const { proceedingId, subjectId } = useParams();
  const navigate = useNavigate();
  
  const [subjectData, setSubjectData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [subjectTypes, setSubjectTypes] = useState([]);
  const [sidesOptions, setSidesOptions] = useState([]);

  useEffect(() => {
    // Загружаем типы субъектов
    setSubjectTypes(AdministrativeCaseService.getSubjectTypes());
    
    // Загружаем список сторон для выбора
    const fetchSides = async () => {
      try {
        const sides = await AdministrativeCaseService.getSides(proceedingId);
        setSidesOptions(sides);
      } catch (err) {
        console.error('Error fetching sides:', err);
      }
    };
    fetchSides();
  }, [proceedingId]);

  useEffect(() => {
    const fetchSubjectData = async () => {
      if (subjectId && subjectId !== 'create' && subjectId !== 'undefined' && subjectId !== 'null') {
        try {
          setLoading(true);
          const data = await AdministrativeCaseService.getSubjectById(proceedingId, subjectId);
          setSubjectData(data);
          setFormData(data);
          setIsEditing(false);
        } catch (err) {
          console.error('Error fetching subject:', err);
          setError('Не удалось загрузить данные субъекта');
        } finally {
          setLoading(false);
        }
      } else {
        // Режим создания
        setSubjectData(null);
        setFormData({
          subject_type: '',
          sides_case_incase: null
        });
        setIsEditing(true);
        setLoading(false);
      }
    };

    fetchSubjectData();
  }, [proceedingId, subjectId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let savedSubject;
      if (subjectId && subjectId !== 'create' && subjectId !== 'undefined' && subjectId !== 'null') {
        savedSubject = await AdministrativeCaseService.updateSubject(proceedingId, subjectId, formData);
      } else {
        savedSubject = await AdministrativeCaseService.createSubject(proceedingId, formData);
      }
      navigate(`/admin-proceedings/${proceedingId}`);
    } catch (err) {
      console.error('Error saving subject:', err);
      setError('Ошибка при сохранении субъекта: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const getSubjectTypeLabel = (value) => {
    const type = subjectTypes.find(t => t.value === value);
    return type?.label || value;
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(`/admin-proceedings/${proceedingId}`)} 
            className={styles.backButton}
          >
            ← Назад к делу
          </button>
          <h1 className={styles.title}>
            {subjectId && subjectId !== 'create' ? 'Редактирование субъекта правонарушения' : 'Добавление субъекта правонарушения'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          {(!isEditing && subjectId && subjectId !== 'create') && (
            <button 
              onClick={() => setIsEditing(true)} 
              className={styles.editButton}
            >
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
                    <h3 className={styles.subsectionTitle}>Субъект административного правонарушения</h3>
                    
                    <div className={styles.field}>
                      <label>Тип субъекта</label>
                      {isEditing ? (
                        <select
                          name="subject_type"
                          value={formData.subject_type || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                          required
                        >
                          <option value="">Выберите тип</option>
                          {subjectTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{getSubjectTypeLabel(subjectData?.subject_type)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Связь со стороной (из карточки дела)</label>
                      {isEditing ? (
                        <select
                          name="sides_case_incase"
                          value={formData.sides_case_incase || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">Не связывать со стороной</option>
                          {sidesOptions.map(side => (
                            <option key={side.id} value={side.id}>
                              {side.sides_case_incase_detail?.name || `Сторона ${side.id}`} - {side.sides_case_role_detail?.name || ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{subjectData?.sides_case_incase_detail?.name || 'Не связан со стороной'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className={styles.editButtons} style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button 
                      type="submit" 
                      className={styles.saveButton}
                      disabled={saving}
                    >
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigate(`/admin-proceedings/${proceedingId}`)} 
                      className={styles.cancelButton}
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;