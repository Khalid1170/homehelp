import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ setShowGetStarted }) {
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
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
        
        {/* Brand Anchor */}
        <div className="flex items-center gap-2 cursor-pointer group select-none" onClick={() => handleNavClick('/')}>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-90 transition duration-200">
            Homehelp
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => handleNavClick('/browse-jobs')} 
            className={`text-sm font-semibold transition-colors duration-200 focus:outline-hidden ${
              location.pathname === '/browse-jobs' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            Browse Jobs
          </button>

          {!token ? (
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
              <button 
                onClick={() => handleNavClick('/login')} 
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200 focus:outline-hidden"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setShowGetStarted && setShowGetStarted(true); }} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/10 active:scale-98 focus:outline-hidden"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
              <button 
                onClick={handleDashboardNavigation} 
                className={`text-sm font-semibold transition-colors duration-200 focus:outline-hidden ${
                  location.pathname.includes('/dashboard') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isClient ? 'Client Dashboard' : 'Worker Dashboard'}
              </button>
              
              <button 
                onClick={handleSignOut} 
                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-200 active:scale-97 focus:outline-hidden"
              >
                Sign Out
              </button>

              {/* User Avatar Circle Badge */}
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black select-none shadow-xs">
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Trigger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-600 hover:text-slate-900 focus:outline-hidden p-1.5 rounded-lg hover:bg-slate-50 transition"
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

      {/* Mobile Drawer Overlay Menu */}
      <div 
        className={`md:hidden border-b border-slate-200 bg-white transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-64 opacity-100 visibility-visible' : 'max-h-0 opacity-0 visibility-hidden pointer-events-none'
        }`}
      >
        <div className="px-4 pt-2 pb-5 space-y-3.5 shadow-inner bg-slate-50/50">
          <button 
            onClick={() => handleNavClick('/browse-jobs')}
            className={`block w-full text-left text-sm font-bold py-1.5 transition ${
              location.pathname === '/browse-jobs' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            Browse Marketplace Listings
          </button>
          
          <hr className="border-slate-200/60" />

          {!token ? (
            <div className="space-y-3 pt-0.5">
              <button 
                onClick={() => handleNavClick('/login')}
                className="block w-full text-left text-sm font-semibold text-slate-600 py-1"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsOpen(false); setShowGetStarted && setShowGetStarted(true); }}
                className="w-full bg-blue-600 text-white text-center text-sm font-bold py-2.5 rounded-xl block shadow-xs"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 pt-0.5">
              <div className="flex items-center gap-2 py-1">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                  {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                  {user?.full_name || user?.email}
                </span>
              </div>

              <button 
                onClick={handleDashboardNavigation}
                className="block w-full text-left text-sm font-semibold text-slate-600"
              >
                {isClient ? 'Go to Client Dashboard' : 'Go to Worker Dashboard'}
              </button>
              
              <button 
                onClick={handleSignOut}
                className="w-full bg-slate-100 text-rose-600 border border-slate-200 text-center text-xs font-bold py-2 rounded-xl block"
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