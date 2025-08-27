import React, { useEffect, useState } from 'react';
import CardService from '../../API/CardService';
import CardList from '../../components/CardList';
import MyButton from '../../components/UI/button/MyButton';
import Modal from '../../components/UI/Modal/Modal';
import Loader from '../../components/UI/loader/Loader';
import { getPageCount } from '../../utils/pages';
import Pagination from '../../components/UI/pagination/Pagination';
import CardFilter from '../../components/CardFilter';
import { useProtectedFetching } from '../../hooks/useProtectedFetching';
import { useCard } from '../../hooks/useCard';
import CardForm from '../../components/CardForm';
import styles from '../../components/UI/Header/Header.module.css';
import { useAuth } from '../../context/AuthContext';
import cl from '../../components/UI/loader/Loader.module.css';

function Cards() {
  const [cards, setCards] = useState([]);
  const [filter, setFilter] = useState({ sort: '', query: '' });
  const [modal, setModal] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Все дела');
  const { isAuthenticated } = useAuth();
  const [fetchCards, isCardsLoading, cardsError] = useProtectedFetching();

  const sortedAndSearchCards = useCard(cards, filter.sort, filter.query);

  useEffect(() => {
    if (isAuthenticated()) {
      loadCards();
    }
  }, [limit, page, isAuthenticated]);

  const loadCards = async () => {
    try {
      await fetchCards(async () => {
        const response = await CardService.getAll(limit, page);
        setCards(response.data);
        const totalCount = response.headers['x-total-count'];
        setTotalPages(getPageCount(totalCount, limit));
      });
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  };

  const createCard = (newCard) => {
    setCards([...cards, newCard]);
    setModal(false);
  };

  const removeCard = async (id) => {
    try {
      await fetchCards(async () => {
        await CardService.remove(id);
        setCards(prevCards => prevCards.filter(card => card.id !== id));
      });
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const changePage = (page) => {
    setPage(page);
  };

  const handleCreateCardClick = () => {
    if (isAuthenticated()) {
      setModal(true);
      setShowForm(true);
    }
  };

  const handleCloseModal = () => {
    setModal(false);
    setShowForm(false);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  const filteredCards = activeCategory === 'Все дела'
    ? cards
    : cards.filter(card => {
        const normalizedCategory = card.case_category_title?.trim().toLowerCase();
        const activeCategoryNormalized = activeCategory.toLowerCase();
        return normalizedCategory === activeCategoryNormalized;
      });

  if (!isAuthenticated()) {
    return (
      <div className={cl.authMessage}>
        <div className={cl.authIcon}>🔐</div>
        <h3 className={cl.authTitle}>Для просмотра данных требуется авторизация</h3>
        <p className={cl.authText}>Пожалуйста, войдите в систему чтобы продолжить работу</p>
        <button className={cl.authButton} onClick={() => window.location.reload()}>
          Перезагрузить страницу
        </button>
      </div>
    );
  }

  return (
    <div className='App'>

      <div className={styles.createCardButtonContainer}>
        <div className={styles.categories}>
          {['Все дела', 'Административное правнарушение', 'Административное судопроизводство', 'Гражданское судопроизводство', 'Уголовное судопроизводство'].map(
            (category) => (
              <div
                key={category}
                className={`${styles.category} ${activeCategory === category ? styles.active : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </div>
            )
          )}
        </div>
        <button 
          className={styles.createCardButton} 
          onClick={handleCreateCardClick}
          disabled={!isAuthenticated()}
        >
          Создать карточку
        </button>
      </div>

      <Modal visible={modal} setVisible={setModal}>
        {showForm && <CardForm create={createCard} onCancel={handleCloseModal} />}
      </Modal>

      {isCardsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
          <Loader />
        </div>
      ) : (
        <>
          {cardsError && <div style={{ color: 'red', textAlign: 'center' }}>Ошибка: {cardsError}</div>}
          <CardList remove={removeCard} cards={filteredCards} title='Список карточек' />
        </>
      )}

      <Pagination page={page} changePage={changePage} totalPages={totalPages} />
    </div>
  );
}

export default Cards;