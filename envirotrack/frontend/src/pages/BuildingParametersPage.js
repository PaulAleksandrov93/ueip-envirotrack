// BuildingParametersPage.js

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Select from 'react-select';
import './ParametersPage.css';
import { FiArrowLeft, FiMinus, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import ErrorMessageModal from '../components/ErrorMessageModal';


const BuildingParametersPage = () => {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const openErrorModal = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  const [createdAtDate, setCreatedAtDate] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [modifiedAtDate, setModifiedAtDate] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]); 
  const [selectedBuilding, setSelectedBuilding] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  const [measurementInstruments, setMeasurementInstruments] = useState([]);
  const [selectedMeasurementInstruments, setSelectedMeasurementInstruments] = useState([]);
  

  // ---
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [exceededParameters, setExceededParameters] = useState([]);
  // ---

  // Проверка граничных параметров
  const checkParameterBoundaries = () => {
    if (!selectedBuilding) return [];
    
    const exceeded = [];
    
    parameterSets.forEach((paramSet, setIndex) => {
      // Проверка напряжения
      if (paramSet.voltage !== '') {
        const voltage = parseFloat(paramSet.voltage);
        if (voltage < selectedBuilding.voltage_min || voltage > selectedBuilding.voltage_max) {
          exceeded.push({
            parameter: 'Напряжение',
            value: voltage,
            min: selectedBuilding.voltage_min,
            max: selectedBuilding.voltage_max,
            unit: 'В',
            setIndex
          });
        }
      }
      
      // Проверка частоты
      if (paramSet.frequency !== '') {
        const frequency = parseFloat(paramSet.frequency);
        if (frequency < selectedBuilding.frequency_min || frequency > selectedBuilding.frequency_max) {
          exceeded.push({
            parameter: 'Частота',
            value: frequency,
            min: selectedBuilding.frequency_min,
            max: selectedBuilding.frequency_max,
            unit: 'Гц',
            setIndex
          });
        }
      }
    });
    
    return exceeded;
  };

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
      voltage: '',
      frequency: '',
      waveform_shape: 'синусоидальная', // Устанавливаем значение по умолчанию
      harmonic_coefficient: '',          // Пустое значение для ввода процента
      time: '',
    }
  ]);
  const [parameter, setParameter] = useState({});
  const [canAddParameterSet, setCanAddParameterSet] = useState(true);

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
      selectedBuilding !== null &&
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
      let response = await fetch(`/api/building_environmental_parameters/${id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + String(authTokens.access),
        },
      });
      let data = await response.json();
      setParameter(data);
      setSelectedBuilding(data.building);
      setSelectedMeasurementInstruments(data.measurement_instruments);
      setCreatedBy(data.created_by);
      setModifiedBy(data.modified_by);
      setParameterSets(data.parameter_sets);
    } catch (error) {
      console.error('Error fetching parameter:', error);
    }
  }, [authTokens.access, id]);

  const getBuildings = useCallback(async () => {
    try {
      let response = await fetch(`/api/buildings/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + String(authTokens.access),
        },
      });
      let data = await response.json();

      const updatedBuildings = data.map(building => ({
        id: building.id,
        building_number: building.building_number,
        voltage_min: building.voltage_min,
        voltage_max: building.voltage_max,
        frequency_min: building.frequency_min,
        frequency_max: building.frequency_max,
      }));
      setBuildings(updatedBuildings);
    } catch (error) {
      console.error('Error fetching buildings:', error);
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
    getBuildings();
    getMeasurementInstruments();
  }, [getParameter, getBuildings, getMeasurementInstruments]);

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
      if (canAddParameterSet) {
        setParameterSets(prevSets => {
          const newSet = { 
            voltage: '',
            frequency: '',
            waveform_shape: 'синусоидальная',
            harmonic_coefficient: '',
            time: '',
          };
          updateParameterSet(prevSets.length, newSet);
          return [...prevSets, newSet];
        });
        setCanAddParameterSet(false);
      } else {
        console.error('Можно добавить только один параметрсет');
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
        setCanAddParameterSet(true);
      }
    } else {
      console.error('User not authenticated');
    }
  };

  const handleParameterSetChange = (index, key, value) => {
    setParameterSets(prevSets => {
        const updatedSets = prevSets.map((set, i) => {
            if (i === index) {
                return { ...set, [key]: value };
            }
            return set;
        });
        return updatedSets;
    });
  };

  const renderParameterSets = () => {
    const fields = [
      { key: 'voltage', label: 'Напряжение сети', unit: 'В', min: selectedBuilding?.voltage_min, max: selectedBuilding?.voltage_max },
      { key: 'frequency', label: 'Частота тока', unit: 'Гц', min: selectedBuilding?.frequency_min, max: selectedBuilding?.frequency_max },
      { key: 'harmonic_coefficient', label: 'Коэффициент гармоник', unit: '%' },
    ];

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
            const value = parseFloat(parameterSet[field.key]);
            const hasRange = field.min !== undefined && field.min !== null && field.max !== undefined && field.max !== null;
            const invalid = hasRange && !Number.isNaN(value) && (value < field.min || value > field.max);
            return (
              <div key={field.key} className={`form-field ${invalid ? 'is-invalid' : ''}`}>
                <label htmlFor={`${field.key}-${index}`}>
                  {field.label}
                  {invalid && <span className='exceeded-warning' title='Значение вне нормы'>!</span>}
                </label>
                <div className='input-unit'>
                  <input
                    id={`${field.key}-${index}`}
                    type='number'
                    step='any'
                    value={parameterSet[field.key] ?? ''}
                    onChange={(e) => handleParameterSetChange(index, field.key, e.target.value)}
                  />
                  <span className='input-unit__suffix'>{field.unit}</span>
                </div>
                <small className='form-hint'>{hasRange ? `Норма: ${field.min} – ${field.max} ${field.unit}` : '\u00a0'}</small>
              </div>
            );
          })}
          {(() => {
            const shape = parameterSet.waveform_shape ?? 'синусоидальная';
            const unusual = shape.trim() !== '' && shape.trim().toLowerCase() !== 'синусоидальная';
            return (
              <div className={`form-field ${unusual ? 'is-invalid' : ''}`}>
                <label htmlFor={`waveform_shape-${index}`}>
                  Форма кривой
                  {unusual && <span className='exceeded-warning' title='Ожидается синусоидальная'>!</span>}
                </label>
                <input
                  id={`waveform_shape-${index}`}
                  type='text'
                  value={shape}
                  onChange={(e) => handleParameterSetChange(index, 'waveform_shape', e.target.value)}
                />
                <small className='form-hint'>Норма: синусоидальная</small>
              </div>
            );
          })()}
        </div>
      </section>
    ));
  };

  const createParameters = async () => {
    if (currentUser && validateFields()) {
        try {
            const createdParamSets = [];

            for (const paramSetData of parameterSets) {
                const responseParamSet = await fetch('/api/building_parameter_sets/create/', {
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
                building: { building_number: selectedBuilding.building_number },
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
                parameter_sets: createdParamSets,
                created_by: `${currentUser.first_name} ${currentUser.last_name}`,
                created_at: parameter.created_at,
            };
            // console.log('Sending Parameters:', newParameters);
            const responseParameters = await fetch('/api/building_environmental_parameters/create/', {
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
            // console.log('Созданы параметры, параметрсеты и записи (Для здания)');
            navigate('/buildings-parameters');
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
    
      const response = await fetch(`/api/building_environmental_parameters/update/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + String(authTokens.access),
        },
        body: JSON.stringify({
          building: { building_number: selectedBuilding.building_number },
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
          modified_by: modifiedBy,
          created_at: parameter.created_at,
          modified_at: modifiedAt,
        }),
      });
    
      if (response.ok) {
        // console.log('Запись успешно обновлена');
        navigate('/buildings-parameters');
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
          const response = await fetch(`/api/building_environmental_parameters/delete/${id}/`, {
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
            navigate('/buildings-parameters');
          }
        } catch (error) {
          console.error('Error while deleting parameter:', error);
        }
      }
    }
  };

  const handleSubmit = () => {
    navigate('/buildings-parameters');
  };

  const handleChange = (field, value) => {
    setParameter((prevParameter) => ({ ...prevParameter, [field]: value }));
  };

  // const handleSave = async () => {
  //   if (id === 'new') {
  //     createParameters();
  //   } else {
  //     await updateParameter();
  //   }
  // };

  // ---
  const handleSave = async () => {
    if (!validateFields()) return;
    
    const exceededParams = checkParameterBoundaries();
    if (exceededParams.length > 0) {
      setExceededParameters(exceededParams);
      setShowWarningModal(true);
    } else {
      proceedWithSave();
    }
  };

  const proceedWithSave = async () => {
    if (id === 'new') {
      await createParameters();
    } else {
      await updateParameter();
    }
  };
  // ---

  return (
    <div className='record-page'>
      <div className='record-toolbar'>
        <button type='button' className='btn btn--ghost' onClick={handleSubmit}>
          <FiArrowLeft /> К списку
        </button>
        <div className='record-toolbar__title'>
          <h1>{id === 'new' ? 'Новая запись по зданию' : 'Редактирование записи по зданию'}</h1>
          {selectedBuilding && <span className='record-toolbar__subtitle'>Здание {selectedBuilding.building_number}</span>}
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
            <label htmlFor='building'>Здание</label>
            <Select
              inputId='building'
              classNamePrefix='rs'
              className="custom-select"
              options={buildings 
                ? [...buildings]
                    .sort((a, b) => a.building_number.localeCompare(b.building_number, undefined, { 
                      numeric: true, 
                      sensitivity: 'base' 
                    }))
                    .map((building) => ({ 
                      value: building.id, 
                      label: `${building.building_number} (${building.voltage_min}-${building.voltage_max}V)`, // Можно добавить доп. информацию
                      ...building // Все поля здания будут доступны в selectedOption
                    })) 
                : []}
              value={selectedBuilding ? { 
                value: selectedBuilding.id, 
                label: selectedBuilding.building_number 
              } : null}
              onChange={(selectedOption) => {
                const newSelectedBuilding = buildings.find(building => building.id === selectedOption.value);
                setSelectedBuilding(newSelectedBuilding);
              }}
              placeholder="Выбрать здание"
              noOptionsMessage={() => "Здания не найдены"}
            />
          </div>
          <div className='form-field'>
            <label htmlFor='created_at'>Дата</label>
            <input
              type='date'
              id='created_at'
              value={createdAtDate}
              onChange={(e) => handleChange('created_at', e.target.value)}
            />
          </div>
          <div className='form-field'>
            <label htmlFor='measurement_instruments'>Средства измерений</label>
            {selectedMeasurementInstruments.map((selectedInstrument, index) => (
              <div key={index} className='si-row'>
                <div className='si-row__control'>
                <Select
                  className="custom-select"
                  classNamePrefix="rs"
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
                </div>
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
            ))}
            {selectedMeasurementInstruments.length < 5 && ( // Добавляем условие для кнопки добавления, чтобы не превышать максимальное количество средств измерений
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
          <div className='record-sets__grid'>{renderParameterSets()}</div>
        </section>
      </div>
      {showErrorModal && <ErrorMessageModal message={errorMessage} onClose={closeErrorModal} />}

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
              <button type='button' className='btn btn--secondary' onClick={() => setShowWarningModal(false)}>Отменить</button>
              <button
                type='button'
                className='btn btn--danger'
                onClick={() => {
                  setShowWarningModal(false);
                  proceedWithSave();
                }}
              >
                Сохранить несмотря на предупреждение
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
};

export default BuildingParametersPage;
