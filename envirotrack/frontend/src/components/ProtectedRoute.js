// import React, { useContext } from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import AuthContext from '../context/AuthContext';
// import ParametersListPage from '../pages/ParametersListPage';
// import AdminPage from '../pages/AdminPage';

// function ProtectedRoute() {
//   let { user } = useContext(AuthContext);

//   // Получаем текущий путь
//   const location = useLocation();
//   const currentPath = location.pathname;

//   // Проверяем, является ли текущий путь страницей админки
//   const isAdminPage = currentPath === '/admin';

//   // Если это страница админки, показываем соответствующую страницу
//   if (isAdminPage) {
//     return user ? <AdminPage /> : <Navigate to="/login" />;
//   }

//   // Если пользователь залогинен, показываем соответствующую страницу
//   if (user) {
//     return <ParametersListPage />;
//   }

//   // Если пользователь не залогинен и не находится на странице админки, перенаправляем на страницу входа
//   return <Navigate to="/login" />;
// }

// export default ProtectedRoute;

// components/ProtectedRoute.js
// import React, { useContext } from 'react';
// import { Navigate } from 'react-router-dom';
// import AuthContext from '../context/AuthContext';

// const ProtectedRoute = ({ children }) => {
//   const { user } = useContext(AuthContext);

//   return user ? children : <Navigate to="/login" />;
// };

// export default ProtectedRoute;

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;