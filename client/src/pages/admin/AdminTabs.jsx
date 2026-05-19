import React from "react";

export default function AdminTabs({
  activeTab,
  setActiveTab,
  jobs,
  workers,
  clients
}) {

  return (
    <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">

      <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">

        {/* JOBS */}
        <button
          onClick={() => setActiveTab("jobs")}
          className={`
            px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer
            ${
              activeTab === "jobs"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-500 hover:text-slate-300"
            }
          `}
        >
          ⚡ Full Job Lifecycles ({jobs.length})
        </button>

        {/* WORKERS */}
        <button
          onClick={() => setActiveTab("workers")}
          className={`
            px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer
            ${
              activeTab === "workers"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-500 hover:text-slate-300"
            }
          `}
        >
          🛠️ Specialists ({workers.length})
        </button>

        {/* CLIENTS */}
        <button
          onClick={() => setActiveTab("clients")}
          className={`
            px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer
            ${
              activeTab === "clients"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-500 hover:text-slate-300"
            }
          `}
        >
          💼 Clients ({clients.length})
        </button>

      </div>
    </div>
  );
}