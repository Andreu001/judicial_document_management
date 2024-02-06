import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from './UI/input/MyInput';
import MyButton from './UI/button/MyButton';
import CardService from '../API/CardService';

const CardForm = ({ create, editCardData, onSave, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCardData, setEditedCardData] = useState({ ...editCardData });
  const [newCard, setNewCard] = useState([]);
  const [card, setCard] = useState({
    original_name: '',
    author: '',
    case_category: '',
    article: '',
    pub_date: '',
    preliminary_hearing: '',
  });

  const [categoryList, setCategoryList] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:8000/business_card/category/')
      .then(response => {
        setCategoryList(response.data);
      })
      .catch(error => {
        console.error('Error fetching category list:', error);
      });

    // Если редактируем существующую карточку, устанавливаем данные в форму
    if (editCardData) {
      setIsEditing(true);
      setCard({ ...editCardData });
    }
  }, [editCardData]);

  const handleAddCard = (newCardData) => {
    setNewCard([...newCard, newCardData]);
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

      handleAddCard(updatedCard, setNewCard);

      console.log('Состояние side после сохранения:', updatedCard);
    } catch (error) {
      console.error('Ошибка при обновлении стороны:', error);
    }
    // Передаем измененные данные в функцию onSave
    console.log('Данные, которые передаются при сохранении:', card);
    onSave({ ...card });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };

  const handleAddNewCard = (e) => {
    e.preventDefault();

    axios
      .post('http://localhost:8000/business_card/businesscard/', card)
      .then(response => {
        console.log('Карточка создана:', response.data);
        create(response.data);
        setCard({
          original_name: '',
          author: '',
          case_category: '',
          article: '',
          pub_date: '',
          preliminary_hearing: '',
        });
      })
      .catch(error => {
        console.error('Ошибка создания карточки:', error);
      });
  };

  return (
    <form>
      <MyInput
        type="text"
        name="original_name"
        value={card.original_name}
        onChange={handleChange}
        placeholder="Номер дела"
      />
      <MyInput
        type="text"
        name="author"
        value={card.author}
        onChange={handleChange}
        placeholder="Автор"
      />
      <select name="case_category" value={card.case_category} onChange={handleChange}>
        <option value="">Выберите категорию</option>
        {categoryList.map((category, index) => (
          <option key={index} value={category.id}>
            {category.title_category}
          </option>
        ))}
      </select>
      <MyInput
        type="text"
        name="article"
        value={card.article}
        onChange={handleChange}
        placeholder="Статья"
      />
      <MyInput
        type="text"
        name="pub_date"
        value={card.pub_date}
        onChange={handleChange}
        placeholder="Дата создания (не заполнять!!!!)"
      />
      <MyInput
        type="date"
        name="preliminary_hearing"
        value={card.preliminary_hearing}
        onChange={handleChange}
        placeholder="Дата предварительного заседания"
      />
      {isEditing ? (
        <>
          <MyButton onClick={handleSave}>Сохранить дело</MyButton>
          <MyButton onClick={handleCancel}>Отменить</MyButton>
        </>
      ) : (
        <MyButton onClick={handleAddNewCard}>Создать NEW</MyButton>
      )}
    </form>
  );
};

export default CardForm;
