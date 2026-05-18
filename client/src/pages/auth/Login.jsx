import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid authorization credentials provided.');
      }

      // Safeguard against different Flask JSON shapes (root vs nested user object)
      const userPayload = data.user || { id: data.id, role: data.role, name: data.name };

      if (!userPayload.role) {
        throw new Error("Server response configuration error: Missing user role key.");
      }

      // Commit to Context & LocalStorage
      login(data.token, userPayload);

      // Route-guard dashboard deployment redirection
      if (userPayload.role === 'client') {
        navigate('/client/dashboard');
      } else if (userPayload.role === 'worker') {
        navigate('/worker/dashboard');
      } else if (userPayload.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto w-full max-w-md animate-[fadeIn_0.3s_ease-out]">
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          Sign in to Homehelp
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          New to the platform?{' '}
          <button onClick={() => navigate('/register')} className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer">
            Create an account profile
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/60">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email address</label>
              <input
                id="email"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
              <input
                id="password"
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200/60 rounded-xl text-xs font-semibold text-red-800 flex gap-2 items-center">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all duration-200 disabled:bg-slate-400 active:scale-98 cursor-pointer text-sm"
            >
              {loading ? 'Authenticating Identity...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-slate-600 font-medium underline cursor-pointer">
              &larr; Cancel and return home
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}