import React, { useContext, useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { FiCheck, FiCloudOff, FiLoader, FiRotateCcw, FiUser, FiUsers } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { emptyFilters } from '../hooks/usePersistentFilters';
import './FilterPanel.css';

const naturalCompare = (a, b) => String(a).localeCompare(String(b), 'ru', { numeric: true });

const toISODate = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const PERIODS = [
  { id: 'today', label: 'Сегодня', range: () => { const d = toISODate(new Date()); return [d, d]; } },
  { id: 'week', label: '7 дней', range: () => { const d = new Date(); d.setDate(d.getDate() - 6); return [toISODate(d), toISODate(new Date())]; } },
  { id: 'month', label: '30 дней', range: () => { const d = new Date(); d.setDate(d.getDate() - 29); return [toISODate(d), toISODate(new Date())]; } },
  { id: 'all', label: 'Всё время', range: () => ['', ''] },
];

const SAVE_STATUS = {
  saving: { icon: FiLoader, text: 'Сохраняем фильтр…', className: 'is-saving' },
  saved: { icon: FiCheck, text: 'Фильтр закреплён за вами', className: 'is-saved' },
  error: { icon: FiCloudOff, text: 'Не удалось сохранить на сервере', className: 'is-error' },
};

const useFilterOptions = (scope) => {
  const { authTokens } = useContext(AuthContext);
  const [responsibles, setResponsibles] = useState([]);
  const [entities, setEntities] = useState([]);

  useEffect(() => {
    const headers = authTokens ? { Authorization: 'Bearer ' + String(authTokens.access) } : {};
    const load = async (url, setter) => {
      try {
        const response = await fetch(url, { headers });
        if (response.ok) setter(await response.json());
      } catch {
        setter([]);
      }
    };
    load('/api/responsibles/', setResponsibles);
    load(scope === 'buildings' ? '/api/buildings/' : '/api/rooms/', setEntities);
    // Options do not depend on the access token value, only on being signed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, Boolean(authTokens)]);

  const responsibleOptions = useMemo(
    () =>
      [...responsibles]
        .sort((a, b) => naturalCompare(a.last_name, b.last_name))
        .map((r) => ({ value: r.id, label: `${r.last_name} ${r.first_name}${r.patronymic ? ` ${r.patronymic[0]}.` : ''}` })),
    [responsibles],
  );

  const entityOptions = useMemo(() => {
    if (scope === 'buildings') {
      return [...entities]
        .sort((a, b) => naturalCompare(a.building_number, b.building_number))
        .map((b) => ({ value: b.id, label: `Здание ${b.building_number}` }));
    }
    const groups = new Map();
    [...entities]
      .sort((a, b) => naturalCompare(a.building_number, b.building_number) || naturalCompare(a.room_number, b.room_number))
      .forEach((room) => {
        const title = room.building_number ? `Здание ${room.building_number}` : 'Без здания';
        if (!groups.has(title)) groups.set(title, []);
        groups.get(title).push({
          value: room.id,
          label: room.building_number ? `${room.room_number} · зд. ${room.building_number}` : room.room_number,
        });
      });
    return [...groups.entries()].map(([label, options]) => ({ label, options }));
  }, [entities, scope]);

  return { responsibleOptions, entityOptions };
};

const flatOptions = (options) => options.flatMap((o) => (o.options ? o.options : [o]));

const FilterPanel = ({ scope, filters, onChange, onReset, responsibleId, saveState, total, loading }) => {
  const { user } = useContext(AuthContext);
  const entityKey = scope === 'buildings' ? 'buildings' : 'rooms';
  const { responsibleOptions, entityOptions } = useFilterOptions(scope);

  const update = (patch) => onChange((prev) => ({ ...prev, ...patch }));

  const selected = (options, ids) => {
    const flat = flatOptions(options);
    return (ids || []).map((id) => flat.find((o) => o.value === id)).filter(Boolean);
  };

  const activePeriod = PERIODS.find((p) => {
    const [start, end] = p.range();
    return start === filters.start_date && end === filters.end_date;
  });

  const isDirty = JSON.stringify({ ...emptyFilters(scope), ...filters }) !== JSON.stringify(emptyFilters(scope));
  const status = SAVE_STATUS[saveState];
  const StatusIcon = status?.icon;

  return (
    <section className='filter-panel card'>
      <div className='filter-panel__row'>
        {user && responsibleId && (
          <div className='form-field filter-panel__scope'>
            <span className='form-label'>Показывать</span>
            <div className='segmented' role='radiogroup' aria-label='Какие записи показывать'>
              <button
                type='button'
                role='radio'
                aria-checked={filters.mine}
                className={filters.mine ? 'is-active' : ''}
                onClick={() => update({ mine: true })}
              >
                <FiUser /> {scope === 'buildings' ? 'Мои здания' : 'Мои помещения'}
              </button>
              <button
                type='button'
                role='radio'
                aria-checked={!filters.mine}
                className={!filters.mine ? 'is-active' : ''}
                onClick={() => update({ mine: false })}
              >
                <FiUsers /> Все
              </button>
            </div>
          </div>
        )}

        <div className='form-field filter-panel__select'>
          <label htmlFor={`${scope}-responsible`}>Ответственный</label>
          <Select
            inputId={`${scope}-responsible`}
            classNamePrefix='rs'
            isMulti
            options={responsibleOptions}
            value={selected(responsibleOptions, filters.responsible)}
            onChange={(items) => update({ responsible: items.map((i) => i.value) })}
            placeholder='Любой'
            noOptionsMessage={() => 'Никого не найдено'}
          />
        </div>

        <div className='form-field filter-panel__select filter-panel__select--wide'>
          <label htmlFor={`${scope}-entity`}>{scope === 'buildings' ? 'Здания' : 'Помещения'}</label>
          <Select
            inputId={`${scope}-entity`}
            classNamePrefix='rs'
            isMulti
            closeMenuOnSelect={false}
            options={entityOptions}
            value={selected(entityOptions, filters[entityKey])}
            onChange={(items) => update({ [entityKey]: items.map((i) => i.value) })}
            placeholder={scope === 'buildings' ? 'Все здания' : 'Все помещения'}
            noOptionsMessage={() => 'Ничего не найдено'}
          />
        </div>

        <div className='form-field filter-panel__period'>
          <span className='form-label'>Период</span>
          <div className='filter-panel__dates'>
            <input
              type='date'
              aria-label='С даты'
              value={filters.start_date}
              max={filters.end_date || undefined}
              onChange={(e) => update({ start_date: e.target.value })}
            />
            <span className='muted'>—</span>
            <input
              type='date'
              aria-label='По дату'
              value={filters.end_date}
              min={filters.start_date || undefined}
              onChange={(e) => update({ end_date: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className='filter-panel__footer'>
        <div className='filter-panel__presets'>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type='button'
              className={`chip ${activePeriod?.id === p.id ? 'is-active' : ''}`}
              onClick={() => {
                const [start_date, end_date] = p.range();
                update({ start_date, end_date });
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className='filter-panel__meta'>
          <span className='filter-panel__total'>
            {loading ? 'Загрузка…' : `Найдено записей: ${total}`}
          </span>
          {status && (
            <span className={`filter-panel__status ${status.className}`}>
              <StatusIcon /> {status.text}
            </span>
          )}
          {isDirty && (
            <button type='button' className='btn btn--ghost btn--sm' onClick={onReset}>
              <FiRotateCcw /> Сбросить
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FilterPanel;
