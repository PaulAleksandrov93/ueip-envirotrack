import React, { useContext, useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import { FiDownload, FiX } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { filtersToQuery } from '../hooks/usePersistentFilters';
import FilterPanel from './FilterPanel';
import './ExportDialog.css';

const filenameFrom = (response, fallback) => {
  const header = response.headers.get('Content-Disposition') || '';
  const match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const ExportDialog = ({ scope, title, exportUrl, fallbackName, initialFilters, responsibleId, onClose }) => {
  const { authTokens } = useContext(AuthContext);
  const [filters, setFilters] = useState(initialFilters);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const entityKey = scope === 'buildings' ? 'buildings' : 'rooms';

  const download = async () => {
    setDownloading(true);
    setError('');
    try {
      const response = await fetch(`${exportUrl}?${filtersToQuery(filters, entityKey)}`, {
        headers: authTokens ? { Authorization: 'Bearer ' + String(authTokens.access) } : {},
      });
      if (!response.ok) throw new Error(String(response.status));
      saveAs(await response.blob(), filenameFrom(response, fallbackName()));
      onClose();
    } catch {
      setError('Не удалось сформировать файл. Попробуйте ещё раз или сузьте период.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className='modal-overlay' onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className='export-dialog' role='dialog' aria-modal='true' aria-labelledby='export-dialog-title'>
        <header className='export-dialog__head'>
          <div>
            <h2 id='export-dialog-title'>Выгрузка в Excel</h2>
            <p className='muted'>{title}. По умолчанию — условия текущего фильтра списка.</p>
          </div>
          <button type='button' className='btn btn--ghost btn--icon btn--sm' onClick={onClose} aria-label='Закрыть'>
            <FiX />
          </button>
        </header>

        <FilterPanel
          scope={scope}
          filters={filters}
          onChange={(update) => setFilters((prev) => (typeof update === 'function' ? update(prev) : update))}
          responsibleId={responsibleId}
          embedded
        />

        {error && <div className='export-dialog__error'>{error}</div>}

        <footer className='export-dialog__foot'>
          <button type='button' className='btn btn--secondary' onClick={onClose}>
            Отмена
          </button>
          <button type='button' className='btn btn--primary' onClick={download} disabled={downloading}>
            <FiDownload /> {downloading ? 'Формируем файл…' : 'Скачать Excel'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ExportDialog;
