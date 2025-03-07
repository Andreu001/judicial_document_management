import React from 'react';
import { Link } from 'react-router-dom';
import MyInput from './UI/input/MyInput';
import MySelect from './UI/select/MySelect';
import styles from './UI/Header/Header.module.css';

const Header = ({ filter, setFilter, onSearch }) => {
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
        <button className={styles.notificationButton}>🔔</button>
        <div className={styles.divider}></div>
        <Link to="/profile" className={styles.profileButton}>👤 Профиль</Link>
      </div>
    </div>
  );
};

export default Header;
