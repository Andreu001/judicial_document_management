
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from './Auth/LoginForm';
import UserMenu from './User/UserMenu';
import NotificationBell from './Notifications/NotificationsBell';
import MeetingsCalendar from './Calendar/MeetingsCalendar';
import styles from './UI/Header/Header.module.css';
import CitizenLoginForm from '../pages/Citizen/CitizenLoginForm';


const Header = ({ filter, setFilter, onSearch }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showCitizenLogin, setShowCitizenLogin] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { user, isAuthenticated, isCitizen, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    if (isCitizen()) {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  };

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

  if (isCitizen() && user) {
    return (
      <>
        <div className={styles.header}>
          <div className={styles.citizenTitle}>
            📋 Личный кабинет участника процесса
          </div>
          <div className={styles.actions}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user?.last_name} {user?.first_name}
              </span>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Выйти
            </button>
          </div>
        </div>

        {showCalendar && (
          <MeetingsCalendar onClose={() => setShowCalendar(false)} />
        )}
      </>
    );
  }

  // Полный хедер для сотрудников (ВСЕ ВОССТАНОВЛЕНО)
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

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск..."
            className={styles.searchInput}
            value={filter?.query || ''}
            onChange={(e) => setFilter && setFilter({ ...filter, query: e.target.value })}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.searchButton} onClick={handleSearch}>
            🔍
          </button>
        </div>

        <div className={styles.actions}>
          <NotificationBell />
          <div className={styles.divider}></div>
          
          {isAuthenticated() && user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <button 
                onClick={() => setShowCitizenLogin(true)}
                className={styles.citizenLoginButton}
              >
                Вход для граждан
              </button>
              <button 
                onClick={() => setShowLogin(true)}
                className={styles.loginButton}
              >
                Вход для сотрудников
              </button>
            </>
          )}
        </div>
      </div>

      {showLogin && (
        <LoginForm 
          onClose={() => setShowLogin(false)} 
          onSwitchToCitizen={() => {
            setShowLogin(false);
            setShowCitizenLogin(true);
          }}
        />
      )}

      {showCitizenLogin && (
        <CitizenLoginForm 
          onClose={() => setShowCitizenLogin(false)}
          onSwitchToStaff={() => {
            setShowCitizenLogin(false);
            setShowLogin(true);
          }}
        />
      )}

      {showCalendar && (
        <MeetingsCalendar onClose={() => setShowCalendar(false)} />
      )}
    </>
  );
};

export default Header;