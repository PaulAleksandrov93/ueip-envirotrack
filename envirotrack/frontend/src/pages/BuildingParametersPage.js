// BuildingParametersPage.js

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Select from 'react-select';
import './ParametersPage.css';
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
      voltage: '',
      frequency: '',
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
    return parameterSets.map((parameterSet, index) => (
      <div key={index} className='parameter-set'>
        <div className='left-column'>
          <div className='parameter-field'>
            <label htmlFor='voltage'>Напряжение питающей сети, В:</label>
            <input
              type='number'
              value={parameterSet.voltage}
              onChange={(e) => handleParameterSetChange(index, 'voltage', e.target.value)}
            />
          </div>
          <div className='parameter-field'>
            <label htmlFor='frequency'>Частота переменного тока, Гц:</label>
            <input
              type='number'
              value={parameterSet.frequency}
              onChange={(e) => handleParameterSetChange(index, 'frequency', e.target.value)}
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
              {selectedBuilding && (
                  <div>
                      Напряжение: {selectedBuilding.voltage_min} - {selectedBuilding.voltage_max} В; 
                      Частота: {selectedBuilding.frequency_min} - {selectedBuilding.frequency_max} Гц
                  </div>
              )}
          </div>
        </div>
      </div>
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
            <label htmlFor='building'>Здание:</label>
            <Select
              className="custom-select"
              options={buildings ? buildings.map((building) => ({ 
                value: building.id, 
                label: building.building_number, 
                voltage_min: building.voltage_min,
                voltage_max: building.voltage_max,
                frequency_min: building.frequency_min,
                frequency_max: building.frequency_max,
              })) : []}
              value={selectedBuilding ? { value: selectedBuilding.id, label: selectedBuilding.building_number } : null}
              onChange={(selectedOption) => {
                const newSelectedBuilding = buildings.find(building => building.id === selectedOption.value);
                setSelectedBuilding(newSelectedBuilding)
              }}
              placeholder="Выбрать здание"
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
            {selectedMeasurementInstruments.length < 5 && ( // Добавляем условие для кнопки добавления, чтобы не превышать максимальное количество средств измерений
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

export default BuildingParametersPage;