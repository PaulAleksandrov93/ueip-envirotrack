// //MeasurementInstrumentsFrom.js

// import React, { useState, useEffect, useContext } from 'react';
// import './MeasuringInstrumentsForm.css';
// import AuthContext from '../context/AuthContext';
// import ErrorMessageModal from './ErrorMessageModal';

// const MeasuringInstrumentForm = ({ instrumentId, onCloseForm }) => {
//   const { authTokens } = useContext(AuthContext);
//   const [formData, setFormData] = useState({
//     registration_number: '',
//     name: '',
//     type: '',
//     serial_number: '',
//     metrological_characteristics: '',
//     calibration_date: '',
//     calibration_interval: '',
//     next_calibration_date: '',
//     year_of_manufacture: '',
//     suitability: true,
//   });

//   // Функция для установки даты следующей поверки
  
//   const calculateNextCalibrationDate = () => {
//     const { calibration_date, calibration_interval } = formData;
//     if (calibration_date && calibration_interval) {
//       const dateParts = calibration_date.split('-');
//       const year = parseInt(dateParts[0]);
//       const month = parseInt(dateParts[1]);
//       const day = parseInt(dateParts[2]);

//       // Создаем новую дату и устанавливаем год, месяц и день
//       const nextCalibrationDate = new Date();
//       nextCalibrationDate.setFullYear(year, month - 1 + parseInt(calibration_interval), day);

//       // Вычитаем один день
//       nextCalibrationDate.setDate(nextCalibrationDate.getDate() - 1);

//       setFormData(prevState => ({
//         ...prevState,
//         next_calibration_date: nextCalibrationDate.toISOString().split('T')[0],
//       }));
//     }
//   };

//   useEffect(() => {
//     calculateNextCalibrationDate();
//   }, [formData.calibration_date, formData.calibration_interval]);

//   // useEffect(() => {
//   //   calculateNextCalibrationDate();
//   //   const currentDate = new Date();
//   //   const nextCalibrationDate = new Date(formData.next_calibration_date);
//   //   if (nextCalibrationDate < currentDate) {
//   //     setFormData({
//   //       ...formData,
//   //       suitability: false,
//   //     });
//   //   }
//   // }, [formData.calibration_date, formData.next_calibration_date]);



//   const [formErrors, setFormErrors] = useState({});

//   useEffect(() => {
//     if (instrumentId) {
//       fetch(`/api/measurement_instrument_types/${instrumentId}/`, {
//         headers: {
//           Authorization: 'Bearer ' + authTokens.access,
//         },
//       })
//         .then((response) => response.json())
//         .then((data) => setFormData(data))
//         .catch((error) => console.error('Error:', error));
//     }
//   }, [instrumentId, authTokens.access]);

//   // const handleChange = (e) => {
//   //   const { name, value } = e.target;
//   //   if (name === 'next_calibration_date') {
//   //     const nextCalibrationDate = new Date(value);
//   //     const currentDate = new Date();
//   //     if (nextCalibrationDate < currentDate) {
//   //       // Если дата следующей поверки меньше текущей даты, предотвратить обновление пригодности
//   //       return;
//   //     }
//   //   }
//   //   setFormData({
//   //     ...formData,
//   //     [name]: value,
//   //   });
//   // };
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     if (name === 'next_calibration_date') {
//       const nextCalibrationDate = new Date(value);
//       const currentDate = new Date();
//       if (nextCalibrationDate < currentDate) {
//         // Если дата следующей поверки меньше текущей даты, снимаем галочку и блокируем поле
//         setFormData({
//           ...formData,
//           suitability: false,
//         });
//         return;
//       }
//     }
//     // Если дата следующей поверки больше или равна текущей дате, разблокируем поле
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };


//   const validateForm = () => {
//     const errors = {};
//     Object.keys(formData).forEach((key) => {
//       // Игнорируем проверку для поля "Пригодность СИ"
//       if (key !== 'next_calibration_date' && key !== 'suitability' && !formData[key]) {
//         errors[key] = true;
//       }
//     });
//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const isFormValid = validateForm();
//     if (isFormValid) {
//       try {
//         const url = instrumentId ? `/api/measurement_instrument_types/${instrumentId}/` : '/api/measurement_instrument_types/';
//         const method = instrumentId ? 'PUT' : 'POST';
//         const response = await fetch(url, {
//           method: method,
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: 'Bearer ' + authTokens.access,
//           },
//           body: JSON.stringify(formData),
//         });
//         if (!response.ok) {
//           throw new Error('Ошибка сохранения владельца');
//         }
//         onCloseForm();
//       } catch (error) {
//         console.error('Ошибка:', error);
//       }
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       const url = `/api/measurement_instrument_types/${instrumentId}/`;
//       const response = await fetch(url, {
//         method: 'DELETE',
//         headers: {
//           Authorization: 'Bearer ' + authTokens.access,
//         },
//       });
//       if (!response.ok) {
//         throw new Error('Ошибка удаления владельца');
//       }
//       onCloseForm();
//     } catch (error) {
//       console.error('Ошибка:', error);
//     }
//   };

//   return (
//     <div className="measuring-instruments-form-overlay">
//       <div className="measuring-instruments-form">
//         <div className="measuring-instruments-form-container">
//           <h2>{instrumentId ? 'Форма редактирования вспомогательного СИ' : 'Форма создания вспомогательного СИ'}</h2>
//           <button className="measuring-instruments-form-close-button" onClick={onCloseForm}>
//             &times;
//           </button>
//           <form onSubmit={handleSubmit}>
//             <label htmlFor="registration_number" className="form-label">
//               Регистрационный номер:
//               <input type="text" name="registration_number" id="registration_number" value={formData.registration_number} onChange={handleChange} className={`form-input ${formErrors.registration_number ? 'error' : ''}`} />
//             </label>
//             <label htmlFor="name" className="form-label">
//               Наименование СИ:
//               <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`form-input ${formErrors.name ? 'error' : ''}`} />
//             </label>
//             <label htmlFor="type" className="form-label">
//               Тип:
//               <input type="text" name="type" id="type" value={formData.type} onChange={handleChange} className={`form-input ${formErrors.type ? 'error' : ''}`} />
//             </label>
//             <label htmlFor="serial_number" className="form-label">
//               Заводской номер:
//               <input type="text" name="serial_number" id="serial_number" value={formData.serial_number} onChange={handleChange} className={`form-input ${formErrors.serial_number ? 'error' : ''}`} />
//             </label>
//             <label htmlFor="metrological_characteristics" className="form-label">
//               Метрологические характеристики:
//               <input type="text" name="metrological_characteristics" id="metrological_characteristics" value={formData.metrological_characteristics} onChange={handleChange} className={`form-input ${formErrors.metrological_characteristics ? 'error' : ''}`} />
//             </label>
//             <label htmlFor="calibration_date" className="form-label">
//               Дата поверки:
//               <input type="date" name="calibration_date" id="calibration_date" value={formData.calibration_date} onChange={handleChange} className={`form-input ${formErrors.calibration_date ? 'error' : ''}`} />
//             </label>
//             <label htmlFor="calibration_interval" className="form-label">
//               Межповерочный интервал (в месяцах):
//               <input type="number" name="calibration_interval" id="calibration_interval" value={formData.calibration_interval} onChange={handleChange} className={`form-input ${formErrors.calibration_interval ? 'error' : ''}`} />
//             </label>
//             <label htmlFor="next_calibration_date" className="form-label">
//               Дата следующей поверки:
//               <input type="date" name="next_calibration_date" id="next_calibration_date" value={formData.next_calibration_date} onChange={handleChange} className="form-input" />
//             </label>
//             <label htmlFor="year_of_manufacture" className="form-label">
//               Год выпуска СИ:
//               <input type="number" name="year_of_manufacture" id="year_of_manufacture" value={formData.year_of_manufacture} onChange={handleChange} className={`form-input ${formErrors.year_of_manufacture ? 'error' : ''}`} />
//             </label>
//             <label htmlFor="suitability" className="form-label">
//               Пригодность СИ:
//               <input
//                 type="checkbox"
//                 name="suitability"
//                 id="suitability"
//                 checked={formData.suitability}
//                 onChange={(e) => setFormData({ ...formData, suitability: e.target.checked })}
//                 className="form-checkbox"
//               />
//             </label>
//             <button type="submit" className="form-button">
//               {instrumentId ? 'Сохранить' : 'Создать'}
//             </button>
//             {instrumentId && (
//               <button type="button" className="delete-button" onClick={handleDelete}>
//                 Удалить
//               </button>
//             )}
//           </form>
//         </div>
//       </div>
//       {Object.keys(formErrors).length > 0 && (
//         <ErrorMessageModal message="Заполните все поля" onClose={() => setFormErrors({})} />
//       )}
//     </div>
//   );
// };

// export default MeasuringInstrumentForm;


import React, { useState, useEffect, useContext } from 'react';
import './MeasuringInstrumentsForm.css';
import AuthContext from '../context/AuthContext';
import ErrorMessageModal from './ErrorMessageModal';

const MeasuringInstrumentForm = ({ instrumentId, onCloseForm }) => {
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
    suitability: true,
  });

  const calculateNextCalibrationDate = () => {
    const { calibration_date, calibration_interval } = formData;
    if (calibration_date && calibration_interval) {
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

  useEffect(() => {
    calculateNextCalibrationDate();
  }, [formData.calibration_date, formData.calibration_interval]);

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (instrumentId) {
      fetch(`/api/measurement_instrument_types/${instrumentId}/`, {
        headers: {
          Authorization: 'Bearer ' + authTokens.access,
        },
      })
        .then((response) => response.json())
        .then((data) => setFormData(data))
        .catch((error) => console.error('Error:', error));
    }
  }, [instrumentId, authTokens.access]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === 'next_calibration_date') {
      const nextCalibrationDate = new Date(value);
      const currentDate = new Date();
      if (nextCalibrationDate < currentDate) {
        setFormData(prevState => ({
          ...prevState,
          suitability: false,
        }));
      }
    }
  };

  useEffect(() => {
    const nextCalibrationDate = new Date(formData.next_calibration_date);
    const currentDate = new Date();
    if (nextCalibrationDate < currentDate) {
      setFormData(prevState => ({
        ...prevState,
        suitability: false,
      }));
    }
  }, [formData.next_calibration_date]);

  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'next_calibration_date' && key !== 'suitability' && !formData[key]) {
        errors[key] = true;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isFormValid = validateForm();
    if (isFormValid) {
      try {
        const url = instrumentId ? `/api/measurement_instrument_types/${instrumentId}/` : '/api/measurement_instrument_types/';
        const method = instrumentId ? 'PUT' : 'POST';
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authTokens.access,
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error('Ошибка сохранения владельца');
        }
        onCloseForm();
      } catch (error) {
        console.error('Ошибка:', error);
      }
    }
  };

  const handleDelete = async () => {
    try {
      const url = `/api/measurement_instrument_types/${instrumentId}/`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + authTokens.access,
        },
      });
      if (!response.ok) {
        throw new Error('Ошибка удаления владельца');
      }
      onCloseForm();
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  return (
    <div className="measuring-instruments-form-overlay">
      <div className="measuring-instruments-form">
        <div className="measuring-instruments-form-container">
          <h2>{instrumentId ? 'Форма редактирования вспомогательного СИ' : 'Форма создания вспомогательного СИ'}</h2>
          <button className="measuring-instruments-form-close-button" onClick={onCloseForm}>
            &times;
          </button>
          <form onSubmit={handleSubmit}>
            <label htmlFor="registration_number" className="form-label">
              Регистрационный номер:
              <input type="text" name="registration_number" id="registration_number" value={formData.registration_number} onChange={handleChange} className={`form-input ${formErrors.registration_number ? 'error' : ''}`} />
            </label>
            <label htmlFor="name" className="form-label">
              Наименование СИ:
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`form-input ${formErrors.name ? 'error' : ''}`} />
            </label>
            <label htmlFor="type" className="form-label">
              Тип:
              <input type="text" name="type" id="type" value={formData.type} onChange={handleChange} className={`form-input ${formErrors.type ? 'error' : ''}`} />
            </label>
            <label htmlFor="serial_number" className="form-label">
              Заводской номер:
              <input type="text" name="serial_number" id="serial_number" value={formData.serial_number} onChange={handleChange} className={`form-input ${formErrors.serial_number ? 'error' : ''}`} />
            </label>
            <label htmlFor="metrological_characteristics" className="form-label">
              Метрологические характеристики:
              <input type="text" name="metrological_characteristics" id="metrological_characteristics" value={formData.metrological_characteristics} onChange={handleChange} className={`form-input ${formErrors.metrological_characteristics ? 'error' : ''}`} />
            </label>
            <label htmlFor="calibration_date" className="form-label">
              Дата поверки:
              <input type="date" name="calibration_date" id="calibration_date" value={formData.calibration_date} onChange={handleChange} className={`form-input ${formErrors.calibration_date ? 'error' : ''}`} />
            </label>
            <label htmlFor="calibration_interval" className="form-label">
              Межповерочный интервал (в месяцах):
              <input type="number" name="calibration_interval" id="calibration_interval" value={formData.calibration_interval} onChange={handleChange} className={`form-input ${formErrors.calibration_interval ? 'error' : ''}`} />
            </label>
            <label htmlFor="next_calibration_date" className="form-label">
              Дата следующей поверки:
              <input type="date" name="next_calibration_date" id="next_calibration_date" value={formData.next_calibration_date} onChange={handleChange} className="form-input" />
            </label>
            <label htmlFor="year_of_manufacture" className="form-label">
              Год выпуска СИ:
              <input type="number" name="year_of_manufacture" id="year_of_manufacture" value={formData.year_of_manufacture} onChange={handleChange} className={`form-input ${formErrors.year_of_manufacture ? 'error' : ''}`} />
            </label>
            <div className="suitability-container">
              <label htmlFor="suitability" className="suitability-label">
                Пригодность СИ (годен/брак):
              </label>
              <input
                type="checkbox"
                name="suitability"
                id="suitability"
                checked={formData.suitability}
                onChange={(e) => setFormData({ ...formData, suitability: e.target.checked })}
                className="form-checkbox"
                disabled={formData.suitability === false}
              />
            </div>
            <button type="submit" className="form-button">
              {instrumentId ? 'Сохранить' : 'Создать'}
            </button>
            {instrumentId && (
              <button type="button" onClick={handleDelete} className="form-button delete-button">
                Удалить
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default MeasuringInstrumentForm;