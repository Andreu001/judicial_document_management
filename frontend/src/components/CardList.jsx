import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import BusinessCard from './BusinessCard';
import CriminalBusinessCard from './CriminalBusinessCard';
import CivilBusinessCard from './CivilBusinessCard'; // Добавляем импорт
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
        {cards.map((card, index) => {
          // Проверяем тип карточки
          if (card.is_criminal) {
            return (
              <CSSTransition
                key={card.id}
                timeout={500}
                classNames="post"
              >
                <CriminalBusinessCard 
                  key={card.id} 
                  remove={() => remove(card.id)} 
                  number={index + 1} 
                  card={card} 
                />
              </CSSTransition>
            );
          } else if (card.is_civil) { // Добавляем проверку для гражданских дел
            return (
              <CSSTransition
                key={card.id}
                timeout={500}
                classNames="post"
              >
                <CivilBusinessCard 
                  key={card.id} 
                  remove={() => remove(card.id)} 
                  number={index + 1} 
                  card={card} 
                />
              </CSSTransition>
            );
          } else {
            return (
              <CSSTransition
                key={card.id}
                timeout={500}
                classNames="post"
              >
                <BusinessCard 
                  key={card.id} 
                  remove={() => remove(card.id)} 
                  number={index + 1} 
                  card={card} 
                />
              </CSSTransition>
            );
          }
        })}
      </TransitionGroup>
    </div>
  );
};

export default CardList;