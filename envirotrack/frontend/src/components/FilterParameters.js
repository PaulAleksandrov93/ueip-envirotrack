// FilterParameters.js

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import './FilterParameters.css';

const FilterParameters = ({ onFilterChange, onResetFilters }) => {
  const [selectedResponsible, setSelectedResponsible] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [responsibles, setResponsibles] = useState([]);
  const [rooms, setRooms] = useState([]);

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

        const roomsResponse = await fetch('/api/rooms/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(authTokens && { Authorization: 'Bearer ' + String(authTokens.access) }),
          },
        });

        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData);
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
      room: selectedRoom,
      date: selectedDate,
      startDate: startDate,
      endDate: endDate,
    };

    console.log('Filters:', filters);

    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setSelectedResponsible('');
    setSelectedRoom('');
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
        <label htmlFor="room-select">Фильтр по помещению:</label>
        <select
          id="room-select"
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
        >
          <option value="">Выберите помещение</option>
          {rooms.map((room) => (
            <option key={room.room_number} value={room.room_number}>
              {room.room_number}
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

export default FilterParameters;