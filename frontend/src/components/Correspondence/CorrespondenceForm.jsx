import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MyInput from '../UI/input/MyInput';
import baseService from '../../API/baseService';
import styles from './CorrespondenceForm.module.css';

const CorrespondenceForm = ({ initialData = {}, mode = 'create' }) => {
  const navigate = useNavigate();
  const { type } = useParams(); // 'incoming' или 'outgoing'
  
  const [formData, setFormData] = useState({
    correspondence_type: type || 'incoming',
    registration_number: '',
    registration_date: new Date().toISOString().split('T')[0],
    sender: '',
    recipient: '',
    document_type: '',
    summary: '',
    pages_count: 1,
    status: type === 'incoming' ? 'received' : 'registered',
    business_card: '',
    notes: '',
    attached_files: null,
    ...initialData
  });

  const [businessCards, setBusinessCards] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBusinessCards();
    loadDocumentTypes();
    
    if (mode === 'edit' && initialData.id) {
      setFormData(initialData);
    }
  }, [initialData, mode]);

  const fetchBusinessCards = async () => {
    try {
      const response = await baseService.get('/business_card/businesscard/');
      setBusinessCards(response.data);
    } catch (error) {
      console.error('Ошибка загрузки дел:', error);
    }
  };

  const loadDocumentTypes = () => {
    // Используем строковые значения для document_type
    const types = [
      { value: 'Заявление', label: 'Заявление' },
      { value: 'Жалоба', label: 'Жалоба' },
      { value: 'Ходатайство', label: 'Ходатайство' },
      { value: 'Отзыв', label: 'Отзыв' },
      { value: 'Возражение', label: 'Возражение' },
      { value: 'Представление', label: 'Представление' },
      { value: 'Протокол', label: 'Протокол' },
      { value: 'Определение', label: 'Определение' },
      { value: 'Постановление', label: 'Постановление' },
      { value: 'Приговор', label: 'Приговор' },
      { value: 'Решение', label: 'Решение' },
      { value: 'Запрос', label: 'Запрос' },
      { value: 'Ответ на запрос', label: 'Ответ на запрос' },
      { value: 'Уведомление', label: 'Уведомление' },
      { value: 'Письмо', label: 'Письмо' },
      { value: 'Документы по делу', label: 'Документы по делу' },
      { value: 'Иные документы', label: 'Иные документы' },
    ];
    setDocumentTypes(types);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    let finalValue = value;
    if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    } else if (name === 'business_card') {
      finalValue = value === '' ? null : Number(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        attached_files: file
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sender.trim() && type === 'incoming') {
      newErrors.sender = 'Укажите отправителя';
    }
    
    if (!formData.recipient.trim() && type === 'outgoing') {
      newErrors.recipient = 'Укажите получателя';
    }
    
    if (!formData.document_type.trim()) {
      newErrors.document_type = 'Выберите тип документа';
    }
    
    if (!formData.summary.trim()) {
      newErrors.summary = 'Введите краткое содержание';
    }
    
    if (formData.pages_count <= 0) {
      newErrors.pages_count = 'Количество листов должно быть больше 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    navigate(`/${type}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Добавляем обязательные поля
      formDataToSend.append('correspondence_type', formData.correspondence_type);
      formDataToSend.append('registration_date', formData.registration_date);
      formDataToSend.append('sender', formData.sender);
      formDataToSend.append('recipient', formData.recipient);
      formDataToSend.append('document_type', formData.document_type);
      formDataToSend.append('summary', formData.summary);
      formDataToSend.append('pages_count', formData.pages_count);
      formDataToSend.append('status', formData.status);
      
      // Добавляем опциональные поля
      if (formData.business_card) {
        formDataToSend.append('business_card', formData.business_card);
      }
      if (formData.notes) {
        formDataToSend.append('notes', formData.notes);
      }
      if (formData.attached_files instanceof File) {
        formDataToSend.append('attached_files', formData.attached_files);
      }
      
      let response;
      if (mode === 'edit' && formData.id) {
        response = await baseService.patch(
          `/case_registry/correspondence/${formData.id}/`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        response = await baseService.post(
          '/case_registry/correspondence/',
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
      
      // Перенаправляем на страницу списка
      navigate(`/${type}`);
      
    } catch (error) {
      console.error('Ошибка сохранения корреспонденции:', error);
      
      if (error.response?.data) {
        const serverErrors = error.response.data;
        const newErrors = {};
        
        Object.keys(serverErrors).forEach(key => {
          if (Array.isArray(serverErrors[key])) {
            newErrors[key] = serverErrors[key][0];
          } else {
            newErrors[key] = serverErrors[key];
          }
        });
        
        setErrors(newErrors);
      } else {
        alert('Ошибка при сохранении. Проверьте данные и попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          {mode === 'edit' ? 'Редактирование' : 'Регистрация'} 
          {type === 'incoming' ? ' входящей' : ' исходящей'} корреспонденции
        </h1>
        <div className={styles.headerInfo}>
          {mode === 'edit' && formData.registration_number && (
            <span className={styles.registrationNumber}>
              № {formData.registration_number}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Левая колонка - основные данные */}
          <div className={styles.formColumn}>
            <div className={styles.formSection}>
              <h3>Основные данные</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="correspondence_type">Тип корреспонденции</label>
                <input
                  id="correspondence_type"
                  type="text"
                  name="correspondence_type"
                  value={type === 'incoming' ? 'Входящая' : 'Исходящая'}
                  readOnly
                  className={styles.input}
                  style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                />
              </div>
              
              {type === 'incoming' ? (
                <div className={styles.formGroup}>
                  <label htmlFor="sender">Отправитель *</label>
                  <input
                    id="sender"
                    type="text"
                    name="sender"
                    value={formData.sender || ''}
                    onChange={handleChange}
                    placeholder="Наименование отправителя"
                    className={`${styles.input} ${errors.sender ? styles.error : ''}`}
                    required={type === 'incoming'}
                  />
                  {errors.sender && (
                    <span className={styles.errorText}>{errors.sender}</span>
                  )}
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label htmlFor="recipient">Получатель *</label>
                  <input
                    id="recipient"
                    type="text"
                    name="recipient"
                    value={formData.recipient || ''}
                    onChange={handleChange}
                    placeholder="Наименование получателя"
                    className={`${styles.input} ${errors.recipient ? styles.error : ''}`}
                    required={type === 'outgoing'}
                  />
                  {errors.recipient && (
                    <span className={styles.errorText}>{errors.recipient}</span>
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="document_type">Тип документа *</label>
                <select 
                  id="document_type"
                  name="document_type" 
                  value={formData.document_type || ''} 
                  onChange={handleChange}
                  className={`${styles.select} ${errors.document_type ? styles.error : ''}`}
                  required
                >
                  <option value="">Выберите тип документа</option>
                  {documentTypes.map((docType, index) => (
                    <option key={index} value={docType.value}>
                      {docType.label}
                    </option>
                  ))}
                </select>
                {errors.document_type && (
                  <span className={styles.errorText}>{errors.document_type}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="registration_date">Дата регистрации</label>
                <input
                  id="registration_date"
                  type="date"
                  name="registration_date"
                  value={formData.registration_date || ''}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="pages_count">Количество листов *</label>
                  <input
                    id="pages_count"
                    type="number"
                    name="pages_count"
                    value={formData.pages_count || 1}
                    onChange={handleChange}
                    min="1"
                    className={`${styles.input} ${errors.pages_count ? styles.error : ''}`}
                    required
                  />
                  {errors.pages_count && (
                    <span className={styles.errorText}>{errors.pages_count}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status">Статус</label>
                  <select 
                    id="status"
                    name="status" 
                    value={formData.status || ''} 
                    onChange={handleChange}
                    className={styles.select}
                  >
                    {type === 'incoming' ? (
                      <>
                        <option value="received">Получено</option>
                        <option value="registered">Зарегистрировано</option>
                        <option value="processed">Обработано</option>
                        <option value="archived">В архиве</option>
                      </>
                    ) : (
                      <>
                        <option value="registered">Зарегистрировано</option>
                        <option value="sent">Отправлено</option>
                        <option value="archived">В архиве</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - привязка к делу и файлы */}
          <div className={styles.formColumn}>
            <div className={styles.formSection}>
              <h3>Привязка к делу</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="business_card">Связанное дело</label>
                <select 
                  id="business_card"
                  name="business_card" 
                  value={formData.business_card || ''} 
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Не привязано к делу</option>
                  {businessCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.original_name} - {card.description || 'Без описания'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Вложение</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="attached_files">
                  {formData.attached_files?.name ? 'Файл:' : 'Прикрепить файл'}
                </label>
                {formData.attached_files?.name ? (
                  <div className={styles.fileInfo}>
                    <span>{formData.attached_files.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, attached_files: null }))}
                      className={styles.removeFileButton}
                    >
                      Удалить
                    </button>
                  </div>
                ) : (
                  <input
                    id="attached_files"
                    type="file"
                    name="attached_files"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Поле для описания */}
        <div className={styles.formSection}>
          <h3>Краткое содержание *</h3>
          
          <div className={styles.formGroup}>
            <textarea
              name="summary"
              value={formData.summary || ''}
              onChange={handleChange}
              placeholder="Введите краткое содержание документа..."
              className={`${styles.textarea} ${errors.summary ? styles.error : ''}`}
              rows="4"
              required
            />
            {errors.summary && (
              <span className={styles.errorText}>{errors.summary}</span>
            )}
          </div>
        </div>

        {/* Примечания */}
        <div className={styles.formSection}>
          <h3>Примечания</h3>
          
          <div className={styles.formGroup}>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Дополнительные примечания..."
              className={styles.textarea}
              rows="3"
            />
          </div>
        </div>

        {/* Кнопки действий */}
        <div className={styles.actions}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Сохранение...' : (mode === 'edit' ? 'Сохранить изменения' : 'Зарегистрировать')}
          </button>
          
          <button 
            type="button" 
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default CorrespondenceForm;