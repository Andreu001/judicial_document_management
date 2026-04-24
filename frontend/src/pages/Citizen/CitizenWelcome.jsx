// src/pages/Citizen/CitizenWelcome.jsx
import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './CitizenWelcome.module.css';

const CitizenWelcome = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/citizen/login';
  };

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeHeader}>
          <h1>Добро пожаловать в систему!</h1>
          <p className={styles.subtitle}>Личный кабинет гражданина</p>
        </div>
        
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.first_name?.[0] || user?.username?.[0] || 'Г'}
          </div>
          <div className={styles.userDetails}>
            <h2>{user?.last_name} {user?.first_name} {user?.middle_name}</h2>
            <p>Статус: {user?.is_verified ? '✅ Верифицирован' : '⏳ Ожидает верификации'}</p>
            <p>Email: {user?.email || 'Не указан'}</p>
          </div>
        </div>

        <div className={styles.quickActions}>
          <h3>Быстрые действия</h3>
          <div className={styles.actionButtons}>
            <a href="/citizen/dashboard" className={styles.actionButton}>
              <span className={styles.icon}>📋</span>
              Мои дела
            </a>
            <a href="/citizen/verify" className={styles.actionButton}>
              <span className={styles.icon}>🔐</span>
              Верификация
            </a>
            <a href="/citizen/profile" className={styles.actionButton}>
              <span className={styles.icon}>👤</span>
              Профиль
            </a>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{user?.cases_count || 0}</div>
            <div className={styles.statLabel}>Дел в работе</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{user?.petitions_count || 0}</div>
            <div className={styles.statLabel}>Ходатайств</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{user?.documents_count || 0}</div>
            <div className={styles.statLabel}>Документов</div>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutButton}>
          Выйти из системы
        </button>
      </div>
    </div>
  );
};

export default CitizenWelcome;