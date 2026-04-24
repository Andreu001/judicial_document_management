import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isExpeditionOpen, setIsExpeditionOpen] = useState(false);
  const [isCourtLevelOpen, setIsCourtLevelOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const { isCitizen, isCourtStaff } = useAuth();

  const toggleExpeditionMenu = () => {
    setIsExpeditionOpen(!isExpeditionOpen);
  };

  const toggleCourtLevelMenu = () => {
    setIsCourtLevelOpen(!isCourtLevelOpen);
  };

  const toggleCategoriesMenu = () => {
    setIsCategoriesOpen(!isCategoriesOpen);
  };

  // Для граждан - упрощенное меню
  if (isCitizen()) {
    return (
      <div className={styles.navbar}>
        <div className={styles.navbar__header}>
          <div className={styles.navbar__title}>Автоматизированная</div>
          <div className={styles.navbar__title}>система судопроизводства</div>
        </div>

        <div className={styles.navbar__links}>
          <Link to="/citizen/dashboard">📋 Мои дела</Link>
          
          <div className={styles.dropdown}>
            <button 
              onClick={toggleCategoriesMenu} 
              className={styles.dropdownButton}
            >
              Категории дел
            </button>
            {isCategoriesOpen && (
              <div className={styles.dropdownContent}>
                <Link to="/citizen/cases/criminal">Уголовные дела</Link>
                <Link to="/citizen/cases/civil">Гражданские дела</Link>
                <Link to="/citizen/cases/coap">Адм. правонарушения</Link>
                <Link to="/citizen/cases/kas">Дела КАС</Link>
              </div>
            )}
          </div>

          <Link to="/citizen/archive">📦 Архив дел</Link>
          <Link to="/about">ℹ️ Справка</Link>
        </div>
      </div>
    );
  }

  // Стандартное меню для сотрудников суда
  return (
    <div className={styles.navbar}>
      <div className={styles.navbar__header}>
        <div className={styles.navbar__title}>Автоматизированная</div>
        <div className={styles.navbar__title}>система судопроизводства</div>
      </div>

      <div className={styles.navbar__links}>
        <Link to="/cards">Главная</Link>
        
        <div className={styles.dropdown}>
          <button 
            onClick={toggleCourtLevelMenu} 
            className={styles.dropdownButton}
          >
            Уровни судов
          </button>
          {isCourtLevelOpen && (
            <div className={styles.dropdownContent}>
              <Link to="/world-court">Мировой суд</Link>
              <Link to="/district-court">Районный суд</Link>
              <Link to="/regional-court">Областной суд</Link>
            </div>
          )}
        </div>

        <div className={styles.dropdown}>
          <button 
            onClick={toggleExpeditionMenu} 
            className={styles.dropdownButton}
          >
            Экспедиция
          </button>
          {isExpeditionOpen && (
            <div className={styles.dropdownContent}>
              <Link to="/in">Входящие документы</Link>
              <Link to="/out">Исходящие документы</Link>
            </div>
          )}
        </div>

        <div className={styles.dropdown}>
          <button 
            onClick={toggleCategoriesMenu} 
            className={styles.dropdownButton}
          >
            Категории дел
          </button>
          {isCategoriesOpen && (
            <div className={styles.dropdownContent}>
              <Link to="/criminal">Уголовные дела</Link>
              <Link to="/civil">Гражданские дела</Link>
              <Link to="/administrative">Административные дела КАС</Link>
              <Link to="/admin-offenses">Адм. правонарушения</Link>
            </div>
          )}
        </div>

        <Link to="/person-search">Участники процесса</Link>
        <Link to="/hr">Кадры</Link>
        <Link to="/statistics">Статистика</Link>
        <Link to="/archive">Архив</Link>
        <Link to="/about">Справка</Link>
      </div>
    </div>
  );
};

export default Navbar;