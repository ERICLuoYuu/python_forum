// src/components/ui/card.jsx
import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-4 border-b ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

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
