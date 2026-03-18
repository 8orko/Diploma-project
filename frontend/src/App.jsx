import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';

import { TRANSLATIONS } from './utils/translations';

const Home = ({ t }) => (
  <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-colors duration-200">
    <h2 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">{t.welcome}</h2>
    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{t.organize}</p>
    <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
      {t.goDashboard}
    </Link>
  </div>
);

function App() {
  const navigate = useNavigate();
  // Check for token to determine auth status
  const isAuthenticated = !!localStorage.getItem('token');

  // Get language from localStorage, default to 'en'
  const [language, setLanguage] = React.useState(() => localStorage.getItem('language') || 'en');
  const t = TRANSLATIONS.app[language];

  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'dark');
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'bg' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    window.location.reload(); 
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    // We might need to force a re-render or use a state management library for the nav to update instantly
    window.location.reload(); 
  };

  return (
    <div className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-200 min-h-screen font-sans transition-colors duration-200">
      <nav className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              TimeBlock
            </Link>
            
            <div className="flex items-center space-x-6">
              <button 
                onClick={toggleTheme}
                className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded transition-colors"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button 
                onClick={toggleLanguage}
                className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded transition-colors"
              >
                {language === 'en' ? 'BG' : 'EN'}
              </button>
              <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t.dashboard}
              </Link>
              <Link to="/profile" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t.profile}
              </Link>
              {isAuthenticated ? (
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                  {t.logout}
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">{t.login}</Link>
                  <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                    {t.register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 fade-in">
        <Routes>
          <Route path="/" element={<Home t={t} />} />
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
