import React from "react";

// Новый компонент для панели заголовка
const CardHeader = ({ title, category }) => {
  
  const categoryColors = {
    "Административное правнарушение": "#B8FC9C", // Зеленый цвет
    "Административное судопроизводство": "#FFEAC2", // Оранжевый цвет
    "Гражданское судопроизводство": "#B7C6FB", // Синий цвет
    "Уголовное судопроизводство": "#FF9EA3", // Красный цвет
  };

  return (
    <div style={{ backgroundColor: categoryColors[category], padding: "5px", borderRadius: "5px", display: "inline-block" }}>
      {category}
    </div>
  );
};

export default CardHeader;
