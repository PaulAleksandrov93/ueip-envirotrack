// FilterParametersBuilding.js

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import './FilterParameters.css';

const FilterParametersBuilding = ({ onFilterChange, onResetFilters }) => {
  const [selectedResponsible, setSelectedResponsible] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [responsibles, setResponsibles] = useState([]);
  const [buildings, setBuildings] = useState([]);
  
  const { authTokens } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responsiblesResponse = await fetch('/api/responsibles/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(authTokens && { Authorization: 'Bearer ' + String(authTokens.access) }),
          },
        });

        if (responsiblesResponse.ok) {
          const responsiblesData = await responsiblesResponse.json();
          setResponsibles(responsiblesData);
        }

        const buildingsResponse = await fetch('/api/buildings/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(authTokens && { Authorization: 'Bearer ' + String(authTokens.access) }),
          },
        });

        if (buildingsResponse.ok) {
          const buildingsData = await buildingsResponse.json();
          setBuildings(buildingsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [authTokens]);

  const handleFilterChange = () => {
    const filters = {
      responsible: selectedResponsible,
      building: selectedBuilding,
      date: selectedDate,
      startDate: startDate,
      endDate: endDate,
    };

    console.log('Filters:', filters); 

    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setSelectedResponsible('');
    setSelectedBuilding('');
    setSelectedDate('');
    setStartDate('');
    setEndDate('');
    onResetFilters();
  };

  return (
    <div className="filter-parameters">
      <div className="filter-select">
        <label htmlFor="responsible-select">Фильтр по ответственному:</label>
        <select
          id="responsible-select"
          value={selectedResponsible}
          onChange={(e) => setSelectedResponsible(e.target.value)}
        >
          <option value="">Выберите ответственного</option>
          {responsibles.map((responsible) => (
            <option key={responsible.id} value={responsible.id}>
              {responsible.last_name} {responsible.first_name} 
            </option>
          ))}
        </select>
      </div>

      <div className="filter-select">
        <label htmlFor="building-select">Фильтр по зданию:</label>
        <select
          id="building-select"
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
        >
          <option value="">Выберите здание</option>
          {buildings.map((building) => (
            <option key={building.building_number} value={building.building_number}>
              {building.building_number} 
            </option>
          ))}
        </select>
      </div>

      <div className="filter-input">
        <label htmlFor="date-input">Фильтр по дате:</label>
        <input
          id="date-input"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="filter-input">
        <label htmlFor="start-date-input">Начальная дата:</label>
        <input
          id="start-date-input"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="filter-input">
        <label htmlFor="end-date-input">Конечная дата:</label>
        <input
          id="end-date-input"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <button className="apply-button" onClick={handleFilterChange}>
        Применить фильтры
      </button>

      <button className="reset-button" onClick={handleResetFilters}>
        Сбросить фильтры
      </button>
    </div>
  );
};

export default FilterParametersBuilding;