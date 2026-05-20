import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

export default function WorkerDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active | completed
  const [submittingId, setSubmittingId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/worker/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Could not parse worker payload from the platform core.');
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchDashboardData();
    }
  }, [token]);

  const handleMarkFinished = async (jobId) => {
    setSubmittingId(jobId);
    try {
      const res = await fetch(`http://localhost:5000/jobs/${jobId}/mark-finished`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to update contract timeline status.');
      
      // Refresh local metrics to reflect structural adjustments
      await fetchDashboardData();
    } catch (err) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center p-24">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Synchronizing Operational Ledger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto mt-12 p-6 bg-white border border-rose-200 rounded-2xl text-center shadow-xs">
          <span className="text-2xl">⚠️</span>
          <h3 className="font-bold text-slate-900 mt-2">Data Sync Exception</h3>
          <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>
          <button onClick={fetchDashboardData} className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition">
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  const { worker_info, stats, active_jobs, completed_jobs } = dashboardData || {};
  const jobFeed = activeTab === 'active' ? active_jobs : completed_jobs;

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        
        {/* Welcome Block Profile Stripe */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Welcome back, {worker_info?.name}</h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                worker_info?.verification_status === 'verified' 
                  ? 'bg-blue-50 text-blue-700 border-blue-100' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {worker_info?.verification_status || 'Pending Verification'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Profile Reference Token ID: <span className="font-mono text-slate-600">#WK-{worker_info?.worker_id}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl">
            <span className="text-amber-500 text-sm">★</span>
            <span className="text-xs font-bold text-slate-900">{Number(worker_info?.rating).toFixed(1)}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 border-l border-slate-200">Score Rating</span>
          </div>
        </header>

        {/* Financial Metrics Summary Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Completed Pools</span>
            <span className="text-2xl font-black text-slate-900">{stats?.jobs_completed}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gross Invoiced</span>
            <span className="text-2xl font-black text-slate-900">${stats?.gross_earnings?.toFixed(2)}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Platform Cut (15%)</span>
            <span className="text-2xl font-black text-slate-400">-${stats?.platform_fees?.toFixed(2)}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs border-l-3 border-l-emerald-500">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Net Take Home Payout</span>
            <span className="text-2xl font-black text-emerald-600">${stats?.net_earnings?.toFixed(2)}</span>
          </div>
        </section>

        {/* Feed Management Switchboard Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('active')}
                className={`text-xs font-bold pb-2.5 px-1 relative transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'active' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                Operational & Pitched Runs ({active_jobs?.length || 0})
                {activeTab === 'active' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`text-xs font-bold pb-2.5 px-1 relative transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'completed' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                Archived Closures ({completed_jobs?.length || 0})
                {activeTab === 'completed' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            </div>

            <button 
              onClick={() => navigate('/browse-jobs')}
              className="text-xs font-bold bg-blue-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-blue-700 transition"
            >
              + Find Workload
            </button>
          </div>

          {/* Contextual Table Stream Cards */}
          <div className="space-y-4">
            {jobFeed?.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs font-medium text-slate-400 shadow-xs">
                🚫 Zero assignments allocated to this specific directory tab.
              </div>
            ) : (
              jobFeed?.map((item) => (
                <div 
                  key={item.job_id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer text-sm sm:text-base" onClick={() => navigate(`/jobs/${item.job_id}`)}>
                        {item.title}
                      </h4>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        item.status === 'pending_confirmation' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                        item.status === 'accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {item.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Client Account Anchor: <span className="text-slate-700 font-bold">{item.client_name}</span>
                    </p>

                    {/* Review Callout Section for Completed Deployments */}
                    {item.review && (
                      <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs max-w-xl">
                        <div className="flex items-center gap-1 font-bold text-amber-500 mb-0.5">
                          {'★'.repeat(item.review.rating)}
                          <span className="text-slate-400 font-medium text-[10px] ml-1">Client Feedback Record</span>
                        </div>
                        <p className="text-slate-600 italic font-medium">"{item.review.comment || 'No textual metrics supplied.'}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Gross Value</span>
                      <span className="text-lg font-black text-slate-900">${item.budget}</span>
                    </div>

                    {item.status === 'accepted' && (
                      <button
                        disabled={submittingId === item.job_id}
                        onClick={() => handleMarkFinished(item.job_id)}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-98 cursor-pointer shadow-xs"
                      >
                        {submittingId === item.job_id ? 'Processing...' : 'Mark Execution Complete'}
                      </button>
                    )}
                    
                    {item.status === 'pending_confirmation' && (
                      <span className="text-[11px] font-bold text-slate-400 italic bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                        Awaiting Client Signoff
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}