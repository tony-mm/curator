import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { supabase } from '../utils/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { buildShortUrl } from '../utils/linksService';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [overview, setOverview] = useState({ totalClicks: 0, linkCount: 0, uniqueVisitors: 0 });
  const [daily, setDaily] = useState([]);
  const [devices, setDevices] = useState({ mobile: 0, tablet: 0, desktop: 0, total: 0 });
  const [recentLinks, setRecentLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      if (!user?.id) return;
      const since = new Date();
      since.setDate(since.getDate() - 7);

      Promise.all([
        supabase
          .from('links')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('analytics')
          .select('link_id, clicked_at, user_agent, visitor_id')
          .gte('clicked_at', since.toISOString()),
      ])
        .then(([linksRes, analyticsRes]) => {
          if (linksRes.error) throw linksRes.error;
          if (analyticsRes.error) throw analyticsRes.error;

          const links = linksRes.data || [];
          setRecentLinks(links.slice(0, 5)); // Keep top 5 most recent

          const linkIds = new Set(links.map((l) => l.id));
          const analytics = (analyticsRes.data || []).filter((row) => linkIds.has(row.link_id));

          const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
          const linkCount = links.length;
          const uniqueVisitors = new Set(
            analytics.map((row) => row.visitor_id).filter(Boolean)
          ).size;

          const dailyMap = new Map();
          analytics.forEach((row) => {
            const day = String(row.clicked_at).slice(0, 10);
            dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
          });
          const dailyRows = Array.from(dailyMap.entries()).map(([day, clicks]) => ({ day, clicks }));

          const deviceCounts = { mobile: 0, tablet: 0, desktop: 0, total: 0 };
          analytics.forEach((row) => {
            const ua = row.user_agent || '';
            const isTablet = /Tablet|iPad/i.test(ua);
            const isMobile = /Android|iPhone|iPod|Mobile/i.test(ua) && !isTablet;
            if (isTablet) deviceCounts.tablet += 1;
            else if (isMobile) deviceCounts.mobile += 1;
            else deviceCounts.desktop += 1;
            deviceCounts.total += 1;
          });

          setOverview({ totalClicks, linkCount, uniqueVisitors });
          setDaily(dailyRows);
          setDevices(deviceCounts);
        })
        .catch((err) => {
          console.error('Dashboard load error:', err);
        })
        .finally(() => setLoading(false));
    };
    loadData();
    const interval = setInterval(loadData, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [user?.id]);

  const deviceTotal = devices.total || 1;
  const mobilePercent = Math.round((devices.mobile / deviceTotal) * 100);
  const desktopPercent = Math.round((devices.desktop / deviceTotal) * 100);
  const tabletPercent = Math.round((devices.tablet / deviceTotal) * 100);

  const ctr = overview.totalClicks > 0 && overview.uniqueVisitors > 0
    ? ((overview.uniqueVisitors / overview.totalClicks) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Header */}
        <header className="w-full h-16 flex justify-between items-center px-6 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-40">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">search</span>
              <input
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="Search..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button className="relative p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8 max-w-6xl w-full mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="material-symbols-outlined animate-spin text-4xl text-zinc-300 dark:text-zinc-700">refresh</span>
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Total Clicks', value: overview.totalClicks.toLocaleString(), icon: 'mouse' },
                  { label: 'Unique Visitors', value: overview.uniqueVisitors.toLocaleString(), icon: 'group' },
                  { label: 'Active Links', value: overview.linkCount.toLocaleString(), icon: 'link' },
                  { label: 'Avg. CTR', value: `${ctr}%`, icon: 'ads_click' },
                ].map((metric, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-soft dark:shadow-soft-dark">
                    <div className="flex items-center gap-2 mb-3 text-zinc-500 dark:text-zinc-400">
                      <span className="material-symbols-outlined text-lg">{metric.icon}</span>
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Recent Links List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Links</h3>
                    <NavLink to="/links" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">View all</NavLink>
                  </div>
                  
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden">
                    {recentLinks.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">No links created yet.</div>
                    ) : (
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {recentLinks.map((link) => (
                          <div key={link.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.original_url).hostname}&sz=32`} alt="" className="w-5 h-5 rounded-sm" onError={(e) => { e.target.style.display='none'; }}/>
                              </div>
                              <div className="min-w-0">
                                <a href={buildShortUrl(link.short_code)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-zinc-900 dark:text-white hover:underline truncate block">
                                  curator.link/{link.short_code}
                                </a>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{link.original_url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pl-4 shrink-0">
                              <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{link.clicks}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">clicks</p>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(buildShortUrl(link.short_code));
                                  alert('Copied!');
                                }}
                                className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Devices */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Devices</h3>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6">
                    <div className="flex flex-col items-center">
                      <div className="relative w-32 h-32 mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          {/* Background ring */}
                          <circle cx="18" cy="18" fill="transparent" r="16" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="4"></circle>
                          
                          {/* Mobile */}
                          <circle cx="18" cy="18" fill="transparent" r="16" className="stroke-blue-500" strokeDasharray={`${mobilePercent}, 100`} strokeWidth="4"></circle>
                          
                          {/* Desktop */}
                          <circle cx="18" cy="18" fill="transparent" r="16" className="stroke-indigo-500" strokeDasharray={`${desktopPercent}, 100`} strokeDashoffset={`-${mobilePercent}`} strokeWidth="4"></circle>
                          
                          {/* Tablet */}
                          <circle cx="18" cy="18" fill="transparent" r="16" className="stroke-zinc-400 dark:stroke-zinc-600" strokeDasharray={`${tabletPercent}, 100`} strokeDashoffset={`-${mobilePercent + desktopPercent}`} strokeWidth="4"></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-zinc-900 dark:text-white">{mobilePercent}%</span>
                        </div>
                      </div>

                      <div className="w-full space-y-3">
                        {[
                          { label: 'Mobile', count: devices.mobile.toLocaleString(), color: 'bg-blue-500' },
                          { label: 'Desktop', count: devices.desktop.toLocaleString(), color: 'bg-indigo-500' },
                          { label: 'Tablet', count: devices.tablet.toLocaleString(), color: 'bg-zinc-400 dark:bg-zinc-600' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{item.label}</span>
                            </div>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center py-2 pb-safe z-50">
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-lg ${isActive ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="material-symbols-outlined text-[22px]">grid_view</span>
        </NavLink>
        <NavLink to="/links" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-lg ${isActive ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="material-symbols-outlined text-[22px]">link</span>
        </NavLink>
        <NavLink to="/links" className="relative -top-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-soft dark:shadow-soft-dark border-[4px] border-white dark:border-zinc-950">
            <span className="material-symbols-outlined">add</span>
          </div>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-lg ${isActive ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="material-symbols-outlined text-[22px]">bar_chart</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-lg ${isActive ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Dashboard;
