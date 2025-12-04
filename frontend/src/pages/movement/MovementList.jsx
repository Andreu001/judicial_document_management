import React from 'react';
import styles from '../../components/UI/Card/BusinessCard.module.css';

const MovementList = ({
    movements,
    decisionCases,
    handleShowDetailsMovement,
    handleDeleteMove,
    handleEditMoveForm,
    cardId,
    setMovements,
    router,
    setIsEditingMove,
    setEditedMoveData
}) => {
  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  // Функция для получения названия решения
  const getDecisionName = (decisionId) => {
    if (!decisionId || !decisionCases.length) return 'Не указано';
    
    const decision = decisionCases.find((decision) => decision.id === decisionId);
    return decision?.name_case || 'Неизвестно';
  };

  return (
    <>
      {movements.length > 0 ? (
        movements.map((movement, index) => (
          <div key={movement.id || index} className={styles.defendantItem}>
            <div className={styles.defendantInfo}>
              <strong>Дата заседания: {formatDate(movement.date_meeting)}</strong>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>Время заседания:</div>
                <div className={styles.infoValue}>{movement.meeting_time || 'Не указано'}</div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>Результат заседания:</div>
                <div className={styles.infoValue}>{movement.result_court_session || 'Не указан'}</div>
              </div>              
            </div>
            
            <div className={styles.verticalActionButtons}>
              <button 
                onClick={() => handleShowDetailsMovement({ 
                  move: movement, 
                  card: { id: cardId } // Передаем cardId
                }, router)} // Передаем router как navigate
                className={`${styles.verticalActionButton} ${styles.viewButton}`}
                title="Просмотреть подробнее"
              >
                <span className={styles.buttonIcon}>👁️</span>
                Просмотр
              </button>
              <button 
                onClick={() => handleEditMoveForm(movement.id)}
                className={`${styles.verticalActionButton} ${styles.editButton}`}
                title="Редактировать"
              >
                <span className={styles.buttonIcon}>✏️</span>
                Изменить
              </button>
              <button 
                onClick={() => handleDeleteMove(movement.id, cardId, setMovements)}
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
        <p>Движения по делу не добавлены</p>
      )}
    </>
  );
};

export default MovementList;