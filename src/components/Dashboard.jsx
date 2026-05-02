import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { supabase } from '../utils/supabaseClient';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [overview, setOverview] = useState({ totalClicks: 0, linkCount: 0, uniqueVisitors: 0 });
  const [daily, setDaily] = useState([]);
  const [devices, setDevices] = useState({ mobile: 0, tablet: 0, desktop: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadData = () => {
      if (!user?.id) return;
      const since = new Date();
      since.setDate(since.getDate() - 7);

      Promise.all([
        supabase
          .from('links')
          .select('id, clicks')
          .eq('user_id', user.id),
        supabase
          .from('analytics')
          .select('link_id, clicked_at, user_agent, visitor_id')
          .gte('clicked_at', since.toISOString()),
      ])
        .then(([linksRes, analyticsRes]) => {
          if (linksRes.error) throw linksRes.error;
          if (analyticsRes.error) throw analyticsRes.error;

          const links = linksRes.data || [];
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
          setOverview({ totalClicks: 0, linkCount: 0, uniqueVisitors: 0 });
          setDaily([]);
          setDevices({ mobile: 0, tablet: 0, desktop: 0, total: 0 });
        })
        .finally(() => setLoading(false));
    };
    loadData();
    const interval = setInterval(loadData, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, [user?.id]);

  const maxClicks = Math.max(...daily.map(d => d.clicks), 1);
  const barHeights = daily.map(d => Math.round((d.clicks / maxClicks) * 100));
  const dayLabels = daily.map(d => {
    const date = new Date(d.day);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  });

  const deviceTotal = devices.total || 1;
  const mobilePercent = Math.round((devices.mobile / deviceTotal) * 100);
  const desktopPercent = Math.round((devices.desktop / deviceTotal) * 100);
  const tabletPercent = Math.round((devices.tablet / deviceTotal) * 100);

  const ctr = overview.totalClicks > 0 && overview.uniqueVisitors > 0
    ? ((overview.uniqueVisitors / overview.totalClicks) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Header */}
        <header className="w-full h-16 flex justify-between items-center px-6 sticky top-0 bg-white border-b border-slate-200 z-40">
          {/* Search */}
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full border border-slate-300 rounded-full py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Search analytics or links..."
                type="text"
              />
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4 ml-6">
            <button className="relative p-2 text-slate-600 hover:text-primary rounded-md">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-slate-600 hover:text-primary rounded-md">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <h2 className="font-bold text-lg text-slate-800">Analytics Overview</h2>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto w-full">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading dashboard...</div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>mouse</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Total Clicks</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.totalClicks.toLocaleString()}</p>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Unique Visitors</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.uniqueVisitors.toLocaleString()}</p>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Active Links</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.linkCount.toLocaleString()}</p>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>ads_click</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Avg. CTR</p>
                  <p className="text-2xl font-bold text-slate-900">{ctr}%</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Line Chart */}
                <div className="lg:col-span-2 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Traffic Growth (Last 7 days)</h3>
                  <canvas id="trafficLineChart" className="w-full h-64"></canvas>
                </div>

                {/* Device Donut */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Device Reach</h3>
                  <p className="text-sm text-slate-500 mb-8">Audience distribution</p>

                  <div className="flex flex-col items-center">
                    <div className="relative w-40 h-40 mb-6">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f1f5f9" strokeWidth="4"></circle>
                        <circle cx="18" cy="18" fill="transparent" r="16" stroke="#0F2784" strokeDasharray={`${mobilePercent}, 100`} strokeWidth="4"></circle>
                        <circle cx="18" cy="18" fill="transparent" r="16" stroke="#00687a" strokeDasharray={`${desktopPercent}, 100`} strokeDashoffset={`-${mobilePercent}`} strokeWidth="4"></circle>
                        <circle cx="18" cy="18" fill="transparent" r="16" stroke="#611e00" strokeDasharray={`${tabletPercent}, 100`} strokeDashoffset={`-${mobilePercent + desktopPercent}`} strokeWidth="4"></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900">{mobilePercent}%</span>
                        <span className="text-[10px] font-medium text-slate-500 uppercase">Mobile</span>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      {[
                        { label: 'Mobile', count: devices.mobile.toLocaleString(), color: 'bg-primary' },
                        { label: 'Desktop', count: devices.desktop.toLocaleString(), color: 'bg-secondary' },
                        { label: 'Tablet', count: devices.tablet.toLocaleString(), color: 'bg-tertiary-container' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <span className="text-sm text-slate-700">{item.label}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <footer className="max-w-7xl mx-auto py-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-slate-900 text-lg">Curator</span>
              <p className="text-xs text-slate-500">© 2025 Curator Link Management</p>
            </div>
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'API Documentation', 'Contact'].map((link) => (
                <a key={link} className="text-xs text-slate-500 hover:text-primary transition-colors" href="#">{link}</a>
              ))}
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary/95 border-t border-slate-700/30 flex justify-around items-center py-3 z-50">
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold">Home</span>
        </NavLink>
        <NavLink to="/links" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">link</span>
          <span className="text-[10px]">Links</span>
        </NavLink>
        <NavLink to="/links" className="relative -top-6">
          <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined">add</span>
          </button>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[10px]">Analytics</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px]">Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Dashboard;
