import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const isClient = user?.role === 'client';

  const handleDashboardNavigation = () => {
    setIsOpen(false);
    if (isClient) {
      navigate('/client/dashboard');
    } else {
      navigate('/worker/dashboard');
    }
  };

  const handleNavClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    try {
      logout();
    } catch (err) {
      console.error("Auth context logoff issue, forcing manual cleanup:", err);
      localStorage.clear(); // Safety fallback to ensure session tokens drop
    }
    navigate('/'); // Safely route users back to Home.jsx layout view
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-xs transition-all duration-200 w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        
        {/* Brand Anchor Logo */}
        <div className="flex items-center gap-2 cursor-pointer group select-none" onClick={() => handleNavClick('/')}>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent group-hover:opacity-85 transition duration-200">
            Homehelp
          </span>
        </div>

        {/* Desktop Navigation Link Cluster */}
        <div className="hidden md:flex items-center gap-8">
          
          {/* Real-time Workers Network Link */}
          <button 
            onClick={() => handleNavClick('/workers')} 
            className={`text-sm font-bold tracking-tight transition-all duration-200 focus:outline-hidden relative py-1 cursor-pointer ${
              location.pathname === '/workers' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Our Network
            {location.pathname === '/workers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-[fadeIn_0.2s_ease-out]" />
            )}
          </button>

          {/* Marketplace Listings Link */}
          <button 
            onClick={() => handleNavClick('/browse-jobs')} 
            className={`text-sm font-bold tracking-tight transition-all duration-200 focus:outline-hidden relative py-1 cursor-pointer ${
              location.pathname === '/browse-jobs' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Browse Jobs
            {location.pathname === '/browse-jobs' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-[fadeIn_0.2s_ease-out]" />
            )}
          </button>

          {/* Conditional Session Auth Actions Wrapper */}
          {!token ? (
            <div className="flex items-center gap-5 border-l border-slate-200/80 pl-6">
              <button 
                onClick={() => handleNavClick('/login')} 
                className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors duration-200 focus:outline-hidden cursor-pointer"
              >
                Sign In
              </button>
              <button 
                onClick={() => handleNavClick('/register/client')} // 🟢 Fixed: Matches /register/client layout boundary route
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-4 py-2.5 rounded-xl transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/15 active:scale-98 focus:outline-hidden cursor-pointer"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-slate-200/80 pl-6">
              <button 
                onClick={handleDashboardNavigation} 
                className={`text-sm font-bold tracking-tight transition-colors duration-200 focus:outline-hidden cursor-pointer ${
                  location.pathname.includes('/dashboard') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isClient ? 'Client Dashboard' : 'Worker Dashboard'}
              </button>
              
              <button 
                onClick={handleSignOut} 
                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200/80 transition-all duration-200 active:scale-97 focus:outline-hidden cursor-pointer"
              >
                Sign Out
              </button>

              {/* User Portrait Identity Badge Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-black select-none shadow-xs border border-white ring-2 ring-indigo-50">
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Hamburg Trigger Action Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-500 hover:text-slate-900 focus:outline-hidden p-2 rounded-xl hover:bg-slate-50 transition active:scale-95"
            aria-label="Toggle Menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between relative">
              <span className={`w-full h-0.5 bg-current rounded-sm transition-all duration-300 transform origin-left ${isOpen ? 'rotate-45 translate-x-px' : ''}`} />
              <span className={`w-full h-0.5 bg-current rounded-sm transition-all duration-300 ${isOpen ? 'opacity-0 translate-x-2' : ''}`} />
              <span className={`w-full h-0.5 bg-current rounded-sm transition-all duration-300 transform origin-left ${isOpen ? '-rotate-45 translate-x-px' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay Expandable Navigation Block */}
      <div 
        className={`md:hidden border-b border-slate-200/60 bg-white transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-80 opacity-100 visibility-visible' : 'max-h-0 opacity-0 visibility-hidden pointer-events-none'
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-4 shadow-inner bg-slate-50/40">
          
          <button 
            onClick={() => handleNavClick('/workers')}
            className={`block w-full text-left text-sm font-black py-1.5 transition ${
              location.pathname === '/workers' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            Our Verified Network
          </button>

          <button 
            onClick={() => handleNavClick('/browse-jobs')}
            className={`block w-full text-left text-sm font-black py-1.5 transition ${
              location.pathname === '/browse-jobs' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            Browse Marketplace Listings
          </button>
          
          <hr className="border-slate-200/60" />

          {!token ? (
            <div className="space-y-3.5 pt-0.5">
              <button 
                onClick={() => handleNavClick('/login')}
                className="block w-full text-left text-sm font-bold text-slate-500 py-1"
              >
                Sign In
              </button>
              <button 
                onClick={() => handleNavClick('/register/client')} // 🟢 Fixed: Matches mobile registration target path
                className="w-full bg-blue-600 text-white text-center text-sm font-black py-3 rounded-xl block shadow-xs"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-0.5">
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                  {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                  {user?.full_name || user?.email}
                </span>
              </div>

              <button 
                onClick={handleDashboardNavigation}
                className="block w-full text-left text-sm font-bold text-slate-600"
              >
                {isClient ? 'Go to Client Dashboard' : 'Go to Worker Dashboard'}
              </button>
              
              <button 
                onClick={handleSignOut}
                className="w-full bg-white text-rose-600 border border-slate-200 text-center text-xs font-bold py-2.5 rounded-xl block shadow-xs"
              >
                Sign Out Account
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}