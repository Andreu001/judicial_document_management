import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Получение CSRF токена из cookie
      const csrftoken = Cookies.get('csrftoken');

      // Установка CSRF токена в заголовок запроса
      const config = {
        headers: {
          'X-CSRFToken': csrftoken
        }
      };

      // Отправка запроса на сервер с установленным токеном в заголовке
      const response = await axios.post('http://127.0.0.1:8000/auth/login/', {
        username: formData.username,
        password: formData.password
      }, config);

      console.log('Login successful:', response.data);
      // Обработка успешного входа пользователя
    } catch (error) {
      console.error('Login failed:', error);
      // Обработка ошибки авторизации
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
