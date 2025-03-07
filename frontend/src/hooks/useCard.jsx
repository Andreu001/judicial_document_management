import { useMemo } from 'react';

export const useCard = (cards, sort, query, searchBy) => {
  return useMemo(() => {
    let filteredCards = [...cards];

    console.log("🔍 Категория поиска:", searchBy);
    console.log("🔎 Поисковый запрос:", query);

    if (query.trim() && searchBy) {
      const lowerQuery = query.toLowerCase().trim();

      filteredCards = filteredCards.filter(card => {
        switch (searchBy) {
          case 'name': // Поиск по ФИО
            return card.sides?.some(side => side?.name?.toLowerCase().includes(lowerQuery));

          case 'caseNumber': // Поиск по номеру дела
            return card.original_name?.toLowerCase().includes(lowerQuery);

          case 'article': // Поиск по статье
            return card.article ? card.article.toString().toLowerCase().includes(lowerQuery) : false;

          default:
            return false;
        }
      });
    }

    // Сортировка
    if (sort) {
      filteredCards.sort((a, b) => {
        if (!a[sort] || !b[sort]) return 0;

        if (sort.includes('Date')) {
          return new Date(a[sort]) - new Date(b[sort]);
        }

        return a[sort].localeCompare(b[sort], 'ru');
      });
    }

    return filteredCards;
  }, [cards, sort, query, searchBy]);
};
