import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import WorkersJobCard from '../../components/WorkersJobCard';

import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Percent,
  Wallet,
  Clock,
  CheckCircle,
  HelpCircle,
  CreditCard,
  Save
} from 'lucide-react';

export default function WorkerDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('active');
  const [submittingId, setSubmittingId] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);

  const [savingStripe, setSavingStripe] = useState(false);

  const [stripeForm, setStripeForm] = useState({
    stripe_account_id: '',
    stripe_email: '',
    payout_method: 'bank_transfer'
  });

  const fetchDashboardData = async () => {
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

        throw new Error('Could not load worker dashboard.');
      }

      const data = await res.json();
      setDashboardData(data);

      setStripeForm({
        stripe_account_id: data?.worker_info?.stripe_account_id || '',
        stripe_email: data?.worker_info?.stripe_email || '',
        payout_method: data?.worker_info?.payout_method || 'bank_transfer'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [token, navigate]);

  // Stripe redirect detection (IMPORTANT FIX)
  useEffect(() => {
    if (location.state?.stripeUpdated) {
      fetchDashboardData();

      navigate(location.pathname, {
        replace: true,
        state: {}
      });
    }
  }, [location.state, location.pathname, navigate]);

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
        throw new Error(data.error || 'Failed to initialize Stripe connection.');
      }

      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      } else {
        throw new Error('Onboarding link was not returned by Stripe.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingStripe(false);
    }
  };

  const handleMarkFinished = async (jobId) => {
    setSubmittingId(jobId);

    try {
      const res = await fetch(
        `http://localhost:5000/jobs/${jobId}/mark-finished`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!res.ok) {
        throw new Error('Failed to update contract status.');
      }

      await fetchDashboardData();
    } catch (err) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const toggleExpandJob = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  // FIXED safe destructuring
  const {
    worker_info,
    stats,
    active_jobs,
    completed_jobs
  } = dashboardData || {};

  const jobFeed =
    activeTab === 'active'
      ? (active_jobs || [])
      : (completed_jobs || []);

  const hasStripeSetup = worker_info?.stripe_account_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />

        <div className="flex flex-col items-center justify-center p-24">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>

          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Synchronizing Operational Ledger...
          </p>
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

          <h3 className="font-bold text-slate-900 mt-2">
            Data Sync Exception
          </h3>

          <p className="text-xs text-rose-600 font-medium mt-1">
            {error}
          </p>

          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* STRIPE SECTION (UNCHANGED UI) */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Stripe Payout Configuration
              </h3>
            </div>

            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                hasStripeSetup
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {hasStripeSetup ? 'Payouts Enabled' : 'Setup Required'}
            </span>
          </div>

          <div className="p-6 text-center space-y-4">
            {hasStripeSetup ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-medium">
                  Your Stripe account is connected! Account ID:{' '}
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 text-xs">
                    {worker_info?.stripe_account_id}
                  </span>
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-xs text-slate-500 font-medium">
                  We use Stripe Express to securely deposit your earnings.
                </p>

                <button
                  onClick={handleConnectStripe}
                  disabled={savingStripe}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 mx-auto"
                >
                  <CreditCard className="w-4 h-4" />
                  {savingStripe ? 'Redirecting...' : 'Connect Stripe Account'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* WALLET + METRICS + JOBS UI (UNCHANGED) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-slate-500" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Completed
              </span>
              <span className="text-xl font-black text-slate-900">
                {stats?.jobs_completed}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Gross
              </span>
              <span className="text-xl font-black text-slate-900">
                ${(stats?.gross_earnings || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <Percent className="w-4 h-4 text-slate-400" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fees
              </span>
              <span className="text-xl font-black text-slate-400">
                -${(stats?.platform_fees || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Net
              </span>
              <span className="text-xl font-black text-emerald-600">
                ${(stats?.net_earnings || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        {/* JOB FEED (UNCHANGED STRUCTURE) */}
        <div className="space-y-4">
          <div className="flex gap-2 border-b pb-2">
            <button
              onClick={() => setActiveTab('active')}
              className={activeTab === 'active' ? 'text-blue-600 font-bold' : ''}
            >
              Active
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={activeTab === 'completed' ? 'text-blue-600 font-bold' : ''}
            >
              Completed
            </button>
          </div>

          <div className="space-y-4">
            {jobFeed.map((item) => (
              <div key={item.job_id} className="space-y-3">
                <WorkersJobCard
                  job={item}
                  isExpanded={expandedJobId === item.job_id}
                  onToggleExpand={() => toggleExpandJob(item.job_id)}
                  hasStripeSetup={hasStripeSetup}
                />
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}