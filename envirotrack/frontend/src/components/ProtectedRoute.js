// // ProtectedRoute.js

// import React, { useContext } from 'react';
// import AuthContext from '../context/AuthContext';

// const ProtectedRoute = ({ children }) => {
//   const { user } = useContext(AuthContext);

//   if (!user) {
//     return null; 
//   }

//   return children;
// };

// export default ProtectedRoute;

import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <></>; // Возвращает пустой фрагмент, что безопасно и не вызывает варнинги
  }

  return children;
};

export default ProtectedRoute;