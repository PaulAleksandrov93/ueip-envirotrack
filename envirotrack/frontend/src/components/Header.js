// Header.js

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ReactComponent as WhiteLogo } from '../assets/rosatom_white_logo.svg';
import './Header.css'; 

const Header = () => {
  let { user, logoutUser } = useContext(AuthContext);
  return (
    <div className='app-header'>
      <WhiteLogo className='app-logo' />
      <h1 className='app-title'>Журнал регистрации параметров окружающей среды</h1>
      <div className='user-info'>
        <p className='user-greeting'>{user && user.username}</p>
        <nav className='nav-links'>
          <Link to='/' className='nav-link'>
            Главная
          </Link>
          {user ? (
            <p className='logout-link' onClick={logoutUser}>
              Выйти
            </p>
          ) : (
            <Link to='/login' className='nav-link'>
              Вход
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Header;