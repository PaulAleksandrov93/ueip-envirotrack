// BoundaryParametersPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { FiHome, FiInbox, FiRotateCcw, FiThermometer } from 'react-icons/fi';
import SubHeader from '../components/SubHeader';
import AuthContext from '../context/AuthContext';
import './BoundaryParametersPage.css';

const EMPTY_SEARCH = { building: '', room_number: '' };

const range = (min, max, unit = '') => {
  const fmt = (v) => (v === null || v === undefined || v === '' ? '—' : String(v).replace('.', ','));
  return `${fmt(min)} – ${fmt(max)}${unit ? ` ${unit}` : ''}`;
};

const naturalCompare = (a, b) => String(a).localeCompare(String(b), 'ru', { numeric: true });

const roomParameters = (room) => {
  const params = [
    { label: 'Температура', value: range(room.temperature_min, room.temperature_max, '°C') },
    { label: 'Влажность', value: range(room.humidity_min, room.humidity_max, '%') },
  ];
  if (room.is_storage) return params;

  params.push(
    { label: 'Давление', value: range(room.pressure_min_kpa, room.pressure_max_kpa, 'кПа') },
    { label: 'Давление', value: range(room.pressure_min_mmhg, room.pressure_max_mmhg, 'мм рт. ст.') },
  );
  const extra = room.has_additional_parameters ? room.additional_parameters : null;
  if (extra) {
    params.push(
      { label: 'Напряжение', value: range(extra.voltage_min, extra.voltage_max, 'В') },
      { label: 'Частота', value: range(extra.frequency_min, extra.frequency_max, 'Гц') },
      { label: 'Радиационный фон', value: range(extra.radiation_min, extra.radiation_max, 'мкЗв/ч') },
    );
  }
  return params;
};

const buildingParameters = (building) => [
  { label: 'Напряжение сети', value: range(building.voltage_min, building.voltage_max, 'В') },
  { label: 'Частота тока', value: range(building.frequency_min, building.frequency_max, 'Гц') },
];

const BoundaryParametersPage = () => {
  const { authTokens } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState('rooms');
  const [searchParams, setSearchParams] = useState(EMPTY_SEARCH);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = authTokens ? { Authorization: 'Bearer ' + authTokens.access } : {};

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/buildings/', { headers });
        if (response.ok) setBuildings(await response.json());
      } catch (error) {
        console.error('Ошибка загрузки зданий:', error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      let url;
      if (filterType === 'rooms') {
        url = '/api/rooms/';
        if (searchParams.building) params.append('building', searchParams.building);
        if (searchParams.room_number) params.append('room_number', searchParams.room_number);
      } else {
        url = '/api/buildings/';
        const building = buildings.find((b) => String(b.id) === searchParams.building);
        if (building) params.append('building_number', building.building_number);
      }
      const response = await fetch(`${url}?${params.toString()}`, { headers });
      if (response.ok) setData(await response.json());
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, searchParams, buildings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const switchType = (type) => {
    setFilterType(type);
    setSearchParams(EMPTY_SEARCH);
  };

  const items = [...data].sort((a, b) =>
    filterType === 'rooms'
      ? naturalCompare(a.building_number, b.building_number) || naturalCompare(a.room_number, b.room_number)
      : naturalCompare(a.building_number, b.building_number),
  );
  const hasSearch = searchParams.building || searchParams.room_number;

  return (
    <>
      <SubHeader />
      <main className='page'>
        <div className='page-toolbar'>
          <h1 className='page-toolbar__title'>
            Граничные значения <span className='page-toolbar__count'>· {items.length}</span>
          </h1>
        </div>

        <section className='filter-panel card boundary-filters'>
          <div className='segmented' role='radiogroup' aria-label='Что показывать'>
            <button
              type='button'
              role='radio'
              aria-checked={filterType === 'rooms'}
              className={filterType === 'rooms' ? 'is-active' : ''}
              onClick={() => switchType('rooms')}
            >
              <FiThermometer /> Помещения
            </button>
            <button
              type='button'
              role='radio'
              aria-checked={filterType === 'buildings'}
              className={filterType === 'buildings' ? 'is-active' : ''}
              onClick={() => switchType('buildings')}
            >
              <FiHome /> Здания
            </button>
          </div>

          <select name='building' value={searchParams.building} onChange={handleSearchChange} aria-label='Здание'>
            <option value=''>Все здания</option>
            {[...buildings]
              .sort((a, b) => naturalCompare(a.building_number, b.building_number))
              .map((building) => (
                <option key={building.id} value={building.id}>
                  Здание {building.building_number}
                </option>
              ))}
          </select>

          {filterType === 'rooms' && (
            <input
              type='search'
              name='room_number'
              value={searchParams.room_number}
              onChange={handleSearchChange}
              placeholder='Номер помещения'
              aria-label='Номер помещения'
            />
          )}

          {hasSearch && (
            <button type='button' className='btn btn--ghost btn--sm' onClick={() => setSearchParams(EMPTY_SEARCH)}>
              <FiRotateCcw /> Сбросить
            </button>
          )}
        </section>

        {loading && items.length === 0 ? (
          <div className='boundary-grid'>
            <div className='skeleton' />
            <div className='skeleton' />
            <div className='skeleton' />
          </div>
        ) : items.length === 0 ? (
          <div className='card empty-state'>
            <FiInbox />
            <h3>Ничего не найдено</h3>
            <p>Измените условия фильтра.</p>
          </div>
        ) : (
          <div className={`boundary-grid ${loading ? 'is-refreshing' : ''}`}>
            {items.map((item) => (
              <article key={item.id} className='boundary-card card'>
                <header className='boundary-card__head'>
                  <span className='boundary-card__title'>
                    {filterType === 'rooms' ? `Помещение ${item.room_number}` : `Здание ${item.building_number}`}
                  </span>
                  {filterType === 'rooms' && item.building_number && (
                    <span className='muted'>Здание {item.building_number}</span>
                  )}
                  {filterType === 'rooms' && item.is_storage && <span className='badge badge--warning'>КВХ</span>}
                  {filterType === 'rooms' && item.has_additional_parameters && (
                    <span className='badge badge--brand'>Доп. параметры</span>
                  )}
                </header>
                <dl className='boundary-card__params'>
                  {(filterType === 'rooms' ? roomParameters(item) : buildingParameters(item)).map((param, index) => (
                    <div key={index} className='boundary-param'>
                      <dt>{param.label}</dt>
                      <dd>{param.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default BoundaryParametersPage;
