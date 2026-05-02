import React, { useMemo, useState, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import toast from 'react-hot-toast';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import isoCountries from 'i18n-iso-countries';
import { supabase } from '../utils/supabaseClient';
import { AuthContext } from '../context/AuthContext';

const Analytics = () => {
  const { user } = useContext(AuthContext);
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
        .select('id, clicks')
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
      // Backend returns ISO alpha-2. The topojson file uses ISO numeric as geo.id (e.g. US -> 840).
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="w-full h-16 flex justify-between items-center px-6 sticky top-0 bg-white border-b border-slate-200 z-40">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full border border-slate-300 rounded-full py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Search analytics..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-6">
            <button className="relative p-2 text-slate-600 hover:text-primary rounded-md">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-slate-600 hover:text-primary rounded-md">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex gap-2">
              <button
                onClick={() => exportToCSV('analytics')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Export CSV
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-7xl mx-auto space-y-8 bg-slate-50">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading analytics...</div>
          ) : (
            <>
              {/* Hero Metrics */}
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <p className="text-slate-500 text-sm font-medium mb-2">Total Clicks</p>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-slate-900">{overview.totalClicks.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <p className="text-slate-500 text-sm font-medium mb-2">Unique Visitors</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-900">{overview.uniqueVisitors.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <p className="text-slate-500 text-sm font-medium mb-2">Total Links</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-900">{overview.linkCount}</span>
                  </div>
                </div>
              </section>

              {/* Traffic Chart — line + area (full 30-day series so bars aren’t one giant block) */}
              <section className="bg-white border border-slate-200 rounded-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Traffic Trends</h3>
                    <p className="text-sm text-slate-500">Clicks per day over the last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Peak day</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {dailySeries.length
                        ? (() => {
                            const peak = dailySeries.reduce(
                              (a, b) => (b.clicks > a.clicks ? b : a),
                              dailySeries[0],
                            );
                            return `${peak.clicks} · ${peak.label.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                          })()
                        : '—'}
                    </p>
                  </div>
                </div>

                {trafficChart && dailySeries.some((d) => d.clicks > 0) ? (
                  <div className="relative w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50/50">
                    <svg
                      viewBox={`0 0 ${trafficChart.w} ${trafficChart.h}`}
                      className="w-full h-auto min-h-[200px] block"
                      preserveAspectRatio="xMidYMid meet"
                      role="img"
                      aria-label="Daily clicks over the last 30 days"
                    >
                      <defs>
                        <linearGradient id="trafficArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(15, 39, 132)" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="rgb(15, 39, 132)" stopOpacity="0.02" />
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
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              strokeDasharray={t === 0 ? '0' : '4 4'}
                            />
                            <text
                              x={trafficChart.pad.left - 4}
                              y={y + 4}
                              textAnchor="end"
                              className="fill-slate-400"
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
                        stroke="rgb(15, 39, 132)"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={trafficChart.linePts}
                      />
                      {dailySeries.map((d, i) => (
                        <circle
                          key={d.day}
                          cx={trafficChart.xAt(i)}
                          cy={trafficChart.yAt(d.clicks)}
                          r={d.clicks > 0 ? 3.5 : 2}
                          fill={d.clicks > 0 ? 'rgb(15, 39, 132)' : '#cbd5e1'}
                          style={{ cursor: 'default' }}
                        >
                          <title>
                            {d.label.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}:{' '}
                            {d.clicks} {d.clicks === 1 ? 'click' : 'clicks'}
                          </title>
                        </circle>
                      ))}
                      <text
                        x={trafficChart.pad.left}
                        y={trafficChart.h - 6}
                        className="fill-slate-500"
                        style={{ fontSize: 11 }}
                      >
                        {dailySeries[0]?.label.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </text>
                      <text
                        x={trafficChart.pad.left + trafficChart.innerW / 2}
                        y={trafficChart.h - 6}
                        textAnchor="middle"
                        className="fill-slate-500"
                        style={{ fontSize: 11 }}
                      >
                        Last 30 days
                      </text>
                      <text
                        x={trafficChart.pad.left + trafficChart.innerW}
                        y={trafficChart.h - 6}
                        textAnchor="end"
                        className="fill-slate-500"
                        style={{ fontSize: 11 }}
                      >
                        {dailySeries[dailySeries.length - 1]?.label.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </text>
                    </svg>
                  </div>
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm px-4 text-center">
                    No daily clicks in the last 30 days yet. Share a link or use “Simulate click” to see the trend line.
                  </div>
                )}
              </section>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Referrers */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Top Referrers</h3>
                      <p className="text-sm text-slate-500">Where your traffic comes from</p>
                    </div>
                  </div>

                  {referrers.length > 0 ? (
                    <div className="space-y-4">
                      {referrers.map((ref, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{ref.referrer || 'Direct'}</span>
                          <span className="text-sm font-bold text-slate-900">{ref.count} clicks</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No referrer data yet</p>
                  )}
                </div>

                {/* Device Breakdown */}
                <div className="bg-white border border-slate-200 rounded-lg p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Devices</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="material-symbols-outlined text-sm">smartphone</span>
                          Mobile
                        </span>
                        <span className="text-sm font-bold text-slate-900">{mobilePercent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${mobilePercent}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="material-symbols-outlined text-sm">desktop_windows</span>
                          Desktop
                        </span>
                        <span className="text-sm font-bold text-slate-900">{desktopPercent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${desktopPercent}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="material-symbols-outlined text-sm">tablet_mac</span>
                          Tablet
                        </span>
                        <span className="text-sm font-bold text-slate-900">{tabletPercent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${tabletPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Browsers & OS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 rounded-lg p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Top Browsers</h3>
                  {browsers.length > 0 ? (
                    <div className="space-y-4">
                      {browsers.map((b, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{b.browser}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${(b.count / totalBrowsers) * 100}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-12 text-right">{Math.round((b.count / totalBrowsers) * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No browser data yet</p>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Operating Systems</h3>
                  {os.length > 0 ? (
                    <div className="space-y-4">
                      {os.map((o, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{o.os}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${(o.count / totalOS) * 100}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-12 text-right">{Math.round((o.count / totalOS) * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No OS data yet</p>
                  )}
                </div>
              </div>

              {/* World Map */}
              <section className="bg-white border border-slate-200 rounded-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Geographic Distribution</h3>
                    <p className="text-sm text-slate-500">Clicks by country</p>
                  </div>
                </div>

                <div className="h-96 w-full">
                  {countries.length > 0 ? (
                    <div>
                      <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{
                          scale: 100,
                          center: [0, 20]
                        }}
                        width={800}
                        height={400}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <Geographies geography="/world-110m.json">
                          {({ geographies }) =>
                            geographies.map((geo) => {
                              const countryData = countriesByNumericId.get(String(geo.id));
                              const clicks = countryData?.count || 0;
                              const fillColor = clicks > 0
                                ? `rgba(59, 130, 246, ${0.2 + (clicks / maxCountryClicks) * 0.8})`
                                : '#f1f5f9';

                              return (
                                <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  fill={fillColor}
                                  stroke="#e2e8f0"
                                  strokeWidth={0.5}
                                  style={{
                                    default: { outline: 'none', cursor: 'pointer' },
                                    hover: { outline: 'none', fill: '#3b82f6', cursor: 'pointer' },
                                    pressed: { outline: 'none' },
                                  }}
                                  onMouseEnter={(event) => {
                                    const countryClicks = countriesByNumericId.get(String(geo.id))?.count || 0;
                                    if (countryClicks > 0) {
                                      event.target.style.fill = '#1e40af';
                                    }
                                  }}
                                  onMouseLeave={(event) => {
                                    const clicks = countriesByNumericId.get(String(geo.id))?.count || 0;
                                    const fillColor = clicks > 0
                                      ? `rgba(59, 130, 246, ${0.2 + (clicks / maxCountryClicks) * 0.8})`
                                      : '#f1f5f9';
                                    event.target.style.fill = fillColor;
                                  }}
                                />
                              );
                            })
                          }
                        </Geographies>
                      </ComposableMap>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      No geographic data yet. Start sharing your links to see traffic from different countries!
                    </div>
                  )}
                </div>

                {/* Color Legend */}
                {countries.length > 0 && (
                  <div className="mt-6 flex items-center justify-center gap-4 pb-4">
                    <span className="text-xs font-medium text-slate-600">Traffic Intensity:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded" style={{backgroundColor: 'rgba(59, 130, 246, 0.2)'}}></div>
                      <span className="text-xs text-slate-600">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded" style={{backgroundColor: 'rgba(59, 130, 246, 0.5)'}}></div>
                      <span className="text-xs text-slate-600">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded" style={{backgroundColor: 'rgba(59, 130, 246, 1)'}}></div>
                      <span className="text-xs text-slate-600">High</span>
                    </div>
                  </div>
                )}

                {countries.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-200 pt-6">
                    <h4 className="col-span-full text-sm font-semibold text-slate-700">Top Countries by Clicks</h4>
                    {countries.slice(0, 8).map((country, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                        <span className="text-sm font-medium text-slate-700">{country.country}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-slate-900">{country.count}</span>
                          <span className="text-xs text-slate-500">{country.percent}%</span>
                        </div>
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
