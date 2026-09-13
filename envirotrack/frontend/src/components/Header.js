// Header.js

import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ReactComponent as WhiteLogo } from '../assets/rosatom_white_logo.svg';
import { ReactComponent as GearIcon } from '../assets/gear.svg';
import ErrorMessageModal from './ErrorMessageModal';
import './Header.css';

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userGuide, setUserGuide] = useState(null);
  const [responsiblesList, setResponsiblesList] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchLatestDocument = async (url, setter) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (data && data.file) {
          setter(data);
        }
      } catch (error) {
        // Документ опционален: меню покажет сообщение при клике
      }
    };

    fetchLatestDocument('/api/documents/', setUserGuide);
    fetchLatestDocument('/api/responsible_list/', setResponsiblesList);
  }, []);

  const downloadFile = (documentData, fallbackName) => {
    if (!documentData || !documentData.file) {
      setErrorMessage('Документ ещё не загружен. Обратитесь к администратору.');
      setMenuOpen(false);
      return;
    }

    const link = document.createElement('a');
    link.href = documentData.file;
    link.download = documentData.name || fallbackName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMenuOpen(false);
  };

  const handleHome = () => {
    navigate('/rooms-parameters');
    setMenuOpen(false);
  };

  const handleAboutProgram = () => {
    navigate('/about');
    setMenuOpen(false);
  };

  return (
    <div className='app-header'>
      <WhiteLogo className='app-logo' />
      <h1 className='app-title'>Журнал регистрации параметров окружающей среды</h1>
      <div className='user-info'>
        {user ? (
          <>
            <p className='user-greeting'>{user.username}</p>
            <div className='settings-menu' ref={menuRef}>
              <GearIcon
                className={`gear-icon ${menuOpen ? 'rotating' : ''}`}
                onClick={() => setMenuOpen((prev) => !prev)}
              />
              {menuOpen && (
                <ul className='dropdown-menu'>
                  <li onClick={handleHome}>Главная страница</li>
                  <li onClick={() => downloadFile(userGuide, 'Руководство пользователя.pdf')}>
                    Руководство пользователя
                  </li>
                  <li onClick={() => downloadFile(responsiblesList, 'Список ответственных.pdf')}>
                    Список ответственных
                  </li>
                  <li onClick={handleAboutProgram}>О программе</li>
                  <li onClick={logoutUser}>Выход</li>
                </ul>
              )}
            </div>
          </>
        ) : (
          <Link to='/login' className='nav-link'>
            Вход
          </Link>
        )}
      </div>
      {errorMessage && (
        <ErrorMessageModal message={errorMessage} onClose={() => setErrorMessage('')} />
      )}
    </div>
  );
};

export default Header;
