import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiActivity, FiHome, FiThermometer } from 'react-icons/fi';
import './SubHeader.css';

const TABS = [
  { to: '/rooms-parameters', label: 'Параметры по помещениям', icon: FiThermometer },
  { to: '/buildings-parameters', label: 'Параметры по зданиям', icon: FiHome },
  { to: '/measuring-instruments', label: 'Средства измерений', icon: FiActivity },
];

const SubHeader = () => (
  <nav className='sub-header'>
    <div className='sub-header__inner'>
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `sub-header__tab ${isActive ? 'is-active' : ''}`}>
          <Icon /> {label}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default SubHeader;
