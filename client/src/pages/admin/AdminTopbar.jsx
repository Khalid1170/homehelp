import React from "react";
import { Link, useLocation } from "react-router-dom"; // 👈 FIXED: Added missing Link and hook imports
import { RefreshCw, LogOut, CreditCard, Layers } from "lucide-react"; // 👈 ADDED: Consistent SVG icons

export default function AdminTopbar({
  logout,
  navigate,
  fetchAdminData
}) {
  const location = useLocation();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-lg">
      
      {/* Brand Anchor Block */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black tracking-widest bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md border border-red-500/20 uppercase select-none flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-red-400 animate-pulse" />
          Platform Overseer Mode
        </span>

        <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
          Homehelp
          <span className="text-slate-500 font-medium text-xs tracking-normal hidden sm:inline">
            Global Matrix
          </span>
        </h1>
      </div>

      {/* Navigation Switchboard Actions */}
      <div className="flex items-center gap-3">

        {/* Real-time Database Synchronization Engine */}
        <button
          onClick={fetchAdminData}
          className="text-xs font-bold bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Sync Database Real-Time</span>
        </button>

        {/* 💰 Integrated Payout Request Link Toggle Button */}
        <Link 
          to="/admin/payouts"
          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-98 shadow-xs border ${
            location.pathname === '/admin/payouts'
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/10'
              : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className={`w-3.5 h-3.5 ${location.pathname === '/admin/payouts' ? 'text-white' : 'text-emerald-400'}`} />
          <span>Payout Requests</span>
        </Link>

        <div className="h-6 w-px bg-slate-800 hidden sm:block mx-1"></div>

        {/* Core Session Sign-Out Pipeline */}
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white hover:border-transparent transition active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}