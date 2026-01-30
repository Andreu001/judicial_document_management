import React from 'react';
import styles from '../../components/UI/Card/BusinessCard.module.css';

const SidesList = ({
    sides,
    handleShowSideDetails,
    handleDeleteSide,
    handleEditSideForm,
    cardId,
    setSide,
    router
}) => {
  return (
    <>
      {sides.length > 0 ? (
        sides.map(side => (
          <div key={side.id} className={styles.defendantItem}>
            <div className={styles.defendantInfo}>
              <strong>ФИО: {side.name}</strong>
              {side.sides_case_name && side.sides_case_name.length > 0 && (
                <div><strong>Вид стороны: {side.sides_case_name.join(', ')}</strong></div>
              )}
              <div>Статус: {side.status_display || 'Не указан'}</div>
            </div>
            <div className={styles.verticalActionButtons}>
              <button 
                onClick={() => {
                  const sideType = side.sides_case_name && side.sides_case_name[0];
                  handleShowSideDetails(side.id, sideType);
                }}
                className={`${styles.verticalActionButton} ${styles.viewButton}`}
                title="Просмотреть подробнее"
              >
                <span className={styles.buttonIcon}>👁️</span>
                Просмотр
              </button>
              <button 
                onClick={() => handleEditSideForm(side.id)}
                className={`${styles.verticalActionButton} ${styles.editButton}`}
                title="Редактировать"
              >
                <span className={styles.buttonIcon}>✏️</span>
                Изменить
              </button>
              <button 
                onClick={() => handleDeleteSide(side.id, cardId, setSide)}
                className={`${styles.verticalActionButton} ${styles.deleteButton}`}
                title="Удалить"
              >
                <span className={styles.buttonIcon}>🗑️</span>
                Удалить
              </button>
            </div>
          </div>
        ))
      ) : (
        <p>Стороны не добавлены</p>
      )}
    </>
  );
};

export default SidesList;