// // ParametersListPage.js

// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import ListItem from '../components/ListItem';
// import AddButton from '../components/AddButton';
// import DownloadButton from '../components/DownloadButton';
// import AuthContext from '../context/AuthContext';
// import FilterParameters from '../components/FilterParameters';
// import SubHeader from '../components/SubHeader';
// import MeasuringInstrumentsList from '../components/MeasuringInstrumentsList';
// import './ParametersListPage.css'; 

// const ParametersListPage = () => {
//   const [parameters, setParameters] = useState([]);
//   const [filterData, setFilterData] = useState({});
//   const [activeComponent, setActiveComponent] = useState('parameters');
//   const { authTokens, logoutUser } = useContext(AuthContext);

//   const getParameters = useCallback(async () => {
//     try {
//       const url = new URL('/api/filterParameters/', window.location.origin);

//       const params = new URLSearchParams();

//       if (filterData.responsible) {
//         params.append('responsible', filterData.responsible);
//       }
//       if (filterData.room) {
//         params.append('room', filterData.room);
//       }
//       if (filterData.date) {
//         params.append('date', filterData.date);
//       }
//       if (filterData.startDate && filterData.endDate) {
//         params.append('start_date', filterData.startDate);
//         params.append('end_date', filterData.endDate);
//       }

//       url.search = params.toString();

//       const response = await fetch(url.toString(), {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: 'Bearer ' + String(authTokens.access),
//         },
//       });
//       const data = await response.json();

//       if (response.status === 200) {
//         setParameters(data);
//       } else if (response.status === 401) {
//         logoutUser();
//       }
//     } catch (error) {
//       console.error('Error fetching parameters:', error);
//     }
//   }, [filterData, authTokens.access, logoutUser]);

//   useEffect(() => {
//     getParameters();
//   }, [getParameters]);

//   return (
//     <div className='page-container'>
//       <SubHeader setActiveComponent={setActiveComponent} />
//       {activeComponent === 'parameters' && (
//         <div>
//           <FilterParameters onFilterChange={setFilterData} onResetFilters={() => setFilterData({})} />
//           <div className='parameters-list'>
//             {parameters.map((parameter, index) => (
//               <ListItem key={index} parameter={parameter} />
//             ))}
//           </div>
//           <DownloadButton />
//           <AddButton />
//         </div>
//       )}
//       {activeComponent === 'measuringInstruments' && <MeasuringInstrumentsList />}
//     </div>
//   );
// };

// export default ParametersListPage;


// ParametersListPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import ListItem from '../components/ListItem';
import AddButton from '../components/AddButton';
import DownloadButton from '../components/DownloadButton';
import AuthContext from '../context/AuthContext';
import FilterParameters from '../components/FilterParameters';
import SubHeader from '../components/SubHeader';
import MeasuringInstrumentsList from '../components/MeasuringInstrumentsList';
import './ParametersListPage.css'; 

const ParametersListPage = () => {
  const [parameters, setParameters] = useState([]);
  const [filterData, setFilterData] = useState({});
  const [activeComponent, setActiveComponent] = useState('parameters');
  const { authTokens, logoutUser, user } = useContext(AuthContext);

  const getParameters = useCallback(async () => {
    try {
      const url = new URL('/api/filterParameters/', window.location.origin);

      const params = new URLSearchParams();

      if (filterData.responsible) {
        params.append('responsible', filterData.responsible);
      }
      if (filterData.room) {
        params.append('room', filterData.room);
      }
      if (filterData.date) {
        params.append('date', filterData.date);
      }
      if (filterData.startDate && filterData.endDate) {
        params.append('start_date', filterData.startDate);
        params.append('end_date', filterData.endDate);
      }

      url.search = params.toString();

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authTokens ? 'Bearer ' + String(authTokens.access) : undefined,
        },
      });
      const data = await response.json();

      if (response.status === 200) {
        setParameters(data);
      } else if (response.status === 401) {
        logoutUser();
      }
    } catch (error) {
      console.error('Error fetching parameters:', error);
    }
  }, [filterData, authTokens, logoutUser]);

  useEffect(() => {
    getParameters();
  }, [getParameters]);

  return (
    <div className='page-container'>
      <SubHeader setActiveComponent={setActiveComponent} />
      {activeComponent === 'parameters' && (
        <div>
          <FilterParameters onFilterChange={setFilterData} onResetFilters={() => setFilterData({})} />
          <div className='parameters-list'>
            {parameters.map((parameter, index) => (
              <ListItem key={index} parameter={parameter} />
            ))}
          </div>
          {user && <DownloadButton />}
          {user && <AddButton />}
        </div>
      )}
      {activeComponent === 'measuringInstruments' && <MeasuringInstrumentsList />}
    </div>
  );
};

export default ParametersListPage;