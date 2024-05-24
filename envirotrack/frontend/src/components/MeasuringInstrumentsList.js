// MeasuringInstrumentsList.js

import React, { useState, useEffect, useContext } from 'react';
import SubHeader from '../components/SubHeader';
import MeasuringInstrumentForm from './MeasuringInstrumentsForm';
import AuthContext from '../context/AuthContext';
import './MeasuringInstrumentsList.css';

const MeasuringInstrumentsList = () => {
  const { authTokens } = useContext(AuthContext);
  const [activeComponent, setActiveComponent] = useState('measuringInstruments');
  const [measuringInstruments, setMeasuringInstruments] = useState([]);
  const [searchParams, setSearchParams] = useState({
    registration_number: '',
    name: '',
    serial_number: '',
    metrological_characteristics: '',
    calibration_date: '',
  });
  const [editingMeasuringInstrumentId, setEditingMeasuringInstrumentId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMeasuringInstruments();
  }, [searchParams]);

  const fetchMeasuringInstruments = async () => {
    try {
      const url = '/api/measurement_instrument_types/';
      const params = new URLSearchParams(searchParams).toString();
      const response = await fetch(`${url}?${params}`, {
        headers: authTokens ? {
          Authorization: 'Bearer ' + authTokens.access,
        } : {},
      });
      if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
      }
      const data = await response.json();
      setMeasuringInstruments(data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
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

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({
      ...searchParams,
      [name]: value,
    });
  };

  const handleApplySearch = () => {
    fetchMeasuringInstruments();
  };

  const handleClearSearch = () => {
    setSearchParams({
      registration_number: '',
      name: '',
      serial_number: '',
      metrological_characteristics: '',
      calibration_date: '',
    });
    fetchMeasuringInstruments();
  };

  const handleCreateMeasuringInstrument = () => {
    if (authTokens) {
      setIsCreating(true);
    }
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
      <h2 className="standard-list-title">Список СИ для контроля параметров</h2>
      <div className="standard-header">
        <span>Регистрационный номер СИ</span>
        <span>Название</span>
        <span>Тип</span>
        <span>Заводской номер</span>
        <span>Метрологические характеристики</span>
        <span>Дата поверки</span>
        <span>Межповерочный интервал</span>
        <span>Дата следующей поверки</span>
        <span>Год выпуска СИ</span>
        <span>Годен/Брак</span>
      </div>
      <div className="search-container">
        {/* Поля для фильтрации данных */}
      </div>
      <div>
        {measuringInstruments.map((instrument) => (
          <div key={instrument.id} className={`standard-item ${new Date(instrument.calibration_date) < new Date() ? 'expired' : ''}`} onDoubleClick={() => handleDoubleClick(instrument.id)}>
            <span>{instrument.registration_number}</span>
            <span>{instrument.name}</span>
            <span>{instrument.type}</span>
            <span>{instrument.serial_number}</span>
            <span>{instrument.metrological_characteristics}</span>
            <span>{formatDate(instrument.calibration_date)}</span>
            <span>{instrument.calibration_interval}</span>
            <span>{formatDate(instrument.next_calibration_date)}</span>
            <span>{instrument.year_of_manufacture}</span>
            <span className={instrument.suitability ? 'suitable' : 'unsuitable'}>{instrument.suitability ? 'Годен' : 'Брак'}</span>
          </div>
        ))}
      </div>
      <div className="footer">
        {authTokens && (
          <button onClick={handleCreateMeasuringInstrument} className="create-standard-link">
            Добавить СИ
          </button>
        )}
      </div>
      
      {isCreating && authTokens && <MeasuringInstrumentForm onCloseForm={handleCloseForm} />}
      {editingMeasuringInstrumentId && authTokens && <MeasuringInstrumentForm instrumentId={editingMeasuringInstrumentId} onCloseForm={handleCloseForm} />}
    </div>
  );
};

export default MeasuringInstrumentsList;