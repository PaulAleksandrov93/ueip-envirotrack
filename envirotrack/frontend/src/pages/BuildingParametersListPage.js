// // BuildingParametersListPage.js

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
//   const [parameters, setBuildingParameters] = useState([]);
//   const [filterData, setFilterData] = useState({});
//   const [activeComponent, setActiveComponent] = useState('buildingParameters');
//   const { authTokens, logoutUser, user } = useContext(AuthContext);

//   const getBuildingParameters = useCallback(async () => {
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
//           Authorization: authTokens ? 'Bearer ' + String(authTokens.access) : undefined,
//         },
//       });
//       const data = await response.json();

//       if (response.status === 200) {
//         setBuildingParameters(data);
//       } else if (response.status === 401) {
//         logoutUser();
//       }
//     } catch (error) {
//       console.error('Error fetching building parameters:', error);
//     }
//   }, [filterData, authTokens, logoutUser]);

//   useEffect(() => {
//     getBuildingParameters();
//   }, [getBuildingParameters]);

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
//           {user && <DownloadButtonBuilding />}
//           {user && <AddButtonBuilding />}
//         </div>
//       )}
//       {activeComponent === 'measuringInstruments' && <MeasuringInstrumentsList />}
//     </div>
//   );
// };

// export default BuildingParametersListPage;

import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import ListItemBuilding from '../components/ListItemBuilding';
import AddButtonBuilding from '../components/AddButtonBuilding';
import DownloadButtonBuilding from '../components/DownloadButtonBuilding';
import AuthContext from '../context/AuthContext';
import FilterParametersBuilding from '../components/FilterParametersBuilding';
import SubHeader from '../components/SubHeader';
import MeasuringInstrumentsList from '../components/MeasuringInstrumentsList';
import './ParametersListPage.css';

const BuildingParametersListPage = () => {
  const [allParameters, setAllParameters] = useState([]); // Все загруженные параметры
  const [displayedParameters, setDisplayedParameters] = useState([]); // Отображаемые параметры
  const [filterData, setFilterData] = useState({});
  const [activeComponent, setActiveComponent] = useState('buildingParameters');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { authTokens, logoutUser, user } = useContext(AuthContext);
  const observer = useRef();
  const pageSize = 50; // Количество элементов на странице

  // Загрузка всех данных
  const getBuildingParameters = useCallback(async () => {
    setIsLoading(true);
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
        setAllParameters(data);
        // Первоначальная загрузка первых N элементов
        setDisplayedParameters(data.slice(0, pageSize));
        setHasMore(data.length > pageSize);
      } else if (response.status === 401) {
        logoutUser();
      }
    } catch (error) {
      console.error('Error fetching building parameters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterData, authTokens, logoutUser]);

  // Эффект для загрузки данных при изменении фильтров
  useEffect(() => {
    getBuildingParameters();
    setPage(1);
  }, [filterData, getBuildingParameters]);

  // Функция для загрузки следующей "страницы"
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const endIndex = nextPage * pageSize;
      
      // "Подгружаем" следующую порцию данных из уже загруженных
      const newParameters = allParameters.slice(0, endIndex);
      
      setDisplayedParameters(newParameters);
      setPage(nextPage);
      setHasMore(endIndex < allParameters.length);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, allParameters, pageSize]);

  // Обработчик бесконечной прокрутки
  const lastItemRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMore]);

  return (
    <div className='page-container'>
      <SubHeader setActiveComponent={setActiveComponent} />
      {activeComponent === 'buildingParameters' && (
        <div>
          <FilterParametersBuilding 
            onFilterChange={setFilterData} 
            onResetFilters={() => setFilterData({})} 
          />
          <div className='parameters-list'>
            {displayedParameters.map((parameter, index) => {
              if (displayedParameters.length === index + 1) {
                return (
                  <div ref={lastItemRef} key={index}>
                    <ListItemBuilding parameter={parameter} />
                  </div>
                );
              }
              return <ListItemBuilding key={index} parameter={parameter} />;
            })}
            {isLoading && <div className="loading-indicator">Загрузка...</div>}
            {!hasMore && allParameters.length > 0 && (
              <div className="end-of-list">
                Все записи загружены ({allParameters.length})
              </div>
            )}
            {!isLoading && allParameters.length === 0 && (
              <div className="no-results">Нет данных для отображения</div>
            )}
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
