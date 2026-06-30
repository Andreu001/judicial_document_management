import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSideAuth } from '../../../context/SideAuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isExpeditionOpen, setIsExpeditionOpen] = useState(false);
  const [isCourtLevelOpen, setIsCourtLevelOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
  const [isCourtRegistryOpen, setIsCourtRegistryOpen] = useState(false);
  const { isAuthenticated: isJudgeAuthenticated, user: judgeUser } = useAuth();
  const { isAuthenticated: isSideAuthenticated, user: sideUser } = useSideAuth();
  const location = useLocation();

  // Определяем, кто авторизован
  const isJudge = isJudgeAuthenticated();
  const isSide = isSideAuthenticated();

  // Сторона не должна видеть административные пункты вообще
  if (isSide && !isJudge) {
    return (
      <div className={styles.navbar}>
        <div className={styles.navbar__header}>
          <div className={styles.navbar__title}>Автоматизированная</div>
          <div className={styles.navbar__title}>система судопроизводства</div>
        </div>

        <div className={styles.navbar__links}>
          {/* Только разрешенные пункты для стороны */}
          <Link to="/my-cases" className={location.pathname === '/my-cases' ? styles.activeLink : ''}>
            Главная
          </Link>
          
          <Link to="/communication" className={location.pathname === '/communication' ? styles.activeLink : ''}>
            Мессенджер
          </Link>

          <Link to="/my-cases?category=criminal" className={styles.categoryLink}>
            Уголовные дела
          </Link>

          <Link to="/my-cases?category=civil" className={styles.categoryLink}>
            Гражданские дела
          </Link>

          <Link to="/my-cases?category=kas" className={styles.categoryLink}>
            Административные дела КАС
          </Link>

          <Link to="/my-cases?category=admin-offenses" className={styles.categoryLink}>
            Административные правонарушения
          </Link>
          
          <Link to="/archive" className={location.pathname === '/archive' ? styles.activeLink : ''}>
            Архив
          </Link>
          
          <Link to="/about" className={location.pathname === '/about' ? styles.activeLink : ''}>
            Справка
          </Link>
          
          <div className={styles.dividerLine}></div>
          <div className={styles.sideCabinet}>
            <div className={styles.sideCabinetHeader}>
              {sideUser?.full_name || 'Участник процесса'}
            </div>
            <div className={styles.sideCabinetDesc}>
              Вы вошли как сторона по делу<br/>
              Доступно только чтение дел
            </div>
          </div>
        </div>
      </div>
    );
  }

  const toggleExpeditionMenu = () => {
    if (!isJudge) return;
    setIsExpeditionOpen(!isExpeditionOpen);
  };

  const toggleCourtLevelMenu = () => {
    if (!isJudge) return;
    setIsCourtLevelOpen(!isCourtLevelOpen);
  };

  const toggleCategoriesMenu = () => {
    if (!isJudge) return;
    setIsCategoriesOpen(!isCategoriesOpen);
  };

  const toggleCommunicationMenu = () => {
    if (!isJudge) return;
    setIsCommunicationOpen(!isCommunicationOpen);
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.navbar__header}>
        <div className={styles.navbar__title}>Автоматизированная</div>
        <div className={styles.navbar__title}>система судопроизводства</div>
      </div>

      <div className={styles.navbar__links}>
        <Link to="/cards" className={location.pathname === '/cards' ? styles.activeLink : ''}>
          Главная
        </Link>
        
        {/* Реестр судов */}
        <div className={styles.dropdown}>
          <button onClick={() => { if (!isJudge) return; setIsCourtRegistryOpen(!isCourtRegistryOpen); }} className={styles.dropdownButton}>
            Реестр судов
          </button>
          {isCourtRegistryOpen && (
            <div className={styles.dropdownContent}>
              <Link to="/court-registry" className={location.pathname === '/court-registry' ? styles.activeLink : ''}>
                Обзор
              </Link>
              <Link to="/court-registry/courts" className={location.pathname.startsWith('/court-registry/courts') ? styles.activeLink : ''}>
                Суды
              </Link>
              <Link to="/court-registry/transfers" className={location.pathname.startsWith('/court-registry/transfers') ? styles.activeLink : ''}>
                Передачи дел
              </Link>
              <Link to="/court-registry/notifications" className={location.pathname.startsWith('/court-registry/notifications') ? styles.activeLink : ''}>
                Уведомления
              </Link>
              <Link to="/court-registry/pending-transfers" className={location.pathname.startsWith('/court-registry/pending-transfers') ? styles.activeLink : ''}>
                Ожидают передачи
              </Link>
              <Link to="/court-registry/vcs" className={location.pathname.startsWith('/court-registry/vcs') ? styles.activeLink : ''}>
                ВКС
              </Link>
              <Link to="/court-registry/messenger" className={location.pathname === '/court-registry/messenger' ? styles.activeLink : ''}>
                Мессенджер
              </Link>
              <Link to="/court-registry/audit" className={location.pathname === '/court-registry/audit' ? styles.activeLink : ''}>
                Аудит
              </Link>
            </div>
          )}
        </div>

        <div className={styles.dropdown}>
          <button onClick={toggleExpeditionMenu} className={styles.dropdownButton}>
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
          <button onClick={toggleCategoriesMenu} className={styles.dropdownButton}>
            Категории дел
          </button>
          {isCategoriesOpen && (
            <div className={styles.dropdownContent}>
              <Link to="/criminal">Уголовные дела</Link>
              <Link to="/civil">Гражданские дела</Link>
              <Link to="/administrative">Административные дела КАС</Link>
              <Link to="/admin-offenses">Административные правонарушения</Link>
            </div>
          )}
        </div>

        <Link to="/person-search" className={location.pathname === '/person-search' ? styles.activeLink : ''}>
          Участники процесса
        </Link>
        <Link to="/hr" className={location.pathname === '/hr' ? styles.activeLink : ''}>
          Кадры
        </Link>
        <Link to="/statistics" className={location.pathname === '/statistics' ? styles.activeLink : ''}>
          Статистика
        </Link>
        <Link to="/archive" className={location.pathname === '/archive' ? styles.activeLink : ''}>
          Архив
        </Link>
        <Link to="/about" className={location.pathname === '/about' ? styles.activeLink : ''}>
          Справка
        </Link>
      </div>
    </div>
  );
};

export default Navbar;