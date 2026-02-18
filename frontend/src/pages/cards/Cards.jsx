import React, { useEffect, useState } from 'react';
import CardService from '../../API/CardService';
import CivilCaseService from '../../API/CivilCaseService'; // Добавляем импорт
import CardList from '../../components/CardList';
import MyButton from '../../components/UI/button/MyButton';
import Modal from '../../components/UI/Modal/Modal';
import Loader from '../../components/UI/loader/Loader';
import { getPageCount } from '../../utils/pages';
import Pagination from '../../components/UI/pagination/Pagination';
import CardFilter from '../../components/CardFilter';
import { useProtectedFetching } from '../../hooks/useProtectedFetching';
import { useCard } from '../../hooks/useCard';
import CategoryBasedForm from '../../components/CategoryBasedForm';
import styles from '../../components/UI/Header/Header.module.css';
import { useAuth } from '../../context/AuthContext';
import cl from '../../components/UI/loader/Loader.module.css';
import CriminalCaseService from '../../API/CriminalCaseService';

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
        const regularCards = response.data;

        // Загрузка уголовных дел
        let criminalCards = [];
        try {
          const criminalResponse = await CriminalCaseService.getAllCriminalProceedings();
          criminalCards = criminalResponse.map(caseItem => ({
            id: `criminal-${caseItem.id}`, // Уникальный ID с префиксом
            case_number: caseItem.case_number_criminal || 'Номер дела не указан',
            case_category_title: 'Уголовное судопроизводство',
            case_category: 4,
            pub_date: caseItem.created_at || new Date().toISOString(),
            updated_at: caseItem.updated_at || new Date().toISOString(),
            author_name: caseItem.author_name || 'Не указан',
            is_criminal: true,
            criminal_proceedings_id: caseItem.id,
          }));
        } catch (error) {
          console.error('Ошибка загрузки уголовных карточек:', error);
        }

        // Загрузка гражданских дел
        let civilCards = [];
        try {
          const civilResponse = await CivilCaseService.getAllCivilProceedings();
          civilCards = civilResponse.map(caseItem => ({
            id: `civil-${caseItem.id}`, // Уникальный ID с префиксом
            case_number: caseItem.case_number_civil || 'Номер дела не указан',
            case_category_title: 'Гражданское судопроизводство',
            case_category: 3,
            pub_date: caseItem.created_at || new Date().toISOString(),
            updated_at: caseItem.updated_at || new Date().toISOString(),
            author_name: caseItem.author_name || 'Не указан',
            is_civil: true,
            civil_proceedings_id: caseItem.id,
          }));
        } catch (error) {
          console.error('Ошибка загрузки гражданских карточек:', error);
        }

        // Объединяем все карточки
        const allCards = [...regularCards, ...criminalCards, ...civilCards];
        
        setCards(allCards);
        const totalCount = response.headers?.['x-total-count'] || allCards.length;
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
      // Определяем тип карточки по ID с префиксом
      if (id.startsWith('criminal-')) {
        const realId = id.replace('criminal-', '');
        
        // Пытаемся удалить
        await CriminalCaseService.deleteCriminalProceedings(realId);
        
        // В случае успеха или если сервер вернул 404, все равно удаляем из состояния
        setCards(prevCards => prevCards.filter(card => card.id !== id));
        console.log('Уголовная карточка удалена из состояния:', id);
      } 
      else if (id.startsWith('civil-')) {
        const realId = id.replace('civil-', '');
        
        // Пытаемся удалить
        await CivilCaseService.deleteCivilProceedings(realId);
        
        // В случае успеха или если сервер вернул 404, все равно удаляем из состояния
        setCards(prevCards => prevCards.filter(card => card.id !== id));
        console.log('Гражданская карточка удалена из состояния:', id);
      } 
      else {
        await fetchCards(async () => {
          await CardService.remove(id);
          setCards(prevCards => prevCards.filter(card => card.id !== id));
        });
        console.log('Обычная карточка удалена из состояния:', id);
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      
      // Если ошибка 404, это означает, что дело уже удалено на сервере
      // В этом случае просто убираем карточку из состояния
      if (error.response?.status === 404) {
        console.log('Дело уже удалено на сервере, убираем из UI');
        setCards(prevCards => prevCards.filter(card => card.id !== id));
      } else {
        // Для других ошибок показываем сообщение
        alert('Не удалось удалить карточку');
      }
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
        if (activeCategory === 'Уголовное судопроизводство') {
          return card.is_criminal;
        } else if (activeCategory === 'Гражданское судопроизводство') {
          return card.is_civil;
        } else {
          const normalizedCategory = card.case_category_title?.trim().toLowerCase();
          const activeCategoryNormalized = activeCategory.toLowerCase();
          return normalizedCategory === activeCategoryNormalized;
        }
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
        {showForm && <CategoryBasedForm create={createCard} onCancel={handleCloseModal} />}
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