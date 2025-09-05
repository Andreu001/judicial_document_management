import React, { useState, useEffect } from 'react';
import MyInput from './UI/input/MyInput';
import MyButton from './UI/button/MyButton';
import CardService from '../API/CardService';
import CriminalCaseService from '../API/CriminalCaseService';
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
  });
  
  const [criminalData, setCriminalData] = useState({});
  const [categoryList, setCategoryList] = useState([]);
  const { isAuthenticated, user } = useAuth();
  const [fetchCategories, isCategoriesLoading, categoriesError] = useProtectedFetching();

  const isCriminalCategory = () => {
    const selectedCategory = categoryList.find(cat => 
      cat.id === parseInt(card.case_category)
    );
    return selectedCategory && selectedCategory.title_category.toLowerCase().includes('уголов');
  };

  useEffect(() => {
    if (isAuthenticated()) {
      loadCategories();
    }

    if (editCardData) {
      setIsEditing(true);
      setCard({ ...editCardData });
    }
  }, [editCardData, isAuthenticated]);

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

    // Если уголовная категория и еще не показана форма уголовного производства
    if (isCriminalCategory() && !showCriminalForm) {
      setShowCriminalForm(true);
      return;
    }

    // Если уже показана форма уголовного производства или не уголовная категория
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
      };

      const response = await CardService.create(cardData);

      if (isCriminalCategory() && response.id) {
        try {
          await CriminalCaseService.create(response.id, criminalData);
        } catch (criminalError) {
          console.error('Ошибка создания уголовного производства:', criminalError);
        }
      }

      create(response);
      
      setCard({
        original_name: '',
        case_category: '',
        pub_date: '',
        preliminary_hearing: '',
      });
      
      setCriminalData({});
      setShowCriminalForm(false);

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
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Номер дела *</label>
            <MyInput
              type="text"
              name="original_name"
              value={card.original_name}
              onChange={handleChange}
              placeholder="Номер дела"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Категория дела *</label>
            <select 
              name="case_category" 
              value={card.case_category} 
              onChange={handleChange}
              required
              className={styles.select}
            >
              <option value="">Выберите категорию</option>
              {categoryList.map((category, index) => (
                <option key={index} value={category.id}>
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

        {/* Форма уголовного производства в отдельном прокручиваемом контейнере */}
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