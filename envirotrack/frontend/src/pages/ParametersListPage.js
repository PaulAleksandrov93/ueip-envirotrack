// ParametersListPage.js

import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import ListItem from '../components/ListItem';
import AddButton from '../components/AddButton';
import DownloadButton from '../components/DownloadButton';
import AuthContext from '../context/AuthContext';
import FilterParameters from '../components/FilterParameters';
import SubHeader from '../components/SubHeader';
import MeasuringInstrumentsList from '../components/MeasuringInstrumentsList';
import './ParametersListPage.css';

// Хук для работы с пользовательскими настройками
const useUserSettings = (user) => {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`user_settings_${user.user_id}`);
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch (error) {
          console.error('Error parsing user settings:', error);
        }
      }
    }
  }, [user]);

  const saveSettings = (newSettings) => {
    if (!user) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem(
        `user_settings_${user.user_id}`, 
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  return [settings, saveSettings];
};

const ParametersListPage = () => {
  const [displayedParameters, setDisplayedParameters] = useState([]);
  const [filterData, setFilterData] = useState({});
  const [activeComponent, setActiveComponent] = useState('parameters');
  
  // Состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const { authTokens, logoutUser, user } = useContext(AuthContext);
  const observer = useRef();
  const pageSize = 30; // Уменьшил до 30 для производительности

  const [userSettings, saveUserSettings] = useUserSettings(user);

  useEffect(() => {
    if (userSettings.filters) {
      setFilterData(userSettings.filters);
    }
  }, [userSettings.filters]);

  const handleFilterChange = (newFilterData) => {
    setFilterData(newFilterData);
    saveUserSettings({ filters: newFilterData });
  };

  const handleResetFilters = () => {
    const emptyFilters = {};
    setFilterData(emptyFilters);
    saveUserSettings({ filters: emptyFilters });
  };

  // Основная функция загрузки данных
  const getParameters = useCallback(async (page = 1, append = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL('/api/parameters/', window.location.origin);
      const params = new URLSearchParams();

      if (filterData.responsible) {
        params.append('responsible', filterData.responsible);
      }
      if (filterData.room) {
      // Отправляем как room_number (так как в FilterParameters передается room_number)
        params.append('room_number', filterData.room);
      }
      if (filterData.date) {
        params.append('date', filterData.date);
      }
      if (filterData.startDate && filterData.endDate) {
        params.append('start_date', filterData.startDate);
        params.append('end_date', filterData.endDate);
      }
      
      // Ключевое: передаем параметры пагинации на сервер
      params.append('page', page);
      params.append('page_size', pageSize);

      url.search = params.toString();

      console.log('Fetching:', url.toString()); // Для отладки

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authTokens ? 'Bearer ' + String(authTokens.access) : undefined,
        },
      });
      
      const data = await response.json();

      if (response.status === 200) {
        // Проверяем формат ответа
        let parametersList;
        let total;
        let nextPage;
        
        if (data.results !== undefined) {
          // Новый формат с пагинацией
          parametersList = data.results;
          total = data.count || 0;
          nextPage = data.next;
          console.log(`Loaded ${parametersList.length} of ${total} records`); // Для отладки
        } else {
          // Старый формат без пагинации
          parametersList = data;
          total = data.length || 0;
          nextPage = null;
          console.log(`Loaded ${parametersList.length} records (no pagination)`); // Для отладки
        }
        
        if (append) {
          setDisplayedParameters(prev => [...prev, ...parametersList]);
        } else {
          setDisplayedParameters(parametersList);
        }
        
        setTotalCount(total);
        setTotalPages(Math.ceil(total / pageSize));
        setHasMore(!!nextPage);
        setCurrentPage(page);
        
      } else if (response.status === 401) {
        logoutUser();
      } else {
        setError(`Ошибка сервера: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching parameters:', error);
      setError('Ошибка загрузки данных. Проверьте соединение.');
    } finally {
      setIsLoading(false);
    }
  }, [filterData, authTokens, logoutUser, pageSize]);

  // Загрузка при изменении фильтров
  useEffect(() => {
    getParameters(1, false);
  }, [filterData, getParameters]);

  // Функция для загрузки следующей страницы
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    getParameters(currentPage + 1, true);
  }, [currentPage, isLoading, hasMore, getParameters]);

  // Обработчик бесконечной прокрутки
  const lastItemRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMore]);

  return (
    <div className='page-container'>
      <SubHeader setActiveComponent={setActiveComponent} />
      {activeComponent === 'parameters' && (
        <div>
          <FilterParameters 
            onFilterChange={handleFilterChange} 
            onResetFilters={handleResetFilters}
            initialFilters={userSettings.filters || {}}
          />
          
          {/* Информация о пагинации */}
          <div className="pagination-info">
            <span>Всего записей: {totalCount}</span>
            {totalPages > 1 && <span> | Страница {currentPage} из {totalPages}</span>}
            {isLoading && <span className="loading-text"> | Загрузка...</span>}
          </div>
          
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => getParameters(1, false)} className="retry-btn">
                Повторить
              </button>
            </div>
          )}
          
          <div className='parameters-list'>
            {displayedParameters.map((parameter, index) => {
              if (displayedParameters.length === index + 1 && hasMore) {
                return (
                  <div ref={lastItemRef} key={parameter.id || index}>
                    <ListItem parameter={parameter} />
                  </div>
                );
              }
              return <ListItem key={parameter.id || index} parameter={parameter} />;
            })}
            
            {isLoading && displayedParameters.length === 0 && (
              <div className="loading-indicator">Загрузка данных...</div>
            )}
            
            {!hasMore && displayedParameters.length > 0 && (
              <div className="end-of-list">
                Все записи загружены ({displayedParameters.length} из {totalCount})
              </div>
            )}
            
            {displayedParameters.length === 0 && !isLoading && !error && (
              <div className="no-results">
                Записи не найдены. Попробуйте изменить фильтры.
              </div>
            )}
          </div>
          
          {/* Кнопки пагинации */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                onClick={() => getParameters(currentPage - 1, false)}
                disabled={currentPage <= 1 || isLoading}
                className="pagination-btn"
              >
                Назад
              </button>
              
              <span className="page-info">
                Страница {currentPage} из {totalPages}
              </span>
              
              <button 
                onClick={() => getParameters(currentPage + 1, false)}
                disabled={currentPage >= totalPages || isLoading}
                className="pagination-btn"
              >
                Вперед
              </button>
            </div>
          )}
          
          {user && <DownloadButton />}
          {user && <AddButton />}
        </div>
      )}
      {activeComponent === 'measuringInstruments' && <MeasuringInstrumentsList />}
    </div>
  );
};

export default ParametersListPage;