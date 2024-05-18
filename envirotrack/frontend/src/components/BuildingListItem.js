// BuildingListItem.js

import React from 'react';
import { Link } from 'react-router-dom';
import './ListItem.css';

const BuildingListItem = ({ parameter }) => {
  const { building, parameter_sets } = parameter;

  const renderParameterSets = ({ parameterSets }) => {
    if (!parameterSets || parameterSets.length === 0) return '-';

    return parameterSets.map((paramSet, index) => (
      <div key={index} className="parameter-set">
        <div className="parameter-item">
          <span>Набор {index + 1}:</span>
          <span> Напряжение: {paramSet.voltage},</span>
          <span> Частота: {paramSet.frequency},</span>
          <span> Время записи: {paramSet.time}</span>
        </div>
      </div>
    ));
  };

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
        <h3>Здание №: {building.name}</h3>
        <div className="parameters-and-info">
          <div className="parameters">
            {renderParameterSets({ parameterSets: parameter_sets })}
          </div>
          <div className="info">
            <div className="parameter-item">
              <span>Дата:</span> {getDate(parameter.created_at)}
            </div>
            <div className="parameter-item">
              <span>Средство измерений:</span> {parameter.measurement_instrument ?
                `${parameter.measurement_instrument.name} ${parameter.measurement_instrument.type} ${parameter.measurement_instrument.serial_number}` :
                'Нет информации'
              }
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BuildingListItem;