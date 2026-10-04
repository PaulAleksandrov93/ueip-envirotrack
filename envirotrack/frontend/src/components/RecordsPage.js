import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { FiDownload, FiInbox, FiPlus } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import usePersistentFilters, { filtersToQuery } from '../hooks/usePersistentFilters';
import FilterPanel from './FilterPanel';
import SubHeader from './SubHeader';
import './RecordCard.css';

const RecordsPage = ({ scope, title, endpoint, exportUrl, exportName, newPath, ItemComponent }) => {
  const { authTokens, logoutUser, user } = useContext(AuthContext);
  const { filters, setFilters, resetFilters, ready, responsibleId, saveState } = usePersistentFilters(scope);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const entityKey = scope === 'buildings' ? 'buildings' : 'rooms';
  const query = filtersToQuery(filters, entityKey);
  const accessToken = authTokens?.access;

  useEffect(() => {
    if (!ready) return undefined;
    const controller = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const response = await fetch(`${endpoint}?${query}`, {
          headers: accessToken ? { Authorization: 'Bearer ' + String(accessToken) } : {},
          signal: controller.signal,
        });
        if (response.status === 401) {
          logoutUser();
          return;
        }
        setRecords(response.ok ? await response.json() : []);
        setLoading(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setRecords([]);
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
    // Token refreshes every few minutes; refetching on each refresh would reset the scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, query, ready]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(exportUrl);
      saveAs(await response.blob(), exportName());
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <SubHeader />
      <main className='page'>
        <div className='page-toolbar'>
          <h1 className='page-toolbar__title'>{title}</h1>
          <div className='page-toolbar__actions'>
            {user && (
              <button type='button' className='btn btn--secondary' onClick={handleExport} disabled={exporting}>
                <FiDownload /> {exporting ? 'Готовим файл…' : 'Выгрузить в Excel'}
              </button>
            )}
            {user && (
              <Link to={newPath} className='btn btn--primary'>
                <FiPlus /> Новая запись
              </Link>
            )}
          </div>
        </div>

        <FilterPanel
          scope={scope}
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          responsibleId={responsibleId}
          saveState={saveState}
          total={records.length}
          loading={loading}
        />

        {loading && records.length === 0 ? (
          <div className='records'>
            <div className='skeleton' />
            <div className='skeleton' />
            <div className='skeleton' />
          </div>
        ) : records.length === 0 ? (
          <div className='card empty-state'>
            <FiInbox />
            <h3>Записей не найдено</h3>
            <p>Измените условия фильтра или сбросьте его.</p>
          </div>
        ) : (
          <div className={`records ${loading ? 'is-refreshing' : ''}`}>
            {records.map((record) => (
              <ItemComponent key={record.id} parameter={record} />
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default RecordsPage;
