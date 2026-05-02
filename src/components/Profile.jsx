import React, { useState, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import { supabase } from '../utils/supabaseClient';
import { AuthContext } from '../context/AuthContext';

/**
 * Simple profile page allowing the user to edit their email, username and upload a profile picture.
 * The picture is stored only in the browser (localStorage) for demo purposes – a real implementation
 * would upload the file to the server and store a reference in the DB.
 */
const Profile = () => {
  const { user } = useContext(AuthContext);
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
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        {message.text && (
          <div className={`p-4 rounded mb-4 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}
        <div className="grid gap-6 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Profile Picture</label>
            {picture && <img src={picture} alt="Profile" className="w-24 h-24 rounded-full mb-2" />}
            <input type="file" accept="image/*" onChange={handlePictureChange} />
          </div>
          <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded">Save Changes</button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
