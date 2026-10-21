import React from 'react';
import { RecordCard } from './ListItem';

const buildingMetrics = (building) => [
  { key: 'voltage', label: 'Напряжение сети', unit: 'В', min: building.voltage_min, max: building.voltage_max, digits: 2 },
  { key: 'frequency', label: 'Частота тока', unit: 'Гц', min: building.frequency_min, max: building.frequency_max, digits: 2 },
  { key: 'harmonic_coefficient', label: 'Коэф. гармоник', unit: '%', digits: 1 },
  { key: 'waveform_shape', label: 'Форма кривой', text: true, expected: 'синусоидальная' },
];

const ListItemBuilding = ({ parameter }) => {
  const { building } = parameter;
  const sets = [...(parameter.parameter_sets || [])].sort((a, b) => String(a.time).localeCompare(String(b.time)));

  return (
    <RecordCard
      to={`/building-parameter/${parameter.id}`}
      place={`Здание ${building.building_number}`}
      responsible={parameter.responsible}
      date={parameter.created_at}
      sets={sets}
      metrics={buildingMetrics(building)}
      instruments={parameter.measurement_instruments || []}
    />
  );
};

export default ListItemBuilding;
