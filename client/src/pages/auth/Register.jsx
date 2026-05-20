import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();

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
        throw new Error(data.message || 'Could not register. An account with this email might already exist.');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2200);

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
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/login')} 
            className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer focus:outline-hidden"
          >
            Sign in here
          </button>
        </p>
      </div>

      {/* Form Content Block */}
      <div className="mt-8 sm:mx-auto w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/60">
          
          {success ? (
            <div className="text-center py-8 space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold rounded-full flex items-center justify-center text-2xl mx-auto shadow-2xs">✓</div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Account Created!</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Taking you straight to the sign-in screen...</p>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleRegister}>
              
              {/* Simplified Role Toggles */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What do you want to do?</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/40">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all focus:outline-hidden cursor-pointer ${role === 'client' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    💼 Hire Help
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('worker')}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all focus:outline-hidden cursor-pointer ${role === 'worker' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🛠️ Earn Money
                  </button>
                </div>
              </div>

              {/* Notice Banner written in natural language for Workers */}
              {role === 'worker' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl text-xs font-medium text-amber-800 leading-normal animate-[fadeIn_0.2s_ease-out]">
                  💡 <strong>Quick Note:</strong> To keep our community trusted and safe, you will be asked to upload a quick piece of ID inside your dashboard before you can accept any jobs.
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  disabled={loading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-60"
                  placeholder="Alex Mercer"
                />
              </div>

              {/* Email Address */}
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
                  placeholder="name@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Create Password</label>
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

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-800 flex gap-2 items-start leading-normal">
                  <span className="text-rose-500 text-sm mt-px">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-600/10 transition-all duration-200 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed active:scale-98 cursor-pointer"
              >
                {loading ? 'Creating your account...' : 'Complete Registration'}
              </button>
            </form>
          )}

          {/* Secondary Escape Navigation Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="text-xs text-slate-400 hover:text-slate-600 font-bold tracking-wide uppercase transition-colors focus:outline-hidden"
            >
              &larr; Return to home page
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}