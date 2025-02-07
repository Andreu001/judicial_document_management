import React from 'react';
import MyInput from './UI/input/MyInput';
import MySelect from './UI/select/MySelect';
import styles from './UI/Header/Header.module.css'; // Импортируем стили

const CardFilter = ({ filter, setFilter }) => {
  return (
    <div className={styles.header}>
      {/* Поиск */}
      <div className={styles.search}>
        <MyInput
          value={filter.query}
          onChange={(e) => setFilter({ ...filter, query: e.target.value })}
          placeholder="Поиск..."
        />
      </div>

      {/* Сортировка */}
      <div className={styles.sort}>
        <MySelect
          value={filter.sort}
          onChange={(selectedSort) => setFilter({ ...filter, sort: selectedSort })}
          defaultValue="Сортировка"
          options={[
            { value: 'title', name: 'По дате поступления' },
            { value: 'title', name: 'По дате назначения' },
            { value: 'title', name: 'По дате рассмотрения' },
            { value: 'body', name: 'По ФИО' },
          ]}
        />
      </div>

      {/* Уведомления и профиль */}
      <div className={styles.actions}>
        <button className={styles.notificationButton}>🔔</button>
        <div className={styles.divider}></div> {/* Разделитель */}
        <button className={styles.profileButton}>👤 Профиль</button>
      </div>
    </div>
  );
};

export default CardFilter;