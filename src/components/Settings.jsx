import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { supabase } from '../utils/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, [navigate, user?.id]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('email_notifications')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          email_notifications: true,
        });
        setEmailNotifs(true);
      } else {
        setEmailNotifs(Boolean(data.email_notifications));
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
        });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings saved' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-zinc-950">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-zinc-300 dark:text-zinc-700">refresh</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 md:ml-64 p-6 md:p-8 max-w-4xl">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Settings</h1>
          <button 
            onClick={toggleTheme} 
            className="p-2 sm:hidden text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50'}`}>
            <span className="material-symbols-outlined shrink-0 mt-0.5">{message.type === 'error' ? 'warning' : 'check_circle'}</span>
            <p>{message.text}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Change Password */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors mt-2">
                Update Password
              </button>
            </form>
          </section>

          {/* Email Notifications */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Email Preferences</h2>
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Receive email notifications</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Get notified about link activity and weekly digests</p>
              </div>
              <button
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`relative w-12 h-6 rounded-full transition-colors ${emailNotifs ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
              >
                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${emailNotifs ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSaveSettings} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
                Save Preferences
              </button>
            </div>
          </section>

          {/* Dark Mode */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Appearance</h2>
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Dark Mode</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Use dark theme for the interface</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
              >
                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-white dark:bg-zinc-900 border-2 border-red-100 dark:border-red-900/30 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <h2 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">Danger Zone</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
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
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-2 transition-colors inline-flex"
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