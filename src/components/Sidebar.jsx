import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const [userEmail, setUserEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.email) return;
    setUserEmail(user.email);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? 'text-white bg-primary-container/20 border-l-2 border-primary-container'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <aside className="hidden md:flex flex-col p-6 space-y-2 h-screen w-64 fixed left-0 top-0 z-50 bg-primary border-r border-slate-700/30">
      <div className="flex items-center gap-3 mb-8 px-2">
        <span className="material-symbols-outlined text-white text-2xl">link</span>
        <h1 className="text-xl font-bold text-white tracking-tight">Curator</h1>
      </div>

      <nav className="flex-1 space-y-1">
        <NavLink to="/dashboard" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Dashboard</span>
            </>
          )}
        </NavLink>
        <NavLink to="/links" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
              <span>Links</span>
            </>
          )}
        </NavLink>
        <NavLink to="/analytics" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-lg">leaderboard</span>
              <span>Analytics</span>
            </>
          )}
        </NavLink>
        <NavLink to="/settings" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-lg">settings</span>
              <span>Settings</span>
            </>
          )}
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-lg">person</span>
              <span>Profile</span>
            </>
          )}
        </NavLink>
      </nav>

      <div className="p-3 bg-primary-container/10 rounded-md relative">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <img
            alt="User Avatar"
            className="w-9 h-9 rounded-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMG5XvB0RtJ8bB2K3p-8hQBM5W8pK8S1dZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1rZ1"
          />
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">{userEmail || 'User'}</p>
            <p className="text-[10px] text-slate-300 truncate">Premium Plan</p>
          </div>
          <span className="material-symbols-outlined text-white text-sm">{dropdownOpen ? 'expand_less' : 'expand_more'}</span>
        </div>

        {dropdownOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
            <button
              onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
            >
              Settings
            </button>
            <button
              onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Profile
            </button>
            <button
              onClick={() => alert('Account deletion is not yet wired up for Supabase.')}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete Account
            </button>
            <div className="border-t border-slate-100"></div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;