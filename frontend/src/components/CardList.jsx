import React, { useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import BusinessCard from './BusinessCard';
import CriminalBusinessCard from './CriminalBusinessCard';
import CivilBusinessCard from './CivilBusinessCard';
import AdministrativeBusinessCard from './AdministrativeBusinessCard';
import KasBusinessCard from './KasBusinessCard';
import styles from './UI/CardList/CardList.module.css';

const CardList = (props) => {
  const { cards, remove } = props;
  
  // Создаем рефы для каждой карточки
  const nodeRefs = useRef({});

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
          // Создаем уникальный ключ для рефа
          if (!nodeRefs.current[card.id]) {
            nodeRefs.current[card.id] = React.createRef();
          }

          if (card.is_criminal) {
            return (
              <CSSTransition
                key={card.id}
                nodeRef={nodeRefs.current[card.id]}
                timeout={500}
                classNames="post"
              >
                <div ref={nodeRefs.current[card.id]}>
                  <CriminalBusinessCard 
                    remove={() => remove(card.id)} 
                    number={index + 1} 
                    card={card} 
                  />
                </div>
              </CSSTransition>
            );
          } else if (card.is_civil) {
            return (
              <CSSTransition
                key={card.id}
                nodeRef={nodeRefs.current[card.id]}
                timeout={500}
                classNames="post"
              >
                <div ref={nodeRefs.current[card.id]}>
                  <CivilBusinessCard 
                    remove={() => remove(card.id)} 
                    number={index + 1} 
                    card={card} 
                  />
                </div>
              </CSSTransition>
            );
          } else if (card.is_administrative) {
            return (
              <CSSTransition
                key={card.id}
                nodeRef={nodeRefs.current[card.id]}
                timeout={500}
                classNames="post"
              >
                <div ref={nodeRefs.current[card.id]}>
                  <AdministrativeBusinessCard 
                    remove={() => remove(card.id)} 
                    number={index + 1} 
                    card={card} 
                  />
                </div>
              </CSSTransition>
            );
          } else {
            return (
              <CSSTransition
                key={card.id}
                nodeRef={nodeRefs.current[card.id]}
                timeout={500}
                classNames="post"
              >
                <div ref={nodeRefs.current[card.id]}>
                  <KasBusinessCard 
                    remove={() => remove(card.id)} 
                    number={index + 1} 
                    card={card} 
                  />
                </div>
              </CSSTransition>
            );
          }
        })}
      </TransitionGroup>
    </div>
  );
};

export default CardList;