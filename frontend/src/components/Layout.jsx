import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navbar from './UI/Navbar/Navbar';

const Layout = () => {
  const [filter, setFilter] = useState({ query: '', searchBy: '', sort: '' });

  return (
    <div>
      <Navbar />
      <Header filter={filter} setFilter={setFilter} onSearch={(query) => console.log("Поиск:", query)} />
      <div style={{ marginTop: '60px', padding: '20px' }}> {/* Отступ после хедера */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
