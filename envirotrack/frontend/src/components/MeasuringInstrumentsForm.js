// MeasurementInstrumentsForm.js

import React, { useState, useEffect, useContext } from 'react';
import './MeasuringInstrumentsForm.css';
import AuthContext from '../context/AuthContext';

const MeasuringInstrumentForm = ({ instrumentId, onCloseForm, onUpdateInstrument }) => {
  const { authTokens } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    registration_number: '',
    name: '',
    type: '',
    serial_number: '',
    metrological_characteristics: '',
    calibration_date: '',
    calibration_interval: '',
    next_calibration_date: '',
    year_of_manufacture: '',
    suitability: '', // Оставляем пустым, сервер сам рассчитает
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Функция для расчета следующей даты поверки
  const calculateNextCalibrationDate = () => {
    const { calibration_date, calibration_interval } = formData;
    if (calibration_date && calibration_interval && parseInt(calibration_interval) > 0) {
      const dateParts = calibration_date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);

      const nextCalibrationDate = new Date();
      nextCalibrationDate.setFullYear(year, month - 1 + parseInt(calibration_interval), day);
      nextCalibrationDate.setDate(nextCalibrationDate.getDate() - 1);

      setFormData(prevState => ({
        ...prevState,
        next_calibration_date: nextCalibrationDate.toISOString().split('T')[0],
      }));
    }
  };

  // Рассчитываем следующую дату поверки при изменении даты поверки или интервала
  useEffect(() => {
    calculateNextCalibrationDate();
  }, [formData.calibration_date, formData.calibration_interval]);

  // Загружаем данные для редактирования
  useEffect(() => {
    if (instrumentId) {
      fetch(`/api/measurement_instrument_types/${instrumentId}/`, {
        headers: {
          Authorization: 'Bearer ' + authTokens.access,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setFormData(data);
        })
        .catch((error) => console.error('Error:', error));
    }
  }, [instrumentId, authTokens.access]);

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prevState) => ({
        ...prevState,
        [name]: checked,
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const errors = {};
    const requiredFields = ['registration_number', 'name', 'type', 'serial_number', 'year_of_manufacture'];
    
    requiredFields.forEach((key) => {
      if (!formData[key] || formData[key].toString().trim() === '') {
        errors[key] = 'Это поле обязательно для заполнения';
      }
    });

    // Проверка дат
    if (formData.calibration_date) {
      const calibrationDate = new Date(formData.calibration_date);
      if (isNaN(calibrationDate.getTime())) {
        errors.calibration_date = 'Некорректная дата';
      }
    }

    if (formData.next_calibration_date) {
      const nextCalibrationDate = new Date(formData.next_calibration_date);
      if (isNaN(nextCalibrationDate.getTime())) {
        errors.next_calibration_date = 'Некорректная дата';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const url = instrumentId 
        ? `/api/measurement_instrument_types/${instrumentId}/` 
        : '/api/measurement_instrument_types/';
      
      const method = instrumentId ? 'PUT' : 'POST';
      
      // // ВРЕМЕННО: отправляем suitability
      // const dataToSend = { ...formData };
      // // delete dataToSend.suitability; 
      const dataToSend = { ...formData };
      
      // Если это создание нового СИ (нет instrumentId), удаляем suitability из отправляемых данных
      if (!instrumentId) {
        delete dataToSend.suitability;
      }
      
      console.log('Отправляемые данные:', dataToSend);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authTokens.access,
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error('Ошибка сохранения');
      }
      
      const savedInstrument = await response.json();
      console.log('Сохраненные данные:', savedInstrument);
      
      if (onUpdateInstrument) {
        onUpdateInstrument(savedInstrument);
      }
      
      onCloseForm();
      
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      alert(`Ошибка при сохранении: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик удаления
  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить это средство измерений?')) {
      return;
    }
    
    try {
      const url = `/api/measurement_instrument_types/${instrumentId}/`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + authTokens.access,
        },
      });
      
      if (!response.ok) {
        throw new Error('Ошибка удаления');
      }
      
      // Если нужно обновить список после удаления
      if (onUpdateInstrument && instrumentId) {
        onUpdateInstrument({ id: instrumentId, deleted: true });
      }
      
      onCloseForm();
      
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      alert('Ошибка при удалении');
    }
  };

  // Проверяем актуальную пригодность для отображения в форме (только UI)
  const calculateCurrentSuitability = () => {
    if (formData.next_calibration_date) {
      const nextCalibrationDate = new Date(formData.next_calibration_date);
      const currentDate = new Date();
      return nextCalibrationDate >= currentDate;
    }
    return formData.suitability || false;
  };

  const currentSuitability = calculateCurrentSuitability();

  return (
    <div className="measuring-instruments-form-overlay">
      <div className="measuring-instruments-form">
        <div className="measuring-instruments-form-container">
          <h2>{instrumentId ? 'Форма редактирования СИ' : 'Форма создания СИ'}</h2>
          <button 
            className="measuring-instruments-form-close-button" 
            onClick={onCloseForm}
            disabled={isSubmitting}
          >
            &times;
          </button>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="registration_number" className="form-label">
                Регистрационный номер: *
              </label>
              <input 
                type="text" 
                name="registration_number" 
                id="registration_number" 
                value={formData.registration_number} 
                onChange={handleChange} 
                className={`form-input ${formErrors.registration_number ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {formErrors.registration_number && (
                <span className="error-message">{formErrors.registration_number}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Наименование СИ: *
              </label>
              <input 
                type="text" 
                name="name" 
                id="name" 
                value={formData.name} 
                onChange={handleChange} 
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {formErrors.name && (
                <span className="error-message">{formErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="type" className="form-label">
                Тип: *
              </label>
              <input 
                type="text" 
                name="type" 
                id="type" 
                value={formData.type} 
                onChange={handleChange} 
                className={`form-input ${formErrors.type ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {formErrors.type && (
                <span className="error-message">{formErrors.type}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="serial_number" className="form-label">
                Заводской номер: *
              </label>
              <input 
                type="text" 
                name="serial_number" 
                id="serial_number" 
                value={formData.serial_number} 
                onChange={handleChange} 
                className={`form-input ${formErrors.serial_number ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {formErrors.serial_number && (
                <span className="error-message">{formErrors.serial_number}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="metrological_characteristics" className="form-label">
                Метрологические характеристики:
              </label>
              <textarea
                name="metrological_characteristics"
                id="metrological_characteristics"
                value={formData.metrological_characteristics}
                onChange={handleChange}
                className={`form-input ${formErrors.metrological_characteristics ? 'error' : ''}`}
                rows={9}
                style={{ resize: 'none', width: '100%' }}
                disabled={isSubmitting}
              />
              {formErrors.metrological_characteristics && (
                <span className="error-message">{formErrors.metrological_characteristics}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="calibration_date" className="form-label">
                Дата поверки:
              </label>
              <input 
                type="date" 
                name="calibration_date" 
                id="calibration_date" 
                value={formData.calibration_date} 
                onChange={handleChange} 
                className={`form-input ${formErrors.calibration_date ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {formErrors.calibration_date && (
                <span className="error-message">{formErrors.calibration_date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="calibration_interval" className="form-label">
                Межповерочный интервал (в месяцах):
              </label>
              <input 
                type="number" 
                name="calibration_interval" 
                id="calibration_interval" 
                value={formData.calibration_interval} 
                onChange={handleChange} 
                className={`form-input ${formErrors.calibration_interval ? 'error' : ''}`}
                min="0"
                step="1"
                disabled={isSubmitting}
              />
              {formErrors.calibration_interval && (
                <span className="error-message">{formErrors.calibration_interval}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="next_calibration_date" className="form-label">
                Годен до:
                <small style={{ marginLeft: '5px', color: '#666' }}>
                  (автоматически рассчитывается из даты поверки и интервала)
                </small>
              </label>
              <input 
                type="date" 
                name="next_calibration_date" 
                id="next_calibration_date" 
                value={formData.next_calibration_date} 
                onChange={handleChange} 
                className={`form-input ${formErrors.next_calibration_date ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {formErrors.next_calibration_date && (
                <span className="error-message">{formErrors.next_calibration_date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="year_of_manufacture" className="form-label">
                Год выпуска СИ: *
              </label>
              <input 
                type="number" 
                name="year_of_manufacture" 
                id="year_of_manufacture" 
                value={formData.year_of_manufacture} 
                onChange={handleChange} 
                className={`form-input ${formErrors.year_of_manufacture ? 'error' : ''}`}
                min="1900"
                max={new Date().getFullYear()}
                disabled={isSubmitting}
              />
              {formErrors.year_of_manufacture && (
                <span className="error-message">{formErrors.year_of_manufacture}</span>
              )}
            </div>

            <div className="form-group">
              <div className="suitability-display">
                <label className="form-label">Текущая пригодность:</label>
                <div className={`suitability-status ${currentSuitability ? 'suitable' : 'unsuitable'}`}>
                  {currentSuitability ? '✓ Годен' : '✗ Брак'}
                </div>
                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                  Пригодность автоматически определяется по дате "Годен до"
                </small>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="form-button primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Сохранение...' : (instrumentId ? 'Сохранить' : 'Создать')}
              </button>
              
              {instrumentId && (
                <button 
                  type="button" 
                  onClick={handleDelete} 
                  className="form-button delete-button"
                  disabled={isSubmitting}
                >
                  Удалить
                </button>
              )}
              
              <button 
                type="button" 
                onClick={onCloseForm} 
                className="form-button secondary"
                disabled={isSubmitting}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MeasuringInstrumentForm;