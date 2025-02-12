import { useMemo } from 'react';

export const useCard = (cards, sort, query) => {
  return useMemo(() => {
    let sortedCards = [...cards];

    // Сортировка
    if (sort) {
      sortedCards.sort((a, b) => {
        if (a[sort] < b[sort]) return -1;
        if (a[sort] > b[sort]) return 1;
        return 0;
      });
    }

    // Поиск
    if (query) {
      sortedCards = sortedCards.filter(card =>
        card.name.toLowerCase().includes(query.toLowerCase()) || // Поиск по ФИО
        card.receivedDate.toLowerCase().includes(query.toLowerCase()) || // Поиск по дате поступления
        card.appointedDate.toLowerCase().includes(query.toLowerCase()) || // Поиск по дате назначения
        card.consideredDate.toLowerCase().includes(query.toLowerCase()) // Поиск по дате рассмотрения
      );
    }

    return sortedCards;
  }, [cards, sort, query]);
};