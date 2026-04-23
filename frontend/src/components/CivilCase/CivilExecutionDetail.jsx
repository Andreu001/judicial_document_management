import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';

const CivilExecutionDetail = () => {
  const { proceedingId, executionId } = useParams();
  const navigate = useNavigate();
  const isEditing = executionId && executionId !== 'create';
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    execution_result: []
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await CivilCaseService.getCivilDecisionOptions();
        setOptions({
          execution_result: response.execution_result || [
            { value: '1', label: 'Исполнено' },
            { value: '2', label: 'Не исполнено' },
            { value: '3', label: 'Возвращено без исполнения' },
            { value: '4', label: 'Частично исполнено' },
          ]
        });
      } catch (error) {
        console.error('Ошибка загрузки опций:', error);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const loadExecutionData = async () => {
      if (isEditing) {
        try {
          setLoading(true);
          const data = await CivilCaseService.getExecutionById(proceedingId, executionId);
          setFormData(data);
        } catch (error) {
          console.error('Ошибка загрузки данных исполнения:', error);
          setError('Не удалось загрузить данные исполнения');
        } finally {
          setLoading(false);
        }
      } else {
        setFormData({});
        setLoading(false);
      }
    };

    loadExecutionData();
  }, [proceedingId, executionId, isEditing]);

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

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
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
    } finally {
      setSaving(false);
    }
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
            onClick={() => navigate(-1)}
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

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <form onSubmit={handleSubmit}>
            <div className={styles.tabGrid}>
              {/* Блок 5.1: Основные сведения об исполнении */}
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>Основные сведения</h3>
                
                <div className={styles.field}>
                  <label>Дата вступления решения в законную силу</label>
                  <input
                    type="date"
                    name="decision_effective_date"
                    value={formatDateForInput(formData.decision_effective_date)}
                    onChange={(e) => handleDateChange('decision_effective_date', e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Дата направления исп. листа суд. приставу</label>
                  <input
                    type="date"
                    name="writ_sent_to_bailiff_date"
                    value={formatDateForInput(formData.writ_sent_to_bailiff_date)}
                    onChange={(e) => handleDateChange('writ_sent_to_bailiff_date', e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Дата выдачи исп. листа взыскателю</label>
                  <input
                    type="date"
                    name="writ_issued_to_claimant_date"
                    value={formatDateForInput(formData.writ_issued_to_claimant_date)}
                    onChange={(e) => handleDateChange('writ_issued_to_claimant_date', e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Дата направления отделом делопроизводства для исполнения</label>
                  <input
                    type="date"
                    name="writ_sent_by_department_date"
                    value={formatDateForInput(formData.writ_sent_by_department_date)}
                    onChange={(e) => handleDateChange('writ_sent_by_department_date', e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Дата исполнения</label>
                  <input
                    type="date"
                    name="execution_date"
                    value={formatDateForInput(formData.execution_date)}
                    onChange={(e) => handleDateChange('execution_date', e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Вид взыскания</label>
                  <input
                    type="text"
                    name="execution_type"
                    value={formData.execution_type || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="например: денежные средства, имущество"
                  />
                </div>

                <div className={styles.field}>
                  <label>Сумма взыскания (руб.)</label>
                  <input
                    type="number"
                    name="execution_amount"
                    value={formData.execution_amount || ''}
                    onChange={handleNumberChange}
                    className={styles.input}
                    step="0.01"
                  />
                </div>
              </div>

              {/* Блок 5.2: Результат исполнения */}
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>Результат исполнения</h3>
                
                <div className={styles.field}>
                  <label>Результат исполнения</label>
                  <select
                    name="execution_result"
                    value={formData.execution_result || ''}
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
                  <label>Дата возврата из подразделения ССП</label>
                  <input
                    type="date"
                    name="returned_from_bailiff_date"
                    value={formatDateForInput(formData.returned_from_bailiff_date)}
                    onChange={(e) => handleDateChange('returned_from_bailiff_date', e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Вид взыскания (при возврате)</label>
                  <input
                    type="text"
                    name="returned_type"
                    value={formData.returned_type || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Сумма (при возврате)</label>
                  <input
                    type="number"
                    name="returned_amount"
                    value={formData.returned_amount || ''}
                    onChange={handleNumberChange}
                    className={styles.input}
                    step="0.01"
                  />
                </div>

                <div className={styles.field}>
                  <label>Основание не взыскания</label>
                  <textarea
                    name="not_collected_reason"
                    value={formData.not_collected_reason || ''}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              {/* Блок 5.3: Дополнительная информация */}
              <div className={styles.fieldGroup}>
                <h3 className={styles.subsectionTitle}>Дополнительная информация</h3>
                
                <div className={styles.field}>
                  <label>Примечания</label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows={4}
                    placeholder="Дополнительные сведения об исполнении..."
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CivilExecutionDetail;