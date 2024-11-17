// src/components/ui/alert.jsx
import React from 'react';

export const Alert = ({ children, className = '' }) => (
  <div className={`bg-yellow-50 p-4 rounded-md border border-yellow-200 ${className}`}>
    {children}
  </div>
);

export const AlertDescription = ({ children, className = '' }) => (
  <div className={`text-sm text-yellow-800 ${className}`}>{children}</div>
);
