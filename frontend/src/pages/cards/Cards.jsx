import React, { useEffect, useState } from 'react';
import CardService from '../../API/CardService';
import CardList from '../../components/CardList';
import MyButton from '../../components/UI/button/MyButton';
import Modal from '../../components/UI/Modal/Modal';
import Loader from '../../components/UI/loader/Loader';
import { getPageCount } from '../../utils/pages';
import Pagination from '../../components/UI/pagination/Pagination';
import CardFilter from '../../components/CardFilter';
import { useFetching } from '../../hooks/useFetching';
import { useCard } from '../../hooks/useCard';
import CardForm from '../../components/CardForm';
import styles from '../../components/UI/Header/Header.module.css';

function Cards() {
  const [cards, setCards] = useState([]);
  const [filter, setFilter] = useState({ sort: '', query: '' });
  const [modal, setModal] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Все дела'); // Активная категория по умолчанию

  const sortedAndSearchCards = useCard(cards, filter.sort, filter.query);

  const [fetchCards, isCardsLoading] = useFetching(async (limit, page) => {
    const response = await CardService.getAll(limit, page);
    setCards(response.data);
    const totalCount = response.headers['x-total-count'];
    setTotalPages(getPageCount(totalCount, limit));
  });

  useEffect(() => {
    fetchCards(limit, page);
  }, [limit, page]);

  const createCard = (newCard) => {
    setCards([...cards, newCard]);
  };

  const removeCard = async (id) => {
    try {
      await CardService.remove(id);
      setCards(prevCards => prevCards.filter(card => card.id !== id));
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const changePage = (page) => {
    setPage(page);
    fetchCards(limit, page);
  };

  const handleCreateCardClick = () => {
    setModal(true);
    setShowForm(true);
  };

  const handleCloseModal = () => {
    setModal(false);
    setShowForm(false);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category); // Устанавливаем активную категорию
  };

  // Фильтрация карточек по категории
  const filteredCards = activeCategory === 'Все дела'
    ? cards // Если выбрано "Все дела", показываем все карточки
    : cards.filter(card => {
        const normalizedCategory = card.case_category_title?.trim().toLowerCase();
        const activeCategoryNormalized = activeCategory.toLowerCase();
        return normalizedCategory === activeCategoryNormalized;
      });

  return (
    <div className='App'>
      {/* Верхняя панель */}
      <div className={styles.header}>
        <CardFilter filter={filter} setFilter={setFilter} />
      </div>

      {/* Категории и кнопка "Создать карточку" */}
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
        <button className={styles.createCardButton} onClick={handleCreateCardClick}>
          Создать карточку
        </button>
      </div>

      {/* Модальное окно */}
      <Modal visible={modal} setVisible={setModal}>
        {showForm ? <CardForm create={createCard} /> : null}
      </Modal>

      {/* Список карточек */}
      {isCardsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
          <Loader />
        </div>
      ) : (
        <CardList remove={removeCard} cards={filteredCards} title='Список карточек' />
      )}

      {/* Пагинация */}
      <Pagination page={page} changePage={changePage} totalPages={totalPages} />
    </div>
  );
}

export default Cards;
