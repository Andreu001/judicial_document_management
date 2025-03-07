import React, { useState } from 'react';
import { IoMdEye, IoMdTrash, IoMdCreate } from 'react-icons/io';
import ModalDetails from '../../components/UI/Modal/ModalDetails'; // Импортируем компонент модального окна
import ConsideredDetail from './ConsideredDetail'; // Импортируем компонент с деталями

const ConsideredList = ({
  considered,
  handleDeleteConsidered,
  handleEditConsideredForm,
  cardId,
  setConsidered
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Состояние для открытия/закрытия модального окна
  const [selectedConsideredId, setSelectedConsideredId] = useState(null); // Храним ID выбранного элемента

  // Функция для открытия модального окна с деталями
  const handleShowDetailsConsidered = (consideredItemId) => {
    setSelectedConsideredId(consideredItemId); // Сохраняем выбранный ID
    setIsModalOpen(true); // Открываем модальное окно
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setIsModalOpen(false); // Закрываем окно
    setSelectedConsideredId(null); // Очищаем выбранный ID
  };

  return (
    <>
      {considered.map((consideredItem, index) => (
        <div key={index} style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>
                Название решения:  
                {consideredItem.name_case && consideredItem.name_case.length > 0 
                  ? consideredItem.name_case[0]?.name_case || 'Не указано'
                  : 'Не указано'}
              </strong>
              <div>Дата вынесения решения: {consideredItem.date_consideration}</div>
              <div>Дата вступления в законную силу: {consideredItem.effective_date}</div>
              <div>
                Уведомление сторон:
                {consideredItem.notification_parties && consideredItem.notification_parties.length > 0
                  ? consideredItem.notification_parties.map((party, idx) => (
                      <div key={idx}>{party.name || 'Не указано'}</div>
                    ))
                  : 'Неизвестно'}
              </div>
              <div>Дата исполнения дела: {consideredItem.executive_lists}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IoMdEye 
                onClick={() => handleShowDetailsConsidered(consideredItem.id, cardId)}
                style={{ cursor: 'pointer', marginRight: '10px', color: 'blue' }} 
              />
              <IoMdTrash
                onClick={() => handleDeleteConsidered(consideredItem.id, cardId, setConsidered)}
                style={{ cursor: 'pointer', marginRight: '10px', color: 'red' }}
              />
              <IoMdCreate
                onClick={() => handleEditConsideredForm(consideredItem.id)}
                style={{ cursor: 'pointer', color: 'green' }}
              />
            </div>
          </div>
          <hr style={{ width: '100%', height: '1px', backgroundColor: '#d3d3d3', margin: '10px 0' }} />
        </div>
      ))}

      {/* Модальное окно с деталями */}
      <ModalDetails 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title="Подробнее о решении"
      >
        {/* Здесь рендерим компонент ConsideredDetail для выбранного ID */}
        {selectedConsideredId && <ConsideredDetail
        cardId={cardId}
        consideredId={selectedConsideredId} />}
      </ModalDetails>
    </>
  );
};

export default ConsideredList;
