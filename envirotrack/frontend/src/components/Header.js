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
        {user ? (
          <>
            <p className='user-greeting'>{user.username}</p>
            <p className='logout-link' onClick={logoutUser}>Выйти</p>
          </>
        ) : (
          <Link to='/login' className='nav-link'>Вход</Link>
        )}
      </div>
    </div>
  );
};

export default Header;