import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MyInput from './UI/input/MyInput';
import MySelect from './UI/select/MySelect';
import LoginForm from './Auth/LoginForm';
import UserMenu from './User/UserMenu';
import NotificationBell from './Notifications/NotificationsBell';
import styles from './UI/Header/Header.module.css';

const Header = ({ filter, setFilter, onSearch }) => {
  const [showLogin, setShowLogin] = useState(false);
  const { user, isAuthenticated } = useAuth();

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

  return (
    <>
      <div className={styles.header}>
        <div className={styles.search}>
          <MyInput
            value={filter.query}
            onChange={(e) => setFilter({ ...filter, query: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Поиск..."
          />
          <button className={styles.searchButton} onClick={handleSearch}>
            🔍
          </button>
          <MySelect
            value={filter.searchBy}
            onChange={(selectedSearchBy) => setFilter({ ...filter, searchBy: selectedSearchBy })}
            defaultValue="Поиск по"
            options={[
              { value: 'name', name: 'По ФИО' },
              { value: 'caseNumber', name: 'По номеру дела' },
              { value: 'article', name: 'По статье' },
            ]}
          />
        </div>

        <div className={styles.sort}>
          <MySelect
            value={filter.sort}
            onChange={(selectedSort) => setFilter({ ...filter, sort: selectedSort })}
            defaultValue="Сортировка"
            options={[
              { value: 'receivedDate', name: 'По дате поступления' },
              { value: 'appointedDate', name: 'По дате назначения' },
              { value: 'consideredDate', name: 'По дате рассмотрения' },
            ]}
          />
        </div>

        <div className={styles.actions}>
          {/* Заменяем кнопку уведомлений на компонент колокольчика */}
          <NotificationBell />
          <div className={styles.divider}></div>
          
          {isAuthenticated() && user ? (
            <UserMenu user={user} />
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className={styles.loginButton}
            >
              👤 Войти
            </button>
          )}
        </div>
      </div>

      {showLogin && (
        <LoginForm onClose={() => setShowLogin(false)} />
      )}
    </>
  );
};

export default Header;