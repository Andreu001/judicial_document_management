// Layout.jsx - обновленная версия
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Navbar from './UI/Navbar/Navbar';

const Layout = () => {
  const [filter, setFilter] = useState({ query: '', searchBy: '', sort: '' });
  const location = useLocation();
  
  // Проверяем, находимся ли мы на странице мессенджера
  const isCommunicationPage = location.pathname.startsWith('/communication');

  return (
    <div>
      <Navbar />
      <Header filter={filter} setFilter={setFilter} onSearch={(query) => console.log("Поиск:", query)} />
      <div style={{ 
        marginTop: '60px', 
        padding: isCommunicationPage ? '0' : '20px',
        marginLeft: isCommunicationPage ? '0' : '0',
        height: isCommunicationPage ? 'calc(100vh - 60px)' : 'auto'
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;