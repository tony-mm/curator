import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-600">Sign in to your Curator account</p>
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
              Logged in! Redirecting to dashboard...
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
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Don't have an account?{' '}
          <a href="/signup" className="text-primary font-medium hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
