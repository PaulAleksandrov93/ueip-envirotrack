// BoundaryParametersPage.js
import React, { useState, useEffect, useContext } from 'react';
import SubHeader from '../components/SubHeader';
import AuthContext from '../context/AuthContext';
import './BoundaryParametersPage.css';

const BoundaryParametersPage = () => {
  const { authTokens } = useContext(AuthContext);
  const [setActiveComponent] = useState('boundaryParameters');
  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState('rooms'); 
  const [searchParams, setSearchParams] = useState({
    building_number: '',
    room_number: '',
  });
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterType, searchParams]);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings/', {
        headers: authTokens ? { Authorization: 'Bearer ' + authTokens.access } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки зданий:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms/', {
        headers: authTokens ? { Authorization: 'Bearer ' + authTokens.access } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки помещений:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '';
      const params = new URLSearchParams();
      
      if (filterType === 'rooms') {
        url = '/api/rooms/';
        if (searchParams.building_number) {
          params.append('building', searchParams.building_number);
        }
        if (searchParams.room_number) {
          params.append('room_number', searchParams.room_number);
        }
      } else {
        url = '/api/buildings/';
        if (searchParams.building_number) {
          params.append('building_number', searchParams.building_number);
        }
      }
      
      const response = await fetch(`${url}?${params.toString()}`, {
        headers: authTokens ? { Authorization: 'Bearer ' + authTokens.access } : {},
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setSearchParams({
      building_number: '',
      room_number: '',
    });
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearSearch = () => {
    setSearchParams({
      building_number: '',
      room_number: '',
    });
  };

  const renderRoomParameters = (room) => {
    // Для складов показываем только температуру и влажность
    if (room.is_storage) {
      const storageParams = [
        { label: 'Температура, °C', value: `${room.temperature_min} - ${room.temperature_max}` },
        { label: 'Влажность, %', value: `${room.humidity_min}% - ${room.humidity_max}%` }
      ];

      return (
        <div className="boundary-par-grid">
          {storageParams.map((param, index) => (
            <div key={index} className="boundary-par-item">
              <span className="boundary-par-label">{param.label}:</span>
              <span className="boundary-par-value">{param.value}</span>
            </div>
          ))}
        </div>
      );
    }

    // Для обычных помещений показываем все параметры
    const basicParams = [
      { label: 'Температура, °C', value: `${room.temperature_min} - ${room.temperature_max}` },
      { label: 'Влажность, %', value: `${room.humidity_min} - ${room.humidity_max}` },
      { label: 'Давление, кПа', value: `${room.pressure_min_kpa} - ${room.pressure_max_kpa}` },
      { label: 'Давление, мм рт.ст.', value: `${room.pressure_min_mmhg} - ${room.pressure_max_mmhg}` }
    ];

    const additionalParams = room.has_additional_parameters && room.additional_parameters ? [
      { label: 'Напряжение, В', value: `${room.additional_parameters.voltage_min} - ${room.additional_parameters.voltage_max}` },
      { label: 'Частота, Гц', value: `${room.additional_parameters.frequency_min} - ${room.additional_parameters.frequency_max}` },
      { label: 'Радиация, мкЗв • ч⁻¹', value: `${room.additional_parameters.radiation_min} - ${room.additional_parameters.radiation_max}` }
    ] : [];

    const allParams = [...basicParams, ...additionalParams];

    return (
      <div className="boundary-par-grid">
        {allParams.map((param, index) => (
          <div key={index} className="boundary-par-item">
            <span className="boundary-par-label">{param.label}:</span>
            <span className="boundary-par-value">{param.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderBuildingParameters = (building) => {
    const params = [
      { label: 'Напряжение сети, В', value: `${building.voltage_min} - ${building.voltage_max}` },
      { label: 'Частота тока,', value: `${building.frequency_min} - ${building.frequency_max}` }
    ];

    return (
      <div className="boundary-par-grid">
        {params.map((param, index) => (
          <div key={index} className="boundary-par-item">
            <span className="boundary-par-label">{param.label}:</span>
            <span className="boundary-par-value">{param.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const getBuildingNumber = (item) => {
    if (filterType === 'rooms') {
      // Проверяем разные варианты расположения номера здания
      if (item.building_number) {
        return item.building_number; // Новое поле из сериализатора
      } else if (item.building && typeof item.building === 'object') {
        return item.building.building_number || 'N/A';
      } else if (item.building && typeof item.building === 'string') {
        return item.building;
      }
      return 'N/A';
    }
    return item.building_number;
  };

  const getRoomNumber = (item) => {
    return item.room_number || item.number || 'N/A';
  };

  return (
    <div className="boundary-parameters-container">
      <SubHeader setActiveComponent={setActiveComponent} />
      
      <div className="boundary-filter-tabs">
        <button 
          className={filterType === 'rooms' ? 'boundary-active-tab' : 'boundary-tab'}
          onClick={() => handleFilterChange('rooms')}
        >
          По помещениям
        </button>
        <button 
          className={filterType === 'buildings' ? 'boundary-active-tab' : 'boundary-tab'}
          onClick={() => handleFilterChange('buildings')}
        >
          По зданиям
        </button>
      </div>

      <div className="boundary-search-container">
        {filterType === 'rooms' ? (
          <>
            <select
              name="building_number"
              value={searchParams.building_number}
              onChange={handleSearchChange}
              className="boundary-search-input"
            >
              <option value="">Все здания</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}> {/* Здесь value должно быть building.id */}
                  Здание № {building.building_number}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="room_number"
              value={searchParams.room_number}
              onChange={handleSearchChange}
              placeholder="Номер помещения"
              className="boundary-search-input"
            />
          </>
        ) : (
          <select
            name="building_number"
            value={searchParams.building_number}
            onChange={handleSearchChange}
            className="boundary-search-input"
          >
            <option value="">Все здания</option>
            {buildings.map(building => (
              <option key={building.id} value={building.building_number}> {/* Здесь value должно быть building.building_number */}
                Здание № {building.building_number}
              </option>
            ))}
          </select>
        )}
        
        <button onClick={handleClearSearch} className="boundary-clear-button">
          Очистить
        </button>
      </div>

      <div className="boundary-data-header">
        <span className="boundary-header-item">{filterType === 'rooms' ? 'Помещение' : 'Здание'}</span>
        <span className="boundary-header-params">Граничные параметры</span>
      </div>

      <div className="boundary-data-content">
        {loading ? (
          <div className="boundary-loading">Загрузка...</div>
        ) : data.length > 0 ? (
          data.map(item => (
            <div key={item.id} className="boundary-data-item">
              <div className="boundary-item-header">
                {filterType === 'rooms' 
                  ? `Помещение № ${getRoomNumber(item)}`
                  : `Здание № ${item.building_number}`
                }
                {filterType === 'rooms' && item.is_storage && (
                  <span style={{marginLeft: '10px', color: '#888', fontSize: '12px'}}>
                    (Склад)
                  </span>
                )}
              </div>
              <div className="boundary-item-content">
                {filterType === 'rooms' 
                  ? renderRoomParameters(item)
                  : renderBuildingParameters(item)
                }
              </div>
            </div>
          ))
        ) : (
          <p className="boundary-no-data">Данные не найдены. Попробуйте изменить параметры фильтрации.</p>
        )}
      </div>
    </div>
  );
};

export default BoundaryParametersPage;