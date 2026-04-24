// src/pages/Citizen/CitizenLoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../components/Auth/Auth.module.css';

const CitizenLoginForm = ({ onClose, onSwitchToStaff }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { citizenLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await citizenLogin(username, password);
    
    if (result.success) {
      onClose();
      window.location.href = '/citizen/dashboard';
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    if (provider === 'vk') {
      window.location.href = 'http://localhost:8000/auth/login/vk-oauth2/';
    } else if (provider === 'yandex') {
      window.location.href = 'http://localhost:8000/auth/login/yandex-oauth2/';
    }
  };

  return (
    <div className={styles.authModal}>
      <div className={styles.authContent}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <h2>Вход в личный кабинет</h2>
        <p className={styles.subtitle}>Гражданин / Участник процесса</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="Логин или Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>или</span>
        </div>

        <div className={styles.socialButtons}>
          <button 
            onClick={() => handleSocialLogin('vk')}
            className={`${styles.socialButton} ${styles.vkButton}`}
          >
            Войти через VK
          </button>
          <button 
            onClick={() => handleSocialLogin('yandex')}
            className={`${styles.socialButton} ${styles.yandexButton}`}
          >
            Войти через Яндекс
          </button>
        </div>

        <div className={styles.switchLink}>
          <button onClick={onSwitchToStaff}>
            Вход для сотрудников суда →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenLoginForm;