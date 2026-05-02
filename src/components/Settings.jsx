import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { supabase } from '../utils/supabaseClient';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [navigate, user?.id]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('email_notifications, dark_mode')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          email_notifications: true,
          dark_mode: false,
        });
        setEmailNotifs(true);
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else {
        setEmailNotifs(Boolean(data.email_notifications));
        setDarkMode(Boolean(data.dark_mode));
        if (data.dark_mode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      if (!user?.email) throw new Error('Missing user email');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw signInError;
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifs,
          dark_mode: darkMode,
        });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings saved' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 md:ml-64 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

        {message.text && (
          <div className={`p-4 rounded-md mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Change Password */}
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-2 px-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-2 px-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-2 px-3"
                  required
                />
              </div>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-container">
                Update Password
              </button>
            </form>
          </section>

          {/* Email Notifications */}
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Email Preferences</h2>
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-slate-800">Receive email notifications</p>
                <p className="text-sm text-slate-500">Get notified about link activity and weekly digests</p>
              </div>
              <button
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`relative w-12 h-6 rounded-full transition-colors ${emailNotifs ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${emailNotifs ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>
            <div className="mt-4">
              <button onClick={handleSaveSettings} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-container">
                Save Preferences
              </button>
            </div>
          </section>

          {/* Dark Mode */}
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Appearance</h2>
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-slate-800">Dark Mode</p>
                <p className="text-sm text-slate-500">Use dark theme for the interface</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>
            <div className="mt-4">
              <button onClick={handleSaveSettings} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-container">
                Save Preferences
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-white border-2 border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
            <p className="text-sm text-slate-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone — all your links, analytics, and settings will be removed.
            </p>
            <button
              onClick={async () => {
                if (!window.confirm('Are you sure you want to delete your account? All your data will be permanently removed.')) return;
                try {
                  alert('Account deletion is not yet wired up for Supabase.');
                  navigate('/');
                } catch (err) {
                  setMessage({ type: 'error', text: err.message });
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">delete_forever</span>
              Delete My Account
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;