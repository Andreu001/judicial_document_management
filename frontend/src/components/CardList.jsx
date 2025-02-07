import React, { useEffect, useState } from 'react';
import CardService from '../API/CardService';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import BusinessCard from './BusinessCard';
import styles from './UI/CardList/CardList.module.css';

const CardList = (props) => {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    async function fetchCards() {
      try {
        const response = await CardService.getAll();
        setCards(response.data);
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    }

    fetchCards();
  }, []);

  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return (
      <h1 style={{ textAlign: 'center' }}>
        Карточки не найдены!
      </h1>
    );
  }

  const removeCard = async (id) => {
    try {
      await CardService.remove(id);
      setCards(cards.filter(card => card.id !== id));
      console.log("Удаляется карточка с ID:", id);
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  return (
    <div className={styles.cardGrid}>
      {cards.map((card, index) => (
        <CSSTransition
          key={card.id}
          timeout={500}
          classNames="post"
        >
          <BusinessCard key={card.id} remove={() => removeCard(card.id)} number={index + 1} card={card} />
        </CSSTransition>
      ))}
    </div>
  );
};

export default CardList;