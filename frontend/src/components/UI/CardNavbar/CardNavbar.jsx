import React, { useState } from 'react';
import styles from "./CardNavbar.module.css";

const CardNavbar = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index) => {
    setActiveTab(index);
    onTabChange(index);
  };

  return (
    <div className={styles.tabs}>
      <h6
        className={activeTab === 0 ? styles.active : ""}
        onClick={() => handleTabClick(0)}
      >
        Общее
      </h6>
      <h6
        className={activeTab === 1 ? styles.active : ""}
        onClick={() => handleTabClick(1)}
      >
        Стороны
      </h6>
      <h6
        className={activeTab === 2 ? styles.active : ""}
        onClick={() => handleTabClick(2)}
      >
        Движение
      </h6>
      <h6
        className={activeTab === 3 ? styles.active : ""}
        onClick={() => handleTabClick(3)}
      >
        Ходатайства
      </h6>
      <h6
        className={activeTab === 4 ? styles.active : ""}
        onClick={() => handleTabClick(4)}
      >
        Решения
      </h6>
    </div>
  );
};

export default CardNavbar;
