import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// импорт таблицы стилей css для использования класса bootstrap
// добавьте эту строку только в этот файл
import "bootstrap/dist/css/bootstrap.min.css"; 

// Используйте createRoot() вместо ReactDOM.render()
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);