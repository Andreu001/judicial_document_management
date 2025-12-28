import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import baseService from '../../API/baseService';
import styles from './CorrespondenceForm.module.css';

const CorrespondenceForm = ({ initialData = {}, mode = 'create' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams(); // 'incoming' или 'outgoing' из URL
  
  // Определяем тип корреспонденции из URL или location
  const getCorrespondenceType = () => {
    // 1. Сначала проверяем URL path
    if (location.pathname.includes('/out/')) {
      return 'outgoing';
    } else if (location.pathname.includes('/in/')) {
      return 'incoming';
    }
    // 2. Потом проверяем параметры URL
    else if (type === 'outgoing') {
      return 'outgoing';
    } else if (type === 'incoming') {
      return 'incoming';
    }
    // 3. По умолчанию возвращаем incoming
    return 'incoming';
  };
  
  const correspondenceType = getCorrespondenceType();
  
  const [formData, setFormData] = useState({
    correspondence_type: correspondenceType,
    registration_number: '',
    registration_date: new Date().toISOString().split('T')[0],
    sender: '',
    recipient: '',
    document_type: '',
    summary: '',
    pages_count: 1,
    status: correspondenceType === 'incoming' ? 'received' : 'registered',
    business_card: '',
    notes: '',
    attached_files: null,
    // Новые поля только для входящих документов
    number_sender_document: '',
    outgoing_date_document: '',
    ...initialData
  });

  const [businessCards, setBusinessCards] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Мемоизированная функция загрузки визиток
  const fetchBusinessCards = useCallback(async () => {
    try {
      const response = await baseService.get('/business_card/businesscard/');
      setBusinessCards(response.data);
    } catch (error) {
      console.error('Ошибка загрузки дел:', error);
    }
  }, []);

  // Мемоизированная функция загрузки типов документов
  const loadDocumentTypes = useCallback(() => {
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
  }, []);

  // Инициализация - один раз при монтировании
  useEffect(() => {
    if (!isInitialized) {
      fetchBusinessCards();
      loadDocumentTypes();
      setIsInitialized(true);
    }
  }, [fetchBusinessCards, loadDocumentTypes, isInitialized]);

  // Обновление formData только при изменении initialData или mode
  useEffect(() => {
    if (mode === 'edit' && initialData.id && isInitialized) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Убедимся, что дата в правильном формате
        registration_date: initialData.registration_date 
          ? new Date(initialData.registration_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        // Убедимся, что дата документа отправителя в правильном формате
        outgoing_date_document: initialData.outgoing_date_document 
          ? new Date(initialData.outgoing_date_document).toISOString().split('T')[0]
          : ''
      }));
    }
  }, [initialData, mode, isInitialized]);

  // Обновляем correspondence_type при изменении URL
  useEffect(() => {
    if (isInitialized && mode === 'create') {
      setFormData(prev => ({
        ...prev,
        correspondence_type: correspondenceType,
        status: correspondenceType === 'incoming' ? 'received' : 'registered'
      }));
    }
  }, [correspondenceType, mode, isInitialized]);

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
    
    if (!formData.sender.trim() && formData.correspondence_type === 'incoming') {
      newErrors.sender = 'Укажите отправителя';
    }
    
    if (!formData.recipient.trim() && formData.correspondence_type === 'outgoing') {
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
    const redirectType = formData.correspondence_type === 'incoming' ? 'in' : 'out';
    navigate(`/${redirectType}`);
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
      
      // Добавляем новые поля только для входящих документов
      if (formData.correspondence_type === 'incoming') {
        if (formData.number_sender_document) {
          formDataToSend.append('number_sender_document', formData.number_sender_document);
        }
        if (formData.outgoing_date_document) {
          formDataToSend.append('outgoing_date_document', formData.outgoing_date_document);
        }
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
      
      // ФИКС: Используем formData.correspondence_type вместо type
      const redirectType = formData.correspondence_type === 'incoming' ? 'in' : 'out';
      navigate(`/${redirectType}`);
      
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

  // Рендерим поля для данных отправителя только для входящей корреспонденции
  const renderSenderFields = () => {
    if (formData.correspondence_type !== 'incoming') return null;
    
    return (
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="number_sender_document">Исх. номер документа</label>
          <input
            id="number_sender_document"
            type="text"
            name="number_sender_document"
            value={formData.number_sender_document || ''}
            onChange={handleChange}
            placeholder="Номер документа отправителя"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="outgoing_date_document">Исх. дата документа</label>
          <input
            id="outgoing_date_document"
            type="date"
            name="outgoing_date_document"
            value={formData.outgoing_date_document || ''}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          {mode === 'edit' ? 'Редактирование' : 'Регистрация'} 
          {formData.correspondence_type === 'incoming' ? ' входящей' : ' исходящей'} корреспонденции
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
                  value={formData.correspondence_type === 'incoming' ? 'Входящая' : 'Исходящая'}
                  readOnly
                  className={styles.input}
                  style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                />
              </div>
              
              {/* Поля данных отправителя для входящей корреспонденции */}
              {renderSenderFields()}
              
              {formData.correspondence_type === 'incoming' ? (
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
                    required={formData.correspondence_type === 'incoming'}
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
                    required={formData.correspondence_type === 'outgoing'}
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
                    {formData.correspondence_type === 'incoming' ? (
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
