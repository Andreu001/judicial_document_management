import React, { useState, useEffect } from 'react';
import MyInput from './UI/input/MyInput';
import MyButton from './UI/button/MyButton';
import CardService from '../API/CardService';
import styles from './UI/input/Input.module.css';
import { useProtectedFetching } from '../hooks/useProtectedFetching';
import { useAuth } from '../context/AuthContext';

const CardForm = ({ create, editCardData, onSave, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCardData, setEditedCardData] = useState({ ...editCardData });
  const [card, setCard] = useState({
    original_name: '',
    case_category: '',
    article: '',
    pub_date: '',
    preliminary_hearing: '',
  });
  const [categoryList, setCategoryList] = useState([]);
  const { isAuthenticated, user } = useAuth();
  const [fetchCategories, isCategoriesLoading, categoriesError] = useProtectedFetching();

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
    onCancel();
  };

  const handleAddNewCard = async (e) => {
    e.preventDefault();

    try {
      // Подготавливаем данные для отправки - author автоматически из user
      const cardData = {
        original_name: card.original_name,
        author: user?.id || 1, // ID авторизованного пользователя
        case_category: card.case_category,
        article: card.article,
        pub_date: card.pub_date || null,
        preliminary_hearing: card.preliminary_hearing || null,
      };

      console.log('Отправляемые данные:', cardData);

      const response = await CardService.create(cardData);
      console.log('Карточка создана:', response);
      create(response);
      setCard({
        original_name: '',
        case_category: '',
        article: '',
        pub_date: '',
        preliminary_hearing: '',
      });
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
          <label>Автор *</label>
          <MyInput
            type="text"
            value={user ? `${user.first_name} ${user.last_name}` : 'Неизвестный пользователь'}
            disabled
            placeholder="Автор"
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Автор определяется автоматически по текущему пользователю
          </small>
        </div>

        <div className={styles.formGroup}>
          <label>Категория дела *</label>
          <select 
            name="case_category" 
            value={card.case_category} 
            onChange={handleChange}
            required
          >
            <option value="">Выберите категорию</option>
            {categoryList.map((category, index) => (
              <option key={index} value={category.id}>
                {category.title_category}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Статья</label>
          <MyInput
            type="text"
            name="article"
            value={card.article}
            onChange={handleChange}
            placeholder="Статья"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Дата предварительного заседания</label>
          <MyInput
            type="date"
            name="preliminary_hearing"
            value={card.preliminary_hearing}
            onChange={handleChange}
          />
        </div>

        <div className={styles.buttonGroup}>
          {isEditing ? (
            <>
              <MyButton onClick={handleSave}>Сохранить</MyButton>
              <MyButton onClick={handleCancel}>Отменить</MyButton>
            </>
          ) : (
            <MyButton onClick={handleAddNewCard}>Создать карточку</MyButton>
          )}
        </div>
      </form>
    </div>
  );
};

export default CardForm;