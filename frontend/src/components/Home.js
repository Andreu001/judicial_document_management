import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Состояние для хранения информации об авторизации пользователя

  // Проверяем, авторизован ли пользователь (здесь можно использовать вашу логику проверки авторизации)
  // В данном случае устанавливаем флаг isLoggedIn в true, предполагая, что пользователь авторизован
  const checkUserAuth = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      <h1>Welcome to My Authentication App</h1>
      <nav>
        <ul>
          <li>
            <Link to="/auth/login/">Login</Link>
          </li>
          {isLoggedIn && ( // Показываем кнопку только если пользователь авторизован
            <li>
              <Link to="/logout">Logout</Link>
            </li>
          )}
          <li>
            <Link to="/signup">Signup</Link>
          </li>
          <li>
            <Link to="/admin/">Админка</Link>
          </li>
          <li>
            <Link to="/business_card/">Добавить карточку</Link>
          </li>
          {/* ...other links */}
        </ul>
      </nav>
      <div>
        <SignupButton />
      </div>
    </div>
  );
};

const SignupButton = () => {
  return (
    <Link to="/signup">
      <button>Зарегистрироваться</button>
    </Link>
  );
};

// Регистрация пользователя по вашим роутерам Django
const Signup = () => {
  return (
    <div>
      <h2>Авторизоваться</h2>
      {/* Добавьте форму для регистрации */}
    </div>
  );
};

export default Home;
