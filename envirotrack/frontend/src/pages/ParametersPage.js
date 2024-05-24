// ParametersPage.js

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Select from 'react-select';
import './ParametersPage.css';
import ErrorMessageModal from '../components/ErrorMessageModal';


const ParameterPage = () => {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const openErrorModal = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
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
      const availableInstruments = measurementInstruments.filter(instrument => !selectedMeasurementInstruments.find(selected => selected && selected.value === instrument.id));
      if (availableInstruments.length > 0) {
        setMeasurementInstruments([...measurementInstruments]);
        setSelectedMeasurementInstruments([
          ...selectedMeasurementInstruments,
          { value: null, label: 'Выбрать СИ' } 
        ]);
      }
    }
  };
  
  const removeMeasurementInstrument = () => {
    if (selectedMeasurementInstruments.length > 1) {
      const updatedSelectedInstruments = [...selectedMeasurementInstruments];
      updatedSelectedInstruments.pop();
      setSelectedMeasurementInstruments(updatedSelectedInstruments);
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

    const allFieldsFilled =
      Object.values(parameter).every(value => value !== '') &&
      parameterSets.every(paramSet =>
        Object.values(paramSet).every(value => value !== '')
      ) &&
      selectedRoom !== null &&
      selectedMeasurementInstruments.some(instrument => instrument && instrument.value !== null) &&
      parameter.created_at !== '' &&
      isValidDate(parameter.created_at);

    if (!allFieldsFilled) {
      openErrorModal('Пожалуйста, заполните все поля');
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
          setParameterSets(data.extended_parameter_sets);
        } else {
          console.error('Ошибка: extended_parameter_sets не является массивом', data);
        }
      } else if (data.room.is_storage) {
        if (Array.isArray(data.parameter_sets_for_storage)) {
          setParameterSets(data.parameter_sets_for_storage);
        } else {
          console.error('Ошибка: parameter_sets_for_storage не является массивом', data);
        }
      } else {
        // Если нет, используем parameter_sets
        if (Array.isArray(data.parameter_sets)) {
          setParameterSets(data.parameter_sets);
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
      setMeasurementInstruments(data);
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

        if (key === 'pressure_kpa') {
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
    if (selectedRoom && selectedRoom.has_additional_parameters) {
      return parameterSets.map((parameterSet, index) => (
        <div key={index} className='parameter-set'>
          <div className='left-column'>
            <div className='parameter-field'>
              <label htmlFor='temperature_celsius'>Температура, °C:</label>
              <input
                type='number'
                value={parameterSet.temperature_celsius}
                onChange={(e) => handleParameterSetChange(index, 'temperature_celsius', e.target.value)}
              />
            </div>
            <div className='parameter-field'>
              <label htmlFor='humidity_percentage'>Влажность, %:</label>
              <input
                type='number'
                value={parameterSet.humidity_percentage}
                onChange={(e) => handleParameterSetChange(index, 'humidity_percentage', e.target.value)}
              />
            </div>
            <div className='parameter-field'>
              <label htmlFor='pressure_kpa'>Давление, кПа:</label>
              <input
                type='number'
                value={parameterSet.pressure_kpa}
                onChange={(e) => handleParameterSetChange(index, 'pressure_kpa', e.target.value)}
              />
            </div>
            <div className='parameter-field'>
              <label htmlFor='pressure_mmhg'>Давление, мм рт. ст.:</label>
              <input
                type='number'
                value={parameterSet.pressure_mmhg}
                onChange={(e) => handleParameterSetChange(index, 'pressure_mmhg', e.target.value)}
              />
            </div>
            <div className='parameter-field'>
              <label htmlFor='voltage'>Напряжение, В:</label>
              <input
                type='number'
                value={parameterSet.voltage}
                onChange={(e) => handleParameterSetChange(index, 'voltage', e.target.value)}
              />
            </div>
            <div className='parameter-field'>
              <label htmlFor='frequency'>Частота, Гц:</label>
              <input
                type='number'
                value={parameterSet.frequency}
                onChange={(e) => handleParameterSetChange(index, 'frequency', e.target.value)}
              />
            </div>
            <div className='parameter-field'>
              <label htmlFor='radiation'>Радиационный фон, мкЗв • ч⁻¹:</label>
              <input
                type='number'
                value={parameterSet.radiation}
                onChange={(e) => handleParameterSetChange(index, 'radiation', e.target.value)}
              />
            </div>
            <div className='parameter-field'>
              <label htmlFor='time'>Время:</label>
              <input
                type='time'
                step='1' 
                value={parameterSet.time ? parameterSet.time : ''}
                onChange={(e) => handleParameterSetChange(index, 'time', e.target.value)}
              />
            </div>
            <div className='parameter-boundaries'>
                Граничные диапазоны:
                <div>Температура: {selectedRoom.temperature_min} - {selectedRoom.temperature_max} °C; Влажность: {selectedRoom.humidity_min} - {selectedRoom.humidity_max} %
                Давление: {selectedRoom.pressure_min_kpa} - {selectedRoom.pressure_max_kpa} кПа; Давление: {selectedRoom.pressure_min_mmhg} - {selectedRoom.pressure_max_mmhg} мм рт. ст.</div>
                <div>Напряжение: {selectedRoom.additional_parameters.voltage_min} - {selectedRoom.additional_parameters.voltage_max} В; Частота: {selectedRoom.additional_parameters.frequency_min} - {selectedRoom.additional_parameters.frequency_max} Гц
                Радиационный фон: {selectedRoom.additional_parameters.radiation_min} - {selectedRoom.additional_parameters.radiation_max} мкЗв • ч⁻¹</div>
            </div>
          </div>
        </div>
      ));
    } else if (selectedRoom && selectedRoom.is_storage) {
        return parameterSets.map((parameterSet, index) => (
          <div key={index} className='parameter-set'>
            <div className='left-column'>
              {/* Оставляем только базовые поля для обычного параметрсета */}
              <div className='parameter-field'>
                <label htmlFor='temperature_celsius'>Температура, °C:</label>
                <input
                  type='number'
                  value={parameterSet.temperature_celsius}
                  onChange={(e) => handleParameterSetChange(index, 'temperature_celsius', e.target.value)}
                />
              </div>
              <div className='parameter-field'>
                <label htmlFor='humidity_percentage'>Влажность, %:</label>
                <input
                  type='number'
                  value={parameterSet.humidity_percentage}
                  onChange={(e) => handleParameterSetChange(index, 'humidity_percentage', e.target.value)}
                />
              </div>
              <div className='parameter-field'>
                <label htmlFor='time'>Время:</label>
                <input
                  type='time'
                  step='1' 
                  value={parameterSet.time ? parameterSet.time : ''}
                  onChange={(e) => handleParameterSetChange(index, 'time', e.target.value)}
                />
              </div>
              <div className='parameter-boundaries'>
                Граничные диапазоны:
                <div>Температура: {selectedRoom.temperature_min} - {selectedRoom.temperature_max} °C</div>
                <div>Влажность: {selectedRoom.humidity_min} - {selectedRoom.humidity_max} %</div>
              </div>
            </div>
          </div>
        ));
    } else {
        return parameterSets.map((parameterSet, index) => (
          <div key={index} className='parameter-set'>
            <div className='left-column'>
              {/* Оставляем только базовые поля для обычного параметрсета */}
              <div className='parameter-field'>
                <label htmlFor='temperature_celsius'>Температура, °C:</label>
                <input
                  type='number'
                  value={parameterSet.temperature_celsius}
                  onChange={(e) => handleParameterSetChange(index, 'temperature_celsius', e.target.value)}
                />
              </div>
              <div className='parameter-field'>
                <label htmlFor='humidity_percentage'>Влажность, %:</label>
                <input
                  type='number'
                  value={parameterSet.humidity_percentage}
                  onChange={(e) => handleParameterSetChange(index, 'humidity_percentage', e.target.value)}
                />
              </div>
              <div className='parameter-field'>
                <label htmlFor='pressure_kpa'>Давление, кПа:</label>
                <input
                  type='number'
                  value={parameterSet.pressure_kpa}
                  onChange={(e) => handleParameterSetChange(index, 'pressure_kpa', e.target.value)}
                />
              </div>
              <div className='parameter-field'>
                <label htmlFor='pressure_mmhg'>Давление, мм рт. ст.:</label>
                <input
                  type='number'
                  value={parameterSet.pressure_mmhg}
                  onChange={(e) => handleParameterSetChange(index, 'pressure_mmhg', e.target.value)}
                />
              </div>
              <div className='parameter-field'>
                <label htmlFor='time'>Время:</label>
                <input
                  type='time'
                  step='1' 
                  value={parameterSet.time ? parameterSet.time : ''}
                  onChange={(e) => handleParameterSetChange(index, 'time', e.target.value)}
                />
              </div>
              <div className='parameter-boundaries'>
                  <div>Граничные значения параметров:</div>
                  {selectedRoom && (
                      <div>
                          Температура: {selectedRoom.temperature_min} - {selectedRoom.temperature_max} °C;
                          Влажность: {selectedRoom.humidity_min} - {selectedRoom.humidity_max} %;
                          Давление: {selectedRoom.pressure_min_kpa} - {selectedRoom.pressure_max_kpa} кПа;
                          Давление: {selectedRoom.pressure_min_mmhg} - {selectedRoom.pressure_max_mmhg} мм рт. ст.
                      </div>
                  )}
              </div>
            </div>
          </div>
        ));
      }
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
                    console.error('Failed to create parameter set:', responseParamSet.statusText);
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
                })), // Передаем объект прибора измерений целиком
                responsible: {
                    id: currentUser.id,
                    first_name: currentUser.first_name,
                    last_name: currentUser.last_name,
                    patronymic: currentUser.patronymic,
                },
                created_by: `${currentUser.first_name} ${currentUser.last_name}`,
                created_at: parameter.created_at,
            };

            if (selectedRoom && selectedRoom.has_additional_parameters) {
                newParameters.extended_parameter_sets = createdParamSets;
            } else if (selectedRoom && selectedRoom.is_storage) {
                newParameters.parameter_sets_for_storage = createdParamSets;
            } else {
                newParameters.parameter_sets = createdParamSets;
            }

            // console.log('Sending Parameters:', newParameters);
            // console.log('Additional parameters:', selectedRoom.additional_parameters);
            const responseParameters = await fetch('/api/parameters/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + String(authTokens.access),
                },
                body: JSON.stringify(newParameters),
            });

            if (!responseParameters.ok) {
                console.error('Failed to create parameters:', responseParameters.statusText);
                return;
            }

            // console.log('Созданы параметры, параметрсеты и записи');
            navigate('/rooms-parameters');
        } catch (error) {
            console.error('Error while creating parameters:', error);
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
  const handleSave = async () => {
    if (id === 'new') {
      createParameters();
    } else {
      await updateParameter();
    }
  };
  
  return (
    <div className='parameter'>
      <h2>
        {id === 'new' ? 'Форма создания записи' : 'Форма редактирования записи'}
      </h2>
      <div className='parameter-header'>
        <div className='button-header'>
          {id !== 'new' ? (
            <>
              <button className="parameter-button-delete" onClick={deleteParameter}>Удалить</button>
              <button className="parameter-button-save" onClick={handleSave}>Сохранить</button>
              {parameterSets.length < 2 && ( // Скрываем кнопку "Добавить набор параметров", если уже есть два набора
                <button className="parameter-button-create" onClick={addParameterSet}>
                  Добавить набор параметров
                </button>
              )}
              {parameterSets.length > 1 && ( // Показываем кнопку удаления набора параметров только если их больше одного
                <button className="parameter-button-create" onClick={deleteLastParameterSet}>
                  Удалить набор параметров
                </button>
              )}
              <button className="parameter-button-back" onClick={handleSubmit}>Назад</button>
            </>
          ) : (
            <>
              <button className="parameter-button-create" onClick={handleSave}>Создать запись</button>
              {parameterSets.length < 2 && ( // Скрываем кнопку "Добавить набор параметров", если уже есть два набора
                <button className="parameter-button-create" onClick={addParameterSet}>
                  Добавить набор параметров
                </button>
              )}
              {parameterSets.length > 1 && ( // Показываем кнопку удаления набора параметров только если их больше одного
                <button className="parameter-button-create" onClick={deleteLastParameterSet}>
                  Удалить набор параметров
                </button>
              )}
              <button className="parameter-button-back" onClick={handleSubmit}>Назад</button>
            </>
          )}
        </div>
      </div>
      <div className='parameter-fields'>
        <div className='left-column'>
          <div className='parameter-field'>
            <label htmlFor='room'>Помещение:</label>
            <Select
              className="custom-select"
              options={rooms ? rooms.map((room) => ({
                value: room.id,
                label: room.room_number,
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
              })) : []}
              value={selectedRoom ? { value: selectedRoom.id, label: selectedRoom.room_number } : null}
              onChange={(selectedOption) => {
                const newSelectedRoom = rooms.find(room => room.id === selectedOption.value);
                setSelectedRoom(newSelectedRoom);
              }}
              getOptionLabel={(option) => option.label}
              placeholder="Выбрать помещение"
            />
          </div>
          <div className='parameter-field'>
            <label htmlFor='created_at'>Дата:</label>
            <input
              type='date'
              id='created_at'
              value={createdAtDate}
              onChange={(e) => handleChange('created_at', e.target.value)}
            />
          </div>
          <div className='parameter-field'>
            <label htmlFor='measurement_instruments'>Средства измерений:</label>
            {selectedMeasurementInstruments.map((selectedInstrument, index) => (
              <div key={index}>
                
                <Select
                  className="custom-select"
                  options={measurementInstruments.map((instrument) => ({
                    value: instrument.id,
                    label: `${instrument.name} - ${instrument.type} (${instrument.serial_number})`,
                    name: instrument.name,
                    type: instrument.type,
                    serial_number: instrument.serial_number,
                    calibration_date: instrument.calibration_date,
                    calibration_interval: instrument.calibration_interval,
                  }))}
                  value={selectedInstrument ? {
                    value: selectedInstrument.value || null,
                    label: selectedInstrument.name && selectedInstrument.type && selectedInstrument.serial_number ?
                      `${selectedInstrument.name} - ${selectedInstrument.type} (${selectedInstrument.serial_number})` :
                      'Выбрать СИ',
                    type: selectedInstrument.type || null,
                    serial_number: selectedInstrument.serial_number || null,
                    calibration_date: selectedInstrument.calibration_date || null,
                    calibration_interval: selectedInstrument.calibration_interval || null,
                  } : null} 
                  onChange={(selectedOption) => {
                    const updatedSelectedInstruments = [...selectedMeasurementInstruments];
                    updatedSelectedInstruments[index] = selectedOption;
                    setSelectedMeasurementInstruments(updatedSelectedInstruments);
                  }}
                  placeholder={{
                    value: null,
                    label: 'Выбрать СИ',
                  }}
                  isSearchable={true}
                />
                {index === selectedMeasurementInstruments.length - 1 && selectedMeasurementInstruments.length > 1 && (
                  <button className="remove-instrument-button" onClick={removeMeasurementInstrument}>
                    Удалить СИ
                  </button>
                )}
              </div>
            ))}
            {selectedMeasurementInstruments.length < 5 && ( // Добавляем условие для кнопки добавления, чтобы не превышать максимальное количество средств измерения
              <button className="parameter-button-create" onClick={addMeasurementInstrument}>
                Добавить СИ
              </button>
            )}
          </div>
          <div className='parameter-fields-1'>
          <div className='parameter-field'>
            <label>Создано:</label>
            <div className="created-by">{createdBy ? `${createdBy}` : 'Нет данных'}</div>
          </div>
          <div className='parameter-field'>
            <label>Изменено:</label>
            <div className="modified-by">{modifiedBy ? `${modifiedBy}` : 'Нет данных'}</div>
          </div>
        </div>
        </div>
        <div className='right-column'>
          <div className='parameter-set-column'>
            {renderParameterSets()}
          </div>
        </div>
      </div>
      {showErrorModal && <ErrorMessageModal message={errorMessage} onClose={closeErrorModal} />}
    </div>
    );
  };

  export default ParameterPage;