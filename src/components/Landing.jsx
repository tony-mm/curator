import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { supabase } from '../utils/supabaseClient';
import { buildShortUrl, createLink } from '../utils/linksService';

const Landing = () => {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (isLoading) {
      setError('Checking your session, please try again.');
      return;
    }
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    setLoading(true);
    try {
      const { shortCode } = await createLink({
        supabase,
        userId: user?.id,
        url,
        alias: alias || undefined,
      });
      setResult(buildShortUrl(shortCode));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert('Copied to clipboard!');
    }
  };

  const downloadQR = () => {
    if (!result) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(result)}`;
    window.open(qrUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 transition-colors duration-200">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <span className="material-symbols-outlined text-lg font-bold">link</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Curator</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme} 
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                <span className="material-symbols-outlined text-xl">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              {isAuthenticated ? (
                <Link to="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors hidden sm:block">Log in</Link>
                  <Link to="/signup" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-all">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-7xl">
              Short links with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">superpowers</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-zinc-600 dark:text-zinc-400">
              Curator is an open-source link management tool for modern marketing teams to create, share, and track short links.
            </p>

            {/* URL Input Area */}
            <div className="mt-10 mx-auto max-w-2xl">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="material-symbols-outlined text-zinc-400 group-focus-within:text-blue-500">link</span>
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://your-long-url.com/very/long/path"
                    className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-4 pl-12 pr-4 text-base text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-soft dark:shadow-soft-dark"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white px-8 py-4 text-base font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:focus:ring-white dark:focus:ring-offset-zinc-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    'Shorten'
                  )}
                </button>
              </form>
              
              {/* Optional Alias */}
              <div className="mt-4 flex items-center justify-center sm:justify-start text-sm text-zinc-500 dark:text-zinc-400">
                <span>curator.link/</span>
                <input
                  type="text"
                  placeholder="custom-alias (optional)"
                  className="ml-1 bg-transparent border-b border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:outline-none py-1 px-1 text-zinc-900 dark:text-white placeholder-zinc-400 w-40 transition-colors"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 text-left rounded-xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-900">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Success Result */}
              {result && (
                <div className="mt-8 animate-slide-down">
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-soft dark:shadow-soft-dark flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined text-xl">check</span>
                      </div>
                      <div className="truncate text-left w-full">
                        <a href={result} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-zinc-900 dark:text-white hover:underline truncate block">
                          {result}
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={copyToClipboard}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] mr-1.5">content_copy</span>
                        Copy
                      </button>
                      <button
                        onClick={downloadQR}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] mr-1.5">qr_code</span>
                        QR
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 sm:py-24 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Advanced Analytics', desc: 'Track clicks, geographic data, and referrers to understand your audience.', icon: 'monitoring' },
                { title: 'Custom Domains', desc: 'Connect your own domain to create branded, recognizable short links.', icon: 'language' },
                { title: 'API Access', desc: 'Integrate Curator directly into your application using our powerful API.', icon: 'api' }
              ].map((feature, idx) => (
                <div key={idx} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm transition-all hover:shadow-md dark:hover:shadow-soft-dark">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                    <span className="material-symbols-outlined">{feature.icon}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <span className="material-symbols-outlined text-[14px] font-bold">link</span>
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">Curator</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">© 2025</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
