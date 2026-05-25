import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import WorkersJobCard from '../../components/WorkersJobCard';

import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  CheckCircle,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Wallet
} from 'lucide-react';

export default function WorkerDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('active');
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [savingStripe, setSavingStripe] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/worker/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Could not load your dashboard info.');
      }

      const data = await res.json();
      setDashboardData(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, navigate, logout]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [token, navigate, fetchDashboardData]);

  useEffect(() => {
    if (location.state?.stripeUpdated) {
      fetchDashboardData();
      navigate(location.pathname, {
        replace: true,
        state: {}
      });
    }
  }, [location.state, location.pathname, navigate, fetchDashboardData]);

  const handleConnectStripe = async (e) => {
    e.preventDefault();
    if (savingStripe) return;
    setSavingStripe(true);

    try {
      const res = await fetch('http://localhost:5000/worker/connect-stripe', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect with Stripe.');
      }

      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      } else {
        throw new Error('Stripe setup link was not found.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingStripe(false);
    }
  };

  const toggleExpandJob = (jobId) => {
    setExpandedJobId(prevId => (prevId === jobId ? null : jobId));
  };

  const {
    worker_info,
    stats,
    active_jobs = [],
    completed_jobs = []
  } = dashboardData || {};

  const jobFeed = activeTab === 'active' ? active_jobs : completed_jobs;
  const hasStripeSetup = !!worker_info?.stripe_account_id;

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50/50 font-sans antialiased">
        <Navbar />
        <div className="flex flex-col items-center justify-center p-32">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 w-full h-full border-4 border-indigo-600/20 rounded-full"></div>
            <div className="absolute inset-0 w-full h-full border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xs font-black tracking-widest text-slate-400 uppercase mt-5 animate-pulse">
            Loading your updates...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 font-sans antialiased">
        <Navbar />
        <div className="max-w-md mx-auto mt-16 p-8 bg-white border border-rose-100 rounded-3xl text-center shadow-xl shadow-rose-600/5 animate-[scaleUp_0.2s_ease-out]">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-black text-slate-900 tracking-tight text-lg">Something went wrong</h3>
          <p className="text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen font-sans antialiased text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        {/* WELCOME BANNER PANEL */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1 z-10">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Hello, {worker_info?.name || 'Helper'}
            </h1>
            <p className="text-xs text-indigo-200/70 font-semibold tracking-tight">
              Track your earnings, manage your tasks, and view your active jobs.
            </p>
          </div>
        </header>

        {/* STRIPE PAYOUT GATEWAY STATUS */}
        <section className="bg-white border border-slate-200/70 rounded-3xl shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Bank Payout Setup
              </h3>
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border select-none ${
                hasStripeSetup
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : 'bg-amber-50 text-amber-700 border-amber-200/60'
              }`}
            >
              {hasStripeSetup ? 'Connected' : 'Action Required'}
            </span>
          </div>

          <div className="p-6 sm:p-8 text-center">
            {hasStripeSetup ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-slate-50/60 border border-slate-100 p-4 rounded-2xl max-w-xl mx-auto">
                <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-sm text-slate-600 font-bold tracking-tight">
                  Stripe Account Linked:{' '}
                  <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-indigo-600 text-xs">
                    {worker_info?.stripe_account_id}
                  </span>
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  We use Stripe to safely and directly transfer your earnings to your bank account. Set it up below to start receiving payouts automatically.
                </p>
                <button
                  onClick={handleConnectStripe}
                  disabled={savingStripe}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mx-auto shadow-xs hover:shadow-md hover:shadow-blue-600/15 active:scale-98 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  {savingStripe ? 'Connecting...' : 'Set Up Payouts'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* METRICS DASHBOARD GRID */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Jobs Completed */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-3 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-4 shadow-xs hover:shadow-sm transition duration-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate whitespace-normal sm:whitespace-nowrap leading-tight">
                Jobs Done
              </span>
              <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5 truncate">
                {stats?.jobs_completed || 0}
              </span>
            </div>
          </div>

          {/* Gross Earnings */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-3 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-4 shadow-xs hover:shadow-sm transition duration-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate whitespace-normal sm:whitespace-nowrap leading-tight">
                Total Made
              </span>
              <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5 truncate">
                ${(stats?.gross_earnings || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Platform Fees */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-3 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-4 shadow-xs hover:shadow-sm transition duration-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50/50 text-rose-500 border border-rose-100/50 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate whitespace-normal sm:whitespace-nowrap leading-tight">
                App Fee (15%)
              </span>
              <span className="text-base sm:text-xl font-black text-slate-400 block mt-0.5 truncate">
                -${(stats?.platform_fees || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Net Earnings */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-3 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-4 shadow-xs hover:shadow-sm transition duration-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 border border-indigo-100/70 flex items-center justify-center shrink-0 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-600/70 truncate whitespace-normal sm:whitespace-nowrap leading-tight">
                Take Home
              </span>
              <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5 truncate">
                ${(stats?.net_earnings || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Requests Pending */}
          <div className="bg-white border border-amber-200/70 rounded-2xl p-3 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-4 shadow-xs hover:shadow-sm transition duration-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-600/70 truncate whitespace-normal sm:whitespace-nowrap leading-tight">
                Processing
              </span>
              <span className="text-base sm:text-xl font-black text-amber-600 block mt-0.5 truncate">
                {stats?.payout_requests_pending || stats?.payouts_pending || 0}
              </span>
            </div>
          </div>

          {/* Payouts Settled */}
          <div className="bg-white border border-emerald-200/70 rounded-2xl p-3 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-4 shadow-xs hover:shadow-sm transition duration-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600/70 truncate whitespace-normal sm:whitespace-nowrap leading-tight">
                Paid Out
              </span>
              <span className="text-base sm:text-xl font-black text-emerald-600 block mt-0.5 truncate">
                {stats?.payouts_completed || stats?.payouts_settled || 0}
              </span>
            </div>
          </div>
        </section>

        {/* FEED SELECTION AND CONTENT REGISTRY */}
        <div className="space-y-6">
          <div className="flex gap-6 border-b border-slate-200/80 pb-1.5 select-none">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 text-sm tracking-tight font-bold transition-all duration-200 relative cursor-pointer ${
                activeTab === 'active' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Current Tasks ({active_jobs.length})
              {activeTab === 'active' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-[fadeIn_0.15s_ease-out]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-3 text-sm tracking-tight font-bold transition-all duration-200 relative cursor-pointer ${
                activeTab === 'completed' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Past Tasks ({completed_jobs.length})
              {activeTab === 'completed' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-[fadeIn_0.15s_ease-out]" />
              )}
            </button>
          </div>

          {/* RENDER DYNAMIC CARD INJECTION */}
          <div className="space-y-4">
            {jobFeed.length > 0 ? (
              jobFeed.map((item) => (
                <div 
                  key={item.job_id || item.id}
                  className="transition-all duration-300 hover:translate-x-0.5"
                >
                  <WorkersJobCard
                    job={item}
                    isExpanded={expandedJobId === (item.job_id || item.id)}
                    onToggleExpand={() => toggleExpandJob(item.job_id || item.id)}
                    hasStripeSetup={hasStripeSetup}
                    onPayoutSuccess={fetchDashboardData}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-white p-8">
                <p className="text-sm text-slate-400 font-bold tracking-tight">
                  No tasks found in this section.
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}