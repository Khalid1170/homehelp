import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminTopbar from './AdminTopbar';
import FinancialOverview from "./FinancialOverview";
import AdminTabs from "./AdminTabs";

export default function AdminDashboard() {
  const { token, logout} = useAuth();
  const navigate = useNavigate();
  
  // Real-time Database Collections
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tab and Interactive Inspect Drawer States
  const [activeTab, setActiveTab] = useState('jobs'); // jobs | workers | clients
  const [inspectTarget, setInspectTarget] = useState(null); // Holds a profile object when clicked

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Concurrent database extraction across all four of your admin endpoints 🚀
      const [statsRes, clientsRes, workersRes, jobsRes] = await Promise.all([
        fetch('http://localhost:5000/admin/stats', { headers }),
        fetch('http://localhost:5000/admin/clients/detailed', { headers }),
        fetch('http://localhost:5000/admin/workers/detailed', { headers }),
        fetch('http://localhost:5000/admin/jobs/full', { headers })
      ]);

      if (!statsRes.ok || !clientsRes.ok || !workersRes.ok || !jobsRes.ok) {
        throw new Error('Database hydration failed. Verify authorization or role parameters.');
      }

      setStats(await statsRes.json());
      setClients(await clientsRes.json());
      setWorkers(await workersRes.json());
      setJobs(await jobsRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAdminData();
  }, [token]);

  // Actions wired directly to your backend operational endpoints
  const handleToggleSuspension = async (userId) => {
    if (!window.confirm("Are you sure you want to change this user's platform access state?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not execute user status toggle.');
      fetchAdminData();
      if (inspectTarget) setInspectTarget(null);
    } catch (err) { alert(err.message); }
  };

  const handleVerifyWorker = async (workerId) => {
    try {
      const res = await fetch(`http://localhost:5000/admin/workers/${workerId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not commit validation parameter.');
      fetchAdminData();
      if (inspectTarget) setInspectTarget(null);
    } catch (err) { alert(err.message); }
  };

  const handleForceJobStatus = async (jobId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/admin/jobs/${jobId}/force-status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Could not force override job state.');
      fetchAdminData();
    } catch (err) { alert(err.message); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold tracking-widest uppercase text-slate-500">Compiling Global Architecture Feed...</p>
        </div>
      </div>
    );
  }

  // Visual SVG Chart Dimensions Mapping Data
  const grossVol = stats?.finance?.total_gross_volume || 0;
  const platformFees = stats?.finance?.estimated_platform_fees || 0;
  const payouts = stats?.finance?.net_worker_payouts || 0;
  const chartMax = Math.max(grossVol, 1);
  const feeHeight = (platformFees / chartMax) * 120;
  const payoutHeight = (payouts / chartMax) * 120;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      
        <AdminTopbar
  logout={logout}
  navigate={navigate}
  fetchAdminData={fetchAdminData}
    />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* 📊 Section 1: Financial Telemetry & Native SVG Chart Metrics */}
            <FinancialOverview stats={stats} />

        {/* 📋 Section 2: Master Tab Switches */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <AdminTabs
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  jobs={jobs}
  workers={workers}
  clients={clients}
/>

          {/* =====================================
              TAB 1: COMPLETE JOB CYCLES (THE FEED)
              ===================================== */}
          {activeTab === 'jobs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-xs text-slate-500 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Job Context</th>
                    <th className="p-4">Marketplace Entities</th>
                    <th className="p-4">Financials State</th>
                    <th className="p-4">Status Flag</th>
                    <th className="p-4 text-right">Administrative Action Overrides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {jobs.map(j => (
                    <tr key={j.job_id} className="hover:bg-slate-850/10 transition">
                      <td className="p-4">
                        <p className="font-bold text-white text-sm">{j.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: #{j.job_id} • Posted {j.created_at?.slice(0,10)}</p>
                      </td>
                      <td className="p-4 text-xs space-y-1">
                        <p>💼 Client: <span className="font-bold text-slate-200 hover:underline cursor-pointer hover:text-blue-400" onClick={() => {
                          const match = clients.find(c => c.id === j.participants.client.id);
                          if (match) setInspectTarget({ ...match, inspectRole: 'client' });
                        }}>{j.participants.client.name}</span></p>
                        <p>🛠️ Specialist: <span className="font-bold text-slate-200 hover:underline cursor-pointer hover:text-blue-400" onClick={() => {
                          const match = workers.find(w => w.name === j.participants.worker.name);
                          if (match) setInspectTarget({ ...match, inspectRole: 'worker' });
                        }}>{j.participants.worker.name}</span></p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white text-xs">Valued: {j.financials.budget}</p>
                        <span className={`inline-block mt-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                          j.financials.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          💳 {j.financials.payment_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          j.status === 'completed' ? 'bg-emerald-950 text-emerald-400' :
                          j.status === 'assigned' ? 'bg-blue-950 text-blue-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {j.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        {j.status !== 'completed' && (
                          <button onClick={() => handleForceJobStatus(j.job_id, 'completed')} className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-md transition cursor-pointer">
                            Force Complete
                          </button>
                        )}
                        {j.status !== 'cancelled' && (
                          <button onClick={() => handleForceJobStatus(j.job_id, 'cancelled')} className="text-[11px] bg-slate-800 hover:bg-red-900 hover:text-white text-slate-400 font-bold px-2 py-1 rounded-md transition cursor-pointer">
                            Force Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* =====================================
              TAB 2: SPECIALISTS VIEW GRID
              ===================================== */}
          {activeTab === 'workers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-xs text-slate-500 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Worker Info</th>
                    <th className="p-4">Vetting Parameters</th>
                    <th className="p-4">Performance Rating</th>
                    <th className="p-4">Total Earned</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {workers.map(w => (
                    <tr key={w.worker_id} className="hover:bg-slate-850/10 transition">
                      <td className="p-4">
                        <p className="font-bold text-white text-sm hover:underline cursor-pointer hover:text-blue-400" onClick={() => setInspectTarget({ ...w, inspectRole: 'worker' })}>{w.name}</p>
                        <p className="text-xs text-slate-500">{w.email}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${w.verification === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'}`}>
                          {w.verification.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-200">★ {w.rating}</td>
                      <td className="p-4 text-xs">
                        <p className="font-semibold text-white">{w.performance?.completed} Assignments</p>
                        <p className="text-emerald-400 mt-0.5">£{w.performance?.gross_earnings} Gross</p>
                      </td>
                      <td className="p-4 text-right">
                        {w.verification !== 'verified' && (
                          <button onClick={() => handleVerifyWorker(w.worker_id)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition mr-2 cursor-pointer">Verify</button>
                        )}
                        <button onClick={() => handleToggleSuspension(w.worker_id)} className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${w.is_suspended ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
                          {w.is_suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* =====================================
              TAB 3: CLIENTS VIEW GRID
              ===================================== */}
          {activeTab === 'clients' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-xs text-slate-500 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Client Parameters</th>
                    <th className="p-4">Engagement Index</th>
                    <th className="p-4">Capital Outlay</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {clients.map(c => (
                    <tr key={c.id} className="hover:bg-slate-850/10 transition">
                      <td className="p-4">
                        <p className="font-bold text-white text-sm hover:underline cursor-pointer hover:text-blue-400" onClick={() => setInspectTarget({ ...c, inspectRole: 'client' })}>{c.name}</p>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </td>
                      <td className="p-4 font-semibold text-slate-300">{c.stats?.jobs_posted} Tasks Published</td>
                      <td className="p-4 font-bold text-emerald-400">£{c.stats?.total_spent}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleToggleSuspension(c.id)} className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${c.is_suspended ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
                          {c.is_suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* =======================================================
          👁️ INTERACTIVE CONTROL DRAWER (GOD-MODE PROFILE INSPECT)
          ======================================================= */}
      {inspectTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-end animate-[fadeIn_0.15s_ease-out]">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 p-6 shadow-2xl h-full overflow-y-auto flex flex-col justify-between">
            
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black tracking-widest bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">
                    Platform Entity Deep-Audit
                  </span>
                  <h2 className="text-xl font-black text-white mt-2">{inspectTarget.name}</h2>
                  <p className="text-xs text-slate-400">{inspectTarget.email}</p>
                </div>
                <button onClick={() => setInspectTarget(null)} className="text-slate-500 hover:text-white text-sm font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 cursor-pointer">
                  ✕ Close Window
                </button>
              </div>

              {/* Render Worker Profile Specific Historical Lists */}
              {inspectTarget.inspectRole === 'worker' ? (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-3 text-center gap-2">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Average Score</p><p className="text-base font-black text-white mt-0.5">★ {inspectTarget.rating}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Gross Earnings</p><p className="text-base font-black text-emerald-400 mt-0.5">£{inspectTarget.performance?.gross_earnings}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Completed</p><p className="text-base font-black text-white mt-0.5">{inspectTarget.performance?.completed}</p></div>
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Associated Platform Identity State</h4>
                  <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-2 text-xs">
                    <div>Account Status: <span className={inspectTarget.is_suspended ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{inspectTarget.is_suspended ? 'SUSPENDED' : 'ACTIVE'}</span></div>
                    <div>Vetting Verification: <span className="font-bold text-slate-200">{inspectTarget.verification?.toUpperCase()}</span></div>
                  </div>
                </div>
              ) : (
                /* Render Client Profile Specific Historical Lists */
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 text-center gap-2">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Tasks Published</p><p className="text-lg font-black text-white mt-0.5">{inspectTarget.stats?.jobs_posted}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Total Capital Capitalized</p><p className="text-lg font-black text-emerald-400 mt-0.5">£{inspectTarget.stats?.total_spent}</p></div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignment Audit Trail</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {inspectTarget.recent_activity?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No historical jobs logged on this account rows yet.</p>
                    ) : (
                      inspectTarget.recent_activity?.map(j => (
                        <div key={j.job_id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-white">{j.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Assigned to: {j.worker}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-300">Valued: {j.budget}</p>
                            <p className="text-[10px] font-medium text-blue-400 mt-0.5 uppercase">{j.status}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Panel Management Hotkeys */}
            <div className="pt-4 border-t border-slate-800 flex gap-3">
              {inspectTarget.inspectRole === 'worker' && inspectTarget.verification !== 'verified' && (
                <button onClick={() => handleVerifyWorker(inspectTarget.worker_id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">
                  Approve Vetting Profile
                </button>
              )}
              <button 
                onClick={() => handleToggleSuspension(inspectTarget.inspectRole === 'worker' ? inspectTarget.worker_id : inspectTarget.id)} 
                className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition border cursor-pointer ${
                  inspectTarget.is_suspended ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {inspectTarget.is_suspended ? 'Lift Profile Suspension' : 'Terminate System Access'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}