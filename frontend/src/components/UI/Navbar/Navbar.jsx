import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isExpeditionOpen, setIsExpeditionOpen] = useState(false);
  const [isCourtLevelOpen, setIsCourtLevelOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const toggleExpeditionMenu = () => {
    setIsExpeditionOpen(!isExpeditionOpen);
  };

  const toggleCourtLevelMenu = () => {
    setIsCourtLevelOpen(!isCourtLevelOpen);
  };

  const toggleCategoriesMenu = () => {
    setIsCategoriesOpen(!isCategoriesOpen);
  };

  const toggleParticipantsMenu = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
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
        <div className={styles.dropdown}>
          <button onClick={toggleExpeditionMenu} className={styles.dropdownButton}>
            Экспедиция
          </button>
          {isExpeditionOpen && (
            <div className={styles.dropdownContent}>
              <Link to="/in">Входящая корреспонденция</Link>
              <Link to="/out">Исходящая корреспонденция</Link>
            </div>
          )}
        </div>
        <div className={styles.dropdown}>
          <button onClick={toggleCategoriesMenu} className={styles.dropdownButton}>
            Категории дел
          </button>
          {isCategoriesOpen && (
            <div className={styles.dropdownContent}>
              <Link to="">Уголовные дела</Link>
              <Link to="">Гражданские дела</Link>
              <Link to="">Административные дела</Link>
              <Link to="">Административные правонарушения</Link>
            </div>
          )}
        </div>
        <div className={styles.dropdown}>
          <button onClick={toggleParticipantsMenu} className={styles.dropdownButton}>
            Участники процесса
          </button>
          {isParticipantsOpen && (
            <div className={styles.dropdownContent}>
              <Link to="">Физические лица</Link>
              <Link to="">Юридические лица</Link>
            </div>
          )}
        </div>
        <Link to="/statistic">Статистика</Link>
        <Link to="/archive">Архив</Link>
        <Link to="/profile">Профиль</Link>
        <Link to="/about">О сайте</Link>
      </div>
    </div>
  );
};

export default Navbar;