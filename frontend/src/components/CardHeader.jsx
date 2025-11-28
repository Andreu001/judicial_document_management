import React from 'react';
import styles from './UI/Card/BusinessCard.module.css';

const CardHeader = ({ card }) => {
  
  const normalizedCategory = card.case_category_title?.trim().toLowerCase();
  const categoryColors = {
    'административное правнарушение': '#ffcc80',
    'административное судопроизводство': '#b3e5fc',
    'гражданское судопроизводство': '#c8e6c9',
    'уголовное судопроизводство': '#ef9a9a',
  };
  const cardStyle = {
    backgroundColor: categoryColors[normalizedCategory] || '#e0e0e0',
  };  

  return (
    <div className={styles.cardHeader} style={cardStyle}>
      <div className={styles.headerTop}>
        <h5 className={styles.categoryTitle}>{card.case_category_title}</h5>
        <div className={styles.caseInfo}>
          <p className={styles.caseNumber}>№ {card.original_name}</p>
        </div>
      </div>
    </div>
  );
};

export default CardHeader;
