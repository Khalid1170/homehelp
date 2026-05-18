import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();

  // Handle incoming role selection from the home page CTA, default to 'client'
  const [role, setRole] = useState(location.state?.selectedRole || 'client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: fullName, 
          email, 
          password, 
          role 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Account might already exist.');
      }

      setSuccess(true);
      // Automatically redirect to login after a brief success window
      setTimeout(() => {
        navigate('/login');
      }, 2000);

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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Already registered?{' '}
          <button onClick={() => navigate('/login')} className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer">
            Sign in here
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/60">
          
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-green-50 text-green-600 font-bold rounded-full flex items-center justify-center text-xl mx-auto">✓</div>
              <h3 className="text-lg font-bold text-slate-900">Registration Successful!</h3>
              <p className="text-sm text-slate-500">Redirecting you to the login screen...</p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleRegister}>
              
              {/* Role Toggle Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/40">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${role === 'client' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    💼 Hire Workers
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('worker')}
                    className={`py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${role === 'worker' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🛠️ Earn Money
                  </button>
                </div>
              </div>

              {/* Vetting Notice banner dynamically shown for Workers */}
              {role === 'worker' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-800 leading-normal animate-[fadeIn_0.2s_ease-out]">
                  ⚠️ <strong>Notice:</strong> Once registered, you will be requested to upload verification documents inside your control board before browsing live funded jobs.
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  disabled={loading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                  placeholder="Alex Mercer"
                />
              </div>

              {/* Email Address */}
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
                  placeholder="name@example.com"
                />
              </div>

              {/* Password */}
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
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/10 transition-all duration-200 disabled:bg-blue-400 active:scale-98 cursor-pointer text-sm"
              >
                {loading ? 'Creating Account Profile...' : 'Complete Registration'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-slate-600 font-medium underline cursor-pointer">
              &larr; Return to main landing page
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}