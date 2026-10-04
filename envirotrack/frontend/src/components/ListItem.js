import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiCalendar, FiChevronRight, FiClock, FiTool, FiUser } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { formatDate, formatTime, formatValue, isOutOfRange, shortName } from './recordFormat';
import './RecordCard.css';

const roomMetrics = (room) => {
  const extra = room.additional_parameters || {};
  return [
    { key: 'temperature_celsius', label: 'Температура', unit: '°C', min: room.temperature_min, max: room.temperature_max },
    { key: 'humidity_percentage', label: 'Влажность', unit: '%', min: room.humidity_min, max: room.humidity_max, digits: 1 },
    { key: 'pressure_kpa', label: 'Давление', unit: 'кПа', min: room.pressure_min_kpa, max: room.pressure_max_kpa },
    { key: 'pressure_mmhg', label: 'Давление', unit: 'мм рт. ст.', min: room.pressure_min_mmhg, max: room.pressure_max_mmhg },
    { key: 'voltage', label: 'Напряжение', unit: 'В', min: extra.voltage_min, max: extra.voltage_max },
    { key: 'frequency', label: 'Частота', unit: 'Гц', min: extra.frequency_min, max: extra.frequency_max },
    { key: 'radiation', label: 'Радиац. фон', unit: 'мкЗв/ч', min: extra.radiation_min, max: extra.radiation_max },
  ];
};

export const MetricTile = ({ metric, value }) => {
  const invalid = isOutOfRange(value, metric.min, metric.max);
  const hasRange = metric.min !== null && metric.min !== undefined && metric.max !== null && metric.max !== undefined;
  return (
    <div
      className={`metric ${invalid ? 'metric--invalid' : ''}`}
      title={hasRange ? `Норма: ${metric.min} – ${metric.max} ${metric.unit}` : undefined}
    >
      <span className='metric__label'>{metric.label}</span>
      <span className='metric__value'>
        {formatValue(value, metric.digits)}
        <small>{metric.unit}</small>
      </span>
    </div>
  );
};

export const RecordCard = ({ to, place, subtitle, tags, responsible, date, sets, metrics, instruments }) => {
  const { user } = useContext(AuthContext);
  const visibleMetrics = metrics.filter((m) => sets.some((s) => s[m.key] !== undefined && s[m.key] !== null));
  const violations = sets.reduce(
    (count, set) => count + visibleMetrics.filter((m) => isOutOfRange(set[m.key], m.min, m.max)).length,
    0,
  );

  const body = (
    <>
      <header className='record-card__head'>
        <div className='record-card__place'>
          <span className='record-card__number'>{place}</span>
          {subtitle && <span className='record-card__subtitle'>{subtitle}</span>}
          {tags}
        </div>
        <div className='record-card__meta'>
          {violations > 0 && (
            <span className='badge badge--danger'>
              <FiAlertTriangle /> Отклонений: {violations}
            </span>
          )}
          <span className='record-card__who'>
            <FiUser /> {shortName(responsible)}
          </span>
          <span className='record-card__date'>
            <FiCalendar /> {formatDate(date)}
          </span>
          {user && <FiChevronRight className='record-card__chevron' />}
        </div>
      </header>

      <div className='record-card__sets'>
        {sets.length === 0 && <div className='muted'>Наборы параметров не заполнены</div>}
        {sets.map((set, index) => (
          <div className='set-row' key={set.id || index}>
            <span className='set-row__time'>
              <FiClock /> {formatTime(set.time)}
            </span>
            <div className='set-row__metrics'>
              {visibleMetrics.map((metric) => (
                <MetricTile key={metric.key} metric={metric} value={set[metric.key]} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer className='record-card__foot'>
        <FiTool />
        {instruments.length > 0
          ? instruments.map((i) => `${i.name} ${i.type} (№ ${i.serial_number})`).join(' · ')
          : 'Средства измерений не указаны'}
      </footer>
    </>
  );

  return user ? (
    <Link to={to} className='record-card card is-clickable'>
      {body}
    </Link>
  ) : (
    <article className='record-card card'>{body}</article>
  );
};

const ListItem = ({ parameter }) => {
  const { room } = parameter;
  const sets = [
    ...(parameter.parameter_sets || []),
    ...(parameter.extended_parameter_sets || []),
    ...(parameter.parameter_sets_for_storage || []),
  ].sort((a, b) => String(a.time).localeCompare(String(b.time)));

  const tags = (
    <>
      {room.is_storage && <span className='badge badge--warning'>КВХ</span>}
      {room.has_additional_parameters && <span className='badge badge--brand'>Доп. параметры</span>}
    </>
  );

  return (
    <RecordCard
      to={`/room-parameter/${parameter.id}`}
      place={`Помещение ${room.room_number}`}
      subtitle={room.building_number ? `Здание ${room.building_number}` : null}
      tags={tags}
      responsible={parameter.responsible}
      date={parameter.created_at}
      sets={sets}
      metrics={roomMetrics(room)}
      instruments={parameter.measurement_instruments || []}
    />
  );
};

export default ListItem;
