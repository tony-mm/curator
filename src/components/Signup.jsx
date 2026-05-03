import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const navigate = useNavigate();
  const { signup } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!email || !password || !confirm) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { session } = await signup(email, password);
      setLoading(false);
      setSuccess(true);
      setNeedsEmailConfirm(!session);
      if (session) {
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create account</h1>
          <p className="text-slate-600">Start your Curator journey</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 rounded">
              <span className="material-symbols-outlined text-base">warning</span>
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2 rounded">
              <span className="material-symbols-outlined text-base">check_circle</span>
              {needsEmailConfirm
                ? 'Account created! Check your email to confirm before signing in.'
                : 'Account created! Redirecting to dashboard...'}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                className="w-full border border-slate-300 rounded-lg py-3 px-4 pl-10 text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full border border-slate-300 rounded-lg py-3 px-4 pl-10 text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength={6}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full border border-slate-300 rounded-lg py-3 px-4 pl-10 text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">check_circle</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-container flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span>
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-primary font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
