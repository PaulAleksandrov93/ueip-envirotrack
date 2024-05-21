// App.js

// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext'
// import './App.css';
// import Header from './components/Header';
// import LoginPage from './pages/LoginPage';
// import ParametersPage from './pages/ParametersPage';
// import MeasuringInstrumentsList from './components/MeasuringInstrumentsList';
// import BuildingParametersListPage from './pages/BuildingParametersListPage';
// import BuildingParametersPage from './pages/BuildingParametersPage';
// import ProtectedRoute from './components/ProtectedRoute';

// function App() {
//   return (
//     <Router>
//       <div className="container root">
//         <div className="app">
//           <AuthProvider>
//             <Header />
//             <Routes>
//               <Route path="/" element={<ProtectedRoute />} />
//               <Route path="/login" element={<LoginPage />} />
//               <Route path="/parameter/:id" element={<ParametersPage />} />
//               <Route path="/building-parameter/:id" element={<BuildingParametersPage />} />
//               <Route path="/instruments" element={<MeasuringInstrumentsList />} />
//               <Route path="/buildings" element={<BuildingParametersListPage />} />
//             </Routes>
//           </AuthProvider>
//         </div>
//       </div>
//     </Router>
//   );
// }

// export default App;

// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import './App.css';
// import Header from './components/Header';
// import LoginPage from './pages/LoginPage';
// import ParametersPage from './pages/ParametersPage';
// import MeasuringInstrumentsList from './components/MeasuringInstrumentsList';
// import BuildingParametersListPage from './pages/BuildingParametersListPage';
// import ProtectedRoute from './components/ProtectedRoute';
// import ParametersListPage from './pages/ParametersListPage';

// function App() {
//   return (
//     <Router>
//       <div className="container root">
//         <div className="app">
//           <AuthProvider>
//             <Header />
//             <Routes>
//               <Route path="/" element={<ParametersListPage />} />
//               <Route path="/login" element={<LoginPage />} />
//               <Route path="/parameter/:id" element={<ParametersPage />} />
//               <Route path="/building-parameter/:id" element={<BuildingParametersListPage />} />
//               <Route path="/instruments" element={<MeasuringInstrumentsList />} />
//               <Route path="/buildings" element={<BuildingParametersListPage />} />
//             </Routes>
//           </AuthProvider>
//         </div>
//       </div>
//     </Router>
//   );
// }

// export default App;

// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import './App.css';
// import Header from './components/Header';
// import LoginPage from './pages/LoginPage';
// import ParametersPage from './pages/ParametersPage';
// import MeasuringInstrumentsList from './components/MeasuringInstrumentsList';
// import BuildingParametersListPage from './pages/BuildingParametersListPage';
// import ProtectedRoute from './components/ProtectedRoute';
// import ParametersListPage from './pages/ParametersListPage';

// function App() {
//   return (
//     <Router>
//       <div className="container root">
//         <div className="app">
//           <AuthProvider>
//             <Header />
//             <Routes>
//               <Route path="/" element={<ParametersListPage />} />
//               <Route path="/login" element={<LoginPage />} />
//               <Route
//                 path="/parameter/:id"
//                 element={
//                   <ProtectedRoute>
//                     <ParametersPage />
//                   </ProtectedRoute>
//                 }
//               />
//               <Route
//                 path="/building-parameter/:id"
//                 element={
//                   <ProtectedRoute>
//                     <BuildingParametersListPage />
//                   </ProtectedRoute>
//                 }
//               />
//               <Route
//                 path="/instruments"
//                 element={
//                   <ProtectedRoute>
//                     <MeasuringInstrumentsList />
//                   </ProtectedRoute>
//                 }
//               />
//               <Route
//                 path="/buildings"
//                 element={
//                   <ProtectedRoute>
//                     <BuildingParametersListPage />
//                   </ProtectedRoute>
//                 }
//               />
//             </Routes>
//           </AuthProvider>
//         </div>
//       </div>
//     </Router>
//   );
// }

// export default App;


import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ParametersPage from './pages/ParametersPage';
import MeasuringInstrumentsList from './components/MeasuringInstrumentsList';
import MeasuringInstrumentsForm from './components/MeasuringInstrumentsForm';
import BuildingParametersListPage from './pages/BuildingParametersListPage';
import BuildingParametersPage from './pages/BuildingParametersPage';
import ProtectedRoute from './components/ProtectedRoute';
import ParametersListPage from './pages/ParametersListPage';

function App() {
  return (
    <Router>
      <div className="container root">
        <div className="app">
          <AuthProvider>
            <Header />
            <Routes>
              <Route path="/rooms-parameters" element={<ParametersListPage />} />
              <Route path="/buildings-parameters" element={<BuildingParametersListPage />} />
              <Route path="/measuring-instruments" element={<MeasuringInstrumentsList />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/rooms-parameters/room-parameter/:id"
                element={
                  <ProtectedRoute>
                    <ParametersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/buildings-parameters/building-parameter/:id"
                element={
                  <ProtectedRoute>
                    <BuildingParametersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/measuring-instruments/measurement-instrument/:id"
                element={
                  <ProtectedRoute>
                    <MeasuringInstrumentsForm/>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </div>
      </div>
    </Router>
  );
}

export default App;