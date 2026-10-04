// DownloadButtonBuilding.js (для зданий)

import React from 'react';
import { saveAs } from 'file-saver';
import './DownloadButton.css';

const DownloadButtonBuilding = () => {
  const handleDownload = async () => {
    const confirmation = window.confirm('Вы уверены, что хотите скачать файл с параметрами зданий?');
    if (confirmation) {
      try {
        const response = await fetch('/api/export-parameters-buildings/');
        const blob = await response.blob();
        
        const currentDate = new Date().toLocaleDateString('ru-RU');
        const filename = `Параметры по зданиям от ${currentDate}.xlsx`;
        
        saveAs(blob, filename);
      } catch (error) {
        console.error('Ошибка при загрузке файла:', error);
      }
    }
  };

  return (
    <button className="download-button" onClick={handleDownload} title="Скачать параметры зданий">
      <svg className="download-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#27ae60" />
        <text x="50%" y="65%" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#FFFFFF">
          Excel
        </text>
      </svg>
    </button>
  );
};

export default DownloadButtonBuilding;