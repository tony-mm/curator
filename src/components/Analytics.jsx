import React, { useMemo, useState, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import toast from 'react-hot-toast';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import isoCountries from 'i18n-iso-countries';
import { supabase } from '../utils/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [overview, setOverview] = useState({ totalClicks: 0, linkCount: 0, uniqueVisitors: 0 });
  const [links, setLinks] = useState([]);
  const [analyticsRows, setAnalyticsRows] = useState([]);
  const [daily, setDaily] = useState([]);
  const [devices, setDevices] = useState({ mobile: 0, tablet: 0, desktop: 0, total: 0 });
  const [referrers, setReferrers] = useState([]);
  const [browsers, setBrowsers] = useState([]);
  const [os, setOs] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = () => {
    if (!user?.id) return;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    Promise.all([
      supabase
        .from('links')
        .select('id, clicks, short_code, original_url, created_at, is_archived, expires_at')
        .eq('user_id', user.id),
      supabase
        .from('analytics')
        .select('link_id, clicked_at, user_agent, referrer, country, visitor_id')
        .gte('clicked_at', since.toISOString()),
    ])
      .then(([linksRes, analyticsRes]) => {
        if (linksRes.error) throw linksRes.error;
        if (analyticsRes.error) throw analyticsRes.error;

        const links = linksRes.data || [];
        setLinks(links);
        const linkIds = new Set(links.map((l) => l.id));
        const analytics = (analyticsRes.data || []).filter((row) => linkIds.has(row.link_id));
        setAnalyticsRows(analytics);

        const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
        const linkCount = links.length;
        const uniqueVisitors = new Set(
          analytics.map((row) => row.visitor_id).filter(Boolean)
        ).size;
        setOverview({ totalClicks, linkCount, uniqueVisitors });

        const dailyMap = new Map();
        analytics.forEach((row) => {
          const day = String(row.clicked_at).slice(0, 10);
          dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
        });
        const dailyRows = Array.from(dailyMap.entries()).map(([day, clicks]) => ({ day, clicks }));
        setDaily(dailyRows);

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
        setDevices(deviceCounts);

        const referrerMap = new Map();
        analytics.forEach((row) => {
          const ref = row.referrer || 'Direct';
          referrerMap.set(ref, (referrerMap.get(ref) || 0) + 1);
        });
        setReferrers(
          Array.from(referrerMap.entries())
            .map(([referrer, count]) => ({ referrer, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );

        const browserMap = new Map();
        const osMap = new Map();
        analytics.forEach((row) => {
          const ua = row.user_agent || '';
          let browser = 'Other';
          if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = 'Chrome';
          else if (/Firefox/.test(ua)) browser = 'Firefox';
          else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
          else if (/Edg|Edge/.test(ua)) browser = 'Edge';
          else if (/Opera|OPR/.test(ua)) browser = 'Opera';
          browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

          let osName = 'Other';
          if (/Windows/.test(ua)) osName = 'Windows';
          else if (/Mac OS X/.test(ua)) osName = 'macOS';
          else if (/Linux/.test(ua) && !/Android/.test(ua)) osName = 'Linux';
          else if (/Android/.test(ua)) osName = 'Android';
          else if (/iOS|iPhone|iPad/.test(ua)) osName = 'iOS';
          osMap.set(osName, (osMap.get(osName) || 0) + 1);
        });
        setBrowsers(
          Array.from(browserMap.entries())
            .map(([browser, count]) => ({ browser, count }))
            .sort((a, b) => b.count - a.count)
        );
        setOs(
          Array.from(osMap.entries())
            .map(([osName, count]) => ({ os: osName, count }))
            .sort((a, b) => b.count - a.count)
        );

        const countryMap = new Map();
        analytics.forEach((row) => {
          const country = row.country || 'Unknown';
          countryMap.set(country, (countryMap.get(country) || 0) + 1);
        });
        const countriesList = Array.from(countryMap.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        const total = countriesList.reduce((sum, r) => sum + r.count, 0) || 1;
        setCountries(
          countriesList.map((row) => ({
            ...row,
            percent: Math.round((row.count / total) * 100),
          }))
        );
      })
      .catch((err) => {
        console.error('Analytics load error:', err);
        setOverview({ totalClicks: 0, linkCount: 0, uniqueVisitors: 0 });
        setDaily([]);
        setDevices({ mobile: 0, tablet: 0, desktop: 0, total: 0 });
        setReferrers([]);
        setBrowsers([]);
        setOs([]);
        setCountries([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
  }, [user?.id]);

  const conversionRate = overview.totalClicks > 0 && overview.uniqueVisitors > 0
    ? ((overview.uniqueVisitors / overview.totalClicks) * 100).toFixed(1)
    : '0.0';

  /** Full 30-day window so sparse API rows don’t become one giant bar */
  const dailySeries = useMemo(() => {
    const byDay = new Map();
    for (const row of daily) {
      if (row?.day != null) byDay.set(String(row.day).slice(0, 10), row.clicks ?? 0);
    }
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({ day: key, clicks: byDay.get(key) ?? 0, label: d });
    }
    return out;
  }, [daily]);

  const maxDailyClicks = useMemo(
    () => Math.max(...dailySeries.map((d) => d.clicks), 1),
    [dailySeries],
  );

  const trafficChart = useMemo(() => {
    const w = 800;
    const h = 220;
    const pad = { top: 16, right: 12, bottom: 28, left: 12 };
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;
    const n = dailySeries.length;
    if (n === 0) return null;
    const xAt = (i) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yAt = (clicks) => pad.top + innerH - (clicks / maxDailyClicks) * innerH;
    const linePts = dailySeries.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.clicks).toFixed(1)}`).join(' ');
    const areaPath = (() => {
      const baseY = pad.top + innerH;
      let d = `M ${xAt(0).toFixed(1)} ${baseY} L ${xAt(0).toFixed(1)} ${yAt(dailySeries[0].clicks).toFixed(1)}`;
      for (let i = 1; i < n; i++) {
        d += ` L ${xAt(i).toFixed(1)} ${yAt(dailySeries[i].clicks).toFixed(1)}`;
      }
      d += ` L ${xAt(n - 1).toFixed(1)} ${baseY} Z`;
      return d;
    })();
    return { w, h, pad, linePts, areaPath, xAt, yAt, innerH, innerW, n };
  }, [dailySeries, maxDailyClicks]);

  const deviceTotal = devices.total || 1;
  const mobilePercent = Math.round((devices.mobile / deviceTotal) * 100);
  const desktopPercent = Math.round((devices.desktop / deviceTotal) * 100);
  const tabletPercent = Math.round((devices.tablet / deviceTotal) * 100);

  const totalBrowsers = browsers.reduce((sum, b) => sum + b.count, 0) || 1;
  const totalOS = os.reduce((sum, o) => sum + o.count, 0) || 1;

  const countriesByNumericId = useMemo(() => {
    const map = new Map();
    for (const c of countries) {
      const alpha2 = typeof c?.country === 'string' ? c.country.toUpperCase() : '';
      const numeric = alpha2 ? isoCountries.alpha2ToNumeric(alpha2) : undefined;
      if (numeric) map.set(String(numeric), c);
    }
    return map;
  }, [countries]);

  const maxCountryClicks = useMemo(() => Math.max(...countries.map((c) => c.count), 1), [countries]);

  const exportToCSV = async (type) => {
    try {
      const headers = type === 'analytics'
        ? ['short_code', 'original_url', 'clicks', 'unique_visitors', 'countries']
        : ['short_code', 'original_url', 'clicks', 'created_at', 'is_archived', 'expires_at'];

      const rows = type === 'analytics'
        ? (() => {
            const byLink = new Map();
            analyticsRows.forEach((row) => {
              const entry = byLink.get(row.link_id) || {
                clicks: 0,
                visitors: new Set(),
                countries: new Set(),
              };
              entry.clicks += 1;
              if (row.visitor_id) entry.visitors.add(row.visitor_id);
              if (row.country) entry.countries.add(row.country);
              byLink.set(row.link_id, entry);
            });
            return links.map((link) => {
              const entry = byLink.get(link.id) || { clicks: 0, visitors: new Set(), countries: new Set() };
              return {
                short_code: link.short_code,
                original_url: link.original_url,
                clicks: entry.clicks,
                unique_visitors: entry.visitors.size,
                countries: Array.from(entry.countries).join('|') || 'Unknown',
              };
            });
          })()
        : links.map((link) => ({
            short_code: link.short_code,
            original_url: link.original_url,
            clicks: link.clicks || 0,
            created_at: link.created_at,
            is_archived: link.is_archived ? 'true' : 'false',
            expires_at: link.expires_at || 'Never',
          }));

      const csv = [headers.join(',')]
        .concat(rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${type === 'analytics' ? 'Analytics' : 'Links'} exported successfully!`);
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const chartStrokeColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
  const chartFillColorStart = theme === 'dark' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)';
  const chartFillColorEnd = theme === 'dark' ? 'rgba(96, 165, 250, 0)' : 'rgba(59, 130, 246, 0)';
  const mapFillBase = theme === 'dark' ? '#27272a' : '#f4f4f5';
  const mapStrokeColor = theme === 'dark' ? '#3f3f46' : '#e4e4e7';

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Header */}
        <header className="w-full h-16 flex justify-between items-center px-6 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-40">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">search</span>
              <input
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                placeholder="Search analytics..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 hidden sm:block text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block"></div>
            <button
              onClick={() => exportToCSV('analytics')}
              className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-8 pb-24">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Analytics</h1>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="material-symbols-outlined animate-spin text-4xl text-zinc-300 dark:text-zinc-700">refresh</span>
            </div>
          ) : (
            <>
              {/* Hero Metrics */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-soft dark:shadow-soft-dark">
                  <div className="flex items-center gap-2 mb-3 text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined text-lg">mouse</span>
                    <span className="text-sm font-medium">Total Clicks</span>
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{overview.totalClicks.toLocaleString()}</p>
                </div>
                
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-soft dark:shadow-soft-dark">
                  <div className="flex items-center gap-2 mb-3 text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined text-lg">group</span>
                    <span className="text-sm font-medium">Unique Visitors</span>
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{overview.uniqueVisitors.toLocaleString()}</p>
                </div>
                
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-soft dark:shadow-soft-dark">
                  <div className="flex items-center gap-2 mb-3 text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined text-lg">link</span>
                    <span className="text-sm font-medium">Total Links</span>
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{overview.linkCount.toLocaleString()}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-soft dark:shadow-soft-dark">
                  <div className="flex items-center gap-2 mb-3 text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined text-lg">trending_up</span>
                    <span className="text-sm font-medium">Conv. Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{conversionRate}%</p>
                </div>
              </section>

              {/* Traffic Chart */}
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Traffic Trends</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Clicks per day over the last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Peak day</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {dailySeries.length
                        ? (() => {
                            const peak = dailySeries.reduce((a, b) => (b.clicks > a.clicks ? b : a), dailySeries[0]);
                            return `${peak.clicks} · ${peak.label.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                          })()
                        : '—'}
                    </p>
                  </div>
                </div>

                {trafficChart && dailySeries.some((d) => d.clicks > 0) ? (
                  <div className="relative w-full overflow-hidden rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 pt-4">
                    <svg
                      viewBox={`0 0 ${trafficChart.w} ${trafficChart.h}`}
                      className="w-full h-auto min-h-[240px] block"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <linearGradient id="trafficArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartFillColorStart} />
                          <stop offset="100%" stopColor={chartFillColorEnd} />
                        </linearGradient>
                      </defs>
                      {[0, 0.5, 1].map((t) => {
                        const y = trafficChart.pad.top + trafficChart.innerH * (1 - t);
                        const label = t === 0 ? 0 : t === 1 ? maxDailyClicks : Math.round(maxDailyClicks / 2);
                        return (
                          <g key={t}>
                            <line
                              x1={trafficChart.pad.left}
                              y1={y}
                              x2={trafficChart.pad.left + trafficChart.innerW}
                              y2={y}
                              stroke={theme === 'dark' ? '#3f3f46' : '#e4e4e7'}
                              strokeWidth="1"
                              strokeDasharray={t === 0 ? '0' : '4 4'}
                            />
                            <text
                              x={trafficChart.pad.left - 4}
                              y={y + 4}
                              textAnchor="end"
                              className="fill-zinc-400 dark:fill-zinc-500"
                              style={{ fontSize: 10 }}
                            >
                              {label}
                            </text>
                          </g>
                        );
                      })}
                      <path d={trafficChart.areaPath} fill="url(#trafficArea)" />
                      <polyline
                        fill="none"
                        stroke={chartStrokeColor}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={trafficChart.linePts}
                      />
                      {dailySeries.map((d, i) => (
                        <circle
                          key={d.day}
                          cx={trafficChart.xAt(i)}
                          cy={trafficChart.yAt(d.clicks)}
                          r={d.clicks > 0 ? 4 : 2}
                          fill={d.clicks > 0 ? chartStrokeColor : (theme === 'dark' ? '#3f3f46' : '#e4e4e7')}
                          stroke={theme === 'dark' ? '#18181b' : '#ffffff'}
                          strokeWidth="2"
                        >
                          <title>
                            {d.label.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: {d.clicks} clicks
                          </title>
                        </circle>
                      ))}
                      <text
                        x={trafficChart.pad.left}
                        y={trafficChart.h - 6}
                        className="fill-zinc-400 dark:fill-zinc-500"
                        style={{ fontSize: 11 }}
                      >
                        {dailySeries[0]?.label.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </text>
                      <text
                        x={trafficChart.pad.left + trafficChart.innerW / 2}
                        y={trafficChart.h - 6}
                        textAnchor="middle"
                        className="fill-zinc-400 dark:fill-zinc-500"
                        style={{ fontSize: 11 }}
                      >
                        Last 30 days
                      </text>
                      <text
                        x={trafficChart.pad.left + trafficChart.innerW}
                        y={trafficChart.h - 6}
                        textAnchor="end"
                        className="fill-zinc-400 dark:fill-zinc-500"
                        style={{ fontSize: 11 }}
                      >
                        {dailySeries[dailySeries.length - 1]?.label.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </text>
                    </svg>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 text-sm px-4 text-center">
                    <span className="material-symbols-outlined text-3xl mb-2 text-zinc-300 dark:text-zinc-600">show_chart</span>
                    No daily clicks in the last 30 days yet.
                  </div>
                )}
              </section>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Top Referrers */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Top Referrers</h3>

                  {referrers.length > 0 ? (
                    <div className="space-y-4">
                      {referrers.map((ref, i) => {
                        const totalRefs = referrers.reduce((s, r) => s + r.count, 0) || 1;
                        const pct = Math.round((ref.count / totalRefs) * 100);
                        return (
                          <div key={i} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <img src={`https://www.google.com/s2/favicons?domain=${ref.referrer}&sz=32`} alt="" className="w-4 h-4 rounded-sm bg-zinc-100 dark:bg-zinc-800" onError={(e) => { e.target.style.display='none'; }} />
                                {ref.referrer === 'Direct' ? 'Direct / Unknown' : ref.referrer}
                              </span>
                              <span className="text-sm font-bold text-zinc-900 dark:text-white">{ref.count} <span className="font-normal text-zinc-500 text-xs ml-1">({pct}%)</span></span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-sm">No referrer data yet</div>
                  )}
                </div>

                {/* Device Breakdown */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Devices</h3>
                  
                  {deviceTotal > 1 || devices.mobile > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-36 h-36 mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" fill="transparent" r="16" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="4"></circle>
                          <circle cx="18" cy="18" fill="transparent" r="16" className="stroke-blue-500" strokeDasharray={`${mobilePercent}, 100`} strokeWidth="4"></circle>
                          <circle cx="18" cy="18" fill="transparent" r="16" className="stroke-indigo-500" strokeDasharray={`${desktopPercent}, 100`} strokeDashoffset={`-${mobilePercent}`} strokeWidth="4"></circle>
                          <circle cx="18" cy="18" fill="transparent" r="16" className="stroke-zinc-300 dark:stroke-zinc-600" strokeDasharray={`${tabletPercent}, 100`} strokeDashoffset={`-${mobilePercent + desktopPercent}`} strokeWidth="4"></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-zinc-900 dark:text-white">{mobilePercent}%</span>
                        </div>
                      </div>

                      <div className="w-full space-y-3">
                        {[
                          { label: 'Mobile', count: devices.mobile.toLocaleString(), color: 'bg-blue-500' },
                          { label: 'Desktop', count: devices.desktop.toLocaleString(), color: 'bg-indigo-500' },
                          { label: 'Tablet', count: devices.tablet.toLocaleString(), color: 'bg-zinc-300 dark:bg-zinc-600' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{item.label}</span>
                            </div>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-sm">No device data yet</div>
                  )}
                </div>
              </div>

              {/* Browsers & OS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Top Browsers</h3>
                  {browsers.length > 0 ? (
                    <div className="space-y-4">
                      {browsers.map((b, i) => {
                        const pct = Math.round((b.count / totalBrowsers) * 100);
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{b.browser}</span>
                            <div className="flex items-center gap-4">
                              <div className="w-24 sm:w-32 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-sm font-bold text-zinc-900 dark:text-white w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm text-center py-6">No browser data yet</p>
                  )}
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Operating Systems</h3>
                  {os.length > 0 ? (
                    <div className="space-y-4">
                      {os.map((o, i) => {
                        const pct = Math.round((o.count / totalOS) * 100);
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{o.os}</span>
                            <div className="flex items-center gap-4">
                              <div className="w-24 sm:w-32 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-sm font-bold text-zinc-900 dark:text-white w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm text-center py-6">No OS data yet</p>
                  )}
                </div>
              </div>

              {/* World Map */}
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Locations</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Clicks by country</p>
                  </div>
                </div>

                <div className="h-[400px] w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
                  {countries.length > 0 ? (
                    <ComposableMap
                      projection="geoMercator"
                      projectionConfig={{ scale: 130, center: [0, 20] }}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <Geographies geography="/world-110m.json">
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            const countryData = countriesByNumericId.get(String(geo.id));
                            const clicks = countryData?.count || 0;
                            const fillColor = clicks > 0
                              ? (theme === 'dark' 
                                  ? `rgba(59, 130, 246, ${0.3 + (clicks / maxCountryClicks) * 0.7})` 
                                  : `rgba(59, 130, 246, ${0.2 + (clicks / maxCountryClicks) * 0.8})`)
                              : mapFillBase;

                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={fillColor}
                                stroke={mapStrokeColor}
                                strokeWidth={0.5}
                                style={{
                                  default: { outline: 'none', cursor: 'pointer', transition: 'all 250ms' },
                                  hover: { outline: 'none', fill: '#3b82f6', cursor: 'pointer' },
                                  pressed: { outline: 'none' },
                                }}
                              />
                            );
                          })
                        }
                      </Geographies>
                    </ComposableMap>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
                      No geographic data yet.
                    </div>
                  )}
                </div>

                {countries.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {countries.slice(0, 8).map((country, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 truncate">
                          <img 
                            src={`https://flagcdn.com/24x18/${isoCountries.alpha3ToAlpha2(isoCountries.numericToAlpha3(isoCountries.alpha2ToNumeric(country.country)))?.toLowerCase()}.png`} 
                            alt="" className="w-4 h-3 rounded-sm object-cover" 
                            onError={(e) => { e.target.style.display='none'; }} 
                          />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate" title={country.country}>{country.country}</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white shrink-0 ml-2">{country.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
