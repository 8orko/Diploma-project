import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

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
        setError(err.response?.data?.message || 'Failed to load profile data.');
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
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="glass-panel p-8 rounded-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
            <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">Back to Dashboard</button>
        </div>
        
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-2 rounded text-sm">{error}</div>}
            {success && <div className="bg-green-500/20 border border-green-500 text-green-200 p-2 rounded text-sm">{success}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input-field" placeholder="First Name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-field" placeholder="Last Name" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-field" placeholder="Username" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Email Address" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Leave blank to keep current password" />
            </div>

            <button type="submit" className="w-full btn-primary mt-4">Save Changes</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;