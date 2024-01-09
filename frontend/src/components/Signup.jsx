import React from 'react';

const Signup = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Здесь добавьте логику для отправки данных формы на сервер
  };

  return (
    <div>
      <h2>Signup Page</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" />
        </div>
        <div>
          <label htmlFor="password">Пароль:</label>
          <input type="password" id="password" name="password" />
        </div>
        {/* Добавьте другие поля для регистрации */}
        <button type="submit">Зарегистрироваться</button>
      </form>
    </div>
  );
};

export default Signup;
