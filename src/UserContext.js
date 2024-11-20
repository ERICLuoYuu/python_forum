import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

// Mock users database - in a real app, this would be on a server
const USERS = {
  'tutor1@example.com': { role: 'tutor', name: 'Tutor One', password: 'tutor123' },
  'tutor2@example.com': { role: 'tutor', name: 'Tutor Two', password: 'tutor123' },
  'student1@example.com': { role: 'student', name: 'Student One', password: 'student123' },
  'student2@example.com': { role: 'student', name: 'Student Two', password: 'student123' },
  'student3@example.com': { role: 'student', name: 'Student Three', password: 'student123' }
};

export function UserProvider({ children }) {
  const [activeUsers, setActiveUsers] = useState(() => {
    const saved = localStorage.getItem('activeUsers');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('activeUsers', JSON.stringify(activeUsers));
  }, [activeUsers]);

  const login = (email, password) => {
    const userInfo = USERS[email];
    
    if (!userInfo) {
      throw new Error('User not found');
    }
    
    if (userInfo.password !== password) {
      throw new Error('Invalid password');
    }

    // Add user to active users if not already logged in
    if (!activeUsers.find(u => u.email === email)) {
      const newUser = {
        email,
        name: userInfo.name,
        role: userInfo.role,
        loginTime: new Date().toISOString()
      };
      setActiveUsers([...activeUsers, newUser]);
    }

    return { email, name: userInfo.name, role: userInfo.role };
  };

  const logout = (email) => {
    setActiveUsers(activeUsers.filter(u => u.email !== email));
  };

  const getActiveUsers = () => activeUsers;

  const isUserActive = (email) => activeUsers.some(u => u.email === email);

  return (
    <UserContext.Provider value={{ login, logout, getActiveUsers, isUserActive, USERS }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
