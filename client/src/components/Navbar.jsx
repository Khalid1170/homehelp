import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path if your context is elsewhere

export default function Navbar({ setShowGetStarted }) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
        
        <div className="flex items-center gap-2 cursor-pointer group select-none" onClick={() => navigate('/')}>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-90 transition duration-200">
            Homehelp
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => navigate('/browse-jobs')} 
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 focus:outline-hidden"
          >
            Browse Jobs
          </button>

          {!token ? (
            <div className="flex items-center gap-3 sm:gap-4 border-l border-slate-200/80 pl-4 sm:pl-6">
              <button 
                onClick={() => navigate('/login')} 
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200 focus:outline-hidden"
              >
                Sign In
              </button>
              <button 
                onClick={() => setShowGetStarted && setShowGetStarted(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/10 active:scale-98 focus:outline-hidden"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4 border-l border-slate-200/80 pl-4 sm:pl-6">
              <button 
                onClick={() => navigate('/admin/dashboard')} 
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200 focus:outline-hidden"
              >
                Control Dashboard
              </button>
              <button 
                onClick={() => { logout(); navigate('/'); }} 
                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-200 active:scale-97 focus:outline-hidden"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}