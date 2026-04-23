import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import styles from './AdministrativeDetail.module.css';

const SecurityMeasureDetail = () => {
  const { proceedingId, measureId } = useParams();
  const navigate = useNavigate();
  
  const [measureData, setMeasureData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [measureTypes, setMeasureTypes] = useState([]);

  useEffect(() => {
    setMeasureTypes(AdministrativeCaseService.getSecurityMeasureTypes());
  }, []);

  useEffect(() => {
    const fetchMeasureData = async () => {
      if (measureId && measureId !== 'create' && measureId !== 'undefined' && measureId !== 'null') {
        try {
          setLoading(true);
          const data = await AdministrativeCaseService.getSecurityMeasureById(proceedingId, measureId);
          setMeasureData(data);
          setFormData(data);
          setIsEditing(false);
        } catch (err) {
          console.error('Error fetching security measure:', err);
          setError('Не удалось загрузить данные меры обеспечения');
        } finally {
          setLoading(false);
        }
      } else {
        // Режим создания
        setMeasureData(null);
        setFormData({
          measure_type: '',
          applied_date: null,
          amount: null,
          period: '',
          notes: ''
        });
        setIsEditing(true);
        setLoading(false);
      }
    };

    fetchMeasureData();
  }, [proceedingId, measureId]);

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
    setSaving(true);
    setError(null);

    try {
      let savedMeasure;
      if (measureId && measureId !== 'create' && measureId !== 'undefined' && measureId !== 'null') {
        savedMeasure = await AdministrativeCaseService.updateSecurityMeasure(proceedingId, measureId, formData);
      } else {
        savedMeasure = await AdministrativeCaseService.createSecurityMeasure(proceedingId, formData);
      }
      navigate(`/admin-proceedings/${proceedingId}`);
    } catch (err) {
      console.error('Error saving security measure:', err);
      setError('Ошибка при сохранении меры обеспечения: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const getMeasureTypeLabel = (value) => {
    const type = measureTypes.find(t => t.value === value);
    return type?.label || value;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
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
            onClick={() => navigate(`/admin-proceedings/${proceedingId}`)} 
            className={styles.backButton}
          >
            ← Назад к делу
          </button>
          <h1 className={styles.title}>
            {measureId && measureId !== 'create' ? 'Редактирование меры обеспечения' : 'Добавление меры обеспечения'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          {(!isEditing && measureId && measureId !== 'create') && (
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
                    <h3 className={styles.subsectionTitle}>Мера обеспечения производства по делу об АП</h3>
                    
                    <div className={styles.field}>
                      <label>Вид меры обеспечения</label>
                      {isEditing ? (
                        <select
                          name="measure_type"
                          value={formData.measure_type || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                          required
                        >
                          <option value="">Выберите меру</option>
                          {measureTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{getMeasureTypeLabel(measureData?.measure_type)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Дата применения</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="applied_date"
                          value={formData.applied_date || ''}
                          onChange={(e) => handleDateChange('applied_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(measureData?.applied_date)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Сумма (для залога, ареста имущества и т.д.)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          name="amount"
                          value={formData.amount || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatCurrency(measureData?.amount)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Срок (для помещения в спецучреждение)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="period"
                          value={formData.period || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Например: 30 суток"
                        />
                      ) : (
                        <span>{measureData?.period || 'Не указано'}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Примечания</label>
                      {isEditing ? (
                        <textarea
                          name="notes"
                          value={formData.notes || ''}
                          onChange={handleInputChange}
                          className={styles.textarea}
                          rows={3}
                        />
                      ) : (
                        <span>{measureData?.notes || 'Нет'}</span>
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

export default SecurityMeasureDetail;