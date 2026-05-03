import React, { useState, useEffect, useMemo, useContext } from 'react';
import Sidebar from './Sidebar';
import toast from 'react-hot-toast';
import isoCountries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { supabase } from '../utils/supabaseClient';
import { buildShortUrl, createLink } from '../utils/linksService';

isoCountries.registerLocale(enLocale);



const Links = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [showTestUtil, setShowTestUtil] = useState(false);
  
  // Form state
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shortening, setShortening] = useState(false);
  const [error, setError] = useState('');
  
  const [editingUrl, setEditingUrl] = useState('');
  const [editingAlias, setEditingAlias] = useState('');
  


  const filteredLinks = links.filter(link => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      link.shortCode.toLowerCase().includes(q) ||
      link.originalUrl.toLowerCase().includes(q)
    );
  });

  const loadLinks = () => {
    if (!user?.id) return;
    supabase
      .from('links')
      .select('id, short_code, original_url, clicks, created_at, is_archived, expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        setLinks(
          (data || []).map((row) => ({
            id: row.id,
            shortCode: row.short_code,
            originalUrl: row.original_url,
            clicks: row.clicks || 0,
            createdAt: row.created_at,
            isArchived: Boolean(row.is_archived),
            expiresAt: row.expires_at,
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load links:', err);
        setLinks([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLinks();
  }, [user?.id]);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    setError('');
    setShortening(true);
    try {
      const expiresIso = expiresAt ? new Date(expiresAt).toISOString() : undefined;
      await createLink({
        supabase,
        userId: user?.id,
        url,
        alias: alias || undefined,
        expiresAt: expiresIso,
      });
      toast.success('Link created successfully!');
      setUrl('');
      setAlias('');
      setExpiresAt('');
      setShowModal(false);
      loadLinks();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setShortening(false);
    }
  };

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    setError('');
    setShortening(true);
    try {
      const expiresIso = expiresAt ? new Date(expiresAt).toISOString() : null;
      const { error } = await supabase
        .from('links')
        .update({
          original_url: editingUrl,
          short_code: editingAlias || selectedLink.shortCode,
          is_archived: selectedLink.isArchived,
          expires_at: expiresIso,
        })
        .eq('id', selectedLink.id)
        .eq('user_id', user?.id);
      if (error) throw error;
      toast.success('Link updated!');
      setShowEditModal(false);
      loadLinks();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setShortening(false);
    }
  };

  const handleDeleteLink = async () => {
    setShortening(true);
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', selectedLink.id)
        .eq('user_id', user?.id);
      if (error) throw error;
      toast.success('Link deleted!');
      setShowDeleteModal(false);
      loadLinks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setShortening(false);
    }
  };

  const handleArchiveToggle = async (link) => {
    try {
      const { error } = await supabase
        .from('links')
        .update({ is_archived: !link.isArchived })
        .eq('id', link.id)
        .eq('user_id', user?.id);
      if (error) throw error;
      toast.success(`Link ${link.isArchived ? 'restored' : 'archived'}!`);
      loadLinks();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyToClipboard = (shortCode) => {
    const fullUrl = buildShortUrl(shortCode);
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success(`Copied to clipboard`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy');
    });
  };



  const loadQRCode = async (link) => {
    try {
      const url = buildShortUrl(link.shortCode);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
      setQrCode(qrUrl);
      setShowQR(true);
    } catch (err) {
      toast.error('Failed to generate QR');
    }
  };

  const openEditModal = (link) => {
    setSelectedLink(link);
    setEditingUrl(link.originalUrl);
    setEditingAlias(link.shortCode);
    setExpiresAt(link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '');
    setShowEditModal(true);
  };

  const openDeleteModal = (link) => {
    setSelectedLink(link);
    setShowDeleteModal(true);
  };

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
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="Search links..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-soft"
              onClick={() => {
                setExpiresAt('');
                setShowModal(true);
              }}
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              Create Link
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 md:p-8 max-w-6xl w-full mx-auto pb-24">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Your Links</h1>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="material-symbols-outlined animate-spin text-4xl text-zinc-300 dark:text-zinc-700">refresh</span>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="material-symbols-outlined text-3xl text-zinc-400">link</span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No links found</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">Create your first short link to get started with analytics.</p>
              <button
                className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors inline-flex items-center gap-2"
                onClick={() => setShowModal(true)}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Create Link
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredLinks.map((link) => (
                  <div key={link.shortCode} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    
                    <div className="flex items-start gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                        <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.originalUrl).hostname}&sz=64`} alt="" className="w-5 h-5 rounded-sm" onError={(e) => { e.target.style.display='none'; }}/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <a href={buildShortUrl(link.shortCode)} target="_blank" rel="noreferrer" className="text-base font-bold text-zinc-900 dark:text-white hover:underline truncate">
                            curator.link/{link.shortCode}
                          </a>
                          <button
                            onClick={() => copyToClipboard(link.shortCode)}
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy short link"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] sm:max-w-md">
                          {link.originalUrl}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {new Date(link.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          
                          {link.expiresAt && new Date(link.expiresAt) < new Date() ? (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                              Expired
                            </span>
                          ) : link.isArchived ? (
                            <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              Archived
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800 pt-4 sm:pt-0 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1 sm:justify-end">
                          {link.clicks} <span className="material-symbols-outlined text-[14px] text-zinc-400">bar_chart</span>
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">clicks</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button onClick={() => loadQRCode(link)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="QR Code">
                          <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                        </button>
                        <button onClick={() => openEditModal(link)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        
                        {/* More dropdown placeholder or individual buttons */}
                        <div className="relative group/menu">
                          <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                          </button>
                          
                          {/* Simple hover dropdown for extra actions */}
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-soft dark:shadow-soft-dark opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 overflow-hidden">
                            <button onClick={() => handleArchiveToggle(link)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">{link.isArchived ? 'unarchive' : 'archive'}</span>
                              {link.isArchived ? 'Restore' : 'Archive'}
                            </button>
                            <div className="border-t border-zinc-100 dark:border-zinc-700"></div>
                            <button onClick={() => openDeleteModal(link)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Link Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" onClick={() => !shortening && setShowModal(false)}></div>
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Create Link</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50 flex gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <p>{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleCreateLink} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Destination URL</label>
                    <input
                      type="url"
                      required
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      placeholder="https://example.com/very-long-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={shortening}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Custom Alias</label>
                    <div className="relative flex shadow-sm rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                      <div className="bg-zinc-100 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 flex items-center shrink-0">
                        curator.link/
                      </div>
                      <input
                        type="text"
                        className="w-full bg-zinc-50 dark:bg-zinc-950 py-2.5 px-3.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
                        placeholder="custom-alias (optional)"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        disabled={shortening}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Expiration Date <span className="text-zinc-400 font-normal">(Optional)</span></label>
                    <input
                      type="datetime-local"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={shortening}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-soft flex justify-center items-center gap-2"
                      disabled={shortening}
                    >
                      {shortening ? (
                        <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                      ) : 'Create Link'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Link Modal */}
        {showEditModal && selectedLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" onClick={() => !shortening && setShowEditModal(false)}></div>
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Edit Link</h2>
                <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50 flex gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <p>{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleUpdateLink} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Destination URL</label>
                    <input
                      type="url"
                      required
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      value={editingUrl}
                      onChange={(e) => setEditingUrl(e.target.value)}
                      disabled={shortening}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Custom Alias</label>
                    <div className="relative flex shadow-sm rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                      <div className="bg-zinc-100 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 flex items-center shrink-0">
                        curator.link/
                      </div>
                      <input
                        type="text"
                        className="w-full bg-zinc-50 dark:bg-zinc-950 py-2.5 px-3.5 text-sm text-zinc-900 dark:text-white outline-none"
                        value={editingAlias}
                        onChange={(e) => setEditingAlias(e.target.value)}
                        disabled={shortening}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Expiration Date</label>
                    <input
                      type="datetime-local"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={shortening}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-soft flex justify-center items-center gap-2"
                      disabled={shortening}
                    >
                      {shortening ? (
                        <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" onClick={() => !shortening && setShowDeleteModal(false)}></div>
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in overflow-hidden border border-zinc-200 dark:border-zinc-800 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Delete Link?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-300">{selectedLink.shortCode}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={shortening}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-soft"
                  onClick={handleDeleteLink}
                  disabled={shortening}
                >
                  {shortening ? 'Deleting...' : 'Delete Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQR && qrCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowQR(false)}></div>
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in overflow-hidden border border-zinc-200 dark:border-zinc-800 p-6 text-center">
              <div className="flex justify-end mb-2">
                <button onClick={() => setShowQR(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="bg-white p-4 rounded-xl border border-zinc-200 inline-block mb-4 shadow-sm">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 tracking-tight">QR Code</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Scan to visit your shortened URL</p>
            </div>
          </div>
        )}


      </main>
    </div>
  );
};

export default Links;
