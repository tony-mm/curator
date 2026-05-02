import React, { useState, useEffect, useMemo, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import toast from 'react-hot-toast';
import isoCountries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { buildShortUrl, createLink } from '../utils/linksService';

isoCountries.registerLocale(enLocale);

/** ISO 3166-1 alpha-2 list with English names, sorted A–Z for the simulate-click picker */
const SIMULATE_CLICK_COUNTRY_OPTIONS = Object.entries(
  isoCountries.getNames('en', { select: 'official' }),
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

const Links = () => {
  const { user } = useContext(AuthContext);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [shortening, setShortening] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUrl, setEditingUrl] = useState('');
  const [editingAlias, setEditingAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [showTestUtil, setShowTestUtil] = useState(false);
  const [testCountry, setTestCountry] = useState('US');
  const [testingLink, setTestingLink] = useState(null);
  const [testCountrySearch, setTestCountrySearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const simulateCountryOptionsShown = useMemo(() => {
    const q = testCountrySearch.trim().toLowerCase();
    let list = q
      ? SIMULATE_CLICK_COUNTRY_OPTIONS.filter(
          ({ code, name }) =>
            code.toLowerCase().includes(q) || name.toLowerCase().includes(q),
        )
      : SIMULATE_CLICK_COUNTRY_OPTIONS;
    if (!list.some((c) => c.code === testCountry)) {
      const selected = SIMULATE_CLICK_COUNTRY_OPTIONS.find((c) => c.code === testCountry);
      if (selected) list = [selected, ...list];
    }
    return list;
  }, [testCountrySearch, testCountry]);

  const filteredLinks = links.filter(link => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      link.shortCode.toLowerCase().includes(q) ||
      link.originalUrl.toLowerCase().includes(q)
    );
  });

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? 'text-white bg-primary-container/20 border-l-2 border-primary-container'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

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
    setSuccess('');
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
      toast.success(`Copied: ${fullUrl}`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    });
  };

  const simulateTestClick = async (link) => {
    try {
      const visitorId = localStorage.getItem('visitorId') || crypto.randomUUID();
      localStorage.setItem('visitorId', visitorId);
      const { error } = await supabase.functions.invoke('track-click', {
        body: {
          short_code: link.shortCode,
          country: testCountry,
          visitor_id: visitorId,
          user_agent: 'Test Client',
          referrer: 'test',
        },
      });
      if (error) throw error;
      toast.success(`Simulated click from ${testCountry}!`);
      setShowTestUtil(false);
      setTestingLink(null);
      loadLinks();
    } catch (err) {
      console.error('[SIMULATE CLICK ERROR]', err);
      toast.error(err.message);
    }
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
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="w-full h-16 flex justify-between items-center px-6 sticky top-0 bg-white border-b border-slate-200 z-40">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full border border-slate-300 rounded-full py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Search links..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            <button
              className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              onClick={() => {
                setExpiresAt('');
                setShowModal(true);
              }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Link
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading links...</div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="mb-4">No links yet.</p>
              <button
                className="bg-primary text-white px-6 py-2 rounded-md"
                onClick={() => setShowModal(true)}
              >
                Create your first link
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Short URL</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Original URL</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Clicks</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Created</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 text-right uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLinks.map((link) => (
                    <tr key={link.shortCode} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary">{link.shortCode}</span>
                          <button
                            onClick={() => copyToClipboard(link.shortCode)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded"
                            title="Copy"
                          >
                            <span className="material-symbols-outlined text-base">content_copy</span>
                          </button>
                          <button
                            onClick={() => loadQRCode(link)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded"
                            title="QR Code"
                          >
                            <span className="material-symbols-outlined text-base">qr_code</span>
                          </button>
                        </div>
                        {link.expiresAt && (
                          <p className="text-xs text-slate-500 mt-1">
                            Expires: {new Date(link.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 truncate max-w-xs">{link.originalUrl}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">{link.clicks}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          link.isArchived
                            ? 'bg-slate-100 text-slate-600'
                            : link.expiresAt && new Date(link.expiresAt) < new Date()
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {link.isArchived ? 'Archived' : link.expiresAt && new Date(link.expiresAt) < new Date() ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => copyToClipboard(link.shortCode)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded"
                            title="Copy"
                          >
                            <span className="material-symbols-outlined text-lg">content_copy</span>
                          </button>
                          <button
                            onClick={() => loadQRCode(link)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded"
                            title="QR Code"
                          >
                            <span className="material-symbols-outlined text-lg">qr_code</span>
                          </button>
                          <button
                            onClick={() => {
                              setTestingLink(link);
                              setTestCountrySearch('');
                              setShowTestUtil(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded text-xs"
                            title="Test Click"
                          >
                            <span className="material-symbols-outlined text-lg">test</span>
                          </button>
                          <button
                            onClick={() => openEditModal(link)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleArchiveToggle(link)}
                            className={`p-2 hover:bg-slate-100 rounded ${
                              link.isArchived ? 'text-green-600 hover:text-green-700' : 'text-slate-400 hover:text-amber-600'
                            }`}
                            title={link.isArchived ? 'Restore' : 'Archive'}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {link.isArchived ? 'restore' : 'archive'}
                            </span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(link)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Link Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Create New Link</h2>
                <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowModal(false)}>
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 rounded">
                  <span className="material-symbols-outlined">warning</span>
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2 rounded">
                  <span className="material-symbols-outlined">check_circle</span>
                  {success}
                </div>
              )}
              <form onSubmit={handleCreateLink} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination URL</label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      className="w-full border border-slate-300 rounded-md py-2.5 pl-10 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="https://example.com/very-long-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={shortening}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">link</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Custom Alias (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">curator.link/</span>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-md py-2.5 pl-32 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="my-custom-alias"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      disabled={shortening}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Expiration Date (Optional)</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      className="w-full border border-slate-300 rounded-md py-2.5 pl-10 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={shortening}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">schedule</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Leave empty for no expiration</p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-md font-medium text-slate-600 hover:bg-slate-100"
                    onClick={() => setShowModal(false)}
                    disabled={shortening}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary-container flex items-center gap-2"
                    disabled={shortening}
                  >
                    {shortening ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        Shortening...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">bolt</span>
                        Shorten URL
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Link Modal */}
        {showEditModal && selectedLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Edit Link</h2>
                <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowEditModal(false)}>
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 rounded">
                  <span className="material-symbols-outlined">warning</span>
                  {error}
                </div>
              )}
              <form onSubmit={handleUpdateLink} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination URL</label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      className="w-full border border-slate-300 rounded-md py-2.5 pl-10 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      value={editingUrl}
                      onChange={(e) => setEditingUrl(e.target.value)}
                      disabled={shortening}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">link</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Custom Alias</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">curator.link/</span>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-md py-2.5 pl-32 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      value={editingAlias}
                      onChange={(e) => setEditingAlias(e.target.value)}
                      disabled={shortening}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Expiration Date</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      className="w-full border border-slate-300 rounded-md py-2.5 pl-10 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={shortening}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">schedule</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-md font-medium text-slate-600 hover:bg-slate-100"
                    onClick={() => setShowEditModal(false)}
                    disabled={shortening}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary-container flex items-center gap-2"
                    disabled={shortening}
                  >
                    {shortening ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Link?</h3>
                <p className="text-slate-600 mb-6">
                  Are you sure you want to delete <span className="font-bold text-primary">{selectedLink.shortCode}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    className="px-6 py-2 rounded-md font-medium text-slate-600 hover:bg-slate-100"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={shortening}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-600 text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 flex items-center gap-2"
                    onClick={handleDeleteLink}
                    disabled={shortening}
                  >
                    {shortening ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">delete</span>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQR && qrCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg text-center">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">QR Code</h2>
                <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowQR(false)}>
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              <img src={qrCode} alt="QR Code" className="mx-auto mb-4" />
              <p className="text-sm text-slate-600">Scan to visit your shortened URL</p>
            </div>
          </div>
        )}

        {/* Test Click Utility Modal */}
        {showTestUtil && testingLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Simulate Click (Dev)</h2>
                <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowTestUtil(false)}>
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Simulate a click from a specific country to test geographic analytics.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                <p className="text-xs text-slate-500 mb-2">
                  Full ISO 3166-1 list. Use the search box to narrow the list, then pick a country.
                </p>
                <input
                  type="search"
                  value={testCountrySearch}
                  onChange={(e) => setTestCountrySearch(e.target.value)}
                  placeholder="Search by name or code (e.g. Japan, JP)…"
                  className="w-full px-3 py-2 mb-2 border border-slate-300 rounded-md text-slate-900 bg-white text-sm"
                />
                <select
                  value={testCountry}
                  onChange={(e) => setTestCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white"
                >
                  {simulateCountryOptionsShown.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {name} ({code})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 mb-4">Link: <span className="font-mono font-bold">{testingLink.shortCode}</span></p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-6 py-2 rounded-md font-medium text-slate-600 hover:bg-slate-100"
                  onClick={() => setShowTestUtil(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 flex items-center gap-2"
                  onClick={() => simulateTestClick(testingLink)}
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  Simulate Click
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Links;
