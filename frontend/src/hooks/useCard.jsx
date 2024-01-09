import { useMemo } from "react";

export const useSortedCard = (cards, sort) => {
    const sortedCards = useMemo(() => {
		if(sort) {
			return [...cards].sort((a, b) => a[sort].localeCompare(b[sort]));
		}
		return cards;
	}, [sort, cards])

    return sortedCards;

}

export const useCard = (cards, sort, query) => {
    const sortedCards = useSortedCard(cards, sort);

    const sortedAndSearchCards = useMemo(() => {
		return sortedCards.filter(card => card.title)
	}, [query, sortedCards])

    return sortedAndSearchCards;
}