// MeasuringInstrumentsList.js

import React, { useState, useEffect, useContext } from 'react';
import { FiPlus } from 'react-icons/fi';
import SubHeader from '../components/SubHeader';
import MeasuringInstrumentForm from './MeasuringInstrumentsForm';
import AuthContext from '../context/AuthContext';
import './MeasuringInstrumentsList.css';

const MeasuringInstrumentsList = () => {
  const { authTokens } = useContext(AuthContext);
  const [measuringInstruments, setMeasuringInstruments] = useState([]);
  const [searchParams] = useState({
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
    <>
      <SubHeader />
      <main className="page">
      <div className="page-toolbar">
        <h1 className="page-toolbar__title">
          Средства измерений <span className="page-toolbar__count">· {measuringInstruments.length}</span>
        </h1>
        <div className="page-toolbar__actions">
          {authTokens && (
            <button type="button" onClick={handleCreateMeasuringInstrument} className="btn btn--primary">
              <FiPlus /> Добавить СИ
            </button>
          )}
        </div>
      </div>
      <div className="si-table card">
        <div className="si-table__head">
          <span>Рег. номер</span>
          <span>Название</span>
          <span>Тип</span>
          <span>Заводской №</span>
          <span>Метрологические характеристики</span>
          <span>Поверка</span>
          <span>МПИ, мес.</span>
          <span>Следующая поверка</span>
          <span>Год выпуска</span>
          <span>Статус</span>
        </div>
        {measuringInstruments.map((instrument) => (
          <div
            key={instrument.id}
            className={`si-table__row ${authTokens ? 'is-clickable' : ''}`}
            onDoubleClick={() => handleDoubleClick(instrument.id)}
            title={authTokens ? 'Дважды щёлкните, чтобы редактировать' : undefined}
          >
            <span>{instrument.registration_number || '—'}</span>
            <span className="si-table__strong">{instrument.name}</span>
            <span>{instrument.type}</span>
            <span>{instrument.serial_number}</span>
            <span className="si-table__muted">{instrument.metrological_characteristics || '—'}</span>
            <span>{formatDate(instrument.calibration_date)}</span>
            <span>{instrument.calibration_interval}</span>
            <span>{formatDate(instrument.next_calibration_date)}</span>
            <span>{instrument.year_of_manufacture}</span>
            <span>
              <span className={`badge ${instrument.current_suitability ?? instrument.suitability ? 'badge--success' : 'badge--danger'}`}>
                {instrument.current_suitability ?? instrument.suitability ? 'Годен' : 'Брак'}
              </span>
            </span>
          </div>
        ))}
      </div>

      {isCreating && authTokens && <MeasuringInstrumentForm onCloseForm={handleCloseForm} />}
      {editingMeasuringInstrumentId && authTokens && <MeasuringInstrumentForm instrumentId={editingMeasuringInstrumentId} onCloseForm={handleCloseForm} />}
      </main>
    </>
  );
};

export default MeasuringInstrumentsList;