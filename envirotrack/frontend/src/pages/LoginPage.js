// LoginPage.js

import React, { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import './LoginPage.css';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  let { loginUser } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    // Проверка на пустые поля
    if (!username || !password) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    const result = await loginUser(e);

    if (result.error) {
      setError(result.error); // Устанавливаем ошибку
    } else {
      setError(""); // Очищаем ошибку при успешном входе
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleLogin} noValidate>
        <label htmlFor="username">
           <FaUser /> Имя пользователя:
        </label>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Введите имя пользователя"
        />
        <label htmlFor="password">
           <FaLock /> Пароль:
        </label>
        <div className="password-input-container">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            placeholder="Введите пароль"
          />
          <span
            className="password-toggle-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="login-button">
          Войти
        </button>
      </form>
    </div>
  );
};

export default LoginPage;