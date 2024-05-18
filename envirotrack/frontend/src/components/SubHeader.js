// SubHeader.js

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SubHeader.css';

const SubHeader = ({ setActiveComponent }) => {
  const location = useLocation();

  return (
    <div className='sub-header'>
      <Link to="/" className={location.pathname === "/" ? 'active' : ''}>Параметры по помещениям</Link>
      <Link to="/buildings" className={location.pathname === "/buildings" ? 'active' : ''} onClick={() => setActiveComponent('buildingParameters')}>Параметры по зданиям</Link>
      <Link to="/instruments" className={location.pathname === "/instruments" ? 'active' : ''} onClick={() => setActiveComponent('measuringInstruments')}>Средства измерений</Link>
    </div>
  );
};

export default SubHeader;

