// CardFooter.jsx - исправим функцию handleAddConsideredToState
import React from 'react';
import MyButton from '../button/MyButton';
import { useNavigate } from 'react-router-dom';
import styles from './CardFooter.module.css';

const CardFooter = ({
  activeTab,
  handleAddSideToState,
  handleAddMovementToState,
  handleAddPetitionToState,
  handleAddConsideredToState,
  handleRemove,
  handleEditToggle,
  isEditingCard,
  cardId,
  hasCriminalCase,
  handleShowDetails,
  card,
  handleAddCriminalDecision // Добавим этот пропс
  }) => {
  const router = useNavigate();
  
const isCriminalCase = () => {
  // Проверяем по ID категории - это самый надежный способ
  if (card && card.case_category === 4) {
    return true;
  }
  
  // Дополнительная проверка по названию (если нужно)
  if (card && card.case_category_title && 
      card.case_category_title.toLowerCase().includes('уголов')) {
    return true;
  }
  
  return false;
};

  const renderButtons = () => {
    if (activeTab === 1) {
      return (
        <div className={styles.cardButtons}>
          <MyButton className={styles.add} onClick={handleAddSideToState}>
            {isCriminalCase() ? 'Добавить обвиняемого' : 'Добавить сторону'}
          </MyButton>
        </div>
      );
    } else if (activeTab === 2) {
      return (
        <div className={styles.cardButtons}>
          <MyButton className={styles.add} onClick={handleAddMovementToState}>Добавить движение по делу</MyButton>
        </div>
      );
    } else if (activeTab === 3) {
      return (
        <div className={styles.cardButtons}>
          <MyButton className={styles.add} onClick={handleAddPetitionToState}>Добавить ходатайство по делу</MyButton>
        </div>
      );
    } else if (activeTab === 4) {
      return (
        <div className={styles.cardButtons}>
          <MyButton className={styles.add} onClick={() => {
            if (isCriminalCase()) {
              handleAddCriminalDecision(); // Вызываем функцию для уголовных решений
            } else {
              handleAddConsideredToState(); // Стандартная функция для обычных решений
            }
          }}>
            Добавить решение
          </MyButton>
        </div>
      );
    }
    return (
      <div className={styles.cardButtons}>
          <MyButton className={styles.details} onClick={handleShowDetails}>
            Подробнее
          </MyButton>
        <MyButton className={styles.delete} onClick={handleRemove}>Удалить</MyButton>
        <MyButton className={styles.edit} onClick={handleEditToggle}>
          {isEditingCard ? 'Сохранить' : 'Редактировать'}
        </MyButton>
      </div>
    );
  };

  return (
    <div className={styles.cardFooter}>
      {renderButtons()}
    </div>
  );
};

export default CardFooter;