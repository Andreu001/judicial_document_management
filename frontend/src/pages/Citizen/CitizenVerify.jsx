// src/pages/Citizen/CitizenVerify.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import citizenAuthService from '../../API/citizenAuthService';
import { useNavigate } from 'react-router-dom';
import styles from './CitizenVerify.module.css';

const CitizenVerify = () => {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    passport_series: '',
    passport_number: '',
    birth_date: user?.birth_date || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [yandexDataLoaded, setYandexDataLoaded] = useState(false);

  // Загружаем данные из Яндекс ID, если они есть
  useEffect(() => {
    const loadYandexData = async () => {
      if (user?.yandex_id && !yandexDataLoaded && !user?.is_verified) {
        try {
          const yandexInfo = await citizenAuthService.getYandexInfo();
          if (yandexInfo && yandexInfo.birth_date && !formData.birth_date) {
            setFormData(prev => ({
              ...prev,
              birth_date: yandexInfo.birth_date
            }));
            setYandexDataLoaded(true);
          }
        } catch (error) {
          console.error('Failed to load Yandex data:', error);
        }
      }
    };
    
    loadYandexData();
  }, [user, yandexDataLoaded, formData.birth_date]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await citizenAuthService.verifyPassport(formData);
      await fetchUser();
      setSuccess(true);
      setTimeout(() => {
        navigate('/citizen/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.verifyContainer}>
      <div className={styles.verifyCard}>
        <h2>🔐 Подтверждение личности</h2>
        <p>Для доступа к делам необходимо подтвердить свою личность по паспортным данным</p>
        
        {user?.yandex_id && !user?.birth_date && (
          <div className={styles.infoBanner}>
            ℹ️ Ваши данные из Яндекса будут использованы для автоматического заполнения
          </div>
        )}
        
        {success && (
          <div className={styles.success}>
            ✅ Верификация успешно пройдена! Перенаправление...
          </div>
        )}
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Серия паспорта</label>
            <input
              type="text"
              name="passport_series"
              placeholder="XXXX"
              value={formData.passport_series}
              onChange={handleChange}
              required
              maxLength="4"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Номер паспорта</label>
            <input
              type="text"
              name="passport_number"
              placeholder="XXXXXX"
              value={formData.passport_number}
              onChange={handleChange}
              required
              maxLength="6"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Дата рождения</label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              required
            />
            {user?.yandex_id && (
              <small className={styles.hint}>
                Эта дата может быть автоматически получена из вашего аккаунта Яндекс
              </small>
            )}
          </div>
          
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CitizenVerify;