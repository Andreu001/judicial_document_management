import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isCourtLevelOpen, setIsCourtLevelOpen] = useState(false);

  const toggleCourtLevelMenu = () => {
    setIsCourtLevelOpen(!isCourtLevelOpen);
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.navbar__header}>
        <div className={styles.navbar__title}>Судопроизводство</div>
      </div>

      <div className={styles.navbar__links}>
        <Link to="/cards">Главная страница</Link>
        <div className={styles.dropdown}>
          <button onClick={toggleCourtLevelMenu} className={styles.dropdownButton}>
            Выбор уровня суда
          </button>
          {isCourtLevelOpen && (
            <div className={styles.dropdownContent}>
              <Link to="/world-court">Мировой суд</Link>
              <Link to="/district-court">Районный/городской суд</Link>
              <Link to="/regional-court">Суд уровня субъекта</Link>
            </div>
          )}
        </div>
        <Link to="">Категории дел</Link>
        <Link to="/archive">Архив</Link>
        <Link to="/profile">Профиль</Link>
        <Link to="/about">О сайте</Link>
      </div>
    </div>
  );
};

export default Navbar;