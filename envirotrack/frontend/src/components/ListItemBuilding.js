// ListItemBuilding.js

import React from 'react';
import { Link } from 'react-router-dom';
import './ListItem.css';

const renderParameterSets = ({ parameterSets, building }) => {
  if (!parameterSets || parameterSets.length === 0) return '-';

  return parameterSets.map((paramSet, index) => {
    let voltageClassName = '';
    let frequencyClassName = '';
    
    const voltage = parseFloat(paramSet.voltage).toFixed(2);
    const frequency = parseFloat(paramSet.frequency).toFixed(2);
   
    if (!isNaN(voltage) && (building.voltage_min !== null && building.voltage_max !== null)) {
      if (voltage < building.voltage_min || voltage > building.voltage_max) {
        voltageClassName = 'invalid';
      }
    }

    if (!isNaN(frequency) && (building.frequency_min !== null && building.frequency_max !== null)) {
      if (frequency < building.frequency_min || frequency > building.frequency_max) {
        frequencyClassName = 'invalid';
      }
    }

    return (
      <div key={index} className="parameter-set">
        <div className="parameter-item">
          <span>Набор {index + 1}:</span>
          <span className={voltageClassName}> Напряжение питающей сети (В): {voltage},</span>
          <span className={frequencyClassName}> Частота переменного тока (Гц): {frequency},</span>
          <span> Время создания: {paramSet.time}</span>
        </div>
      </div>
    );
  });
};

const ListItemBuilding = ({ parameter }) => {
  const { building, parameter_sets, measurement_instruments } = parameter;
 
  const getDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${day}.${month}.${year}`;
  };

  return (
    <Link to={`/building-parameter/${parameter.id}`}>
      <div className="parameters-list-item">
        <h3>Здание №: {building.building_number} | Ответственный: {parameter.responsible.last_name} {parameter.responsible.first_name} | Дата: {getDate(parameter.created_at)}</h3>
        <div className="parameters-and-info">
          <div className="parameters">
            {renderParameterSets({ parameterSets: parameter_sets, building: building })}
          </div>
          <div className="info">
            <div className="parameter-item">
              <span>Средства измерений:</span> {measurement_instruments.length > 0 ?
                measurement_instruments.map((instrument, index) => (
                  <span key={instrument.id}>
                    {instrument.name} {instrument.type} ({instrument.serial_number}){index !== measurement_instruments.length - 1 ? ', ' : ''}
                  </span>
                )) :
                'Нет информации'
              }
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListItemBuilding;