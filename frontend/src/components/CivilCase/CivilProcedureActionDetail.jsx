import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import styles from './CivilDetail.module.css';

const CivilProcedureActionDetail = () => {
  const { proceedingId, actionId } = useParams();
  const navigate = useNavigate();
  const [actionData, setActionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActionData = async () => {
      if (actionId && actionId !== 'create' && actionId !== 'undefined' && actionId !== 'null') {
        try {
          setLoading(true);
          const data = await CivilCaseService.getProcedureActionById(proceedingId, actionId);
          setActionData(data);
          setFormData(data);
          setIsEditing(false);
        } catch (err) {
          console.error('Error fetching procedure action:', err);
          setError('Не удалось загрузить данные процессуального действия');
        } finally {
          setLoading(false);
        }
      } else {
        // Режим создания
        setActionData(null);
        setFormData({
          property_arrest: false,
          defendant_prohibition: false,
          others_prohibition: false,
          defendant_obligation: false,
          others_obligation: false,
          property_sale_suspension: false,
          property_release: false,
          enforcement_suspension: false,
          simplified_proceedings_prep: false
        });
        setIsEditing(true);
        setLoading(false);
      }
    };

    fetchActionData();
  }, [proceedingId, actionId]);

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
      let savedAction;
      if (actionId && actionId !== 'create' && actionId !== 'undefined' && actionId !== 'null') {
        savedAction = await CivilCaseService.updateProcedureAction(proceedingId, actionId, formData);
      } else {
        savedAction = await CivilCaseService.createProcedureAction(proceedingId, formData);
      }
      
      navigate(`/civil-proceedings/${proceedingId}`);
    } catch (err) {
      console.error('Error saving procedure action:', err);
      setError('Ошибка при сохранении процессуального действия: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
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
            {actionId && actionId !== 'create' ? 'Редактирование процессуального действия' : 'Добавление процессуального действия'}
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
          {!actionId && (
            <button 
              onClick={() => navigate(`/civil-proceedings/${proceedingId}`)} 
              className={styles.cancelButton}
            >
              Отмена
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
                    <h3 className={styles.subsectionTitle}>Подготовка дела</h3>
                    
                    <div className={styles.field}>
                      <label>Определение о подготовке дела</label>
                      <input
                        type="date"
                        name="preparation_order_date"
                        value={formData.preparation_order_date || ''}
                        onChange={(e) => handleDateChange('preparation_order_date', e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>
                        <input
                          type="checkbox"
                          name="simplified_proceedings_prep"
                          checked={formData.simplified_proceedings_prep || false}
                          onChange={handleInputChange}
                        />
                        В т.ч. в упрощенном пр-ве
                      </label>
                    </div>

                    <div className={styles.field}>
                      <label>Контрольный срок</label>
                      <input
                        type="date"
                        name="control_date"
                        value={formData.control_date || ''}
                        onChange={(e) => handleDateChange('control_date', e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Предварительное заседание</h3>
                    
                    <div className={styles.field}>
                      <label>Определение о назначении предварительного с/заседания</label>
                      <input
                        type="date"
                        name="preliminary_hearing_order_date"
                        value={formData.preliminary_hearing_order_date || ''}
                        onChange={(e) => handleDateChange('preliminary_hearing_order_date', e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Дата предварительного с/заседания</label>
                      <input
                        type="date"
                        name="preliminary_hearing_date"
                        value={formData.preliminary_hearing_date || ''}
                        onChange={(e) => handleDateChange('preliminary_hearing_date', e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Экспертиза</h3>
                    
                    <div className={styles.field}>
                      <label>Определение о назначении экспертизы</label>
                      <input
                        type="date"
                        name="examination_order_date"
                        value={formData.examination_order_date || ''}
                        onChange={(e) => handleDateChange('examination_order_date', e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Вид экспертизы</label>
                      <input
                        type="text"
                        name="examination_type"
                        value={formData.examination_type || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Учреждение для экспертизы</label>
                      <input
                        type="text"
                        name="examination_institution"
                        value={formData.examination_institution || ''}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Экспертиза направлена</label>
                      <input
                        type="date"
                        name="examination_sent_date"
                        value={formData.examination_sent_date || ''}
                        onChange={(e) => handleDateChange('examination_sent_date', e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Экспертиза возвращена</label>
                      <input
                        type="date"
                        name="examination_returned_date"
                        value={formData.examination_returned_date || ''}
                        onChange={(e) => handleDateChange('examination_returned_date', e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Меры обеспечения</h3>
                    
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="property_arrest"
                          checked={formData.property_arrest || false}
                          onChange={handleInputChange}
                        />
                        Наложение ареста на имущество
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="defendant_prohibition"
                          checked={formData.defendant_prohibition || false}
                          onChange={handleInputChange}
                        />
                        Запрет ответчику совершать определенные действия
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="others_prohibition"
                          checked={formData.others_prohibition || false}
                          onChange={handleInputChange}
                        />
                        Запрещение другим лицам совершать определенные действия
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="defendant_obligation"
                          checked={formData.defendant_obligation || false}
                          onChange={handleInputChange}
                        />
                        Возложение на ответчика обязанности совершить определенные действия
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="others_obligation"
                          checked={formData.others_obligation || false}
                          onChange={handleInputChange}
                        />
                        Возложение на других лиц обязанности совершить определенные действия
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="property_sale_suspension"
                          checked={formData.property_sale_suspension || false}
                          onChange={handleInputChange}
                        />
                        Приостановление реализации имущества
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="property_release"
                          checked={formData.property_release || false}
                          onChange={handleInputChange}
                        />
                        Освобождение имущества от ареста
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="enforcement_suspension"
                          checked={formData.enforcement_suspension || false}
                          onChange={handleInputChange}
                        />
                        Приостановление взыскания по исполнительному документу
                      </label>
                    </div>

                    <div className={styles.field}>
                      <label>Иные меры обеспечения</label>
                      <textarea
                        name="other_security_measures"
                        value={formData.other_security_measures || ''}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Назначение дела</h3>
                    
                    <div className={styles.field}>
                      <label>Определение о переходе к общему порядку</label>
                      <input
                        type="date"
                        name="transition_to_general_order_date"
                        value={formData.transition_to_general_order_date || ''}
                        onChange={(e) => handleDateChange('transition_to_general_order_date', e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Определение о назначении дела к судебному разбирательству</label>
                      <input
                        type="date"
                        name="hearing_schedule_order_date"
                        value={formData.hearing_schedule_order_date || ''}
                        onChange={(e) => handleDateChange('hearing_schedule_order_date', e.target.value)}
                        className={styles.input}
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

export default CivilProcedureActionDetail;