import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

import { TRANSLATIONS } from '../utils/translations';

const Profile = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [language] = useState(() => localStorage.getItem('language') || 'en');
  const t = TRANSLATIONS.profile[language];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/auth/profile');
        setFormData({
          username: res.data.username || '',
          email: res.data.email || '',
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          password: ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.response && err.response.status === 404) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        setError(err.response?.data?.message || t.errorLoad);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiClient.put('/auth/profile', formData);
      setSuccess(t.successUpdate);
    } catch (err) {
      setError(err.response?.data?.message || t.errorUpdate);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">{t.title}</h2>
            <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t.backBtn}</button>
        </div>
        
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">{t.loading}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-2 rounded text-sm">{error}</div>}
            {success && <div className="bg-green-500/20 border border-green-500 text-green-200 p-2 rounded text-sm">{success}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.firstName}</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input-field" placeholder={t.firstNamePlaceholder} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.lastName}</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-field" placeholder={t.lastNamePlaceholder} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.username}</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-field" placeholder={t.usernamePlaceholder} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.email}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder={t.emailPlaceholder} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.newPassword}</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder={t.passwordPlaceholder} />
            </div>

            <button type="submit" className="w-full btn-primary mt-6">{t.saveBtn}</button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};

export default Profile;