import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';

const CivilExecutionDetail = () => {
  const { proceedingId, executionId } = useParams();
  const navigate = useNavigate();
  const isEditing = executionId && executionId !== 'create';
  
  const [formData, setFormData] = useState({
    writ_execution_date: '',
    writ_received_by: '',
    execution_deadline: '',
    execution_result: '',
    execution_date: '',
    legal_costs: '',
    legal_costs_awarded: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    execution_result: []
  });

  useEffect(() => {
    loadOptions();
    if (isEditing) {
      loadExecutionData();
    }
  }, [proceedingId, executionId]);

  const loadOptions = async () => {
    try {
      const response = await CivilCaseService.getCivilDecisionOptions();
      setOptions({
        execution_result: response.execution_result || [
          { value: '1', label: 'Исполнено' },
          { value: '2', label: 'Не исполнено' },
          { value: '3', label: 'Возвращён без исполнения' },
          { value: '4', label: 'Частично исполнено' },
        ]
      });
    } catch (error) {
      console.error('Ошибка загрузки опций:', error);
    }
  };

  const loadExecutionData = async () => {
    try {
      setLoading(true);
      const data = await CivilCaseService.getExecutionById(proceedingId, executionId);
      setFormData({
        writ_execution_date: data.writ_execution_date || '',
        writ_received_by: data.writ_received_by || '',
        execution_deadline: data.execution_deadline || '',
        execution_result: data.execution_result || '',
        execution_date: data.execution_date || '',
        legal_costs: data.legal_costs || '',
        legal_costs_awarded: data.legal_costs_awarded || '',
        notes: data.notes || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных исполнения:', error);
      setError('Не удалось загрузить данные исполнения');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    try {
      setSaving(true);
      
      const dataToSend = { ...formData };
      
      // Очищаем пустые строки
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          delete dataToSend[key];
        }
      });

      if (isEditing) {
        await CivilCaseService.updateExecution(proceedingId, executionId, dataToSend);
      } else {
        await CivilCaseService.createExecution(proceedingId, dataToSend);
      }
      
      navigate(`/civil-proceedings/${proceedingId}`);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setError('Не удалось сохранить данные');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/civil-proceedings/${proceedingId}`);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString;
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
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
            {isEditing ? 'Редактирование исполнения' : 'Новое исполнение'}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          <button 
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Отмена
          </button>
          <button 
            onClick={handleSubmit}
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.tabContent}>
        <div className={styles.tabGrid}>
          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Исполнительный лист</h3>
            
            <div className={styles.field}>
              <label>Дата выдачи исполнительного листа</label>
              <input
                type="date"
                name="writ_execution_date"
                value={formatDateForInput(formData.writ_execution_date)}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label>Кому выдан исполнительный лист</label>
              <input
                type="text"
                name="writ_received_by"
                value={formData.writ_received_by}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Наименование организации или ФИО"
              />
            </div>

            <div className={styles.field}>
              <label>Срок предъявления к исполнению</label>
              <input
                type="date"
                name="execution_deadline"
                value={formatDateForInput(formData.execution_deadline)}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Результат исполнения</h3>
            
            <div className={styles.field}>
              <label>Результат исполнения</label>
              <select
                name="execution_result"
                value={formData.execution_result}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите результат</option>
                {options.execution_result.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Дата фактического исполнения</label>
              <input
                type="date"
                name="execution_date"
                value={formatDateForInput(formData.execution_date)}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Судебные издержки</h3>
            
            <div className={styles.field}>
              <label>Судебные издержки (руб.)</label>
              <input
                type="number"
                name="legal_costs"
                value={formData.legal_costs}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className={styles.field}>
              <label>Присуждённые издержки (руб.)</label>
              <input
                type="number"
                name="legal_costs_awarded"
                value={formData.legal_costs_awarded}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Дополнительная информация</h3>
            
            <div className={styles.field}>
              <label>Примечания</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className={styles.textarea}
                rows="4"
                placeholder="Дополнительные сведения об исполнении..."
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CivilExecutionDetail;