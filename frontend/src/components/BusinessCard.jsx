import React, { useState, useEffect } from 'react';
import MyButton from './UI/button/MyButton';
import { useNavigate } from 'react-router-dom';
import CardService from '../API/CardService';
import { updateCard } from '../API/CardService';
import CardNavbar from './UI/CardNavbar/CardNavbar';
import CardHeader from './CardHeader';
import CardForm from './CardForm';
import { handleShowDetails, handleAddSide, handleDeleteSide, handleEditSide } from '../pages/Sides';
import SidesForm from '../pages/SidesForm';
import SideService from '../API/SideService';

const BusinessCard = (props) => {
  const router = useNavigate();
  const [newside, setNewSide] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editedCardData, setEditedCardData] = useState({ ...props.card });
  const [editedSideData, setEditedSideData] = useState({ ...props.side });
  const [showSideForm, setShowSideForm] = useState(false);
  const [isEditingSide, setIsEditingSide] = useState(false);
  const [sides, setSides] = useState([]);
  const [newCard, setNewCard] = useState([]);
  const [showCardForm, setShowCardForm] = useState(false);
  
  useEffect(() => {
    SideService.getAllSide(props.card.id).then((response) =>  {
      if (Array.isArray(response)) {
        setSides(response);
      } else {
        console.error('Неверный тип данных в ответе:', response);
      }
    });
  }, [props.card.id]);

  const handleEditToggle = () => {
    setIsEditingCard(!isEditingCard);
  };

  const handleSaveSide = async () => {
    try {
      const sideId = String(editedSideData.id);
      const updatedSide = await SideService.updateSide(sideId, editedSideData);
  
      setEditedSideData(updatedSide);
      setIsEditingSide(false);
  
      handleAddSide(updatedSide, setNewSide);
  
      console.log('Состояние side после сохранения:', updatedSide);
    } catch (error) {
      console.error('Ошибка при обновлении стороны:', error);
    }
  };
  
  const handleSaveCard = async (updatedCardData) => {
    try {
        const cardId = String(updatedCardData.id);
        const updatedCard = await updateCard(cardId, updatedCardData);

        setEditedCardData(updatedCard);
        setIsEditingCard(false);

        handleAddCard(updatedCard, setNewCard);

        console.log('Состояние карточки после сохранения:', updatedCard);
    } catch (error) {
        console.error('Ошибка при обновлении карточки:', error);
    }
};

  const handleAddCard = (newCardData) => {
    setNewCard([...newCard, newCardData]);
  };

  const handleCancel = () => {
    setEditedCardData({ ...props.card });
    setIsEditingCard(false);
  };

  const handleRemove = async () => {
    try {
      if (!props.card.id) {
        console.error('ID карточки не определен');
        return;
      }

      const cardId = String(props.card.id);
      await CardService.remove(cardId);
      console.log('Удаляется карточка с ID:', cardId);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  const handleAddSideToState = () => {
    setIsEditingSide(true);
    setShowSideForm(true);
  };

  const handleAddCardToState = () => {
    setIsEditingCard(true);
    setShowCardForm(true);
  };

  const createSide = (newSide) => {
    handleAddSide(newSide, setNewSide);
  };

  const renderButtons = () => {
    if (activeTab === 1) {
      return (
        <>
          <MyButton onClick={handleShowDetails}>Показать детали</MyButton>
          <MyButton onClick={handleAddSideToState}>
            Добавить сторону
          </MyButton>
          <MyButton onClick={handleDeleteSide}>Удалить сторону</MyButton>
          <MyButton onClick={handleEditSide}>Редактировать сторону</MyButton>
        </>
      );
    } else {
      return (
        <>
          <MyButton onClick={() => router(`/cards/${props.card.id}`)}>
            Подробнее
          </MyButton>
          <MyButton onClick={handleRemove}>Удалить</MyButton>
          <MyButton onClick={handleEditToggle}>Редактировать</MyButton>
        </>
      );
    }
  };

  return (
    <div className="post">
      {showSideForm && isEditingSide ? (
        <SidesForm
          create={createSide}
          editSideData={editedSideData}
          onSave={async (newSide) => {
            const updatedSide = await SideService.updateSide(newSide.id, setNewSide);
            handleAddSide(updatedSide, setNewSide);
            setShowSideForm(false);
            setIsEditingSide(false);
          }}
          onCancel={() => {
            setShowSideForm(false);
            setIsEditingSide(false);
          }}
          setNewSide={setNewSide}
        />
      ) : null}
      {isEditingCard ? (
        <CardForm
          create={props.create}
          editCardData={editedCardData}
          onSave={handleSaveCard}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="card-header">
            <h5>
              <CardHeader
                align-items="center"
                category={props.card.case_category_title}
              />
              <p></p>
              {` Карточка № ${props.card.original_name}`}
            </h5>
          </div>
          <div className="post__content">
            <div className="tab-content">
              <CardNavbar onTabChange={handleTabChange} />
              {activeTab === 0 && (
                <>
                  <strong>
                    АЙДИ карточки: {props.card.id} Номер карточки {props.card.original_name}.
                  </strong>
                  <div>Автор: {props.card.author}</div>
                  Категория:
                  <div>{props.card.case_category_title}</div>
                  <div>Статья: {props.card.article}</div>
                  Дата создания:
                  <div>{props.card.pub_date}</div>
                </>
              )}

                {activeTab === 1 && sides ? (
                  <>
                    {sides.map((sides, index) => (
                      <div key={index}>
                        <strong>ФИО {sides.name}.</strong>
                        <div>Под стражей: {sides.under_arrest}</div>
                          {sides.sides_case ? (
                          sides.sides_case.map((sideCase, index) => (
                            <div  key={index}>Сторона по делу:{sideCase.sides_case}</div>
                          ))
                        ) : (
                          <div>Нет данных по сторонам дела</div>
                        )}
                        <div>Дата направления повестки: {sides.date_sending_agenda}</div>
                      </div>
                    ))}
                  </>
                ) : null}


              {activeTab === 2 && (
                <div>
                  Третий текст Третий текст Третий текст Третий текст
                </div>
              )}

              {activeTab === 3 && (
                <div>
                  Четвертый текст Четвертый текст Четвертый текст
                </div>
              )}
            </div>
          </div>
          <hr
            style={{
              width: '100%',
              height: '2px',
              backgroundColor: '#d3d3d3',
              margin: '15px 0',
            }}
          />
          <div className="post__btns">{renderButtons()}</div>
        </>
      )}
    </div>
  );
};

export default BusinessCard;
