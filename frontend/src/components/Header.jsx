// Header.jsx (обновленная версия)
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from './Auth/LoginForm';
import UserMenu from './User/UserMenu';
import NotificationBell from './Notifications/NotificationsBell';
import MeetingsCalendar from './Calendar/MeetingsCalendar';
import styles from './UI/Header/Header.module.css';

const Header = ({ filter, setFilter, onSearch }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveButton = () => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    return type || 'plenum';
  };

  const activeType = getActiveButton();

  const handleNavigation = (type) => {
    navigate(`/legal-documents?type=${type}`);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(filter.query);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCalendarClick = () => {
    setShowCalendar(true);
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.navigation}>
          <button 
            className={`${styles.navButton} ${activeType === 'plenum' ? styles.active : ''}`}
            onClick={() => handleNavigation('plenum')}
          >
            Постановления пленумов ВС РФ
          </button>
          <button 
            className={`${styles.navButton} ${activeType === 'review' ? styles.active : ''}`}
            onClick={() => handleNavigation('review')}
          >
            Обзоры практики ВС РФ
          </button>
          <button 
            className={`${styles.navButton} ${activeType === 'reference' ? styles.active : ''}`}
            onClick={() => handleNavigation('reference')}
          >
            Справочные материалы
          </button>
          <button 
            className={`${styles.navButton} ${styles.calendarButton}`}
            onClick={handleCalendarClick}
          >
            📅 Календарь заседаний
          </button>
        </div>

        <div className={styles.actions}>
          <NotificationBell />
          <div className={styles.divider}></div>
          
          {isAuthenticated() && user ? (
            <UserMenu user={user} />
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className={styles.loginButton}
            >
              Войти
            </button>
          )}
        </div>
      </div>

      {showLogin && (
        <LoginForm onClose={() => setShowLogin(false)} />
      )}

      {showCalendar && (
        <MeetingsCalendar onClose={() => setShowCalendar(false)} />
      )}
    </>
  );
};

export default Header;