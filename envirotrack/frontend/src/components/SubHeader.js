// SubHeader.js

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SubHeader.css';

const SubHeader = ({ setActiveComponent }) => {
  const location = useLocation();

  return (
    <div className='sub-header'>
      <Link to="/rooms-parameters" className={location.pathname === "/rooms-parameters" ? 'active' : ''} onClick={() => setActiveComponent('parameters')}>Параметры по помещениям</Link>
      <Link to="/buildings-parameters" className={location.pathname === "/buildings-parameters" ? 'active' : ''} onClick={() => setActiveComponent('buildingParameters')}>Параметры по зданиям</Link>
      <Link to="/measuring-instruments" className={location.pathname === "/measuring-instruments" ? 'active' : ''} onClick={() => setActiveComponent('measuringInstruments')}>Средства измерений</Link>
    </div>
  );
};

export default SubHeader;

