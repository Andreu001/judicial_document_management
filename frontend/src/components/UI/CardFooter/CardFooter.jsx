import React from 'react';
import MyButton from '../button/MyButton';
import { useNavigate } from 'react-router-dom';
import styles from './CardFooter.module.css';

const CardFooter = ({
  activeTab,
  handleAddSideToState,
  handleAddMovementToState,
  handleAddPetitionToState,
  handleRemove,
  handleEditToggle,
  isEditingCard,
  cardId
}) => {
  const router = useNavigate();

  const renderButtons = () => {
    if (activeTab === 1) {
      return (
        <div className={styles.cardButtons}>
          <MyButton className={styles.add} onClick={handleAddSideToState}>Добавить сторону</MyButton>
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
          <MyButton className={styles.add} onClick={handleAddPetitionToState}>Добавить решение</MyButton>
        </div>
      );
    }
    return (
      <div className={styles.cardButtons}>
        <MyButton className={styles.details} onClick={() => router(`/cards/${cardId}`)}>Подробнее</MyButton>
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
