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
import SideService from '../../API/SideService';

function Cards() {
  const [cards, setCards] = useState([]);
  const [sides, setSides] = useState([]);
  const [filter, setFilter] = useState({ sort: '', query: '' });
  const [modal, setModal] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);

  const sortedAndSearchCards = useCard(cards, filter.sort, filter.query);

  const [fetchCards, isCardsLoading] = useFetching(async (limit, page) => {
    const response = await CardService.getAll(limit, page);
    setCards(response.data);
    const totalCount = response.headers['x-total-count'];
    setTotalPages(getPageCount(totalCount, limit));
  });

  useEffect(() => {

    CardService.getAll(limit, page).then((response) => {
      setCards(response.data);
    });

  }, []);

  async function fetchSide() {
    const response = await SideService.getAllSide();
  }

  useEffect(() => {
    fetchCards(limit, page);
  }, []);

  const createCard = (newCard) => {
    setCards([...cards, newCard]);
  };

  const removeCard = async (id) => {
    try {
      if (!id) {
        console.error('ID карточки не определен');
        return;
      }

      const cardId = String(id);
      await CardService.remove(cardId);
      setCards(cards.filter((card) => card.id !== id));
      console.log('Удаляется карточка с ID:', cardId);
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

  return (
    <div className='App'>
      <MyButton style={{ marginTop: 30 }} onClick={handleCreateCardClick}>
        Создать карточку
      </MyButton>
      <MyButton onClick={fetchSide}>
        Стороны
      </MyButton>
      <Modal visible={modal} setVisible={setModal}>
        {showForm ? ( // Показать форму, если showForm === true
          <CardForm create={createCard} />
        ) : null}
      </Modal>
      <CardFilter filter={filter} setFilter={setFilter} />
      {isCardsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
          <Loader />
        </div>
      ) : (
        <CardList remove={removeCard} cards={sortedAndSearchCards} title='Список карточек' />
      )}
      <Pagination page={page} changePage={changePage} totalPages={totalPages} />
    </div>
  );
}

export default Cards;
