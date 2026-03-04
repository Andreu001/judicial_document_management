import { useState, useEffect, useCallback } from 'react';
import SearchService from '../API/SearchService';

export const useCaseStatus = (initialCard) => {
  const [card, setCard] = useState(initialCard);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Функция для обновления статуса на основе данных карточки
  const determineStatus = useCallback((cardData) => {
    if (cardData.status === 'archived') return 'archived';
    
    // Проверяем наличие исполнения
    if (cardData.has_execution || 
        cardData.execution_date || 
        cardData.sentence_execution_date ||
        cardData.writ_execution_date) {
      return 'execution';
    }
    
    // Проверяем наличие решения
    if (cardData.has_decision ||
        cardData.decision_date ||
        cardData.sentence_date ||
        cardData.hearing_date) {
      return 'completed';
    }
    
    return 'active';
  }, []);

  // Обновление статуса на сервере
  const updateStatusOnServer = useCallback(async (caseId, caseType) => {
    if (!caseId || !caseType) return;
    
    setIsUpdatingStatus(true);
    try {
      const result = await SearchService.updateCaseStatus(caseId, caseType);
      return result;
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, []);

  // Автоматическое обновление статуса при изменении полей
  useEffect(() => {
    if (!card) return;
    
    const newStatus = determineStatus(card);
    if (newStatus !== card.status) {
      setCard(prev => ({ ...prev, status: newStatus }));
      
      // Если есть реальный ID, обновляем на сервере
      if (card.real_id && card.case_type) {
        updateStatusOnServer(card.real_id, card.case_type);
      }
    }
  }, [
    card.has_decision,
    card.has_execution,
    card.decision_date,
    card.sentence_date,
    card.hearing_date,
    card.execution_date,
    card.sentence_execution_date,
    card.writ_execution_date,
    card.case_type,
    card.real_id,
    determineStatus,
    updateStatusOnServer
  ]);

  return {
    card,
    setCard,
    isUpdatingStatus,
    updateStatusOnServer
  };
};