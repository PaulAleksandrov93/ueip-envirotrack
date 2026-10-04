// MeasuringInstrumentsList.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { FiPlus, FiRotateCcw } from 'react-icons/fi';
import SubHeader from '../components/SubHeader';
import MeasuringInstrumentForm from './MeasuringInstrumentsForm';
import AuthContext from '../context/AuthContext';
import './MeasuringInstrumentsList.css';

const EMPTY_SEARCH = {
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
};

const COLUMNS = [
  { key: 'registration_number', label: 'Рег. номер', placeholder: 'Рег. номер' },
  { key: 'name', label: 'Наименование', placeholder: 'Наименование' },
  { key: 'type', label: 'Тип', placeholder: 'Тип' },
  { key: 'serial_number', label: 'Заводской №', placeholder: 'Заводской №' },
  { key: 'metrological_characteristics', label: 'Метрологические характеристики', placeholder: 'Характеристики' },
  { key: 'calibration_date', label: 'Поверка', type: 'date' },
  { key: 'calibration_interval', label: 'МПИ, мес.', placeholder: 'МПИ' },
  { key: 'next_calibration_date', label: 'Годен до', type: 'date' },
  { key: 'year_of_manufacture', label: 'Год выпуска', placeholder: 'Год' },
];

const formatDate = (date) => {
  if (!date) return '—';
  const [year, month, day] = String(date).slice(0, 10).split('-');
  return `${day}.${month}.${year}`;
};

const MeasuringInstrumentsList = () => {
  const { authTokens } = useContext(AuthContext);
  const [measuringInstruments, setMeasuringInstruments] = useState([]);
  const [searchParams, setSearchParams] = useState(EMPTY_SEARCH);
  const [editingMeasuringInstrumentId, setEditingMeasuringInstrumentId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchMeasuringInstruments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== '') params.append(key, value);
      });

      const response = await fetch(`/api/filterMeasurementInstruments/?${params.toString()}`, {
        headers: authTokens ? { Authorization: 'Bearer ' + authTokens.access } : {},
      });
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      setMeasuringInstruments(await response.json());
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setMeasuringInstruments([]);
    }
    // Token refreshes must not refetch the table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    fetchMeasuringInstruments();
  }, [fetchMeasuringInstruments]);

  const updateInstrumentInList = (updatedInstrument) => {
    setMeasuringInstruments((prev) =>
      prev.map((instrument) => (instrument.id === updatedInstrument.id ? updatedInstrument : instrument)),
    );
  };

  const handleDoubleClick = (instrumentId) => {
    if (authTokens) setEditingMeasuringInstrumentId(instrumentId);
  };

  const handleCloseForm = () => {
    setEditingMeasuringInstrumentId(null);
    setIsCreating(false);
    fetchMeasuringInstruments();
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const hasSearch = Object.values(searchParams).some((value) => value !== '');

  return (
    <>
      <SubHeader />
      <main className="page">
        <div className="page-toolbar">
          <h1 className="page-toolbar__title">
            Средства измерений <span className="page-toolbar__count">· {measuringInstruments.length}</span>
          </h1>
          <div className="page-toolbar__actions">
            {hasSearch && (
              <button type="button" className="btn btn--ghost" onClick={() => setSearchParams(EMPTY_SEARCH)}>
                <FiRotateCcw /> Очистить фильтры
              </button>
            )}
            {authTokens && (
              <button type="button" onClick={() => setIsCreating(true)} className="btn btn--primary">
                <FiPlus /> Добавить СИ
              </button>
            )}
          </div>
        </div>

        <div className="si-table card">
          <div className="si-table__head">
            {COLUMNS.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
            <span>Пригодность</span>
          </div>
          <div className="si-table__filters">
            {COLUMNS.map((column) => (
              <input
                key={column.key}
                type={column.type || 'text'}
                name={column.key}
                value={searchParams[column.key]}
                onChange={handleSearchChange}
                placeholder={column.placeholder}
                aria-label={`Фильтр: ${column.label}`}
              />
            ))}
            <select name="suitability" value={searchParams.suitability} onChange={handleSearchChange} aria-label="Фильтр: пригодность">
              <option value="">Все</option>
              <option value="true">Годен</option>
              <option value="false">Брак</option>
            </select>
          </div>

          {measuringInstruments.length === 0 ? (
            <div className="empty-state">Список пуст. Попробуйте изменить параметры фильтрации.</div>
          ) : (
            measuringInstruments.map((instrument) => (
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
                <span className="si-table__muted" style={{ whiteSpace: 'pre-line' }}>
                  {instrument.metrological_characteristics || '—'}
                </span>
                <span>{formatDate(instrument.calibration_date)}</span>
                <span>{instrument.calibration_interval}</span>
                <span>{formatDate(instrument.next_calibration_date)}</span>
                <span>{instrument.year_of_manufacture}</span>
                <span>
                  <span className={`badge ${instrument.current_suitability ? 'badge--success' : 'badge--danger'}`}>
                    {instrument.current_suitability ? 'Годен' : 'Брак'}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>

        {isCreating && authTokens && (
          <MeasuringInstrumentForm onCloseForm={handleCloseForm} onUpdateInstrument={updateInstrumentInList} />
        )}
        {editingMeasuringInstrumentId && authTokens && (
          <MeasuringInstrumentForm
            instrumentId={editingMeasuringInstrumentId}
            onCloseForm={handleCloseForm}
            onUpdateInstrument={updateInstrumentInList}
          />
        )}
      </main>
    </>
  );
};

export default MeasuringInstrumentsList;
