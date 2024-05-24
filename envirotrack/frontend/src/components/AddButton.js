// AddButton.js

import React from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as AddIcon } from '../assets/add.svg';
import './AddButton.css'; 

const AddButton = () => {
  return (
    <Link to="/room-parameter/new" className='floating-button'>
      <AddIcon className='add-icon' />
    </Link>
  );
};

export default AddButton;