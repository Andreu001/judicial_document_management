import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SideService from '../API/SideService';
import { useSideNavigation } from '../hooks/useSideNavigation';

// Импортируем все компоненты детализации
import LawyerDetails from '../pages/LawyerDetails';
import DefendantDetails from '../pages/DefendantDetail';
import SideDetails from '../pages/SideDetail';

const SideDetailsWrapper = () => {
  const { cardId, sideId } = useParams();
  const navigate = useNavigate();
  const { getSideType } = useSideNavigation();
  
  const [side, setSide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [componentType, setComponentType] = useState('default');

  useEffect(() => {
    loadSideData();
  }, [cardId, sideId]);

  const loadSideData = async () => {
    try {
      setLoading(true);
      const response = await SideService.getAllSide(cardId);
      const sideData = response.data.find(s => s.id === parseInt(sideId));
      
      if (sideData) {
        setSide(sideData);
        const type = getSideType(sideData);
        setComponentType(type);
      }
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных стороны:', error);
      setLoading(false);
    }
  };

  const handleSideUpdated = async (updatedSide) => {
    // После обновления проверяем, не изменился ли тип стороны
    const newType = getSideType(updatedSide);
    
    if (newType !== componentType) {
      // Если тип изменился, показываем сообщение и перезагружаем с новым компонентом
      alert(`Тип стороны изменен с "${getTypeLabel(componentType)}" на "${getTypeLabel(newType)}". Обновление интерфейса...`);
      setComponentType(newType);
      setSide(updatedSide);
    } else {
      setSide(updatedSide);
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'lawyer': return 'Адвокат';
      case 'defendant': return 'Подсудимый';
      default: return 'Сторона';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (!side) {
    return (
      <div className="not-found">
        <h2>Сторона не найдена</h2>
        <button onClick={() => navigate(`/cases/${cardId}`)}>
          Вернуться к делу
        </button>
      </div>
    );
  }

  // Рендерим соответствующий компонент в зависимости от типа
  switch(componentType) {
    case 'lawyer':
      return <LawyerDetails key={`lawyer-${side.id}`} />;
    case 'defendant':
      return <DefendantDetails key={`defendant-${side.id}`} />;
    default:
      return <SideDetails key={`side-${side.id}`} />;
  }
};

export default SideDetailsWrapper;