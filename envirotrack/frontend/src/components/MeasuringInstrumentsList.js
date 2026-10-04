// MeasuringInstrumentsList.js

import React, { useState, useEffect, useContext } from 'react';
import SubHeader from '../components/SubHeader';
import MeasuringInstrumentForm from './MeasuringInstrumentsForm';
import AuthContext from '../context/AuthContext';
import './MeasuringInstrumentsList.css';

const MeasuringInstrumentsList = () => {
  const { authTokens } = useContext(AuthContext);
  const [setActiveComponent] = useState('measuringInstruments');
  const [measuringInstruments, setMeasuringInstruments] = useState([]);
  const [searchParams, setSearchParams] = useState({
    registration_number: '',
    name: '',
    type: '',
    serial_number: '',
    metrological_characteristics: '',
    calibration_date: '',
    calibration_interval: '',
    next_calibration_date: '',
    year_of_manufacture: '',
    suitability: '',
  });
  const [editingMeasuringInstrumentId, setEditingMeasuringInstrumentId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMeasuringInstruments();
  }, [searchParams]);

  // const fetchMeasuringInstruments = async () => {
  //   try {
  //     const url = '/api/filterMeasurementInstruments/';
  //     const params = new URLSearchParams();
  
  //     Object.entries(searchParams).forEach(([key, value]) => {
  //       if (value) {
  //         params.append(key, value);
  //       }
  //     });
  
  //     const response = await fetch(`${url}?${params.toString()}`, {
  //       headers: authTokens
  //         ? {
  //             Authorization: 'Bearer ' + authTokens.access,
  //           }
  //         : {},
  //     });
  
  //     if (!response.ok) {
  //       throw new Error('Ошибка загрузки данных');
  //     }
  
  //     const data = await response.json();
  //     setMeasuringInstruments(data);
  //   } catch (error) {
  //     console.error('Ошибка загрузки данных:', error);
  //   }
  // };

  // const fetchMeasuringInstruments = async () => {
  //   try {
  //     const url = '/api/filterMeasurementInstruments/';
  //     const params = new URLSearchParams();
      
  //     // Только базовые параметры для теста
  //     if (searchParams.registration_number) {
  //       params.append('registration_number', searchParams.registration_number);
  //     }
  //     if (searchParams.name) {
  //       params.append('name', searchParams.name);
  //     }
  //     if (searchParams.type) {
  //       params.append('type', searchParams.type);
  //     }
      
  //     // ВРЕМЕННО НЕ ИСПОЛЬЗУЕМ suitability
  //     // if (searchParams.suitability) {
  //     //   params.append('suitability', searchParams.suitability);
  //     // }
      
  //     console.log('Fetching:', `${url}?${params.toString()}`); // Для отладки
      
  //     const response = await fetch(`${url}?${params.toString()}`, {
  //       headers: authTokens
  //         ? {
  //             Authorization: 'Bearer ' + authTokens.access,
  //           }
  //         : {},
  //     });
      
  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error('Server error:', errorText);
  //       throw new Error(`Ошибка сервера: ${response.status}`);
  //     }
      
  //     const data = await response.json();
  //     console.log('Received data:', data); // Для отладки
      
  //     // Просто устанавливаем данные как есть
  //     setMeasuringInstruments(data);
      
  //   } catch (error) {
  //     console.error('Ошибка загрузки данных:', error);
  //     setMeasuringInstruments([]);
  //   }
  // };
  const fetchMeasuringInstruments = async () => {
      try {
        const url = '/api/filterMeasurementInstruments/';
        const params = new URLSearchParams();
        
        
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== '') { 
            params.append(key, value);
          }
        });
        
        console.log('Fetching:', `${url}?${params.toString()}`);
        
        const response = await fetch(`${url}?${params.toString()}`, {
          headers: authTokens ? { Authorization: 'Bearer ' + authTokens.access } : {},
        });
        
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        
        const data = await response.json();
        console.log('Received data:', data);
        
        setMeasuringInstruments(data);
        
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setMeasuringInstruments([]);
      }
  };

  const updateInstrumentInList = (updatedInstrument) => {
    setMeasuringInstruments((prev) =>
      prev.map((instrument) =>
        instrument.id === updatedInstrument.id ? updatedInstrument : instrument
      )
    );
  };

  const handleDoubleClick = (instrumentId) => {
    if (authTokens) {
      setEditingMeasuringInstrumentId(instrumentId);
    }
  };

  const handleCloseForm = () => {
    setEditingMeasuringInstrumentId(null);
    setIsCreating(false);
    fetchMeasuringInstruments();
  };

  const handleCreateMeasuringInstrument = () => {
    if (authTokens) {
      setIsCreating(true);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearSearch = () => {
    setSearchParams({
      registration_number: '',
      name: '',
      type: '',
      serial_number: '',
      metrological_characteristics: '',
      calibration_date: '',
      calibration_interval: '',
      next_calibration_date: '',
      year_of_manufacture: '',
      suitability: '',
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="standard-list-container">
      <SubHeader setActiveComponent={setActiveComponent} />
      {/* <h2 className="standard-list-title">Список СИ для контроля параметров</h2> */}
      <div className="standard-header">
        <span>Регистрационный номер СИ</span>
        <span>Наименование СИ</span>
        <span>Тип</span>
        <span>Заводской номер</span>
        <span>Метрологические характеристики</span>
        <span>Дата поверки</span>
        <span>Межповерочный интервал</span>
        <span>Годен до</span>
        <span>Год выпуска СИ</span>
        <span>Пригодность</span>
      </div>
      <div className="search-container">
        <input
          type="text"
          name="registration_number"
          value={searchParams.registration_number}
          onChange={handleSearchChange}
          placeholder="Регистрационный номер"
          className="search-input"
        />
        <input
          type="text"
          name="name"
          value={searchParams.name}
          onChange={handleSearchChange}
          placeholder="Наименование СИ"
          className="search-input"
        />
        <input
          type="text"
          name="type"
          value={searchParams.type}
          onChange={handleSearchChange}
          placeholder="Тип"
          className="search-input"
        />
        <input
          type="text"
          name="serial_number"
          value={searchParams.serial_number}
          onChange={handleSearchChange}
          placeholder="Заводской номер"
          className="search-input"
        />
        <input
          type="text"
          name="metrological_characteristics"
          value={searchParams.metrological_characteristics}
          onChange={handleSearchChange}
          placeholder="Метрологические характеристики"
          className="search-input"
        />
        <input
          type="date"
          name="calibration_date"
          value={searchParams.calibration_date}
          onChange={handleSearchChange}
          className="search-input"
        />
        <input
          type="text"
          name="calibration_interval"
          value={searchParams.calibration_interval}
          onChange={handleSearchChange}
          placeholder="Межповерочный интервал"
          className="search-input"
        />
        <input
          type="date"
          name="next_calibration_date"
          value={searchParams.next_calibration_date}
          onChange={handleSearchChange}
          placeholder="Годен до"
          className="search-input"
        />
        <input
          type="text"
          name="year_of_manufacture"
          value={searchParams.year_of_manufacture}
          onChange={handleSearchChange}
          placeholder="Год выпуска СИ"
          className="search-input"
        />
        {/* <input
          type="text"
          name="suitability"
          value={searchParams.suitability}
          onChange={handleSearchChange}
          placeholder="Пригодность"
          className="search-input"
        /> */}
        <select
          name="suitability"
          value={searchParams.suitability}
          onChange={handleSearchChange}
          className="search-input"
        >
          <option value="">Все</option>
          <option value="true">Годен</option>
          <option value="false">Брак</option>
        </select>
        {/* <button onClick={fetchMeasuringInstruments} className="search-button">Поиск</button> */}
        <button onClick={handleClearSearch} className="clear-button">Очистить</button>
      </div>
      <div className="standard-content">
        {measuringInstruments.length > 0 ? (
          measuringInstruments.map((instrument) => (
            <div
              key={instrument.id}
              className={`standard-item ${
                new Date(instrument.calibration_date) < new Date() ? 'expired' : ''
              }`}
              onDoubleClick={() => handleDoubleClick(instrument.id)}
            >
              <span>{instrument.registration_number}</span>
              <span>{instrument.name}</span>
              <span>{instrument.type}</span>
              <span>{instrument.serial_number}</span>
              {/* <span>{instrument.metrological_characteristics}</span> */}
              <span style={{ whiteSpace: 'pre-line' }}>{instrument.metrological_characteristics}</span>
              <span>{formatDate(instrument.calibration_date)}</span>
              <span>{instrument.calibration_interval}</span>
              <span>{formatDate(instrument.next_calibration_date)}</span>
              <span>{instrument.year_of_manufacture}</span>
              <span className={instrument.current_suitability ? 'suitable' : 'unsuitable'}>
                {instrument.current_suitability ? 'Годен' : 'Брак'}
              </span>
              {/*<span className={instrument.suitability ? 'suitable' : 'unsuitable'}>
                {instrument.suitability ? 'Годен' : 'Брак'}
              </span>*/}
            </div>
          ))
        ) : (
          <p>Список пуст. Попробуйте изменить параметры фильтрации.</p>
        )}
      </div>
      <div className="footer">
        {authTokens && (
          <button onClick={handleCreateMeasuringInstrument} className="create-standard-link">
            Добавить СИ
          </button>
        )}
      </div>
      {isCreating && authTokens && (
        <MeasuringInstrumentForm
          onCloseForm={handleCloseForm}
          onUpdateInstrument={updateInstrumentInList}
        />
      )}
      {editingMeasuringInstrumentId && authTokens && (
        <MeasuringInstrumentForm
          instrumentId={editingMeasuringInstrumentId}
          onCloseForm={handleCloseForm}
          onUpdateInstrument={updateInstrumentInList}
        />
      )}
    </div>
  );
};

export default MeasuringInstrumentsList;
