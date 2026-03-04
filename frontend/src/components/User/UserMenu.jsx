import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './UserMenu.module.css';

const UserMenu = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleName = (role) => {
    const roles = {
      admin: 'Администратор системы',
      judge: 'Судья',
      secretary: 'Секретарь судебного заседания',
      assistant: 'Помощник судьи',
      lawyer: 'Адвокат',
      citizen: 'Гражданин'
    };
    return roles[role] || role;
  };

  const getSubjectLevelName = (level) => {
    const levels = {
      magistrate: 'Мировой суд',
      city_district: 'Городской/районный суд',
      subject_level: 'Суд уровня субъекта РФ'
    };
    return levels[level] || level;
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button 
        className={styles.userButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.userInfo}>
          <span className={styles.userName}>
            {user.last_name} {user.first_name?.[0]}. {user.patronymic?.[0]}.
          </span>
        </span>
        <span className={styles.userAvatar}></span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userHeader}>
            <div className={styles.userDetails}>
              <div className={styles.fullName}>
                {user.last_name} {user.first_name} {user.patronymic}
              </div>
              <div className={styles.role}>{getRoleName(user.role)}</div>
              {user.role === 'judge' && user.subject_level && (
                <div className={styles.subjectLevel}>
                  {getSubjectLevelName(user.subject_level)}
                </div>
              )}
              {user.court_name && (
                <div className={styles.courtName}>{user.court_name}</div>
              )}
              {user.email && <div className={styles.email}>{user.email}</div>}
            </div>
          </div>

          <div className={styles.menuDivider}></div>

          <Link 
            to="/profile" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            Мой профиль
          </Link>

          <Link 
            to="/my-cases" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            Мои дела
          </Link>

          <Link 
            to="/calendar" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            Календарь заседаний
          </Link>

          <Link 
            to="/statistics" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            Статистика
          </Link>

          {user.role === 'admin' && (
            <Link 
              to="/admin-panel" 
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              Панель администратора
            </Link>
          )}

          <div className={styles.menuDivider}></div>

          <button className={styles.menuItem} onClick={handleLogout}>
            Выйти из системы
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;