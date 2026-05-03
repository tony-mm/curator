import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { buildShortUrl, createLink } from '../utils/linksService';

const Landing = () => {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);

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
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-outfit font-bold text-white">Curator</Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Product Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setProductDropdownOpen(true)}
                onMouseLeave={() => setProductDropdownOpen(false)}
              >
                  <button className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                    Product
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </button>
                  {productDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        <Link to="/analytics" className="block px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white">URL Shortener</Link>
                        <Link to="/links" className="block px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white">Analytics</Link>
                        <button onClick={() => { alert('QR Generator coming soon'); setProductDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white">QR Code Generator</button>
                        {/* New product actions – for demo we just alert */}
                        <button onClick={() => { alert('Product A selected – navigate or show details here'); setProductDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white">Product A</button>
                        <button onClick={() => { alert('Product B selected – navigate or show details here'); setProductDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white">Product B</button>
                      </div>
                    </div>
                  )}
              </div>
              <Link to="/login" className="text-slate-300 hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-500 transition-colors">Sign Up</Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800">
            <div className="px-6 py-4 space-y-4">
              {/* Mobile Product Dropdown */}
              <div>
                <button 
                  onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                  className="flex items-center justify-between w-full text-slate-300 hover:text-white"
                >
                  Product
                  <span className="material-symbols-outlined text-sm">{productDropdownOpen ? 'expand_less' : 'expand_more'}</span>
                </button>
                {productDropdownOpen && (
                  <div className="mt-2 ml-4 space-y-2">
                    <Link to="/analytics" className="block text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>URL Shortener</Link>
                    <Link to="/links" className="block text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
                    <button onClick={() => { alert('QR Generator coming soon'); setProductDropdownOpen(false); setMobileMenuOpen(false); }} className="block text-left text-slate-300 hover:text-white">QR Code Generator</button>
                  </div>
                )}
              </div>
              <Link to="/login" className="block text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="block bg-blue-600 text-white px-6 py-3 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-24 px-6">
        {/* Hero */}
        <section className="max-w-5xl mx-auto text-center mb-24">
          <h1 className="text-5xl md:text-7xl font-outfit font-bold text-white mb-8 leading-tight">Elevate your links.</h1>
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">Create short, memorable URLs with powerful analytics. Professional, minimal, and fast.</p>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-5">
            {error && <div className="p-4 bg-red-900/30 border border-red-700 text-red-200 rounded-lg">{error}</div>}
            <div className="flex flex-col sm:flex-row gap-5">
              <input
                type="url"
                required
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-5 px-5 text-lg text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Paste your long URL here"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-blue-500 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Shortening...' : 'Shorten URL'}
              </button>
            </div>
            <div className="text-base text-slate-400 pt-2">
              Optional custom alias: <span className="font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">curator.link/</span>
              <input
                type="text"
                className="bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 ml-3 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                placeholder="my-link"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                disabled={loading}
              />
            </div>
          </form>

          {result && (
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-lg mb-6">
                <p className="text-lg font-bold text-white mb-4">Your short link is ready:</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <span className="text-3xl font-mono text-blue-400 break-all">{result}</span>
                  <button onClick={copyToClipboard} className="bg-slate-700 hover:bg-slate-600 text-white px-10 py-4 rounded-xl font-medium whitespace-nowrap">
                    Copy Link
                  </button>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex flex-col items-center md:items-start">
                    <h3 className="text-xl font-bold text-white mb-4">QR Code</h3>
                    <p className="text-slate-400 mb-6 text-center md:text-left">Download and share your QR code. Scans lead directly to your short link.</p>
                    <button
                      onClick={downloadQR}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">download</span>
                      Download QR
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result)}`}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto mt-32">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-outfit font-bold text-white mb-4">Everything you need.</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">A complete platform for link management, analytics, and brand consistency.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-slate-800 border-l-4 border-blue-500 rounded-xl p-10">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-400 text-3xl">monitoring</span>
                </div>
                <h3 className="text-xl font-outfit font-bold text-white">Real-time Analytics</h3>
              </div>
              <p className="text-base text-slate-300 leading-relaxed">Track clicks, geographic distribution, device types, and referral sources with precision. Export data anytime.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-slate-800 border-l-4 border-emerald-500 rounded-xl p-10">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-400 text-3xl">security</span>
                </div>
                <h3 className="text-xl font-outfit font-bold text-white">Enterprise Security</h3>
              </div>
              <p className="text-base text-slate-300 leading-relaxed">SSO integration, two-factor authentication, and fine-grained access controls keep your data safe.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-slate-800 border-l-4 border-amber-500 rounded-xl p-10">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-400 text-3xl">api</span>
                </div>
                <h3 className="text-xl font-outfit font-bold text-white">Developer API</h3>
              </div>
              <p className="text-base text-slate-300 leading-relaxed">RESTful endpoints with comprehensive documentation. Build custom integrations and automate workflows.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto mt-32">
          <div className="bg-blue-600 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-16 py-24 text-center text-white">
              <h2 className="text-4xl font-outfit font-bold mb-6">Ready to get started?</h2>
              <p className="text-white/90 text-xl mb-12 max-w-2xl mx-auto">Join thousands of teams using Curator to manage their links with precision.</p>
              <div className="flex flex-wrap justify-center gap-6">
                <Link to="/signup" className="bg-white text-blue-600 px-12 py-5 rounded-xl font-bold text-lg hover:bg-slate-100 inline-block text-center">Get Started Free</Link>
                <button className="bg-blue-700 border-2 border-blue-400 px-12 py-5 rounded-xl font-bold text-lg hover:bg-blue-800">Schedule Demo</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-14 border-t border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="font-outfit font-bold text-white text-2xl mb-3">Curator</div>
            <div className="text-base text-slate-400">© 2024 Curator Link Management</div>
          </div>
          <div className="flex gap-10 text-base">
            {['Privacy', 'Terms', 'API Documentation', 'Contact'].map((link) => (
              <a key={link} className="text-slate-400 hover:text-white transition-colors" href="#">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
