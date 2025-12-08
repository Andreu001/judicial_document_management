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

  // Функция для получения имени стороны/обвиняемого (как в PetitionDetail)
  const getPartyName = (party) => {
    if (!party) return 'Не указано';
    
    if (Array.isArray(party)) {
      if (party.length === 0) return 'Не указано';
      
      // Берем первый элемент массива
      const firstParty = party[0];
      
      if (firstParty?.full_name) {
        // Это обвиняемый
        return `${firstParty.full_name} ${firstParty.side_case_name ? `(${firstParty.side_case_name})` : ''}`;
      }
      if (firstParty?.name) {
        // Это сторона
        return `${firstParty.name} ${firstParty.sides_case_name ? `(${firstParty.sides_case_name})` : ''}`;
      }
      return firstParty || 'Не указано';
    }
    
    // Если не массив, а объект
    if (party && typeof party === 'object') {
      if (party.full_name) {
        // Это обвиняемый
        return `${party.full_name} ${party.side_case_name ? `(${party.side_case_name})` : ''}`;
      }
      if (party.name) {
        // Это сторона
        return `${party.name} ${party.sides_case_name ? `(${party.sides_case_name})` : ''}`;
      }
      return party || 'Не указано';
    }
    
    // Если это строка или число
    return String(party || 'Не указано');
  };

  // Функция для получения решений
  const getDecisionName = (decision) => {
    if (!decision) return 'Не указано';
    
    if (Array.isArray(decision)) {
      if (decision.length === 0) return 'Не указано';
      
      const firstDecision = decision[0];
      if (firstDecision?.decisions) {
        return firstDecision.decisions;
      }
      if (firstDecision?.name_case) {
        return firstDecision.name_case;
      }
      return firstDecision || 'Не указано';
    }
    
    // Если не массив, а объект
    if (decision && typeof decision === 'object') {
      if (decision.decisions) {
        return decision.decisions;
      }
      if (decision.name_case) {
        return decision.name_case;
      }
      return decision || 'Не указано';
    }
    
    // Если это строка или число
    return String(decision || 'Не указано');
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
                  {getPartyName(petition.notification_parties)}
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>Дата ходатайства:</div>
                <div className={styles.infoValue}>{formatDate(petition.date_application)}</div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>Вынесенное решение:</div>
                <div className={styles.infoValue}>
                  {getDecisionName(petition.decision_rendered)}
                </div>
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