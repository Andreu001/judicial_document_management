import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import baseService from '../../API/baseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './DefendantDetail.module.css';

const DefendantDetail = () => {
  const { cardId, defendantId } = useParams();
  const navigate = useNavigate();
  const [defendant, setDefendant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDefendantDetails = async () => {
      try {
        setLoading(true);
        
        // Получаем данные обвиняемого
        const defendantData = await CriminalCaseService.getDefendantById(cardId, defendantId);
        
        // Получаем название стороны по делу
        if (defendantData.side_case) {
          try {
            const sideResponse = await baseService.get(`/business_card/sides/${defendantData.side_case}/`);
            defendantData.side_case_name = sideResponse.data.sides_case;
          } catch (sideError) {
            console.error('Ошибка загрузки названия стороны:', sideError);
            defendantData.side_case_name = 'Неизвестный статус';
          }
        }

        setDefendant(defendantData);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных обвиняемого:', err);
        setError('Не удалось загрузить данные обвиняемого');
        setLoading(false);
      }
    };

    fetchDefendantDetails();
  }, [cardId, defendantId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  const getGenderText = (gender) => {
    switch (gender) {
      case 'male': return 'Мужской';
      case 'female': return 'Женский';
      default: return 'Не указано';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          Назад
        </button>
      </div>
    );
  }

  if (!defendant) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Обвиняемый не найден</div>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          ← Назад
        </button>
        <h1 className={styles.title}>Обвиняемый: {defendant.full_name}</h1>
      </div>

      <div className={styles.card}>
        {/* Основная информация */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Основные данные</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>ФИО:</span>
              <span className={styles.value}>{defendant.full_name || 'Не указано'}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Статус:</span>
              <span className={styles.value}>{defendant.side_case_name || 'Не указано'}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Дата рождения:</span>
              <span className={styles.value}>{formatDate(defendant.birth_date)}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Пол:</span>
              <span className={styles.value}>{getGenderText(defendant.sex)}</span>
            </div>
          </div>
        </div>

        {/* Контактная информация */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Контактные данные</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Адрес:</span>
              <span className={styles.value}>{defendant.address || 'Не указано'}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Гражданство:</span>
              <span className={styles.value}>{defendant.citizenship || 'Не указано'}</span>
            </div>
          </div>
        </div>

        {/* Мера пресечения */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Мера пресечения</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Мера:</span>
              <span className={styles.value}>{defendant.restraint_measure || 'Не назначена'}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Дата избрания:</span>
              <span className={styles.value}>{formatDate(defendant.restraint_date)}</span>
            </div>
          </div>
        </div>

        {/* Идентификаторы */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Идентификаторы</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>ID обвиняемого:</span>
              <span className={styles.value}>{defendant.id}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>ID дела:</span>
              <span className={styles.value}>{cardId}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button 
          onClick={() => navigate(`/businesscard/${cardId}/defendants/${defendantId}/edit`)}
          className={styles.editButton}
        >
          Редактировать
        </button>
        
        <button 
          onClick={() => navigate(-1)}
          className={styles.closeButton}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default DefendantDetail;