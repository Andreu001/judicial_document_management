import React, { useState } from 'react';
import styles from "./CardNavbar.module.css"; // Обратите внимание на импорт стилей

const CardNavbar = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index) => {
    setActiveTab(index);
    onTabChange(index);
  };

  return (
    <div className={styles.tabs}> {/* Обновлено использование импортированных стилей */}
      <h6
        className={activeTab === 0 ? styles.active : ""}
        onClick={() => handleTabClick(0)}
      >
        Общая информация
      </h6>
      <h6
        className={activeTab === 1 ? styles.active : ""}
        onClick={() => handleTabClick(1)}
      >
        Стороны по делу
      </h6>
      <h6
        className={activeTab === 2 ? styles.active : ""}
        onClick={() => handleTabClick(2)}
      >
        Движение дела
      </h6>
      <h6
        className={activeTab === 3 ? styles.active : ""}
        onClick={() => handleTabClick(3)}
      >
        Ходатайства по делу
      </h6>
    </div>
  );
};

export default CardNavbar;
