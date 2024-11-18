import React, { useState, useEffect } from 'react';
import { verifyEmail } from '../services/auth';
import { useNotification } from '../NotificationManager';

export function EmailVerification({ code }) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail(code);
        addNotification('Email verified successfully!', 'success');
        setIsVerifying(false);
      } catch (error) {
        setError(error.message);
        addNotification('Failed to verify email', 'error');
        setIsVerifying(false);
      }
    };

    verify();
  }, [code, addNotification]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {isVerifying ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Verifying your email...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-green-500 text-xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Email Verified</h2>
            <p className="text-gray-600">You can now close this window and login to your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
