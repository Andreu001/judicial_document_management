// components/OtherMaterial/OtherMaterialExecutionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OtherMaterialService from '../../API/OtherMaterialService';
import styles from './OtherMaterialDetail.module.css';

const OtherMaterialExecutionDetail = () => {
  const { materialId, executionId } = useParams();
  const navigate = useNavigate();
  const [executionData, setExecutionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    executionResult: []
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const optionsData = await OtherMaterialService.getOtherMaterialOptions();
        setOptions({
          executionResult: optionsData.executionResult || [
            { value: '1', label: 'Исполнено полностью' },
            { value: '2', label: 'Не исполнено' },
            { value: '3', label: 'Частично исполнено' },
          ]
        });
      } catch (err) {
        console.error('Error fetching options:', err);
        setOptions({
          executionResult: [
            { value: '1', label: 'Исполнено полностью' },
            { value: '2', label: 'Не исполнено' },
            { value: '3', label: 'Частично исполнено' },
          ]
        });
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchExecutionData = async () => {
      if (executionId && executionId !== 'create' && executionId !== 'undefined' && executionId !== 'null') {
        try {
          setLoading(true);
          const data = await OtherMaterialService.getExecutionById(materialId, executionId);
          setExecutionData(data);
          setFormData(data);
          setIsEditing(false);
        } catch (err) {
          console.error('Error fetching execution:', err);
          setError('Не удалось загрузить данные исполнения');
        } finally {
          setLoading(false);
        }
      } else {
        setExecutionData(null);
        setFormData({
          execution_document_date: null,
          execution_document_number: '',
          executed: false,
          execution_date: null,
          execution_result: '',
          notes: ''
        });
        setIsEditing(true);
        setLoading(false);
      }
    };

    fetchExecutionData();
  }, [materialId, executionId]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (executionId && executionId !== 'create' && executionId !== 'undefined' && executionId !== 'null') {
        await OtherMaterialService.updateExecution(materialId, executionId, formData);
      } else {
        await OtherMaterialService.createExecution(materialId, formData);
      }
      navigate(-1);
    } catch (err) {
      console.error('Error saving execution:', err);
      setError('Ошибка при сохранении исполнения: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate(-1)} 
            className={styles.backButton}
          >
            ← Назад к материалу
          </button>
          <h1 className={styles.title}>
            {executionId && executionId !== 'create' ? 'Редактирование исполнения' : 'Добавление исполнения'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={handleSubmit} 
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          {(!executionId || executionId === 'create') && (
            <button 
              onClick={() => navigate(-1)} 
              className={styles.cancelButton}
            >
              Отмена
            </button>
          )}
          {executionId && executionId !== 'create' && !isEditing && (
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
                    <h3 className={styles.subsectionTitle}>Исполнительный документ</h3>
                    
                    <div className={styles.field}>
                      <label>Дата исполнительного документа</label>
                      <input
                        type="date"
                        name="execution_document_date"
                        value={formData.execution_document_date || ''}
                        onChange={(e) => handleDateChange('execution_document_date', e.target.value)}
                        className={styles.input}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Номер исполнительного документа</label>
                      <input
                        type="text"
                        name="execution_document_number"
                        value={formData.execution_document_number || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Введите номер исполнительного документа"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Исполнение</h3>
                    
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="executed"
                          checked={formData.executed || false}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                        Исполнено
                      </label>
                    </div>

                    {formData.executed && (
                      <div className={styles.field}>
                        <label>Дата фактического исполнения</label>
                        <input
                          type="date"
                          name="execution_date"
                          value={formData.execution_date || ''}
                          onChange={(e) => handleDateChange('execution_date', e.target.value)}
                          className={styles.input}
                          disabled={!isEditing}
                        />
                      </div>
                    )}

                    <div className={styles.field}>
                      <label>Результат исполнения</label>
                      <select
                        name="execution_result"
                        value={formData.execution_result || ''}
                        onChange={handleInputChange}
                        className={styles.select}
                        disabled={!isEditing}
                      >
                        <option value="">Выберите результат</option>
                        {options.executionResult?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label>Примечания по исполнению</label>
                      <textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows={3}
                        placeholder="Дополнительная информация по исполнению..."
                        disabled={!isEditing}
                      />
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

export default OtherMaterialExecutionDetail;