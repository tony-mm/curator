import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
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
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 border border-transparent'
    }`;

  return (
    <aside className="hidden md:flex flex-col p-4 space-y-4 h-screen w-64 fixed left-0 top-0 z-50 bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
          <span className="material-symbols-outlined text-[18px] font-bold">link</span>
        </div>
        <Link to="/" className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Curator</Link>
      </div>

      <nav className="flex-1 space-y-1">
        <NavLink to="/dashboard" className={navLinkClass}>
          {() => (
            <>
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
              <span>Dashboard</span>
            </>
          )}
        </NavLink>
        <NavLink to="/links" className={navLinkClass}>
          {() => (
            <>
              <span className="material-symbols-outlined text-[20px]">link</span>
              <span>Links</span>
            </>
          )}
        </NavLink>
        <NavLink to="/analytics" className={navLinkClass}>
          {() => (
            <>
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              <span>Analytics</span>
            </>
          )}
        </NavLink>
        <NavLink to="/settings" className={navLinkClass}>
          {() => (
            <>
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Settings</span>
            </>
          )}
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          {() => (
            <>
              <span className="material-symbols-outlined text-[20px]">person</span>
              <span>Profile</span>
            </>
          )}
        </NavLink>
      </nav>

      <div className="relative">
        <div 
          className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{userEmail || 'User'}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Free Plan</p>
          </div>
          <span className="material-symbols-outlined text-zinc-400 text-sm">unfold_more</span>
        </div>

        {dropdownOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-soft dark:shadow-soft-dark z-50 overflow-hidden">
            <button
              onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Settings
            </button>
            <button
              onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Profile
            </button>
            <div className="border-t border-zinc-100 dark:border-zinc-700"></div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;