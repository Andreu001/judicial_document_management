import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSideAuth } from '../context/SideAuthContext';
import LoginForm from './Auth/LoginForm';
import UserMenu from './User/UserMenu';
import NotificationBell from './Notifications/NotificationsBell';
import MeetingsCalendar from './Calendar/MeetingsCalendar';
import SideLoginForm from './SideAuth/SideLoginForm';
import styles from './UI/Header/Header.module.css';
import MessengerApp from './Messenger/MessengerApp';

const Header = ({ filter, setFilter, onSearch }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSideLogin, setShowSideLogin] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMessenger, setShowMessenger] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { user: sideUser, logout: sideLogout, isAuthenticated: isSideAuthenticated } = useSideAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSide = isSideAuthenticated();
  const isJudge = isAuthenticated();

  const getActiveButton = () => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    return type || 'plenum';
  };

  const activeType = getActiveButton();

  const handleNavigation = (type) => {
    navigate(`/legal-documents?type=${type}`);
  };

  const handleMyCasesClick = () => {
    if (isSide) {
      navigate('/my-cases');
    } else {
      setShowSideLogin(true);
    }
  };

  const handleSideLogout = () => {
    sideLogout();
    if (location.pathname === '/my-cases') {
      navigate('/cards');
    }
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

  const handleMessengerToggle = () => {
    setShowMessenger(!showMessenger);
  };

  // Для стороны - хедер только с календарем и кнопкой выхода
  if (isSide && !isJudge) {
    return (
      <>
        <div className={styles.header}>
          <div className={styles.navigation}>
            <button 
              className={`${styles.navButton} ${styles.calendarButton}`}
              onClick={handleCalendarClick}
            >
              Календарь заседаний
            </button>
            <button 
              className={`${styles.navButton} ${styles.messengerButton}`}
              onClick={handleMessengerToggle}
              >Мессенджер
              {showMessenger ? 'Скрыть чаты' : 'Мои чаты'}
            </button>
          </div>

          <div className={styles.actions}>
            {sideUser && (
              <div className={styles.sideUserInfo}>
                <span className={styles.sideUserName}>
                  {sideUser.full_name || sideUser.email}
                </span>
                <button onClick={handleSideLogout} className={styles.sideLogoutButton}>
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>

        {showCalendar && (
          <MeetingsCalendar onClose={() => setShowCalendar(false)} />
        )}

      </>
    );
  }

  // Для сотрудников суда - полная версия
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
            Календарь заседаний
          </button>
          <button 
            className={`${styles.navButton} ${styles.messengerButton}`}
            onClick={handleMessengerToggle}
          >
            {showMessenger ? 'Скрыть чаты' : 'Мессенджер'}
          </button>

          <button 
            className={`${styles.navButton}`}
            onClick={() => navigate('/case-distribution')}
          >
            Распределение дел
          </button>
        </div>

        <div className={styles.actions}>
          <NotificationBell />
          <div className={styles.divider}></div>
          
          {isJudge && user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <button 
              onClick={() => setShowLogin(true)} 
              className={styles.loginButton}
            >
              Вход для сотрудников
            </button>
          )}
          
          <div className={styles.divider}></div>
          
          <button 
            onClick={handleMyCasesClick}
            className={styles.myCasesButton}
          >
            Мои дела
          </button>
        </div>
      </div>

      {showLogin && (
        <LoginForm onClose={() => setShowLogin(false)} />
      )}

      {showSideLogin && (
        <SideLoginForm 
          onClose={() => setShowSideLogin(false)}
          onSuccess={() => {
            setShowSideLogin(false);
            navigate('/my-cases');
          }}
        />
      )}

      {showCalendar && (
        <MeetingsCalendar onClose={() => setShowCalendar(false)} />
      )}
      {showMessenger && <MessengerApp onClose={() => setShowMessenger(false)} />}
    </>
  );
};

export default Header;