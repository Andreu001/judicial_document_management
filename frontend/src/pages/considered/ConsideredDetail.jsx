import React, { useEffect, useState } from 'react';
import { useFetching } from "../../hooks/useFetching";
import ConsideredService from "../../API/ConsideredService";
import Loader from "../../components/UI/loader/Loader";

const ConsideredDetail = ({ cardId }) => {
  const [card, setCard] = useState({});
  
  const [fetchConsideredById, isLoading, error] = useFetching(async (cardId) => {
    const response = await ConsideredService.getAllConsidereds(cardId);
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      setCard(response.data[0]);  // Берем первый элемент из массива
    } else {
      setCard({});  // Если данных нет, устанавливаем пустой объект
    }
    
    console.log("Card data:", response.data);
  });
  
  
  useEffect(() => {
    if (cardId) {
      fetchConsideredById(cardId);
    }
    console.log("cardId data:", cardId);
  }, [cardId]);


  if (isLoading) {
    return <Loader />;
  }

  // Обработка массива notification_parties
  const renderNotificationParties = (parties) => {
    if (parties && parties.length > 0) {
      return parties.map((party, idx) => (
        <div key={idx}>{party.name || 'Не указано'}</div>
      ));
    } else {
      return <div>Неизвестно</div>;
    }
  };

  // Рендер данных
  return (
    <div>
      <h1>Детали решения</h1>
      <div>
        <h2>Название решения: {card.name_case ? card.name_case[0]?.name_case : 'Не указано'}</h2>
        <p><strong>ID:</strong> {card.id || 'Не указано'}</p>
        <p><strong>Описание:</strong> {card.description || 'Не указано'}</p>
        <p><strong>Уведомление сторон:</strong> {renderNotificationParties(card.notification_parties)}</p>
        <p><strong>Дата вынесения решения:</strong> {card.date_consideration || 'Не указано'}</p>
        <p><strong>Дата вступления в законную силу:</strong> {card.effective_date || 'Не указано'}</p>
        <p><strong>Дата исполнения дела:</strong> {card.executive_lists || 'Не указано'}</p>
      </div>
      <div>
        <h3>Комментарии</h3>
      </div>
    </div>
  );
};

export default ConsideredDetail;
