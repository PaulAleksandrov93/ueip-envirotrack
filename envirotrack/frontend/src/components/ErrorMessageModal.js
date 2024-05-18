// ErrorMessageModal.js

import React from 'react';
import './ErrorMessageModal.css';

const ErrorMessageModal = ({ message, onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <p className="error-message">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessageModal;