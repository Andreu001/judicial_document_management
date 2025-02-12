import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import BusinessCard from './BusinessCard';
import styles from './UI/CardList/CardList.module.css';

const CardList = (props) => {
  const { cards, remove } = props;

  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return (
      <h1 style={{ textAlign: 'center' }}>
        Карточки не найдены!
      </h1>
    );
  }

  return (
    <div className={styles.cardGrid}>
      <TransitionGroup component={null}>
        {cards.map((card, index) => (
          <CSSTransition
            key={card.id}
            timeout={500}
            classNames="post"
          >
            <BusinessCard key={card.id} remove={() => remove(card.id)} number={index + 1} card={card} />
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
};

export default CardList;