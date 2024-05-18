// ListItem.js

import React from 'react';
import { Link } from 'react-router-dom';
const renderParameterSets = ({ parameterSets, extendedParameterSets, storageParameterSets, room }) => {
  if (!parameterSets && !extendedParameterSets && !storageParameterSets) return '-';

  // Определяем isStorage на основе наличия storageParameterSets и отсутствия других параметров
  const isStorage = storageParameterSets && storageParameterSets.length > 0 && !parameterSets && !extendedParameterSets;
  let sets;
  if (parameterSets && parameterSets.length > 0) {
    sets = parameterSets;
  } else if (storageParameterSets && storageParameterSets.length > 0) {
    sets = storageParameterSets;
  } else {
    sets = extendedParameterSets;
  }

  return sets.map((paramSet, index) => {
    const { temperature_celsius, humidity_percentage, pressure_kpa, pressure_mmhg, voltage, frequency, radiation, time } = paramSet;
    const isExtended = voltage !== undefined || frequency !== undefined || radiation !== undefined;

    let temperatureClassName = '';
    let humidityClassName = '';
    let pressureClassName = '';
    let voltageClassName = '';
    let frequencyClassName = '';
    let radiationClassName = '';

    if (!isNaN(temperature_celsius) && (room.temperature_min !== null && room.temperature_max !== null)) {
      if (temperature_celsius < room.temperature_min || temperature_celsius > room.temperature_max) {
        temperatureClassName = 'invalid';
      }
    }

    if (!isNaN(humidity_percentage) && (room.humidity_min !== null && room.humidity_max !== null)) {
      if (humidity_percentage < room.humidity_min || humidity_percentage > room.humidity_max) {
        humidityClassName = 'invalid';
      }
    }

    if (!isNaN(pressure_kpa) && (room.pressure_min_kpa !== null && room.pressure_max_kpa !== null)) {
      if (pressure_kpa < room.pressure_min_kpa || pressure_kpa > room.pressure_max_kpa) {
        pressureClassName = 'invalid';
      }
    }

    if (!isNaN(pressure_mmhg) && (room.pressure_min_mmhg !== null && room.pressure_max_mmhg !== null)) {
      if (pressure_mmhg < room.pressure_min_mmhg || pressure_mmhg > room.pressure_max_mmhg) {
        pressureClassName = 'invalid';
      }
    }
    
    if (isExtended) {
      const additionalParams = room.additional_parameters;    
      if (additionalParams) { 
        if (!isNaN(voltage) && (additionalParams.voltage_min !== null && additionalParams.voltage_max !== null)) {
          if (voltage < additionalParams.voltage_min || voltage > additionalParams.voltage_max) {
            voltageClassName = 'invalid';
          }
        }
        if (!isNaN(frequency)) {
          if (frequency < additionalParams.frequency_min || frequency > additionalParams.frequency_max) {
            frequencyClassName = 'invalid';
          }
        }
        if (!isNaN(radiation)) {
          if (radiation < additionalParams.radiation_min || radiation > additionalParams.radiation_max) {
            radiationClassName = 'invalid';
          }
        }
      }
    }

    return (
      <div key={index} className="parameter-set">
        <div className="parameter-item">
          <span>Набор {index + 1}:</span>
          {(isStorage) && (
            <>
              <span className={temperatureClassName}> Температура (°C): {temperature_celsius},</span>
              <span className={humidityClassName}> Влажность (%): {humidity_percentage},</span>
              <span> Время создания: {time}</span>
            </>
          )}
          {isExtended && (
            <>
              <span className={temperatureClassName}> Температура (°C): {temperature_celsius},</span>
              <span className={humidityClassName}> Влажность (%): {humidity_percentage},</span>
              {pressure_kpa !== undefined && (
                <span className={pressureClassName}> Давление (кПа): {pressure_kpa},</span>
              )}
              {pressure_mmhg !== undefined && (
                <span className={pressureClassName}> Давление (мм рт. ст.): {pressure_mmhg},</span>
              )}
              <span className={voltageClassName}> Напряжение (В): {voltage},</span>
              <span className={frequencyClassName}> Частота (Гц): {frequency},</span>
              <span className={radiationClassName}> Радиационный фон (мкЗв • ч⁻¹): {radiation},</span>
              <span> Время создания: {time}</span>
            </>
          )}
          {!isStorage && !isExtended && (
            <>
              <span className={temperatureClassName}> Температура (°C): {temperature_celsius},</span>
              <span className={humidityClassName}> Влажность (%): {humidity_percentage},</span>
              {pressure_kpa !== undefined && (
                <span className={pressureClassName}> Давление (кПа): {pressure_kpa},</span>
              )}
              {pressure_mmhg !== undefined && (
                <span className={pressureClassName}> Давление (мм рт. ст.): {pressure_mmhg},</span>
              )}
              <span> Время создания: {time}</span>
            </>
          )}
        </div>
      </div>
    );
  });
};

const ListItem = ({ parameter }) => {
  const { room, parameter_sets, extended_parameter_sets, parameter_sets_for_storage, measurement_instruments } = parameter;

  const getDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${day}.${month}.${year}`;
  };

  return (
    <Link to={`/parameter/${parameter.id}`}>
      <div className="parameters-list-item">
        <h3>Помещение №: {room.room_number} | Ответственный: {parameter.responsible.last_name} {parameter.responsible.first_name} | Дата: {getDate(parameter.created_at)}</h3>
        <div className="parameters">
          {renderParameterSets({ parameterSets: parameter_sets, extendedParameterSets: extended_parameter_sets, storageParameterSets: parameter_sets_for_storage, room: room })}
        </div>
        <div className="info">
          <div className="parameter-item">
            <span>Средства измерений:</span> {measurement_instruments.length > 0 ?
              measurement_instruments.map((instrument, index) => (
                <span key={instrument.id}>
                  {instrument.name} {instrument.type} ({instrument.serial_number}){index !== measurement_instruments.length - 1 ? '; ' : ''}
                </span>
              )) :
              'Нет информации'
            }
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListItem;

