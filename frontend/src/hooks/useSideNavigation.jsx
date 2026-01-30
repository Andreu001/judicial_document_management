import { useNavigate } from 'react-router-dom';

export const useSideNavigation = () => {
  const navigate = useNavigate();

  // Определяем тип стороны на основе sides_case
  const getSideType = (side) => {
    if (!side?.sides_case || !Array.isArray(side.sides_case)) {
      return 'default';
    }

    const sidesCase = Array.isArray(side.sides_case) 
      ? side.sides_case 
      : [side.sides_case];

    // Проверяем, есть ли среди типов адвокат/защитник
    const lawyerTypes = ['защитник', 'адвокат', 'lawyer', 'defender'];
    const defendantTypes = ['обвиняемый', 'осужденный', 'подозреваемый', 'подсудимый', 
                           'accused', 'convicted', 'suspect', 'defendant'];
    
    const sideTypes = sidesCase.map(type => {
      if (typeof type === 'object') return type.sides_case?.toLowerCase();
      return type?.toString().toLowerCase();
    }).filter(Boolean);

    if (sideTypes.some(type => lawyerTypes.includes(type))) {
      return 'lawyer';
    } else if (sideTypes.some(type => defendantTypes.includes(type))) {
      return 'defendant';
    }
    
    return 'default';
  };

  // Получаем URL для перехода
  const getSideDetailsUrl = (businesscardId, sideId, side) => {
    const sideType = getSideType(side);
    
    switch(sideType) {
      case 'lawyer':
        return `/cases/${businesscardId}/lawyers/${sideId}`;
      case 'defendant':
        return `/cases/${businesscardId}/defendants/${sideId}`;
      default:
        return `/cases/${businesscardId}/sides/${sideId}`;
    }
  };

  // Плавный переход к детализации стороны
  const navigateToSideDetails = (businesscardId, sideId, sideData) => {
    const url = getSideDetailsUrl(businesscardId, sideId, sideData);
    navigate(url);
  };

  // Проверка, нужна ли миграция при изменении типа
  const needsMigration = (oldSide, newSide) => {
    const oldType = getSideType(oldSide);
    const newType = getSideType(newSide);
    
    return oldType !== newType && (oldType !== 'default' || newType !== 'default');
  };

  return {
    getSideType,
    getSideDetailsUrl,
    navigateToSideDetails,
    needsMigration
  };
};