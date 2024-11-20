import React, { useState, useEffect, createContext, useContext } from 'react';

// Create User Context
const UserContext = createContext();

// Mock users database
const USERS = {
  'tutor1@example.com': { role: 'tutor', name: 'Tutor One', password: 'tutor123' },
  'tutor2@example.com': { role: 'tutor', name: 'Tutor Two', password: 'tutor123' },
  'student1@example.com': { role: 'student', name: 'Student One', password: 'student123' },
  'student2@example.com': { role: 'student', name: 'Student Two', password: 'student123' }
};

// Custom hook for User Context
const useUser = () => useContext(UserContext);

// User Provider Component
function UserProvider({ children }) {
  const [activeUsers, setActiveUsers] = useState(() => {
    const saved = localStorage.getItem('activeUsers');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('activeUsers', JSON.stringify(activeUsers));
  }, [activeUsers]);

  const login = (email, password) => {
    const userInfo = USERS[email];
    if (!userInfo) throw new Error('User not found');
    if (userInfo.password !== password) throw new Error('Invalid password');

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

  const value = {
    login,
    logout,
    activeUsers,
    getActiveUsers: () => activeUsers
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

function ActiveUsers() {
  const { activeUsers } = useUser();

  return (
    <div className="bg-white shadow rounded-lg p-4">
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

function Forum() {
  const { login, logout } = useUser();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userInfo = await login(loginForm.email, loginForm.password);
      setUser(userInfo);
      setShowLogin(false);
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    if (user) {
      logout(user.email);
      setUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Python Q&A Forum</h1>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span>Welcome, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Login
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <ActiveUsers />
          </div>
          <div className="col-span-3">
            {!user ? (
              <div className="bg-white rounded-lg p-6 shadow">
                <p>Please log in to participate in discussions.</p>
              </div>
            ) : (
              <div>
                {/* Forum content goes here */}
                <p>Forum content will be added here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Login</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <Forum />
    </UserProvider>
  );
}

export default App;
