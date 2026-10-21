// ParametersPage.js

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Select from 'react-select';
import './ParametersPage.css';
import { FiArrowLeft, FiMinus, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import ErrorMessageModal from '../components/ErrorMessageModal';

const withOneDecimalHumidity = (sets) =>
  sets.map((set) => {
    if (set.humidity_percentage === null || set.humidity_percentage === undefined || set.humidity_percentage === '') {
      return set;
    }
    const num = parseFloat(set.humidity_percentage);
    return Number.isNaN(num) ? set : { ...set, humidity_percentage: num.toFixed(1) };
  });

const TEMPERATURE = { key: 'temperature_celsius', label: 'Температура', unit: '°C' };
const HUMIDITY = { key: 'humidity_percentage', label: 'Влажность', unit: '%', step: '0.1' };
const PRESSURE = [
  { key: 'pressure_kpa', label: 'Давление', unit: 'кПа', hint: '1 кПа = 7.50062 мм рт. ст.' },
  { key: 'pressure_mmhg', label: 'Давление', unit: 'мм рт. ст.', hint: '1 мм рт. ст. = 0.13332 кПа' },
];
const EXTRA = [
  { key: 'voltage', label: 'Напряжение', unit: 'В' },
  { key: 'frequency', label: 'Частота', unit: 'Гц' },
  { key: 'radiation', label: 'Радиационный фон', unit: 'мкЗв/ч' },
];

const getSetFields = (room) => {
  if (room?.is_storage) return [TEMPERATURE, HUMIDITY];
  if (room?.has_additional_parameters) return [TEMPERATURE, HUMIDITY, ...PRESSURE, ...EXTRA];
  return [TEMPERATURE, HUMIDITY, ...PRESSURE];
};

const getRoomBounds = (room) => {
  if (!room) return {};
  const extra = room.additional_parameters || {};
  return {
    temperature_celsius: { min: room.temperature_min, max: room.temperature_max },
    humidity_percentage: { min: room.humidity_min, max: room.humidity_max },
    pressure_kpa: { min: room.pressure_min_kpa, max: room.pressure_max_kpa },
    pressure_mmhg: { min: room.pressure_min_mmhg, max: room.pressure_max_mmhg },
    voltage: { min: extra.voltage_min, max: extra.voltage_max },
    frequency: { min: extra.frequency_min, max: extra.frequency_max },
    radiation: { min: extra.radiation_min, max: extra.radiation_max },
  };
};

const roomLabel = (room) =>
  room ? (room.building_number ? `${room.room_number} · зд. ${room.building_number}` : room.room_number) : '';

const ParameterPage = () => {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // ---
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [exceededParameters, setExceededParameters] = useState([]);
  // ---
  const checkParameterBoundaries = () => {
    if (!selectedRoom) return [];
    
    const exceeded = [];
    
    parameterSets.forEach((paramSet, setIndex) => {
      // Проверка температуры
      if (paramSet.temperature_celsius !== '') {
        const temp = parseFloat(paramSet.temperature_celsius);
        if (temp < selectedRoom.temperature_min || temp > selectedRoom.temperature_max) {
          exceeded.push({
            parameter: 'Температура',
            value: temp,
            min: selectedRoom.temperature_min,
            max: selectedRoom.temperature_max,
            unit: '°C',
            setIndex
          });
        }
      }
      
      // Проверка влажности
      if (paramSet.humidity_percentage !== '') {
        const humidity = parseFloat(paramSet.humidity_percentage);
        if (humidity < selectedRoom.humidity_min || humidity > selectedRoom.humidity_max) {
          exceeded.push({
            parameter: 'Влажность',
            value: humidity,
            min: selectedRoom.humidity_min,
            max: selectedRoom.humidity_max,
            unit: '%',
            setIndex
          });
        }
      }
      
      // Проверка давления (кПа)
      if (paramSet.pressure_kpa !== '' && selectedRoom.pressure_min_kpa !== null) {
        const pressure = parseFloat(paramSet.pressure_kpa);
        if (pressure < selectedRoom.pressure_min_kpa || pressure > selectedRoom.pressure_max_kpa) {
          exceeded.push({
            parameter: 'Давление (кПа)',
            value: pressure,
            min: selectedRoom.pressure_min_kpa,
            max: selectedRoom.pressure_max_kpa,
            unit: 'кПа',
            setIndex
          });
        }
      }
      
      // Проверка давления (мм рт. ст.)
      if (paramSet.pressure_mmhg !== '' && selectedRoom.pressure_min_mmhg !== null) {
        const pressure = parseFloat(paramSet.pressure_mmhg);
        if (pressure < selectedRoom.pressure_min_mmhg || pressure > selectedRoom.pressure_max_mmhg) {
          exceeded.push({
            parameter: 'Давление (мм рт. ст.)',
            value: pressure,
            min: selectedRoom.pressure_min_mmhg,
            max: selectedRoom.pressure_max_mmhg,
            unit: 'мм рт. ст.',
            setIndex
          });
        }
      }
      
      // Проверка дополнительных параметров
      if (selectedRoom.has_additional_parameters && selectedRoom.additional_parameters) {
        // Напряжение
        if (paramSet.voltage !== '' && selectedRoom.additional_parameters.voltage_min !== null) {
          const voltage = parseFloat(paramSet.voltage);
          if (voltage < selectedRoom.additional_parameters.voltage_min || 
              voltage > selectedRoom.additional_parameters.voltage_max) {
            exceeded.push({
              parameter: 'Напряжение',
              value: voltage,
              min: selectedRoom.additional_parameters.voltage_min,
              max: selectedRoom.additional_parameters.voltage_max,
              unit: 'В',
              setIndex
            });
          }
        }
        
        // Частота
        if (paramSet.frequency !== '' && selectedRoom.additional_parameters.frequency_min !== null) {
          const frequency = parseFloat(paramSet.frequency);
          if (frequency < selectedRoom.additional_parameters.frequency_min || 
              frequency > selectedRoom.additional_parameters.frequency_max) {
            exceeded.push({
              parameter: 'Частота',
              value: frequency,
              min: selectedRoom.additional_parameters.frequency_min,
              max: selectedRoom.additional_parameters.frequency_max,
              unit: 'Гц',
              setIndex
            });
          }
        }
        
        // Радиация
        if (paramSet.radiation !== '' && selectedRoom.additional_parameters.radiation_min !== null) {
          const radiation = parseFloat(paramSet.radiation);
          if (radiation < selectedRoom.additional_parameters.radiation_min || 
              radiation > selectedRoom.additional_parameters.radiation_max) {
            exceeded.push({
              parameter: 'Радиационный фон',
              value: radiation,
              min: selectedRoom.additional_parameters.radiation_min,
              max: selectedRoom.additional_parameters.radiation_max,
              unit: 'мкЗв • ч⁻¹',
              setIndex
            });
          }
        }
      }
    });
    
    return exceeded;
  };

  const renderExceededWarning = (paramName, paramValue, setIndex) => {
    if (!selectedRoom || paramValue === '') return null;
    
    const value = parseFloat(paramValue);
    let min, max, unit;
    
    switch (paramName) {
      case 'temperature_celsius':
        min = selectedRoom.temperature_min;
        max = selectedRoom.temperature_max;
        unit = '°C';
        break;
      case 'humidity_percentage':
        min = selectedRoom.humidity_min;
        max = selectedRoom.humidity_max;
        unit = '%';
        break;
      case 'pressure_kpa':
        min = selectedRoom.pressure_min_kpa;
        max = selectedRoom.pressure_max_kpa;
        unit = 'кПа';
        break;
      case 'pressure_mmhg':
        min = selectedRoom.pressure_min_mmhg;
        max = selectedRoom.pressure_max_mmhg;
        unit = 'мм рт. ст.';
        break;
      case 'voltage':
        min = selectedRoom.additional_parameters?.voltage_min;
        max = selectedRoom.additional_parameters?.voltage_max;
        unit = 'В';
        break;
      case 'frequency':
        min = selectedRoom.additional_parameters?.frequency_min;
        max = selectedRoom.additional_parameters?.frequency_max;
        unit = 'Гц';
        break;
      case 'radiation':
        min = selectedRoom.additional_parameters?.radiation_min;
        max = selectedRoom.additional_parameters?.radiation_max;
        unit = 'мкЗв • ч⁻¹';
        break;
      default:
        return null;
    }
    
    // Проверяем, что min и max существуют
    if (min === undefined || max === undefined) return null;
    
    if (value < min || value > max) {
      return (
        <span className="exceeded-warning" title={`Значение выходит за границы допустимых (${min} - ${max} ${unit})`}>
          !
        </span>
      );
    }
    
    return null;
  };

  const openErrorModal = (message) => {
    console.log('openErrorModal called with message:', message); // <-- Добавь эту строку
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  // ---
  const openWarningModal = (exceededParams) => {
    setExceededParameters(exceededParams);
    setShowWarningModal(true);
  };

  const closeWarningModal = () => {
    setShowWarningModal(false);
  };

  // eslint-disable-next-line no-unused-vars
  const handleRoomSelect = (selectedOption) => {
    setSelectedRoom(selectedOption); // Установка выбранного помещения
    // console.log('Selected Room:', selectedOption);
    // Проверяем наличие расширенных параметров при выборе помещения
    if (selectedOption && selectedOption.has_additional_parameters) {
        // console.log('Room has additional parameters');
        // Если есть расширенные параметры, устанавливаем параметры в соответствующий формат
        setParameterSets([{
            temperature_celsius: '',
            humidity_percentage: '',
            pressure_kpa: '',
            pressure_mmhg: '',
            voltage: '',
            frequency: '',
            radiation: '',
            time: '',
        }]);
    } else if (selectedOption && selectedOption.is_storage) {
        // console.log('Room is storage');
        setParameterSets([{
          temperature_celsius: '',
          humidity_percentage: '',
          time: '',
        }]);
    } else {
        // console.log('Room does not have additional parameters');
        // Если расширенных параметров нет, устанавливаем базовые параметры
        setParameterSets([{
          temperature_celsius: '',
          humidity_percentage: '',
          pressure_kpa: '',
          ressure_mmhg: '',
          time: '',
        }]);
    }
  };

  const [createdAtDate, setCreatedAtDate] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [modifiedAtDate, setModifiedAtDate] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [measurementInstruments, setMeasurementInstruments] = useState([]);
  const [selectedMeasurementInstruments, setSelectedMeasurementInstruments] = useState([]);
  
  useEffect(() => {
    setSelectedMeasurementInstruments([{ value: null, label: 'Выбрать СИ' }]);
  }, []);

  const addMeasurementInstrument = () => {
    if (selectedMeasurementInstruments.length < 5) {
      const availableInstruments = measurementInstruments.filter(instrument => 
        !selectedMeasurementInstruments.find(selected => selected && selected.value === instrument.id)
      );
      if (availableInstruments.length > 0) {
        setMeasurementInstruments([...measurementInstruments]);
        setSelectedMeasurementInstruments([
          ...selectedMeasurementInstruments,
          { 
            value: null, 
            label: 'Выбрать СИ',
            is_suitable: true 
          } 
        ]);
      }
    }
  };
  
  const removeMeasurementInstrument = (index) => {
    if (selectedMeasurementInstruments.length > 1) {
      setSelectedMeasurementInstruments(selectedMeasurementInstruments.filter((_, i) => i !== index));
    }
  };

  const { authTokens } = useContext(AuthContext);
  const [createdBy, setCreatedBy] = useState(null);
  const [modifiedBy, setModifiedBy] = useState(null);
  const [parameterSets, setParameterSets] = useState([
    {
      temperature_celsius: '',
      humidity_percentage: '',
      pressure_kpa: '',
      pressure_mmhg: '',
      time: '',
    }
  ]);
  const [parameter, setParameter] = useState({});
  // const [canAddParameterSet, setCanAddParameterSet] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/current_user/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + String(authTokens.access),
          },
        });
        const data = await response.json();
        setCurrentUser(data);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    getCurrentUser();
  }, [authTokens.access]);
  
  useEffect(() => {
    if (parameter.created_at) {
      const date = new Date(parameter.created_at);
      setCreatedAtDate(date.toISOString().slice(0, 10));
    }
    if (parameter.modified_at) {
      const date = new Date(parameter.modified_at);
      setModifiedAtDate(date.toISOString().slice(0, 10));
    }
  }, [parameter.created_at, parameter.modified_at]);

  const validateFields = () => {
  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // Проверяем основные обязательные поля
  if (
    !parameter.created_at ||
    !isValidDate(parameter.created_at) ||
    selectedRoom === null ||
    !selectedMeasurementInstruments.some(instrument => instrument && instrument.value !== null)
  ) {
    openErrorModal('Пожалуйста, заполните все обязательные поля');
    return false;
  }

  // Проверяем параметрсеты в зависимости от типа помещения
  const allParameterSetsValid = parameterSets.every(paramSet => {
    // Обязательные поля для всех типов помещений
    const baseFieldsValid = 
      paramSet.temperature_celsius !== '' && 
      paramSet.humidity_percentage !== '' && 
      paramSet.time !== '';

    // Для складских помещений проверяем только базовые поля
    if (selectedRoom.is_storage) {
      return baseFieldsValid;
    }
    
    // Для помещений с дополнительными параметрами проверяем все поля
    if (selectedRoom.has_additional_parameters) {
      return (
        baseFieldsValid &&
        paramSet.pressure_kpa !== '' &&
        paramSet.pressure_mmhg !== '' &&
        paramSet.voltage !== '' &&
        paramSet.frequency !== '' &&
        paramSet.radiation !== ''
      );
    }

    // Для обычных помещений проверяем базовые поля + давление
    return (
      baseFieldsValid &&
      paramSet.pressure_kpa !== '' &&
      paramSet.pressure_mmhg !== ''
    );
  });

  if (!allParameterSetsValid) {
    openErrorModal('Пожалуйста, заполните все обязательные параметры');
    return false;
  }

  return true;
  };
  
  const getParameter = useCallback(async () => {
    if (id === 'new') return;
    try {
      let response = await fetch(`/api/parameters/${id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + String(authTokens.access),
        },
      });
      let data = await response.json();
      setParameter(data);
      setSelectedRoom(data.room);
      // console.log('Selected Room:', data.room); 
      setSelectedMeasurementInstruments(data.measurement_instruments);
      setCreatedBy(data.created_by);
      setModifiedBy(data.modified_by);
      // Проверяем, есть ли дополнительные параметры
      if (data.room.has_additional_parameters) {
        // Если есть, используем extended_parameter_sets
        if (Array.isArray(data.extended_parameter_sets)) {
          setParameterSets(withOneDecimalHumidity(data.extended_parameter_sets));
        } else {
          console.error('Ошибка: extended_parameter_sets не является массивом', data);
        }
      } else if (data.room.is_storage) {
        if (Array.isArray(data.parameter_sets_for_storage)) {
          setParameterSets(withOneDecimalHumidity(data.parameter_sets_for_storage));
        } else {
          console.error('Ошибка: parameter_sets_for_storage не является массивом', data);
        }
      } else {
        // Если нет, используем parameter_sets
        if (Array.isArray(data.parameter_sets)) {
          setParameterSets(withOneDecimalHumidity(data.parameter_sets));
        } else {
          console.error('Ошибка: parameter_sets не является массивом', data);
        }
      }
    } catch (error) {
      console.error('Error fetching parameter:', error);
    }
  }, [authTokens.access, id]);

  const getRooms = useCallback(async () => {
    try {
      let response = await fetch(`/api/rooms/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + String(authTokens.access),
        },
      });
      let data = await response.json();
      
      const updatedRooms = data.map(room => ({
        id: room.id,
        room_number: room.room_number,
        building_number: room.building_number,
        is_storage: room.is_storage,
        has_additional_parameters: room.has_additional_parameters,
        additional_parameters: room.additional_parameters,
        temperature_min: room.temperature_min,
        temperature_max: room.temperature_max,
        humidity_min: room.humidity_min,
        humidity_max: room.humidity_max,
        pressure_min_kpa: room.pressure_min_kpa,
        pressure_max_kpa: room.pressure_max_kpa,
        pressure_min_mmhg: room.pressure_min_mmhg,
        pressure_max_mmhg: room.pressure_max_mmhg,
        voltage_min: room.voltage_min,
        voltage_max: room.voltage_max,
        frequency_min: room.frequency_min,
        frequency_max: room.frequency_max,
        radiation_min: room.radiation_min,
        radiation_max: room.radiation_max,
      }));
      setRooms(updatedRooms); // Устанавливаем обновленный список комнат
      // console.log('Data rooms:', updatedRooms)
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, [authTokens.access]);

  const getMeasurementInstruments = useCallback(async () => {
    try {
      const response = await fetch('/api/measurement_instrument_types/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + String(authTokens.access),
        },
      });
      const data = await response.json();
      
      // Добавляем вычисляемую пригодность для каждого СИ
      const instrumentsWithSuitability = data.map(instrument => {
        let isSuitable = instrument.current_suitability || instrument.suitability;
        
        // Если есть дата следующей поверки, проверяем её актуальность
        if (instrument.next_calibration_date) {
          const nextDate = new Date(instrument.next_calibration_date);
          const currentDate = new Date();
          isSuitable = nextDate >= currentDate;
        }
        
        return {
          ...instrument,
          is_suitable: isSuitable
        };
      });
      
      setMeasurementInstruments(instrumentsWithSuitability);
    } catch (error) {
      console.error('Error fetching measurement instruments:', error);
    }
  }, [authTokens.access]);
  
  useEffect(() => {
    getParameter();
    getRooms();
    getMeasurementInstruments();
  }, [getParameter, getRooms, getMeasurementInstruments]);

  const updateParameterSet = (index, newSet) => {
    setParameterSets(prevSets => {
      return prevSets.map((set, i) => {
        if (i === index) {
          return newSet;
        } else {
          return set;
        }
      });
    });
  };

  const addParameterSet = () => {
    if (currentUser) {
      // Если у выбранного помещения есть расширенные параметры
      if (selectedRoom && selectedRoom.has_additional_parameters) {
        // Добавляем новый параметр со всеми полями
        setParameterSets(prevSets => {
          const newSet = { 
            temperature_celsius: '',
            humidity_percentage: '',
            pressure_kpa: '',
            pressure_mmhg: '',
            voltage: '',
            frequency: '',
            radiation: '',
            time: '',
          };
          const updatedSets = [...prevSets, newSet];
          // Используем функцию updateParameterSet для обновления состояния
          updateParameterSet(updatedSets.length - 1, newSet);
          return updatedSets;
        });
      // Если выбранное помещение является КВХ
      } else if (selectedRoom && selectedRoom.is_storage) {
        // добавляем только температуру влажность и время
        setParameterSets(prevSets => {
          const newSet = { 
            temperature_celsius: '',
            humidity_percentage: '',
            time: '',
          };
          const updatedSets = [...prevSets, newSet];
          // Используем функцию updateParameterSet для обновления состояния
          updateParameterSet(updatedSets.length - 1, newSet);
          return updatedSets;
        });
      } else {
        // Иначе добавляем только базовые поля
        setParameterSets(prevSets => {
          const newSet = { 
            temperature_celsius: '',
            humidity_percentage: '',
            pressure_kpa: '',
            pressure_mmhg: '',
            time: '',
          };
          const updatedSets = [...prevSets, newSet];
          // Используем функцию updateParameterSet для обновления состояния
          updateParameterSet(updatedSets.length - 1, newSet);
          return updatedSets;
        });
      }
    } else {
      console.error('User not authenticated');
    }
  };


  const deleteLastParameterSet = () => {
    if (currentUser) {
      if (parameterSets.length > 1) {
        const newParameterSets = parameterSets.slice(0, -1);
        setParameterSets(newParameterSets);
        // setCanAddParameterSet(true);
      }
    } else {
      console.error('User not authenticated');
    }
  };


  const handleParameterSetChange = (index, key, value) => {
    // console.log('Parameter Set Change - Index:', index, 'Key:', key, 'Value:', value);
    setParameterSets(prevSets => {
        const updatedSets = prevSets.map((set, i) => {
            if (i === index) {
                return { ...set, [key]: value };
            }
            return set;
        });

        if (key === 'humidity_percentage') {
            if (value !== '' && value !== '-' && !String(value).endsWith('.')) {
                const humidityValue = parseFloat(value);
                if (!isNaN(humidityValue)) {
                    const decimalPart = String(value).split('.')[1];
                    if (decimalPart && decimalPart.length > 1) {
                        value = String(Math.round(humidityValue * 10) / 10);
                    }
                }
            }
            updatedSets[index] = { ...updatedSets[index], humidity_percentage: value };
        } else if (key === 'pressure_kpa') {
            const kpaValue = parseFloat(value);
            if (!isNaN(kpaValue)) {
                updatedSets[index] = {
                    ...updatedSets[index],
                    pressure_mmhg: Math.round(kpaValue * 7.50062 * 100) / 100
                };
            }
        } else if (key === 'pressure_mmhg') {
            const mmHgValue = parseFloat(value);
            if (!isNaN(mmHgValue)) {
                updatedSets[index] = {
                    ...updatedSets[index],
                    pressure_kpa: Math.round((mmHgValue / 7.50062) * 100) / 100
                };
            }
        }
        return updatedSets;
    });
  };

  const renderParameterSets = () => {
    const fields = getSetFields(selectedRoom);
    const bounds = getRoomBounds(selectedRoom);

    return parameterSets.map((parameterSet, index) => (
      <section key={index} className='set-card card'>
        <header className='set-card__head'>
          <h3>Набор {index + 1}</h3>
          <div className='set-card__time'>
            <label htmlFor={`time-${index}`}>Время</label>
            <input
              id={`time-${index}`}
              type='time'
              step='1'
              value={parameterSet.time ? parameterSet.time : ''}
              onChange={(e) => handleParameterSetChange(index, 'time', e.target.value)}
            />
          </div>
        </header>
        <div className='set-card__grid'>
          {fields.map((field) => {
            const warning = renderExceededWarning(field.key, parameterSet[field.key] ?? '', index);
            const range = bounds[field.key];
            return (
              <div key={field.key} className={`form-field ${warning ? 'is-invalid' : ''}`}>
                <label htmlFor={`${field.key}-${index}`}>
                  {field.label}
                  {warning}
                </label>
                <div className='input-unit'>
                  <input
                    id={`${field.key}-${index}`}
                    type='number'
                    step={field.step || 'any'}
                    value={parameterSet[field.key] ?? ''}
                    onChange={(e) => handleParameterSetChange(index, field.key, e.target.value)}
                  />
                  <span className='input-unit__suffix'>{field.unit}</span>
                </div>
                <small className='form-hint'>
                  {range && range.min !== undefined && range.min !== null && range.max !== undefined && range.max !== null
                    ? `Норма: ${range.min} – ${range.max} ${field.unit}`
                    : field.hint || '\u00a0'}
                </small>
              </div>
            );
          })}
        </div>
      </section>
    ));
  };

  const createParameters = async () => {
    if (currentUser && validateFields()) {
      try {
        const createdParamSets = [];
        for (const paramSetData of parameterSets) {
          let url;
          if (selectedRoom && selectedRoom.has_additional_parameters) {
            url = '/api/extended_parameter_sets/create/';
          } else if (selectedRoom && selectedRoom.is_storage) {
            url = '/api/storage_parameter_sets/create/';
          } else {
            url = '/api/parameter_sets/create/';
          }

          const responseParamSet = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + String(authTokens.access),
            },
            body: JSON.stringify(paramSetData),
          });

          if (!responseParamSet.ok) {
            const errorText = await responseParamSet.text();
            console.error('Failed to create parameter set:', responseParamSet.statusText, errorText);
            openErrorModal(`Ошибка создания набора параметров: ${errorText}`);
            return;
          }

          const paramSet = await responseParamSet.json();
          createdParamSets.push(paramSet);
        }

        const newParameters = {
          room: { room_number: selectedRoom.room_number },
          measurement_instruments: selectedMeasurementInstruments.map(instrument => ({
            name: instrument.name,
            type: instrument.type,
            serial_number: instrument.serial_number,
            calibration_date: instrument.calibration_date,
            calibration_interval: instrument.calibration_interval,
          })),
          responsible: {
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            patronymic: currentUser.patronymic || '',
          },
          created_at: parameter.created_at,
        };

        // ВАЖНО: Отправляем ТОЛЬКО нужные parameter_sets
        if (selectedRoom && selectedRoom.has_additional_parameters) {
          newParameters.extended_parameter_sets = createdParamSets;
          newParameters.parameter_sets = []; // Пустой массив для обычных
          newParameters.parameter_sets_for_storage = []; // Пустой массив для складов
        } else if (selectedRoom && selectedRoom.is_storage) {
          newParameters.parameter_sets_for_storage = createdParamSets;
          newParameters.parameter_sets = []; // Пустой массив для обычных
          newParameters.extended_parameter_sets = []; // Пустой массив для расширенных
        } else {
          newParameters.parameter_sets = createdParamSets;
          newParameters.extended_parameter_sets = []; // Пустой массив для расширенных
          newParameters.parameter_sets_for_storage = []; // Пустой массив для складов
        }

        console.log('Отправляемые данные на сервер:', JSON.stringify(newParameters, null, 2));

        const responseParameters = await fetch('/api/parameters/create/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + String(authTokens.access),
          },
          body: JSON.stringify(newParameters),
        });

        // ВАЖНО: Получаем полный текст ошибки
        const responseText = await responseParameters.text();
        console.log('Response status:', responseParameters.status);
        console.log('Response text:', responseText);

        if (!responseParameters.ok) {
          try {
            const errorData = JSON.parse(responseText);
            console.error('Failed to create parameters:', responseParameters.statusText, errorData);
            openErrorModal(`Ошибка создания записи: ${errorData.error || errorData.details || responseParameters.statusText}`);
          } catch (e) {
            console.error('Failed to parse error response:', e);
            openErrorModal(`Ошибка сервера: ${responseParameters.statusText}`);
          }
          return;
        }

        try {
          const data = JSON.parse(responseText);
          console.log('Успешно созданы параметры:', data);
          navigate('/rooms-parameters');
        } catch (e) {
          console.error('Error parsing success response:', e);
          navigate('/rooms-parameters');
        }
      } catch (error) {
        console.error('Error while creating parameters:', error);
        openErrorModal(`Ошибка соединения: ${error.message}`);
      }
    }
  };


  const updateParameter = async () => {
    try {
      const modifiedBy = currentUser ? currentUser : null;
      const currentDate = new Date();
      const modifiedAt = currentDate.toISOString().split('T')[0]; // Форматируем дату в формат YYYY-MM-DD
      // Проверяем все поля перед сохранением
      if (!validateFields()) {
        return; // Если поля не заполнены, прекращаем выполнение функции
      }
    
      const response = await fetch(`/api/parameters/update/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + String(authTokens.access),
        },
        body: JSON.stringify({
          room: { room_number: selectedRoom.room_number },
          measurement_instruments: selectedMeasurementInstruments.map(instrument => ({
            name: instrument.name,
            type: instrument.type,
            serial_number: instrument.serial_number,
            calibration_date: instrument.calibration_date,
            calibration_interval: instrument.calibration_interval,
          })),
          responsible: {
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            patronymic: currentUser.patronymic,
          },
          parameter_sets: parameterSets,
          extended_parameter_sets: parameterSets,
          parameter_sets_for_storage: parameterSets,
          modified_by: modifiedBy,
          created_at: parameter.created_at,
          modified_at: modifiedAt,
        }),
      });
      if (response.ok) {
        // console.log('Запись успешно обновлена');
        navigate('/rooms-parameters');
      } else {
        console.error('Failed to update parameter:', response.statusText);
      }
    } catch (error) {
      console.error('Error while updating parameter:', error);
    }
  };

  
  const deleteParameter = async () => {
    if (parameter !== null) {
      const confirmed = window.confirm("Вы уверены, что хотите удалить запись?");
      if (confirmed) {
        try {
          const response = await fetch(`/api/parameters/delete/${id}/`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + String(authTokens.access),
            },
            body: JSON.stringify(parameter),
          });
          if (!response.ok) {
            console.error('Failed to delete parameter:', response.statusText);
          } else {
            navigate('/rooms-parameters');
          }
        } catch (error) {
          console.error('Error while deleting parameter:', error);
        }
      }
    }
  };


  const handleSubmit = () => {
    navigate('/rooms-parameters');
  };
  
  const handleDateChange = (e) => {
    const value = e.target.value;
    setCreatedAtDate(value); // Устанавливаем значение в формате гггг-мм-дд
    handleChange('created_at', value); // Передаем в функцию изменения
  };

  const handleKeyboardInput = (e) => {
    const input = e.target.value;
    const dateParts = input.split('.');
    
    if (dateParts.length === 3) {
      const [day, month, year] = dateParts.map(part => part.padStart(2, '0'));
      const formattedDate = `${year}-${month}-${day}`; // Преобразуем в гггг-мм-дд
      setCreatedAtDate(formattedDate);
      handleChange('created_at', formattedDate);
    }
  };
  const handleChange = (field, value) => {
    switch (field) {
      case 'pressure_kpa':
        const kpaValue = parseFloat(value);
        if (!isNaN(kpaValue)) {
          const mmHgValue = Math.round(kpaValue * 7.50062 * 100) / 100;
          setParameter((prevParameter) => ({
            ...prevParameter,
            pressure_kpa: Math.round(kpaValue * 100) / 100,
            pressure_mmhg: mmHgValue,
          }));
        }
        break;
  
      case 'pressure_mmhg':
        const mmHgValue = parseFloat(value);
        if (!isNaN(mmHgValue)) {
          const kpaValue = Math.round((mmHgValue / 7.50062) * 100) / 100;
          setParameter((prevParameter) => ({
            ...prevParameter,
            pressure_kpa: kpaValue,
            pressure_mmhg: mmHgValue,
          }));
        }
        break;
  
      default:
        setParameter((prevParameter) => ({ ...prevParameter, [field]: value }));
        break;
    }
  };
  
  const checkExistingRecord = async (date, roomId) => {
    try {
      const response = await fetch(`/api/parameters/check-existing/?date=${date}&room_id=${roomId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + String(authTokens.access),
        },
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при проверке записи');
      }
      
      const data = await response.json();
      return data.exists; // Предполагаем, что API возвращает { exists: true/false }
    } catch (error) {
      console.error('Error checking existing record:', error);
      return false;
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'не указана';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const handleSave = async () => {
    console.log('handleSave called');
    
    // First validate required fields
    if (!validateFields()) {
      console.log('Validation failed');
      return;
    }
    
    // Проверяем, есть ли уже запись на эту дату для выбранного помещения
    if (id === 'new' && parameter.created_at && selectedRoom) {
      console.log('Checking existing record for date:', parameter.created_at, 'room:', selectedRoom.id);
      
      try {
        // Загружаем все записи и проверяем дубликат
        const response = await fetch('/api/parameters/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + String(authTokens.access),
          },
        });
        
        if (response.ok) {
          const allRecords = await response.json();
          
          // Форматируем дату для сравнения (только YYYY-MM-DD)
          const formattedDate = parameter.created_at.split('T')[0];
          
          const hasDuplicate = allRecords.some(record => {
            if (!record.created_at || !record.room) return false;
            
            const recordDate = record.created_at.split('T')[0];
            const sameDate = recordDate === formattedDate;
            const sameRoom = record.room.id === selectedRoom.id;
            
            return sameDate && sameRoom;
          });
          
          console.log('Duplicate check result:', hasDuplicate);
          
          if (hasDuplicate) {
            openErrorModal('Запись на текущую дату уже была создана. Пожалуйста, выберите другую дату.');
            return;
          }
        }
      } catch (error) {
        console.error('Error in date check:', error);
        // Если проверка упала, пропускаем проверку и продолжаем сохранение
      }
    }
    
    // Check for exceeded parameters
    const exceededParams = checkParameterBoundaries();
    
    if (exceededParams.length > 0) {
      // Show warning modal with exceeded parameters
      openWarningModal(exceededParams);
    } else {
      // No exceeded parameters, proceed with save
      proceedWithSave();
    }
  };

  const proceedWithSave = async () => {
    if (id === 'new') {
      createParameters();
    } else {
      await updateParameter();
    }
  };


  return (
    <div className='record-page'>
      <div className='record-toolbar'>
        <button type='button' className='btn btn--ghost' onClick={handleSubmit}>
          <FiArrowLeft /> К списку
        </button>
        <div className='record-toolbar__title'>
          <h1>{id === 'new' ? 'Новая запись' : 'Редактирование записи'}</h1>
          {selectedRoom && (
            <span className='record-toolbar__subtitle'>
              Помещение {roomLabel(selectedRoom)}
              {createdAtDate ? ` · ${createdAtDate.split('-').reverse().join('.')}` : ''}
            </span>
          )}
        </div>
        <div className='record-toolbar__actions'>
          {id !== 'new' && (
            <button type='button' className='btn btn--danger-ghost' onClick={deleteParameter}>
              <FiTrash2 /> Удалить
            </button>
          )}
          <button type='button' className='btn btn--primary' onClick={handleSave}>
            <FiSave /> {id === 'new' ? 'Создать запись' : 'Сохранить'}
          </button>
        </div>
      </div>
      <div className='record-layout'>
        <aside className='record-main card'>
          <h2 className='record-section-title'>Основное</h2>
          <div className='form-field'>
            <label htmlFor='room'>Помещение</label>
            <Select
              inputId='room'
              classNamePrefix='rs'
              className="custom-select"
              options={rooms 
                ? [...rooms]
                    // Сортируем помещения по номеру (учитывая буквенные суффиксы)
                    .sort((a, b) => {
                      // Извлекаем числовую часть номера
                      const numA = parseInt(a.room_number.replace(/[^0-9]/g, '')) || 0;
                      const numB = parseInt(b.room_number.replace(/[^0-9]/g, '')) || 0;
                      
                      // Если числовые части разные - сортируем по ним
                      if (numA !== numB) return numA - numB;
                      
                      // Если числовые части одинаковые - сортируем по буквенному суффиксу
                      return a.room_number.localeCompare(b.room_number);
                    })
                    .map((room) => ({
                      value: room.id,
                      label: roomLabel(room),
                      is_storage: room.is_storage,
                      has_additional_parameters: room.has_additional_parameters,
                      temperature_min: room.temperature_min,
                      temperature_max: room.temperature_max,
                      humidity_min: room.humidity_min,
                      humidity_max: room.humidity_max,
                      pressure_min_kpa: room.pressure_min_kpa,
                      pressure_max_kpa: room.pressure_max_kpa,
                      pressure_min_mmhg: room.pressure_min_mmhg,
                      pressure_max_mmhg: room.pressure_max_mmhg,
                      voltage_min: room.voltage_min,
                      voltage_max: room.voltage_max,
                      frequency_min: room.frequency_min,
                      frequency_max: room.frequency_max,
                      radiation_min: room.radiation_min,
                      radiation_max: room.radiation_max,
                    })) 
                : []}
              value={selectedRoom ? {
                value: selectedRoom.id,
                label: roomLabel(selectedRoom)
              } : null}
              onChange={(selectedOption) => {
                const newSelectedRoom = rooms.find(room => room.id === selectedOption.value);
                setSelectedRoom(newSelectedRoom);
              }}
              getOptionLabel={(option) => option.label}
              placeholder="Выбрать помещение"
              noOptionsMessage={() => "Помещения не найдены"}
            />
          </div>
          <div className='form-field'>
            <label htmlFor='created_at'>Дата</label>
            <input
              type='date'
              id='created_at'
              value={createdAtDate} // Используем значение в формате гггг-мм-дд
              onChange={handleDateChange} // Обработка выбора даты через виджет
              onKeyUp={handleKeyboardInput} // Обработка ввода с клавиатуры
            />
          </div>
          <div className='form-field'>
            <label htmlFor='measurement_instruments'>Средства измерений</label>
            {selectedMeasurementInstruments.map((selectedInstrument, index) => {
              // Проверяем, является ли выбранное СИ негодным
              const isSelectedInstrumentUnsuitable = selectedInstrument && selectedInstrument.value && 
                measurementInstruments.find(instr => instr.id === selectedInstrument.value)?.is_suitable === false;
              
              return (
                <div key={index} className='si-row'>
                  <div className='si-row__control'>
                  <Select
                    className="custom-select"
                    classNamePrefix="rs"
                    options={measurementInstruments.map((instrument) => {
                      const isUnsuitable = instrument.is_suitable === false;
                      
                      return {
                        value: instrument.id,
                        label: isUnsuitable 
                          ? `⚠️ ${instrument.name} - ${instrument.type} (${instrument.serial_number})`
                          : `${instrument.name} - ${instrument.type} (${instrument.serial_number})`,
                        name: instrument.name,
                        type: instrument.type,
                        serial_number: instrument.serial_number,
                        calibration_date: instrument.calibration_date,
                        calibration_interval: instrument.calibration_interval,
                        is_suitable: instrument.is_suitable,
                        // Добавляем свойство для стилизации в селекте
                        className: isUnsuitable ? 'react-select__option--unsuitable' : ''
                      };
                    })}
                    value={selectedInstrument ? {
                      value: selectedInstrument.value || null,
                      label: selectedInstrument.name && selectedInstrument.type && selectedInstrument.serial_number ?
                        `${selectedInstrument.is_suitable === false ? '⚠️ ' : ''}${selectedInstrument.name} - ${selectedInstrument.type} (${selectedInstrument.serial_number})` :
                        'Выбрать СИ',
                      type: selectedInstrument.type || null,
                      serial_number: selectedInstrument.serial_number || null,
                      calibration_date: selectedInstrument.calibration_date || null,
                      calibration_interval: selectedInstrument.calibration_interval || null,
                      is_suitable: selectedInstrument.is_suitable
                    } : null}
                    onChange={(selectedOption) => {
                      const updatedSelectedInstruments = [...selectedMeasurementInstruments];
                      updatedSelectedInstruments[index] = selectedOption;
                      setSelectedMeasurementInstruments(updatedSelectedInstruments);
                      
                      // Показываем предупреждение при выборе негодного СИ
                      if (selectedOption && selectedOption.is_suitable === false) {
                        const instrument = measurementInstruments.find(instr => instr.id === selectedOption.value);
                        openErrorModal(
                          `ВНИМАНИЕ! Выбрано средство измерений с истекшим сроком годности:\n` +
                          `${instrument.name} (${instrument.type})\n` +
                          `Заводской номер: ${instrument.serial_number}\n` +
                          `Дата следующей поверки: ${formatDate(instrument.next_calibration_date)}`
                        );
                      }
                    }}
                    placeholder={{
                      value: null,
                      label: 'Выбрать СИ',
                    }}
                    isSearchable={true}
                    formatOptionLabel={({ label, is_suitable }) => (
                      <div style={{ 
                        color: is_suitable === false ? '#cc0000' : 'inherit',
                        fontWeight: is_suitable === false ? '600' : 'normal'
                      }}>
                        {label}
                      </div>
                    )}
                  />
                  </div>

                  {/* Предупреждение о негодности выбранного СИ */}
                  {isSelectedInstrumentUnsuitable && (
                    <div className="unsuitable-warning">
                      <span className="unsuitable-warning-icon">⚠️</span>
                      <span>
                        <strong>Срок годности истёк!</strong> {selectedInstrument.name} ({selectedInstrument.serial_number}) не допускается к применению.
                      </span>
                    </div>
                  )}
                  
                  {selectedMeasurementInstruments.length > 1 && (
                    <button
                      type='button'
                      className='btn btn--ghost btn--icon btn--sm si-row__remove'
                      title='Убрать это СИ'
                      onClick={() => removeMeasurementInstrument(index)}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              );
            })}
            {selectedMeasurementInstruments.length < 5 && (
              <button type='button' className='btn btn--link si-add' onClick={addMeasurementInstrument}>
                <FiPlus /> Добавить СИ
              </button>
            )}
          </div>
          <dl className='record-meta'>
            <div>
              <dt>Создано</dt>
              <dd>{createdBy || '—'}</dd>
            </div>
            <div>
              <dt>Изменено</dt>
              <dd>{modifiedBy || '—'}</dd>
            </div>
          </dl>
        </aside>
        <section className='record-sets'>
          <div className='record-sets__head'>
            <h2 className='record-section-title'>Наборы параметров</h2>
            <div className='record-sets__actions'>
              {parameterSets.length > 1 && (
                <button type='button' className='btn btn--ghost btn--sm' onClick={deleteLastParameterSet}>
                  <FiMinus /> Убрать набор {parameterSets.length}
                </button>
              )}
              {parameterSets.length < 2 && (
                <button type='button' className='btn btn--secondary btn--sm' onClick={addParameterSet}>
                  <FiPlus /> Добавить набор
                </button>
              )}
            </div>
          </div>
          {selectedRoom ? (
            <div className='record-sets__grid'>{renderParameterSets()}</div>
          ) : (
            <div className='card empty-state'>Выберите помещение — появятся поля для ввода параметров.</div>
          )}
        </section>
      </div>
      
      {showErrorModal && <ErrorMessageModal message={errorMessage} onClose={closeErrorModal} />}
            
      {/* Новое модальное окно с предупреждением о граничных значениях */}
      {showWarningModal && (
        <div className="modal-overlay">
          <div className="warning-modal">
            <h3>Предупреждение</h3>
            <p>Следующие параметры выходят за границы допустимых значений:</p>
            <ul>
              {exceededParameters.map((param, idx) => (
                <li key={idx}>
                  {param.parameter}: {param.value} {param.unit} (допустимо: {param.min} - {param.max} {param.unit})
                  {parameterSets.length > 1 && ` (Набор параметров ${param.setIndex + 1})`}
                </li>
              ))}
            </ul>
            <div className="warning-modal-buttons">
              <button type='button' className='btn btn--secondary' onClick={closeWarningModal}>Отменить</button>
              <button type='button' className='btn btn--danger' onClick={() => {
                closeWarningModal();
                proceedWithSave();
              }}>Сохранить несмотря на предупреждение</button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  export default ParameterPage;