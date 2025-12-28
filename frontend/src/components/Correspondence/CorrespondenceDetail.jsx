import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import correspondenceService from '../../API/CorrespondenceService';
import styles from './CorrespondenceDetail.module.css';

const CorrespondenceDetail = ( type ) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [correspondence, setCorrespondence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCorrespondence = async () => {
      try {
        setLoading(true);
        const data = await correspondenceService.getCorrespondenceById(id);
        setCorrespondence(data);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки документа:', error);
        setError('Не удалось загрузить данные документа');
        setLoading(false);
      }
    };

    fetchCorrespondence();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await correspondenceService.deleteCorrespondence(id);
      alert('Документ успешно удален');
      navigate(`/${type}`); // Возвращаемся к списку корреспонденции
    } catch (error) {
      console.error('Ошибка удаления документа:', error);
      alert('Не удалось удалить документ');
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/${type}/${id}/edit`);
  };

  const handleBack = () => {
    navigate(`/${type}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusText = (status) => {
    const statusMap = {
      'received': 'Получено',
      'registered': 'Зарегистрировано',
      'processed': 'Обработано',
      'sent': 'Отправлено',
      'archived': 'В архиве'
    };
    return statusMap[status] || status;
  };

  const getTypeText = (type) => {
    return type === 'incoming' ? 'Входящий' : 'Исходящий';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка документа...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={handleBack} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  if (!correspondence) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Документ не найден</div>
        <button onClick={handleBack} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={handleBack} className={styles.backButton}>
            ← Назад к списку
          </button>
          <h1>Документ {correspondence.registration_number}</h1>
        </div>
        
        <div className={styles.headerActions}>
          <button onClick={handleEdit} className={styles.editButton}>
            Редактировать
          </button>
          <button 
            onClick={handleDelete} 
            className={styles.deleteButton}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>

      <div className={styles.detailContent}>
        <div className={styles.detailCard}>
          <div className={styles.detailSection}>
            <h2>Основная информация</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}>
                <label>Тип документа:</label>
                <span>{getTypeText(correspondence.correspondence_type)}</span>
              </div>
              <div className={styles.detailField}>
                <label>Регистрационный номер:</label>
                <span className={styles.regNumber}>{correspondence.registration_number}</span>
              </div>
              <div className={styles.detailField}>
                <label>Дата регистрации:</label>
                <span>{formatDate(correspondence.registration_date)}</span>
              </div>
              <div className={styles.detailField}>
                <label>Статус:</label>
                <span className={`${styles.status} ${styles[correspondence.status] || ''}`}>
                  {getStatusText(correspondence.status)}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h2>Сведения о документе</h2>
            <div className={styles.detailGrid}>
              {correspondence.correspondence_type === 'incoming' ? (
                <>
                  <div className={styles.detailField}>
                    <label>Отправитель:</label>
                    <span>{correspondence.sender || 'Не указан'}</span>
                  </div>
                  <div className={styles.detailField}>
                    <label>Исходящий номер отправителя:</label>
                    <span>{correspondence.number_sender_document || 'Не указан'}</span>
                  </div>
                  <div className={styles.detailField}>
                    <label>Дата документа отправителя:</label>
                    <span>{formatDate(correspondence.outgoing_date_document)}</span>
                  </div>
                  <div className={styles.detailField}>
                    <label>Способ поступления:</label>
                    <span>{correspondence.admission_method || 'Не указан'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.detailField}>
                    <label>Получатель:</label>
                    <span>{correspondence.recipient || 'Не указан'}</span>
                  </div>
                  <div className={styles.detailField}>
                    <label>Исходящий номер:</label>
                    <span>{correspondence.number_sender_document || 'Не указан'}</span>
                  </div>
                </>
              )}
              
              <div className={styles.detailField}>
                <label>Тип документа:</label>
                <span>{correspondence.document_type || 'Не указан'}</span>
              </div>
              
              <div className={styles.detailField}>
                <label>Краткое содержание:</label>
                <span>{correspondence.summary || 'Не указано'}</span>
              </div>
              
              <div className={styles.detailField}>
                <label>Исполнитель:</label>
                <span>{correspondence.executor || 'Не назначен'}</span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h2>Связанное дело</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}>
                <label>Дело:</label>
                <span>
                  {correspondence.business_card_name ? (
                    <a 
                      href={`/cards/${correspondence.business_card}`} 
                      className={styles.caseLink}
                    >
                      {correspondence.business_card_name}
                    </a>
                  ) : 'Не связано'}
                </span>
              </div>
            </div>
          </div>

          {correspondence.attached_files && correspondence.attached_files.length > 0 && (
            <div className={styles.detailSection}>
              <h2>Прикрепленные файлы</h2>
              <div className={styles.filesList}>
                {correspondence.attached_files.map((file, index) => (
                  <a 
                    key={index} 
                    href={file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.fileLink}
                  >
                    📎 Файл {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className={styles.detailSection}>
            <h2>Дополнительная информация</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}>
                <label>Дата создания:</label>
                <span>{formatDate(correspondence.created_at)}</span>
              </div>
              <div className={styles.detailField}>
                <label>Последнее обновление:</label>
                <span>{formatDate(correspondence.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrespondenceDetail;
