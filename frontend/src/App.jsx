import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';

import { TRANSLATIONS } from './utils/translations';

const Home = ({ t }) => (
  <div className="text-center p-12 md:p-24 glass-panel relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    <h2 className="text-5xl md:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">{t.welcome}</h2>
    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">{t.organize}</p>
    <Link to="/dashboard" className="btn-primary inline-block text-lg px-8 py-4">
      {t.goDashboard}
    </Link>
  </div>
);

function App() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
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
          <div className="flex items-center justify-between relative">
            <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400 dark:from-blue-400 dark:to-teal-300 hover:opacity-80 transition-opacity">
              TimeBlock
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
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
          
          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl p-4 shadow-2xl flex flex-col space-y-4 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={toggleTheme}
                  className="flex-1 mr-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>
                <button 
                  onClick={toggleLanguage}
                  className="flex-1 ml-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-lg transition-colors font-medium"
                >
                  {language === 'en' ? 'BG' : 'EN'}
                </button>
              </div>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard" className="text-gray-700 dark:text-gray-200 font-semibold py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                {t.dashboard}
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/profile" className="text-gray-700 dark:text-gray-200 font-semibold py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                {t.profile}
              </Link>
              {isAuthenticated ? (
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="mt-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold py-3 rounded-xl transition-colors">
                  {t.logout}
                </button>
              ) : (
                <div className="flex flex-col space-y-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="text-center text-gray-700 dark:text-gray-200 font-semibold py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">{t.login}</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/register" className="text-center btn-primary w-full py-3">
                    {t.register}
                  </Link>
                </div>
              )}
            </div>
          )}
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
