import React, { useEffect, useState, useCallback, useMemo } from 'react';
import CardService from '../../API/CardService';
import CivilCaseService from '../../API/CivilCaseService';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import KasCaseService from '../../API/KasCaseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import SearchService from '../../API/SearchService';
import CardList from '../../components/CardList';
import Modal from '../../components/UI/Modal/Modal';
import Loader from '../../components/UI/loader/Loader';
import { getPageCount } from '../../utils/pages';
import Pagination from '../../components/UI/pagination/Pagination';
import { useProtectedFetching } from '../../hooks/useProtectedFetching';
import { useCard } from '../../hooks/useCard';
import CategoryBasedForm from '../../components/CategoryBasedForm';
import styles from '../../components/UI/Header/Header.module.css';
import searchStyles from '../../components/Search/Search.module.css'; // Новый стиль
import { useAuth } from '../../context/AuthContext';
import cl from '../../components/UI/loader/Loader.module.css';
import SearchResults from '../../components/Search/SearchResults';

function Cards() {
  const [allCards, setAllCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [paginatedCards, setPaginatedCards] = useState([]);
  const [filter, setFilter] = useState({ sort: 'date_desc', query: '' });
  const [modal, setModal] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Все дела');
  const [searchMode, setSearchMode] = useState(false); // Режим поиска
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortOption, setSortOption] = useState('date_desc'); // Опция сортировки
  
  const { isAuthenticated } = useAuth();
  const [fetchCards, isCardsLoading, cardsError] = useProtectedFetching();
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Опции сортировки
  const sortOptions = [
    { value: 'date_desc', label: 'Сначала новые' },
    { value: 'date_asc', label: 'Сначала старые' },
    { value: 'case_number_asc', label: 'По номеру дела (А-Я)' },
    { value: 'case_number_desc', label: 'По номеру дела (Я-А)' },
    { value: 'type_asc', label: 'По типу дела' },
    { value: 'status_asc', label: 'По статусу' },
  ];

  // Функция сортировки карточек
const sortCards = useCallback((cards, sortBy) => {
  const sorted = [...cards];
  
  switch (sortBy) {
    case 'date_desc':
      return sorted.sort((a, b) => {
        const dateA = a.incoming_date || a.pub_date || a.created_at;
        const dateB = b.incoming_date || b.pub_date || b.created_at;
        return new Date(dateB) - new Date(dateA);
      });
    
    case 'date_asc':
      return sorted.sort((a, b) => {
        const dateA = a.incoming_date || a.pub_date || a.created_at;
        const dateB = b.incoming_date || b.pub_date || b.created_at;
        return new Date(dateA) - new Date(dateB);
      });
    
    case 'case_number_asc':
      return sorted.sort((a, b) => {
        const numA = a.case_number || '';
        const numB = b.case_number || '';
        return numA.localeCompare(numB);
      });
    
    case 'case_number_desc':
      return sorted.sort((a, b) => {
        const numA = a.case_number || '';
        const numB = b.case_number || '';
        return numB.localeCompare(numA);
      });
    
    case 'type_asc':
      return sorted.sort((a, b) => {
        const getTypeOrder = (card) => {
          if (card.is_criminal || card.case_type === 'criminal') return 1;
          if (card.is_civil || card.case_type === 'civil') return 2;
          if (card.is_administrative || card.case_type === 'administrative') return 3;
          if (card.is_kas || card.case_type === 'kas') return 4;
          return 5;
        };
        return getTypeOrder(a) - getTypeOrder(b);
      });
    
    case 'status_asc':
      return sorted.sort((a, b) => {
        const statusOrder = { 'active': 1, 'execution': 2, 'completed': 3, 'archived': 4 };
        const statusA = a.status || 'active';
        const statusB = b.status || 'active';
        return (statusOrder[statusA] || 5) - (statusOrder[statusB] || 5);
      });
    
    default:
      return sorted;
  }
}, []);

  useEffect(() => {
    if (isAuthenticated()) {
      loadAllCards();
    }
  }, [isAuthenticated]);

  // Загружаем все карточки
  const loadAllCards = async () => {
    try {
      await fetchCards(async () => {
        // Загрузка обычных карточек
        const regularResponse = await CardService.getAll(1000, 1);
        const regularCards = regularResponse.data;

        // Загрузка уголовных дел
        let criminalCards = [];
        try {
          const criminalResponse = await CriminalCaseService.getAllCriminalProceedings();
          criminalCards = criminalResponse.map(caseItem => ({
            id: `criminal-${caseItem.id}`,
            real_id: caseItem.id,
            case_number: caseItem.case_number_criminal || 'Номер дела не указан',
            case_category_title: 'Уголовное судопроизводство',
            case_category: 4,
            pub_date: caseItem.created_at,
            incoming_date: caseItem.incoming_date,
            created_at: caseItem.created_at,
            updated_at: caseItem.updated_at,
            author_name: caseItem.author_name || 'Не указан',
            is_criminal: true,
            criminal_proceedings_id: caseItem.id,
            status: caseItem.status || 'active',
            status_display: caseItem.status_display,
            // Проверяем наличие решения и исполнения
            has_decision: caseItem.sentence_date || (caseItem.criminal_decisions?.length > 0),
            has_execution: caseItem.criminal_executions?.length > 0,
          }));
        } catch (error) {
          console.error('Ошибка загрузки уголовных карточек:', error);
        }

        // Загрузка гражданских дел
        let civilCards = [];
        try {
          const civilResponse = await CivilCaseService.getAllCivilProceedings();
          civilCards = civilResponse.map(caseItem => ({
            id: `civil-${caseItem.id}`,
            real_id: caseItem.id,
            case_number: caseItem.case_number_civil || 'Номер дела не указан',
            case_category_title: 'Гражданское судопроизводство',
            case_category: 3,
            pub_date: caseItem.created_at,
            incoming_date: caseItem.incoming_date,
            created_at: caseItem.created_at,
            updated_at: caseItem.updated_at,
            author_name: caseItem.author_name || 'Не указан',
            is_civil: true,
            civil_proceedings_id: caseItem.id,
            status: caseItem.status || 'active',
            status_display: caseItem.status_display,
            has_decision: caseItem.hearing_date || (caseItem.civil_decisions?.length > 0),
            has_execution: caseItem.civil_executions?.length > 0,
          }));
        } catch (error) {
          console.error('Ошибка загрузки гражданских карточек:', error);
        }

        // Загрузка административных правонарушений
        let adminOffenseCards = [];
        try {
          const adminResponse = await AdministrativeCaseService.getAllAdministrativeProceedings();
          adminOffenseCards = adminResponse.map(caseItem => ({
            id: `admin-offense-${caseItem.id}`,
            real_id: caseItem.id,
            case_number: caseItem.case_number_admin || 'Номер дела не указан',
            case_category_title: 'Административное правонарушение',
            case_category: 5,
            pub_date: caseItem.created_at,
            incoming_date: caseItem.incoming_date,
            created_at: caseItem.created_at,
            updated_at: caseItem.updated_at,
            author_name: caseItem.author_name || 'Не указан',
            is_administrative: true,
            administrative_proceedings_id: caseItem.id,
            registry_index: caseItem.registry_index,
            offense_type: caseItem.offense_type,
            status: caseItem.status || 'active',
            status_display: caseItem.status_display,
            has_decision: caseItem.hearing_date || (caseItem.admin_decisions?.length > 0),
            has_execution: caseItem.admin_executions?.length > 0,
          }));
        } catch (error) {
          console.error('Ошибка загрузки административных правонарушений:', error);
        }

        // Загрузка административных дел (КАС РФ)
        let kasCards = [];
        try {
          const kasResponse = await KasCaseService.getAllKasProceedings();
          kasCards = kasResponse.map(caseItem => ({
            id: `kas-${caseItem.id}`,
            real_id: caseItem.id,
            case_number: caseItem.case_number_kas || 'Номер дела не указан',
            case_category_title: 'Административное судопроизводство',
            case_category: 6,
            pub_date: caseItem.created_at,
            incoming_date: caseItem.incoming_date,
            created_at: caseItem.created_at,
            updated_at: caseItem.updated_at,
            author_name: caseItem.author_name || 'Не указан',
            presiding_judge: caseItem.presiding_judge_full_name,
            is_kas: true,
            kas_proceedings_id: caseItem.id,
            status: caseItem.status || 'active',
            status_display: caseItem.status_display,
            has_decision: caseItem.hearing_date || (caseItem.kas_decisions?.length > 0),
            has_execution: caseItem.kas_executions?.length > 0,
          }));
        } catch (error) {
          console.error('Ошибка загрузки административных дел (КАС):', error);
        }

        const allLoadedCards = [...regularCards, ...criminalCards, ...civilCards, ...adminOffenseCards, ...kasCards];
        
        // Обновляем статусы на основе наличия решений и исполнений
        const updatedCards = allLoadedCards.map(card => {
          let newStatus = card.status;
          
          if (card.status !== 'archived') {
            if (card.has_execution) {
              newStatus = 'execution';
            } else if (card.has_decision) {
              newStatus = 'completed';
            } else {
              newStatus = 'active';
            }
          }
          
          return {
            ...card,
            status: newStatus,
            status_display: getStatusDisplay(newStatus)
          };
        });
        
        setAllCards(updatedCards);
      });
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  };

  // Получение отображаемого статуса
  const getStatusDisplay = (status) => {
    const statusMap = {
      'active': 'Активное',
      'completed': 'Рассмотрено',
      'execution': 'На исполнении',
      'archived': 'В архиве'
    };
    return statusMap[status] || status;
  };

  // Обработка поиска
  const handleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      alert('Введите минимум 2 символа для поиска');
      return;
    }

    setIsSearching(true);
    setSearchQuery(query.trim());
    setShowSearchResults(true);

    try {
      // Ищем по всем типам дел
      const results = await SearchService.searchCases(query);
      
      // Форматируем результаты
      const formattedResults = SearchService.formatSearchResults(results);
      setSearchResults(formattedResults);
      
      // Также обновляем основной список для отображения в карточках
      setSearchMode(true);
      
      // Применяем фильтрацию по категории и сортировку
      let filtered = formattedResults;
      
      // Фильтруем по категории, если выбрана не "Все дела"
      if (activeCategory !== 'Все дела') {
        filtered = filterByCategory(formattedResults, activeCategory);
      }
      
      // Применяем сортировку
      const sorted = sortCards(filtered, sortOption);
      setFilteredCards(sorted);
      setTotalPages(Math.ceil(sorted.length / limit));
      setPage(1);
    } catch (error) {
      console.error('Ошибка поиска:', error);
      alert('Ошибка при выполнении поиска');
    } finally {
      setIsSearching(false);
    }
  };

  const filterByCategory = (cards, category) => {
    if (category === 'Все дела') return cards;
    
    return cards.filter(card => {
      if (category === 'Уголовное судопроизводство') {
        return card.is_criminal === true || card.case_type === 'criminal';
      } else if (category === 'Гражданское судопроизводство') {
        return card.is_civil === true || card.case_type === 'civil';
      } else if (category === 'Административное правонарушение') {
        return card.is_administrative === true || card.case_type === 'administrative';
      } else if (category === 'Административное судопроизводство') {
        return card.is_kas === true || card.case_type === 'kas';
      } else {
        return card.case_category_title === category;
      }
    });
  };

  // Фильтрация по категории при изменении
  useEffect(() => {
    const sourceCards = searchMode ? searchResults : allCards;
    
    if (sourceCards.length > 0) {
      const filtered = filterByCategory(sourceCards, activeCategory);
      
      // Применяем сортировку
      const sorted = sortCards(filtered, sortOption);
      setFilteredCards(sorted);
      setTotalPages(Math.ceil(sorted.length / limit));
      setPage(1);
    }
  }, [allCards, searchResults, activeCategory, limit, searchMode, sortOption, sortCards]);

  // Пагинация
  useEffect(() => {
    if (filteredCards.length > 0) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      setPaginatedCards(filteredCards.slice(startIndex, endIndex));
    } else {
      setPaginatedCards([]);
    }
  }, [filteredCards, page, limit]);

  const clearSearch = () => {
    setSearchMode(false);
    setSearchResults([]);
    setFilter({ ...filter, query: '' });
    // Не используем window.lastSearchQuery
  };

  const createCard = (newCard) => {
    setAllCards([...allCards, newCard]);
    setModal(false);
  };

  const removeCard = async (id) => {
    try {
      if (id.startsWith('criminal-')) {
        const realId = id.replace('criminal-', '');
        await CriminalCaseService.deleteCriminalProceedings(realId);
      } 
      else if (id.startsWith('civil-')) {
        const realId = id.replace('civil-', '');
        await CivilCaseService.deleteCivilProceedings(realId);
      } 
      else if (id.startsWith('admin-offense-')) {
        const realId = id.replace('admin-offense-', '');
        await AdministrativeCaseService.deleteAdministrativeProceedings(realId);
      }
      else if (id.startsWith('kas-')) {
        const realId = id.replace('kas-', '');
        await KasCaseService.deleteKasProceedings(realId);
      }
      else {
        await CardService.remove(id);
      }
      
      setAllCards(prevCards => prevCards.filter(card => card.id !== id));
      
      // Если в режиме поиска, обновляем результаты
      if (searchMode) {
        setSearchResults(prev => prev.filter(card => card.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить карточку');
    }
  };

  const changePage = (newPage) => {
    setPage(newPage);
    window.scrollTo({
      top: document.querySelector(`.${styles.createCardButtonContainer}`)?.offsetTop - 100 || 0,
      behavior: 'smooth'
    });
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

  // Обработка нажатия клавиши Enter в поиске
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(filter.query);
    }
  };

  // Обработка изменения сортировки
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

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
    <>
      <div className={styles.createCardButtonContainer}>
        <div className={styles.categories}>
          {[
            'Все дела', 
            'Административное правонарушение',
            'Административное судопроизводство', 
            'Гражданское судопроизводство', 
            'Уголовное судопроизводство'
          ].map(
            (category) => (
              <button
                key={category}
                className={`${styles.categoryButton} ${activeCategory === category ? styles.active : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
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

      {/* Поиск и сортировка */}
      <div className={searchStyles.searchHeader}>
        <div className={searchStyles.searchContainer}>
          <input
            type="text"
            className={searchStyles.searchInput}
            value={filter.query}
            onChange={(e) => setFilter({ ...filter, query: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Поиск по номеру дела, ФИО стороны..."
          />
          <button 
            className={searchStyles.searchButton} 
            onClick={() => handleSearch(filter.query)}
            disabled={isSearching}
          >
            {isSearching ? 'Поиск...' : 'Найти'}
          </button>
          {searchMode && (
            <button 
              className={searchStyles.clearButton}
              onClick={clearSearch}
            >
              ✕ Очистить поиск
            </button>
          )}
        </div>
        
        <div className={searchStyles.sortContainer}>
          <label htmlFor="sort">Сортировка:</label>
          <select
            id="sort"
            value={sortOption}
            onChange={handleSortChange}
            className={searchStyles.sortSelect}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Информация о количестве карточек */}
      <div className={styles.cardsInfo}>
        <div className={styles.cardsCount}>
          <span>{filteredCards.length}</span> карточек найдено
          {searchMode && (
            <span className={searchStyles.searchInfo}>
              (результаты поиска)
            </span>
          )}
        </div>
        <div>
          Показано с {filteredCards.length > 0 ? (page - 1) * limit + 1 : 0} по {Math.min(page * limit, filteredCards.length)} из {filteredCards.length}
        </div>
      </div>

      <Modal visible={modal} setVisible={setModal}>
        {showForm && <CategoryBasedForm create={createCard} onCancel={handleCloseModal} />}
      </Modal>

      {showSearchResults && (
        <Modal visible={showSearchResults} setVisible={setShowSearchResults}>
          <SearchResults 
            results={searchResults} 
            query={searchQuery}
            onClose={() => setShowSearchResults(false)}
          />
        </Modal>
      )}

      {isCardsLoading || isSearching ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
          <Loader />
        </div>
      ) : (
        <>
          {cardsError && <div style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>Ошибка: {cardsError}</div>}
          <CardList remove={removeCard} cards={paginatedCards} title='Список карточек' />
        </>
      )}

      {filteredCards.length > 0 && (
        <div className={styles.paginationContainer}>
          <Pagination page={page} changePage={changePage} totalPages={totalPages} />
        </div>
      )}
    </>
  );
}

export default Cards;