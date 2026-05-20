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
        throw new Error(data.message || 'Incorrect email or password. Please try again.');
      }

      const userPayload = data.user || { id: data.id, role: data.role, name: data.name };

      if (!userPayload.role) {
        throw new Error("Something went wrong with your account setup. Missing user role.");
      }

      login(data.token, userPayload);

      // Smooth dashboard sorting based on user type
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      
      {/* Header Area */}
      <div className="sm:mx-auto w-full max-w-md animate-[fadeIn_0.3s_ease-out] text-center">
        <span 
          onClick={() => navigate('/')} 
          className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer select-none"
        >
          Homehelp
        </span>
        <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          New to the platform?{' '}
          <button 
            onClick={() => navigate('/register')} 
            className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer focus:outline-hidden"
          >
            Create an account here
          </button>
        </p>
      </div>

      {/* Main Login Form Wrapper */}
      <div className="mt-8 sm:mx-auto w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/60">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                id="email"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-60"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            {/* Humanized Error Alerts */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-800 flex gap-2 items-start leading-normal">
                <span className="text-rose-500 text-sm mt-px">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Control */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed active:scale-98 cursor-pointer"
            >
              {loading ? 'Signing you in...' : 'Sign In'}
            </button>
          </form>

          {/* Secondary Escape Navigation Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="text-xs text-slate-400 hover:text-slate-600 font-bold tracking-wide uppercase transition-colors focus:outline-hidden"
            >
              &larr; Cancel and go back
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}