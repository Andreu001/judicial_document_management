import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <div className={styles.navbar}>
      <div className={styles.navbar__header}>
        <div className={styles.navbar__title}>Судопроизводство</div>
      </div>

      <div className={styles.navbar__links}>
        <Link to="/cards">Главная страница</Link>
        <Link to="">Выбор уровня суда</Link>
        <Link to="">Категории дел</Link>
        <Link to="">Архив</Link>
        <Link to="">Профиль</Link>
        <Link to="/business_card/businesscard">Список всех карточек</Link>
        <Link to="/about">О сайте</Link>
      </div>
    </div>
  );
};

export default Navbar;