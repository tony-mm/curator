import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const PublicRedirect = () => {
  const { code } = useParams();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    const visitorId = localStorage.getItem('visitorId') || crypto.randomUUID();
    localStorage.setItem('visitorId', visitorId);

    supabase
      .functions
      .invoke('track-click', {
        body: {
          short_code: code,
          visitor_id: visitorId,
        },
      })
      .then(({ data, error: fnError }) => {
        if (fnError || !data?.original_url) {
          setError('Link not found or expired.');
          return;
        }
        window.location.replace(data.original_url);
      })
      .catch(() => setError('Link not found or expired.'));
  }, [code]);

  if (!error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600 text-sm">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Link not found</h1>
      <p className="text-slate-600 mb-6">The link may be expired or does not exist.</p>
      <Link to="/" className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-container">
        Go Home
      </Link>
    </div>
  );
};

export default PublicRedirect;
