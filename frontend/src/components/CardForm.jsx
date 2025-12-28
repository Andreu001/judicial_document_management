import React, { useState, useEffect } from 'react';
import MyInput from './UI/input/MyInput';
import MyButton from './UI/button/MyButton';
import CardService from '../API/CardService';
import CriminalCaseService from '../API/CriminalCaseService';
import CaseRegistryService from '../API/CaseRegistryService';
import CriminalCaseForm from './CriminalCase/CriminalCaseForm';
import styles from './UI/input/Input.module.css';
import { useProtectedFetching } from '../hooks/useProtectedFetching';
import { useAuth } from '../context/AuthContext';

const CardForm = ({ create, editCardData, onSave, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCriminalForm, setShowCriminalForm] = useState(false);
  const [editedCardData, setEditedCardData] = useState({ ...editCardData });
  const [card, setCard] = useState({
    original_name: '',
    case_category: '',
    pub_date: '',
    preliminary_hearing: '',
    registry_index: '',
  });
  
  const [criminalData, setCriminalData] = useState({});
  const [categoryList, setCategoryList] = useState([]);
  const [registryIndexes, setRegistryIndexes] = useState([]);
  const [nextNumber, setNextNumber] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('');
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [isLoadingIndexes, setIsLoadingIndexes] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const [fetchCategories, isCategoriesLoading, categoriesError] = useProtectedFetching();
  const currentYear = new Date().getFullYear();

  const isCriminalCategory = () => {
    const selectedCategory = categoryList.find(cat => 
      cat.id === parseInt(card.case_category)
    );
    return selectedCategory && selectedCategory.title_category.toLowerCase().includes('уголов');
  };

  useEffect(() => {
    if (isAuthenticated()) {
      loadCategories();
      loadRegistryIndexes();
    }

    if (editCardData) {
      setIsEditing(true);
      setCard({ ...editCardData });
    }
  }, [editCardData, isAuthenticated]);

  // Загрузка категорий
  const loadCategories = async () => {
    try {
      await fetchCategories(async () => {
        const categories = await CardService.getCategories();
        setCategoryList(categories);
      });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Загрузка индексов регистрации
  const loadRegistryIndexes = async () => {
    setIsLoadingIndexes(true);
    try {
      console.log('Loading registry indexes...');
      const indexes = await CaseRegistryService.getIndexes();
      console.log('Loaded indexes:', indexes);
      setRegistryIndexes(indexes || []);
    } catch (error) {
      console.error('Ошибка загрузки индексов:', error);
      setRegistryIndexes([]);
    } finally {
      setIsLoadingIndexes(false);
    }
  };

  // Получение следующего номера для выбранного индекса
  const getNextNumber = async (indexCode) => {
    try {
      setIsGeneratingNumber(true);
      const nextNum = await CaseRegistryService.getNextNumber(indexCode);
      setNextNumber(nextNum);
      return nextNum;
    } catch (error) {
      console.error('Ошибка получения номера:', error);
      return null;
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  // Обработчик изменения категории
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setCard({ ...card, case_category: categoryId });
    
    const selectedCategory = categoryList.find(cat => cat.id === parseInt(categoryId));
    if (selectedCategory) {
      await autoSelectIndex(selectedCategory);
    }
  };

  // Автоматический выбор индекса на основе категории
  const autoSelectIndex = async (category) => {
    let indexCode = '';
    
    if (category.title_category.toLowerCase().includes('уголов')) {
      indexCode = '1';
    } else if (category.title_category.toLowerCase().includes('граждан')) {
      indexCode = '2';
    } else if (category.title_category.toLowerCase().includes('административ')) {
      indexCode = '2а';
    } else if (category.title_category.toLowerCase().includes('административных правонарушен')) {
      indexCode = '5';
    } else {
      indexCode = '15';
    }

    const selectedIndex = registryIndexes.find(index => index.index === indexCode);
    if (selectedIndex) {
      setSelectedIndex(selectedIndex);
      setCard(prev => ({ ...prev, registry_index: indexCode }));
      
      const nextNum = await getNextNumber(indexCode);
      if (nextNum) {
        setCard(prev => ({ 
          ...prev, 
          original_name: `${indexCode}-${nextNum}/${currentYear}` 
        }));
      }
    }
  };

  // Обработчик ручного выбора индекса
  const handleIndexChange = async (e) => {
    const indexCode = e.target.value;
    const selectedIndex = registryIndexes.find(index => index.index === indexCode);
    
    if (selectedIndex) {
      setSelectedIndex(selectedIndex);
      setCard(prev => ({ ...prev, registry_index: indexCode }));
      
      const nextNum = await getNextNumber(indexCode);
      if (nextNum) {
        setCard(prev => ({ 
          ...prev, 
          original_name: `${indexCode}-${nextNum}/${currentYear}`
        }));
      }
    }
  };

  // Обработчик изменения номера дела
  const handleOriginalNameChange = (e) => {
    setCard({ ...card, original_name: e.target.value });
  };

  const handleChange = (e) => {
    setCard({ ...card, [e.target.name]: e.target.value });
  };

  const handleCriminalDataChange = (newData) => {
    setCriminalData(newData);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const cardId = String(editedCardData.id);
      const updatedCard = await CardService.updateCard(cardId, editedCardData);
      setEditedCardData(updatedCard);
      setIsEditing(false);
      onSave({ ...card });
    } catch (error) {
      console.error('Ошибка при обновлении карточки:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowCriminalForm(false);
    onCancel();
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();

    if (!card.original_name) {
      alert('Пожалуйста, сгенерируйте номер дела');
      return;
    }

    if (isCriminalCategory() && !showCriminalForm) {
      setShowCriminalForm(true);
      return;
    }

    await handleAddNewCard();
  };

  const handleAddNewCard = async () => {
    try {
      const cardData = {
        original_name: card.original_name,
        author: user?.id || 1,
        case_category: card.case_category,
        pub_date: card.pub_date || null,
        preliminary_hearing: card.preliminary_hearing || null,
        registry_index: card.registry_index,
      };

      // Регистрируем дело в реестре
      let registeredCase = null;
      if (card.registry_index) {
        try {
          registeredCase = await CaseRegistryService.registerCase({
            index: card.registry_index,
            description: `Дело ${card.original_name}`,
          });
        } catch (registryError) {
          console.error('Ошибка регистрации дела:', registryError);
        }
      }

      const response = await CardService.create(cardData);

      if (registeredCase && response.id) {
        try {
          await CaseRegistryService.updateCase(registeredCase.id, {
            business_card_id: response.id
          });
        } catch (updateError) {
          console.error('Ошибка обновления зарегистрированного дела:', updateError);
        }
      }

      if (isCriminalCategory() && response.id) {
        try {
          await CriminalCaseService.create(response.id, criminalData);
        } catch (criminalError) {
          console.error('Ошибка создания уголовного производства:', criminalError);
        }
      }

      create(response);
      
      // Сброс формы
      setCard({
        original_name: '',
        case_category: '',
        pub_date: '',
        preliminary_hearing: '',
        registry_index: '',
      });
      
      setCriminalData({});
      setShowCriminalForm(false);
      setSelectedIndex('');
      setNextNumber('');

    } catch (error) {
      console.error('Ошибка создания карточки:', error.response?.data || error);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className={styles.formContainer}>
        <h3>Для создания карточек требуется авторизация</h3>
        <p>Пожалуйста, войдите в систему</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <form>
        {/* Блок выбора индекса и генерации номера */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Индекс дела *</label>
            <select 
              name="registry_index" 
              value={card.registry_index} 
              onChange={handleIndexChange}
              required
              className={styles.select}
              disabled={isLoadingIndexes}
            >
              <option value="">{isLoadingIndexes ? 'Загрузка индексов...' : 'Выберите индекс'}</option>
              {registryIndexes.map((index) => (
                <option key={index.id} value={index.index}>
                  {index.index} - {index.name}
                </option>
              ))}
            </select>
            {isLoadingIndexes && <small>Загрузка индексов...</small>}
          </div>

          <div className={styles.formGroup}>
            <label>Следующий номер</label>
            <div className={styles.numberGeneration}>
              <MyInput
                type="text"
                value={nextNumber || 'Не выбран индекс'}
                disabled
                className={styles.numberInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Номер дела *</label>
            <MyInput
              type="text"
              name="original_name"
              value={card.original_name}
              onChange={handleOriginalNameChange}
              placeholder="Номер дела (сгенерируется автоматически)"
              required
            />
            <small className={styles.helpText}>
              {selectedIndex ? `Формат: ${selectedIndex.index}-номер/${currentYear}` : 'Сначала выберите индекс'}
            </small>
          </div>

          <div className={styles.formGroup}>
            <label>Категория дела *</label>
            <select 
              name="case_category" 
              value={card.case_category} 
              onChange={handleCategoryChange}
              required
              className={styles.select}
            >
              <option value="">Выберите категорию</option>
              {categoryList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title_category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Автор *</label>
            <MyInput
              type="text"
              value={user ? `${user.first_name} ${user.last_name}` : 'Неизвестный пользователь'}
              disabled
              placeholder="Автор"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата предварительного заседания</label>
            <MyInput
              type="date"
              name="preliminary_hearing"
              value={card.preliminary_hearing}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Форма уголовного производства */}
        {showCriminalForm && (
          <div className={styles.criminalFormContainer}>
            <CriminalCaseForm
              criminalData={criminalData}
              onCriminalDataChange={handleCriminalDataChange}
            />
          </div>
        )}

        <div className={styles.buttonGroup}>
          {isEditing ? (
            <>
              <MyButton onClick={handleSave}>Сохранить</MyButton>
              <MyButton onClick={handleCancel}>Отменить</MyButton>
            </>
          ) : (
            <>
              <MyButton onClick={handleCreateCard}>
                {showCriminalForm ? 'Создать карточку с уголовным делом' : 'Создать карточку'}
              </MyButton>
              {showCriminalForm && (
                <MyButton onClick={() => setShowCriminalForm(false)} style={{background: '#6c757d'}}>
                  Отменить уголовное дело
                </MyButton>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default CardForm;
