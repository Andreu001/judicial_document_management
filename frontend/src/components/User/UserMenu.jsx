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
      admin: 'Администратор',
      judge: 'Судья',
      secretary: 'Секретарь',
      lawyer: 'Адвокат',
      citizen: 'Гражданин'
    };
    return roles[role] || role;
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
            {user.first_name} {user.last_name}
          </span>
          <span className={styles.userRole}>
            {getRoleName(user.role)}
          </span>
        </span>
        <span className={styles.userAvatar}>👤</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userHeader}>
            <div className={styles.avatar}>👤</div>
            <div className={styles.userDetails}>
              <div className={styles.fullName}>
                {user.first_name} {user.last_name}
              </div>
              <div className={styles.role}>{getRoleName(user.role)}</div>
              {user.email && <div className={styles.email}>{user.email}</div>}
            </div>
          </div>

          <div className={styles.menuDivider}></div>

          <Link 
            to="/profile" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            📋 Мой профиль
          </Link>

          <Link 
            to="/" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            📋 Мои дела
          </Link>

          <div className={styles.menuDivider}></div>

          <button className={styles.menuItem} onClick={handleLogout}>
            🚪 Выйти
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;