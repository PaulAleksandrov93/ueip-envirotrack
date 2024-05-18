// DownloadButton.js

import React from 'react';
import { saveAs } from 'file-saver';
import './DownloadButton.css';

const DownloadButton = () => {
  const handleDownload = async () => {
    const confirmation = window.confirm('Вы уверены, что хотите скачать файл?');
    if (confirmation) {
      try {
        const response = await fetch('/api/export-parameters/');
        const blob = await response.blob();
        saveAs(blob, 'env_records.xlsx');
      } catch (error) {
        console.error('Ошибка при загрузке файла:', error);
      }
    }
  };

  return (
    <button className="download-button" onClick={handleDownload}>
      <svg className="download-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#4CAF50" />
        <text x="50%" y="65%" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#FFFFFF">
          Excel
        </text>
      </svg>
    </button>
  );
};

export default DownloadButton;