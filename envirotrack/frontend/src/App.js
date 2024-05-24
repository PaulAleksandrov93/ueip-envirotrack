// App.js

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
                path="room-parameter/:id"
                element={
                  <ProtectedRoute>
                    <ParametersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/building-parameter/:id"
                element={
                  <ProtectedRoute>
                    <BuildingParametersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/measurement-instrument/:id"
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