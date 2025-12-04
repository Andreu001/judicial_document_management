import React from 'react';
import styles from '../../components/UI/Card/BusinessCard.module.css';

const PetitionList = ({
    petitions,
    handleShowDetailsPetition,
    handleDeletePetition,
    handleEditPetition,
    cardId,
    setPetitions,
    setIsEditingPetition,
    setEditedPetitionData,
    router
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

  // Функция для получения названий ходатайств
  const getPetitionNames = (petitionNames) => {
    if (!petitionNames || !Array.isArray(petitionNames)) return 'Не указано';
    
    const names = petitionNames.map((petition) => petition.petitions || 'Неизвестно');
    return names.join(', ') || 'Не указано';
  };

const getNotificationParties = (parties) => {
  // Если parties - это массив объектов
  if (Array.isArray(parties)) {
    const partyNames = parties.map((party) => {
      // Проверяем различные варианты структуры объекта
      if (party && typeof party === 'object') {
        // Проверяем разные возможные поля с именем
        return (
          party.full_name || 
          party.name || 
          party.side_case_name || 
          party.sides_case_name || 
          'Неизвестно'
        );
      }
      return party || 'Неизвестно';
    });
    return partyNames.filter(name => name !== 'Неизвестно').join(', ') || 'Не указано';
  }
  
  // Если parties - это один объект (не массив)
  if (parties && typeof parties === 'object') {
    return (
      parties.full_name || 
      parties.name || 
      parties.side_case_name || 
      parties.sides_case_name || 
      'Не указано'
    );
  }
  
  // Если parties - это строка или число
  if (parties !== undefined && parties !== null) {
    return String(parties);
  }
  
  return 'Не указано';
};

  return (
    <>
      {petitions.length > 0 ? (
        petitions.map((petition, index) => (
          <div key={petition.id || index} className={styles.defendantItem}>
            <div className={styles.defendantInfo}>
              <strong>Ходатайство по делу: {getPetitionNames(petition.petitions_name)}</strong>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>Заявитель ходатайства:</div>
                <div className={styles.infoValue}>
                  {getNotificationParties(petition.notification_parties)}
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>Дата ходатайства:</div>
                <div className={styles.infoValue}>{formatDate(petition.date_application)}</div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>Вынесенное решение:</div>
                <div className={styles.infoValue}>{petition.decision_rendered || 'Не указано'}</div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>Дата решения:</div>
                <div className={styles.infoValue}>{formatDate(petition.date_decision)}</div>
              </div>
              
              {petition.notation && (
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>Примечания:</div>
                  <div className={styles.infoValue}>{petition.notation}</div>
                </div>
              )}
            </div>
            
            <div className={styles.verticalActionButtons}>
              <button 
                onClick={() => handleShowDetailsPetition({ 
                  petition, 
                  card: { id: cardId } 
                }, router)}
                className={`${styles.verticalActionButton} ${styles.viewButton}`}
                title="Просмотреть подробнее"
              >
                <span className={styles.buttonIcon}>👁️</span>
                Просмотр
              </button>
              <button 
                onClick={() => handleEditPetition(petition.id)}
                className={`${styles.verticalActionButton} ${styles.editButton}`}
                title="Редактировать"
              >
                <span className={styles.buttonIcon}>✏️</span>
                Изменить
              </button>
              <button 
                onClick={() => handleDeletePetition(petition.id, cardId, setPetitions)}
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
        <p>Ходатайства не добавлены</p>
      )}
    </>
  );
};

export default PetitionList;
