import React from 'react';
import MyButton from './UI/button/MyButton';

const CardButtons = ({ handleShowDetails, handleAddSideToState, handleDeleteSide, handleEditSide, router, handleRemove, handleEditToggle, activeTab }) => {
  if (activeTab === 1) {
    return (
      <>
        <MyButton onClick={handleShowDetails}>Показать детали</MyButton>
        <MyButton onClick={handleAddSideToState}>Добавить сторону</MyButton>
        <MyButton onClick={handleDeleteSide}>Удалить сторону</MyButton>
        <MyButton onClick={handleEditSide}>Редактировать сторону</MyButton>
      </>
    );
  } else {
    return (
      <>
        <MyButton onClick={() => router(`/cards/${props.card.id}`)}>Подробнее</MyButton>
        <MyButton onClick={handleRemove}>Удалить</MyButton>
        <MyButton onClick={handleEditToggle}>Редактировать</MyButton>
      </>
    );
  }
};

export default CardButtons;
