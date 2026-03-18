import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';

const Home = () => (
  <div className="text-center p-10 bg-gray-800 rounded-lg shadow-xl">
    <h2 className="text-5xl font-bold mb-4">Welcome to Your Time Dashboard</h2>
    <p className="text-xl text-gray-300 mb-8">Organize your life, one block at a time. Log in to manage your schedule.</p>
    <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
      Go to Dashboard
    </Link>
  </div>
);

function App() {
  const navigate = useNavigate();
  // Check for token to determine auth status
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    // We might need to force a re-render or use a state management library for the nav to update instantly
    window.location.reload(); 
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <nav className="bg-gray-800/50 backdrop-blur-sm shadow-lg border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              TimeBlock
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-300 hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <Link to="/profile" className="text-gray-300 hover:text-blue-400 transition-colors">
                Profile
              </Link>
              {isAuthenticated ? (
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                  Logout
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
                  <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 fade-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
