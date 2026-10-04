// LoginPage.js

import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import './LoginPage.css';
import { FaUser, FaLock } from 'react-icons/fa';

const LoginPage = () => {
  let { loginUser } = useContext(AuthContext);
  

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={loginUser}>
        <h1 className="login-title">Вход в журнал</h1>
        <label htmlFor="username">
           <FaUser /> Имя пользователя:
        </label>
        <input type="text" id="username" name="username" placeholder="Введите имя пользователя" />
        <label htmlFor="password">
           <FaLock /> Пароль:
        </label>
        <input type="password" id="password" name="password" placeholder="Введите пароль" />

        <button type="submit" className="login-button">
          Войти
        </button>
      </form>
    </div>
  );
};

export default LoginPage;