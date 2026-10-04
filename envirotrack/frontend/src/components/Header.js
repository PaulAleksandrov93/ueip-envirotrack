import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiChevronDown, FiLogIn, FiLogOut, FiUsers } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { ReactComponent as WhiteLogo } from '../assets/rosatom_white_logo.svg';
import ErrorMessageModal from './ErrorMessageModal';
import './Header.css';

const fetchLatestDocument = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.file ? data : null;
  } catch {
    return null;
  }
};

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userGuide, setUserGuide] = useState(null);
  const [responsiblesList, setResponsiblesList] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchLatestDocument('/api/documents/').then(setUserGuide);
    fetchLatestDocument('/api/responsible_list/').then(setResponsiblesList);
  }, []);

  const downloadFile = (documentData, fallbackName) => {
    setMenuOpen(false);
    if (!documentData) {
      setErrorMessage('Документ ещё не загружен. Обратитесь к администратору.');
      return;
    }
    const link = document.createElement('a');
    link.href = documentData.file;
    link.download = documentData.name || fallbackName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '';

  return (
    <header className='app-header'>
      <Link to='/rooms-parameters' className='app-header__brand'>
        <WhiteLogo className='app-logo' />
        <span className='app-header__divider' />
        <span className='app-title'>Журнал регистрации параметров окружающей среды</span>
      </Link>

      <div className='app-header__right'>
        {user ? (
          <div className='user-menu' ref={menuRef}>
            <button
              type='button'
              className={`user-menu__trigger ${menuOpen ? 'is-open' : ''}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
            >
              <span className='user-menu__avatar'>{initials}</span>
              <span className='user-menu__name'>{user.username}</span>
              <FiChevronDown />
            </button>
            {menuOpen && (
              <ul className='user-menu__dropdown'>
                <li>
                  <button type='button' onClick={() => downloadFile(userGuide, 'Руководство пользователя.pdf')}>
                    <FiBookOpen /> Руководство пользователя
                  </button>
                </li>
                <li>
                  <button type='button' onClick={() => downloadFile(responsiblesList, 'Список ответственных.pdf')}>
                    <FiUsers /> Список ответственных
                  </button>
                </li>
                <li className='user-menu__separator' />
                <li>
                  <button type='button' className='is-danger' onClick={logoutUser}>
                    <FiLogOut /> Выйти
                  </button>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <Link to='/login' className='btn btn--sm app-header__login'>
            <FiLogIn /> Войти
          </Link>
        )}
      </div>

      {errorMessage && <ErrorMessageModal message={errorMessage} onClose={() => setErrorMessage('')} />}
    </header>
  );
};

export default Header;
