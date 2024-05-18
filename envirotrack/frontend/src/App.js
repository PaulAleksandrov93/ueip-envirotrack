// // App.js

// import React from 'react';
// import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
// import './App.css';
// import AuthContext, { AuthProvider } from './context/AuthContext'
// import Header from './components/Header';
// import LoginPage from './pages/LoginPage';
// import ParametersListPage from './pages/ParametersListPage';
// import ParametersPage from './pages/ParametersPage';
// import MeasuringInstrumentsList from './components/MeasuringInstrumentsList';
// import BuildingParametersListPage from './pages/BuildingParametersListPage';
// import { useContext } from 'react';
// import BuildingParametersPage from './pages/BuildingParametersPage';
// import AdminPage from './pages/AdminPage';

// function App() {
//   return (
//     <Router>
//       <div className="container root">
//         <div className="app">
//           <AuthProvider>
//             <Header />
//             <Routes>
//               <Route
//                 path="/"
//                 element={<ProtectedRoute />}
//               />
//               <Route path="/login" element={<LoginPage />} />
//               <Route path="/parameter/:id" element={<ParametersPage />} />
//               <Route path="/building-parameter/:id" element={<BuildingParametersPage />} />
//               <Route path="/instruments" element={<MeasuringInstrumentsList />} />
//               <Route path="/buildings" element={<BuildingParametersListPage />} />
//               <Route path="/admin" element={<AdminPage />} />
//             </Routes>
//           </AuthProvider>
//         </div>
//       </div>
//     </Router>
//   );
// }

// function ProtectedRoute() {
//   let { user } = useContext(AuthContext);

//   // Получаем текущий путь
//   const location = useLocation();
//   const currentPath = location.pathname;

//   // Проверяем, является ли текущий путь страницей админки
//   const isAdminPage = currentPath === '/admin';

//   // Если пользователь залогинен или это страница админки, показываем соответствующую страницу,
//   // иначе перенаправляем на страницу входа
//   return user || isAdminPage ? <ParametersListPage /> : <Navigate to="/login" />;
// }

// export default App;

// App.js

// import React from 'react';
// import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
// import './App.css';
// import AuthContext, { AuthProvider } from './context/AuthContext'
// import Header from './components/Header';
// import LoginPage from './pages/LoginPage';
// import ParametersListPage from './pages/ParametersListPage';
// import ParametersPage from './pages/ParametersPage';
// import MeasuringInstrumentsList from './components/MeasuringInstrumentsList';
// import BuildingParametersListPage from './pages/BuildingParametersListPage';
// import { useContext } from 'react';
// import BuildingParametersPage from './pages/BuildingParametersPage';
// import AdminPage from './pages/AdminPage';

// function App() {
//   return (
//     <Router>
//       <div className="container root">
//         <div className="app">
//           <AuthProvider>
//             <Header />
//             <Routes>
//               <Route
//                 path="/"
//                 element={<ProtectedRoute />}
//               />
//               <Route path="/login" element={<LoginPage />} />
//               <Route path="/parameter/:id" element={<ParametersPage />} />
//               <Route path="/building-parameter/:id" element={<BuildingParametersPage />} />
//               <Route path="/instruments" element={<MeasuringInstrumentsList />} />
//               <Route path="/buildings" element={<BuildingParametersListPage />} />
//               <Route path="/admin" element={<AdminPage />} />
//             </Routes>
//           </AuthProvider>
//         </div>
//       </div>
//     </Router>
//   );
// }

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

// export default App;

// ===

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'
import './App.css';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ParametersPage from './pages/ParametersPage';
import MeasuringInstrumentsList from './components/MeasuringInstrumentsList';
import BuildingParametersListPage from './pages/BuildingParametersListPage';
import BuildingParametersPage from './pages/BuildingParametersPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="container root">
        <div className="app">
          <AuthProvider>
            <Header />
            <Routes>
              <Route path="/" element={<ProtectedRoute />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/parameter/:id" element={<ParametersPage />} />
              <Route path="/building-parameter/:id" element={<BuildingParametersPage />} />
              <Route path="/instruments" element={<MeasuringInstrumentsList />} />
              <Route path="/buildings" element={<BuildingParametersListPage />} />
            </Routes>
          </AuthProvider>
        </div>
      </div>
    </Router>
  );
}

export default App;