import React, { useEffect, useState } from 'react';
import SideService from '../API/SideService';
import { CSSTransition } from 'react-transition-group';
import BusinessCard from './BusinessCard';

const SideList = (props) => {
    const [sides, setSides] = useState([]);

  useEffect(() => {
    async function fetchSides() {
      try {
        const response = await SideService.getAllSide();
        setSides(response.data);
        console.log("Удаляется сторона с ID:", setSides);
      } catch (error) {
        console.error('Error fetching sides:', error);
      }
    }

    fetchSides();
  }, []);

  if (!sides || !Array.isArray(sides) || sides.length === 0) {
    return (
      <h1 style={{ textAlign: 'center' }}>
        Стороны не найдены!
      </h1>
    );
  }

  const removeSide = async (id) => {
    try {
      await SideService.remove(id);
      setSides(sides.filter(side => side.id !== id));
      console.log("Удаляется сторона с ID:", id);
    } catch (error) {
      console.error('Error removing side:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', maxWidth: '1000px', margin: '0 auto', padding: '15px' }}>
        {sides.map((side, index) => (
          <CSSTransition
            key={side.id}
            timeout={500}
            classNames="post"
          >
            <div style={{ width: 'calc(50% - 10px)', marginBottom: '10px' }}>
              <BusinessCard key={side.id} remove={() => removeSide(side.id)} number={index + 1} side={side} />
            </div>
          </CSSTransition>
        ))}

    </div>
  );
};

export default SideList;
