import React, { useState, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import { supabase } from '../utils/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Simple profile page allowing the user to edit their email, username and upload a profile picture.
 * The picture is stored only in the browser (localStorage) for demo purposes – a real implementation
 * would upload the file to the server and store a reference in the DB.
 */
const Profile = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [picture, setPicture] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load current user info
  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setUsername(user.user_metadata?.username || '');
    const stored = localStorage.getItem('profilePicture');
    if (stored) setPicture(stored);
  }, [user]);

  const handlePictureChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      setPicture(dataUrl);
      // Persist locally for demo purposes
      localStorage.setItem('profilePicture', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        email,
        data: { username },
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated. Check your email to confirm changes.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 md:ml-64 max-w-4xl">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Profile</h1>
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
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
          <div className="grid gap-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Profile Picture</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                  {picture ? (
                    <img src={picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-zinc-400 dark:text-zinc-500">person</span>
                  )}
                </div>
                <div>
                  <label className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Upload Image
                    <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Recommended: 256x256px JPG or PNG.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                placeholder="Choose a username"
              />
            </div>
            
            <div className="mt-2 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                onClick={handleSave} 
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
