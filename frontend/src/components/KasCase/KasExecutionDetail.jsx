import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KasCaseService from '../../API/KasCaseService';
import styles from './KasDetail.module.css';

const KasExecutionDetail = () => {
  const { proceedingId, executionId } = useParams();
  const navigate = useNavigate();
  const [executionData, setExecutionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExecutionData = async () => {
      if (executionId && executionId !== 'create' && executionId !== 'undefined' && executionId !== 'null') {
        try {
          setLoading(true);
          const data = await KasCaseService.getExecutionById(proceedingId, executionId);
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
        // Режим создания
        setExecutionData(null);
        setFormData({
          decision_effective_date: null,
          writ_sent_to_bailiff_date: null,
          writ_issued_to_claimant_date: null,
          writ_sent_by_department_date: null,
          execution_date: null,
          execution_type: '',
          execution_amount: null,
          returned_from_bailiff_date: null,
          returned_type: '',
          returned_amount: null,
          not_collected_reason: ''
        });
        setIsEditing(true);
        setLoading(false);
      }
    };

    fetchExecutionData();
  }, [proceedingId, executionId]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : null) : value
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
        await KasCaseService.updateExecution(proceedingId, executionId, formData);
      } else {
        await KasCaseService.createExecution(proceedingId, formData);
      }
      
      navigate(-1);
    } catch (err) {
      console.error('Error saving execution:', err);
      setError('Ошибка при сохранении исполнения: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
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
            ← Назад к делу
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
          {!executionId && (
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
                    <h3 className={styles.subsectionTitle}>Основные даты</h3>
                    
                    <div className={styles.field}>
                      <label>Дата вступления решения в законную силу</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="decision_effective_date"
                          value={formData.decision_effective_date || ''}
                          onChange={(e) => handleDateChange('decision_effective_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(executionData?.decision_effective_date)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата исполнения</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="execution_date"
                          value={formData.execution_date || ''}
                          onChange={(e) => handleDateChange('execution_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(executionData?.execution_date)}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Направление исполнительных документов</h3>
                    
                    <div className={styles.field}>
                      <label>Дата направления исп. листа суд. приставу</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="writ_sent_to_bailiff_date"
                          value={formData.writ_sent_to_bailiff_date || ''}
                          onChange={(e) => handleDateChange('writ_sent_to_bailiff_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(executionData?.writ_sent_to_bailiff_date)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата выдачи исп. листа взыскателю</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="writ_issued_to_claimant_date"
                          value={formData.writ_issued_to_claimant_date || ''}
                          onChange={(e) => handleDateChange('writ_issued_to_claimant_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(executionData?.writ_issued_to_claimant_date)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата направления отделом делопроизводства</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="writ_sent_by_department_date"
                          value={formData.writ_sent_by_department_date || ''}
                          onChange={(e) => handleDateChange('writ_sent_by_department_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(executionData?.writ_sent_by_department_date)}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Взыскание</h3>
                    
                    <div className={styles.field}>
                      <label>Вид взыскания</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="execution_type"
                          value={formData.execution_type || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Например: денежные средства, имущество"
                        />
                      ) : (
                        <span>{executionData?.execution_type || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма взыскания (руб.)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="execution_amount"
                          value={formData.execution_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          step="0.01"
                        />
                      ) : (
                        <span>{formatCurrency(executionData?.execution_amount)}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Возврат документов</h3>
                    
                    <div className={styles.field}>
                      <label>Дата возврата из подразделения ССП</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="returned_from_bailiff_date"
                          value={formData.returned_from_bailiff_date || ''}
                          onChange={(e) => handleDateChange('returned_from_bailiff_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(executionData?.returned_from_bailiff_date)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Вид взыскания (при возврате)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="returned_type"
                          value={formData.returned_type || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{executionData?.returned_type || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма (при возврате)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="returned_amount"
                          value={formData.returned_amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          step="0.01"
                        />
                      ) : (
                        <span>{formatCurrency(executionData?.returned_amount)}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Дополнительная информация</h3>
                    
                    <div className={styles.field}>
                      <label>Основание не взыскания</label>
                      {isEditing ? (
                        <textarea
                          name="not_collected_reason"
                          value={formData.not_collected_reason || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={4}
                          placeholder="Укажите причину, если взыскание не произведено"
                        />
                      ) : (
                        <span>{executionData?.not_collected_reason || 'Не указано'}</span>
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

export default KasExecutionDetail;