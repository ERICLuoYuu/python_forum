import React from 'react';
import { useUser } from '../contexts/UserContext';

export function ActiveUsers() {
  const { getActiveUsers } = useUser();
  const activeUsers = getActiveUsers();

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold mb-2">Active Users</h2>
      <div className="space-y-2">
        {activeUsers.map(user => (
          <div 
            key={user.email}
            className={`flex items-center gap-2 ${
              user.role === 'tutor' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>{user.name}</span>
            <span className="text-sm text-gray-400">({user.role})</span>
          </div>
        ))}
        {activeUsers.length === 0 && (
          <p className="text-gray-500 text-sm">No active users</p>
        )}
      </div>
    </div>
  );
}
