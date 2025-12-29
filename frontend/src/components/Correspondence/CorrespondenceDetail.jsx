import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import correspondenceService from '../../API/CorrespondenceService';
import baseService from '../../API/baseService';
import styles from './CorrespondenceDetail.module.css';

const CorrespondenceDetail = ({ type = '' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [correspondence, setCorrespondence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [businessCards, setBusinessCards] = useState([]);
  const [documentTypes] = useState([
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
  ]);

  useEffect(() => {
    fetchCorrespondenceDetail();
    fetchBusinessCards();
  }, [id]);

  const fetchCorrespondenceDetail = async () => {
    try {
      setLoading(true);
      const data = await correspondenceService.getById(id);
      setCorrespondence(data);
      
      // Определяем начальное значение статуса в зависимости от типа
      const defaultStatus = data.correspondence_type === 'incoming' ? 'received' : 'registered';
      
      setFormData({
        ...data,
        registration_date: data.registration_date ? 
          new Date(data.registration_date).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        outgoing_date_document: data.outgoing_date_document ? 
          new Date(data.outgoing_date_document).toISOString().split('T')[0] : '',
        business_card: data.business_card ? String(data.business_card) : '',
        status: data.status || defaultStatus
      });
    } catch (err) {
      console.error('Ошибка загрузки деталей корреспонденции:', err);
      setError('Не удалось загрузить данные документа');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessCards = async () => {
    try {
      const response = await baseService.get('/business_card/businesscard/');
      setBusinessCards(response.data);
    } catch (error) {
      console.error('Ошибка загрузки дел:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Создаем объект для отправки, а не FormData
      const dataToSend = { ...formData };
      
      // Конвертируем типы данных
      if (dataToSend.business_card) {
        dataToSend.business_card = Number(dataToSend.business_card);
      }
      
      if (dataToSend.pages_count) {
        dataToSend.pages_count = Number(dataToSend.pages_count);
      }
      
      console.log('Отправляемые данные:', dataToSend);
      console.log('Отправляемый статус:', dataToSend.status);
      
      // Используем метод updateCorrespondence из service
      const updatedData = await correspondenceService.updateCorrespondence(id, dataToSend);
      
      setCorrespondence(updatedData);
      setIsEditing(false);
      setSaving(false);
      
      // Обновляем данные
      fetchCorrespondenceDetail();
      
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      if (err.response) {
        console.error('Детали ошибки:', err.response.data);
      }
      alert('Не удалось сохранить изменения');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (correspondence) {
      const defaultStatus = correspondence.correspondence_type === 'incoming' ? 'received' : 'registered';
      
      setFormData({
        ...correspondence,
        registration_date: correspondence.registration_date ? 
          new Date(correspondence.registration_date).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        business_card: correspondence.business_card ? String(correspondence.business_card) : '',
        status: correspondence.status || defaultStatus
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!correspondence || !correspondence.correspondence_type) {
      console.error('correspondence не определен');
      return;
    }

    if (window.confirm('Вы уверены, что хотите удалить этот документ?')) {
      try {
        await correspondenceService.delete(id);
        const redirectType = type || correspondence.correspondence_type;
        const typePath = redirectType === 'incoming' ? 'in' : 'out';
        navigate(`/${typePath}`);
      } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Не удалось удалить документ');
      }
    }
  };

  const handleBack = () => {
    const redirectType = type || (correspondence && correspondence.correspondence_type);
    if (redirectType) {
      const typePath = redirectType === 'incoming' ? 'in' : 'out';
      navigate(`/${typePath}`);
    } else {
      navigate(-1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`Изменение поля ${name}:`, value);
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  const getStatusText = (status) => {
    switch (status) {
      case 'received': return 'Получено';
      case 'registered': return 'Зарегистрировано';
      case 'processed': return 'Обработано';
      case 'sent': return 'Отправлено';
      case 'archived': return 'В архиве';
      default: return status || 'Не указано';
    }
  };

  const getTypeText = (docType) => {
    if (!docType) return 'Неизвестный';
    const docTypeString = String(docType).toLowerCase();
    return docTypeString.includes('incoming') ? 'Входящий' : 'Исходящий';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch (e) {
      return 'Неверная дата';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  if (!correspondence) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Документ не найден</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  // Определяем тип корреспонденции из данных документа
  const correspondenceType = correspondence.correspondence_type || 'incoming';

  const renderField = (label, name, isEdit = false, children) => {
    return (
      <div className={styles.field}>
        <label>{label}:</label>
        {isEdit ? children : (
          <span className={styles.value}>
            {children || 'Не указано'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={handleBack} className={styles.backButton}>
            ← Назад к списку
          </button>
          <h1 className={styles.title}>
            {getTypeText(correspondenceType)} документ
            {correspondence.registration_number && ` № ${correspondence.registration_number}`}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          {!isEditing ? (
            <>
              <button onClick={handleEdit} className={styles.editButton}>
                Редактировать
              </button>
              <button onClick={handleDelete} className={styles.deleteButton}>
                Удалить
              </button>
            </>
          ) : (
            <div className={styles.editButtons}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.infoCard}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Основная информация</h2>
            
            <div className={styles.fieldGrid}>
              {renderField(
                'Регистрационный номер',
                'registration_number',
                false,
                correspondence.registration_number || 'Не указан'
              )}
              
              {renderField(
                'Дата регистрации',
                'registration_date',
                isEditing,
                isEditing ? (
                  <input
                    type="date"
                    name="registration_date"
                    value={formData.registration_date || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                ) : (
                  formatDate(correspondence.registration_date)
                )
              )}
              
              {renderField(
                'Тип документа',
                'document_type',
                isEditing,
                isEditing ? (
                  <select 
                    name="document_type" 
                    value={formData.document_type || ''} 
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="">Выберите тип документа</option>
                    {documentTypes.map((docType, index) => (
                      <option key={index} value={docType.value}>
                        {docType.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  correspondence.document_type || 'Не указан'
                )
              )}
              
              {renderField(
                'Статус',
                'status',
                isEditing,
                isEditing ? (
                  <select 
                    name="status" 
                    value={formData.status || ''}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    {correspondenceType === 'incoming' ? (
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
                ) : (
                  <span className={`${styles.status} ${styles[correspondence.status || '']}`}>
                    {getStatusText(correspondence.status)}
                  </span>
                )
              )}
              
              {correspondenceType === 'incoming' ? (
                renderField(
                  'Отправитель',
                  'recipient',
                  isEditing,
                  isEditing ? (
                    <input
                      type="text"
                      name="recipient"
                      value={formData.recipient || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Введите отправителя"
                    />
                  ) : (
                    correspondence.recipient || 'Не указан'
                  )
                )
              ) : (
                renderField(
                  'Получатель',
                  'recipient',
                  isEditing,
                  isEditing ? (
                    <input
                      type="text"
                      name="recipient"
                      value={formData.recipient || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Введите получателя"
                    />
                  ) : (
                    correspondence.recipient || 'Не указан'
                  )
                )
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Содержание</h2>
            {renderField(
              'Краткое содержание',
              'summary',
              isEditing,
              isEditing ? (
                <textarea
                  name="summary"
                  value={formData.summary || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows="4"
                  placeholder="Введите краткое содержание документа..."
                />
              ) : (
                <div className={styles.textContent}>
                  {correspondence.summary || 'Не указано'}
                </div>
              )
            )}
            
            {renderField(
              'Примечания',
              'notes',
              isEditing,
              isEditing ? (
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows="3"
                  placeholder="Дополнительные примечания..."
                />
              ) : correspondence.notes ? (
                <div className={styles.textContent}>
                  {correspondence.notes}
                </div>
              ) : null
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Дополнительная информация</h2>
            
            <div className={styles.fieldGrid}>
              {renderField(
                'Количество страниц',
                'pages_count',
                isEditing,
                isEditing ? (
                  <input
                    type="number"
                    name="pages_count"
                    value={formData.pages_count || 1}
                    onChange={handleInputChange}
                    className={styles.input}
                    min="1"
                  />
                ) : (
                  correspondence.pages_count || 1
                )
              )}
              
              {renderField(
                'Связанное дело',
                'business_card',
                isEditing,
                isEditing ? (
                  <select 
                    name="business_card" 
                    value={formData.business_card || ''} 
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="">Не привязано к делу</option>
                    {businessCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.original_name} - {card.description || 'Без описания'}
                      </option>
                    ))}
                  </select>
                ) : correspondence.business_card_name ? (
                  <Link to={`/cards/${correspondence.business_card}`} className={styles.link}>
                    {correspondence.business_card_name}
                  </Link>
                ) : (
                  'Не связано'
                )
              )}
              
              {renderField(
                'Дата создания',
                'created_at',
                false,
                formatDate(correspondence.created_at)
              )}
              
              {renderField(
                'Дата обновления',
                'updated_at',
                false,
                formatDate(correspondence.updated_at)
              )}
            </div>
          </div>

          {renderField(
            'Прикрепленные файлы',
            'attached_files',
            isEditing,
            isEditing ? (
              <div>
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
                    type="file"
                    name="attached_files"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                )}
              </div>
            ) : correspondence.attached_files ? (
              <div className={styles.filesList}>
                <div className={styles.fileItem}>
                  <span className={styles.fileName}>
                    {correspondence.attached_files.split('/').pop()}
                  </span>
                  <a 
                    href={correspondence.attached_files} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.downloadButton}
                  >
                    Скачать
                  </a>
                </div>
              </div>
            ) : 'Нет файлов'
          )}
        </div>
      </div>
    </div>
  );
};

export default CorrespondenceDetail;