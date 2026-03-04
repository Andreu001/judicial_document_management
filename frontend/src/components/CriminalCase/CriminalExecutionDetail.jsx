import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './CriminalDetail.module.css';
import ConfirmDialog from '../../pages/ConfirmDialog';

const CriminalExecutionDetail = () => {
  const { proceedingId, executionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [allSides, setAllSides] = useState([]);
  const [formData, setFormData] = useState({
    sentence_execution_date: '',
    execution_sent_date: '',
    execution_sent_to: '',
    execution_sent_document: '',
    control_return_date: '',
    control_result: '',
    execution_mark_date: '',
    execution_mark_content: '',
    execution_mark_author: '',
    special_execution_notes: '',
    removal_from_control_date: '',
    removal_from_control_reason: '',
    copies_sent_info: '',
    execution_recipient_type: '',
    execution_recipient_id: ''
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Подтверждение',
    message: '',
    onConfirm: null
  });

  const isEditing = executionId && executionId !== 'create';

  useEffect(() => {
    loadAllSides();
    if (isEditing) {
      loadExecutionData();
    }
  }, [proceedingId, executionId]);

  const loadAllSides = async () => {
    try {
      const sides = await CriminalCaseService.getAllSides(proceedingId);
      setAllSides(sides);
    } catch (error) {
      console.error('Error loading sides:', error);
    }
  };

  const loadExecutionData = async () => {
    try {
      setLoading(true);
      const data = await CriminalCaseService.getExecutionById(proceedingId, executionId);
      setFormData(data);
    } catch (error) {
      setError('Ошибка загрузки данных исполнения');
      console.error('Error loading execution:', error);
    } finally {
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
    setSaving(true);
    setError(null);

    try {
      const dataToSend = { ...formData };
      
      // Не удаляем пустые поля, так как они могут быть валидными null значениями
      // Вместо этого преобразуем пустые строки в null
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null;
        }
      });

      // Для создания записи убеждаемся, что есть получатель
      if (!isEditing) {
        if (!dataToSend.execution_recipient_type || !dataToSend.execution_recipient_id) {
          setError('Необходимо выбрать получателя');
          setSaving(false);
          return;
        }
      }

      console.log('Sending data:', dataToSend); // Для отладки

      if (isEditing) {
        await CriminalCaseService.updateExecution(proceedingId, executionId, dataToSend);
      } else {
        await CriminalCaseService.createExecution(proceedingId, dataToSend);
      }
      navigate(-1);
    } catch (error) {
      console.error('Error saving execution:', error);
      // Попробуем получить более детальную информацию об ошибке
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);
        setError(JSON.stringify(error.response.data) || 'Ошибка сохранения');
      } else {
        setError(error.response?.data?.message || 'Ошибка сохранения');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const getRecipientName = () => {
    if (!formData.execution_recipient_type || !formData.execution_recipient_id) return null;
    
    const recipient = allSides.find(s => 
      s.type === formData.execution_recipient_type && s.id === parseInt(formData.execution_recipient_id)
    );
    
    return recipient ? recipient.name : 'Неизвестный получатель';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString;
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
            ← Назад
          </button>
          <h1 className={styles.title}>
            {isEditing ? 'Редактирование записи об исполнении' : 'Новая запись об исполнении'}
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
          <button 
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Отмена
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.tabContentWrapper}>
        <div className={styles.tabContent}>
          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Основные сведения</h3>
            
            <div className={styles.tabGrid}>
              <div className={styles.field}>
                <label>Получатель приговора/решения:</label>
                {!isEditing ? (
                  <select
                    name="execution_recipient_type"
                    value={formData.execution_recipient_type}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="">Выберите тип получателя</option>
                    <option value="defendant">Обвиняемый</option>
                    <option value="lawyer">Адвокат</option>
                    <option value="side">Сторона</option>
                  </select>
                ) : (
                  <span className={styles.staticValue}>
                    {getRecipientName() || 'Не указано'}
                  </span>
                )}
              </div>

              {!isEditing && formData.execution_recipient_type && (
                <div className={styles.field}>
                  <label>Выберите получателя:</label>
                  <select
                    name="execution_recipient_id"
                    value={formData.execution_recipient_id}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="">Выберите получателя</option>
                    {allSides
                      .filter(s => s.type === formData.execution_recipient_type)
                      .map(recipient => (
                        <option key={`${recipient.type}-${recipient.id}`} value={recipient.id}>
                          {recipient.name} ({recipient.role})
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className={styles.field}>
                <label>Дата обращения приговора к исполнению:</label>
                {isEditing ? (
                  <span className={styles.staticValue}>{formatDate(formData.sentence_execution_date) || '—'}</span>
                ) : (
                  <input
                    type="date"
                    name="sentence_execution_date"
                    value={formData.sentence_execution_date || ''}
                    onChange={(e) => handleDateChange('sentence_execution_date', e.target.value)}
                    className={styles.input}
                  />
                )}
              </div>

              <div className={styles.field}>
                <label>Дата направления для исполнения:</label>
                <input
                  type="date"
                  name="execution_sent_date"
                  value={formData.execution_sent_date || ''}
                  onChange={(e) => handleDateChange('execution_sent_date', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>Куда направлено для исполнения:</label>
                <input
                  type="text"
                  name="execution_sent_to"
                  value={formData.execution_sent_to || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Наименование органа/учреждения"
                />
              </div>

              <div className={styles.field}>
                <label>Направленный документ:</label>
                <select
                  name="execution_sent_document"
                  value={formData.execution_sent_document || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите документ</option>
                  <option value="1">Копия приговора</option>
                  <option value="2">Исполнительный лист</option>
                  <option value="3">Распоряжение об исполнении</option>
                  <option value="4">Копия апелляционного определения</option>
                  <option value="5">Иное</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Контроль исполнения</h3>
            
            <div className={styles.tabGrid}>
              <div className={styles.field}>
                <label>Дата поступления контрольной карточки:</label>
                <input
                  type="date"
                  name="control_return_date"
                  value={formData.control_return_date || ''}
                  onChange={(e) => handleDateChange('control_return_date', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>Результат контроля исполнения:</label>
                <input
                  type="text"
                  name="control_result"
                  value={formData.control_result || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Результат контроля"
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Отметки об исполнении</h3>
            
            <div className={styles.tabGrid}>
              <div className={styles.field}>
                <label>Дата отметки об исполнении:</label>
                <input
                  type="date"
                  name="execution_mark_date"
                  value={formData.execution_mark_date || ''}
                  onChange={(e) => handleDateChange('execution_mark_date', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>Кто поставил отметку:</label>
                <input
                  type="text"
                  name="execution_mark_author"
                  value={formData.execution_mark_author || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="ФИО"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Содержание отметки об исполнении:</label>
              <textarea
                name="execution_mark_content"
                value={formData.execution_mark_content || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows="3"
                placeholder="Текст отметки об исполнении"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Снятие с контроля</h3>
            
            <div className={styles.tabGrid}>
              <div className={styles.field}>
                <label>Дата снятия с контроля:</label>
                <input
                  type="date"
                  name="removal_from_control_date"
                  value={formData.removal_from_control_date || ''}
                  onChange={(e) => handleDateChange('removal_from_control_date', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>Основание снятия с контроля:</label>
                <input
                  type="text"
                  name="removal_from_control_reason"
                  value={formData.removal_from_control_reason || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Основание"
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <h3 className={styles.subsectionTitle}>Дополнительная информация</h3>
            
            <div className={styles.field}>
              <label>Информация о рассылке копий:</label>
              <textarea
                name="copies_sent_info"
                value={formData.copies_sent_info || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows="3"
                placeholder="Кому и когда направлены копии"
              />
            </div>

            <div className={styles.field}>
              <label>Особые отметки по исполнению:</label>
              <textarea
                name="special_execution_notes"
                value={formData.special_execution_notes || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows="3"
                placeholder="Особые отметки"
              />
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default CriminalExecutionDetail;