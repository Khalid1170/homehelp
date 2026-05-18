import React from "react";

export default function AdminTopbar({
  logout,
  navigate,
  fetchAdminData
}) {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-lg">
      
      <div className="flex items-center gap-3">
        <span className="text-xs font-black tracking-widest bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md border border-red-500/20 uppercase select-none">
          Platform Overseer Mode
        </span>

        <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
          Homehelp
          <span className="text-slate-500 font-medium text-xs tracking-normal">
            Global Matrix
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-4">

        <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

        <button
          onClick={fetchAdminData}
          className="text-xs font-bold bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          🔄 Sync Database Real-Time
        </button>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white hover:border-transparent transition active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          🚪 Sign Out
        </button>
      </div>
    </nav>
  );
}