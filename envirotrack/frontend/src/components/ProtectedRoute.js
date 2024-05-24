// ProtectedRoute.js

import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return null; 
  }

  return children;
};

export default ProtectedRoute;