// BuildingParametersListPage.js

// import React, { useState, useEffect, useContext, useCallback  } from 'react';
// import ListItemBuilding from '../components/ListItemBuilding';
// import AddButtonBuilding from '../components/AddButtonBuilding';
// import DownloadButtonBuilding from '../components/DownloadButtonBuilding';
// import AuthContext from '../context/AuthContext';
// import FilterParametersBuilding from '../components/FilterParametersBuilding';
// import SubHeader from '../components/SubHeader';
// import MeasuringInstrumentsList from '../components/MeasuringInstrumentsList';
// import './ParametersListPage.css'; 

// const BuildingParametersListPage = () => {
//   const [parameters, setParameters] = useState([]);
//   const [filterData, setFilterData] = useState({});
//   const [activeComponent, setActiveComponent] = useState('buildingParameters');
//   const { authTokens, logoutUser } = useContext(AuthContext);

//   const getParameters = useCallback(async () => {
//     try {
//       const url = new URL('/api/filterBuildingParameters/', window.location.origin);

//       const params = new URLSearchParams();

//       if (filterData.responsible) {
//         params.append('responsible', filterData.responsible);
//       }
//       if (filterData.building) {
//         params.append('building', filterData.building);
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
//       {activeComponent === 'buildingParameters' && (
//         <div>
//           <FilterParametersBuilding onFilterChange={setFilterData} onResetFilters={() => setFilterData({})} />
//           <div className='parameters-list'>
//             {parameters.map((parameter, index) => (
//               <ListItemBuilding key={index} parameter={parameter} />
//             ))}
//           </div>
//           <DownloadButtonBuilding />
//           <AddButtonBuilding />
//         </div>
//       )}
//       {activeComponent === 'measuringInstruments' && <MeasuringInstrumentsList />}
//     </div>
//   );
// };

// export default BuildingParametersListPage;

// BuildingParametersListPage.js
import React, { useState, useEffect, useContext, useCallback  } from 'react';
import ListItemBuilding from '../components/ListItemBuilding';
import AddButtonBuilding from '../components/AddButtonBuilding';
import DownloadButtonBuilding from '../components/DownloadButtonBuilding';
import AuthContext from '../context/AuthContext';
import FilterParametersBuilding from '../components/FilterParametersBuilding';
import SubHeader from '../components/SubHeader';
import MeasuringInstrumentsList from '../components/MeasuringInstrumentsList';
import './ParametersListPage.css'; 

const BuildingParametersListPage = () => {
  const [parameters, setBuildingParameters] = useState([]);
  const [filterData, setFilterData] = useState({});
  const [activeComponent, setActiveComponent] = useState('buildingParameters');
  const { authTokens, logoutUser, user } = useContext(AuthContext);

  const getBuildingParameters = useCallback(async () => {
    try {
      const url = new URL('/api/filterBuildingParameters/', window.location.origin);

      const params = new URLSearchParams();

      if (filterData.responsible) {
        params.append('responsible', filterData.responsible);
      }
      if (filterData.building) {
        params.append('building', filterData.building);
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
        setBuildingParameters(data);
      } else if (response.status === 401) {
        logoutUser();
      }
    } catch (error) {
      console.error('Error fetching building parameters:', error);
    }
  }, [filterData, authTokens, logoutUser]);

  useEffect(() => {
    getBuildingParameters();
  }, [getBuildingParameters]);

  return (
    <div className='page-container'>
      <SubHeader setActiveComponent={setActiveComponent} />
      {activeComponent === 'buildingParameters' && (
        <div>
          <FilterParametersBuilding onFilterChange={setFilterData} onResetFilters={() => setFilterData({})} />
          <div className='parameters-list'>
            {parameters.map((parameter, index) => (
              <ListItemBuilding key={index} parameter={parameter} />
            ))}
          </div>
          {user && <DownloadButtonBuilding />}
          {user && <AddButtonBuilding />}
        </div>
      )}
      {activeComponent === 'measuringInstruments' && <MeasuringInstrumentsList />}
    </div>
  );
};

export default BuildingParametersListPage;

