import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

        throw new Error(
          'Could not parse worker payload from the platform core.'
        );
      }

      const data = await res.json();

      setDashboardData(data);

      setStripeForm({
        stripe_account_id:
          data?.worker_info?.stripe_account_id || '',
        stripe_email:
          data?.worker_info?.stripe_email || '',
        payout_method:
          data?.worker_info?.payout_method || 'bank_transfer'
      });
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

  // const handleSaveStripe = async (e) => {
  //   e.preventDefault();

  //   setSavingStripe(true);

  //   try {
  //     const res = await fetch(
  //       'http://localhost:5000/worker/stripe-details',
  //       {
  //         method: 'PATCH',
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         },
  //         body: JSON.stringify(stripeForm)
  //       }
  //     );

  //     const data = await res.json();

  //     if (!res.ok) {
  //       throw new Error(data.error || 'Failed to save payout details.');
  //     }

  //     alert('Stripe payout details updated successfully.');

  //     await fetchDashboardData();
  //   } catch (err) {
  //     alert(err.message);
  //   } finally {
  //     setSavingStripe(false);
  //   }
  // };

  const handleConnectStripe = async (e) => {
  e.preventDefault();
  setSavingStripe(true);

  try {
    const res = await fetch('http://localhost:5000/worker/connect-stripe', {
      method: 'POST', // Matches your Flask backend configuration
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to initialize Stripe connection.');
    }

    // If the backend successfully returns the Stripe Express onboarding URL, redirect them to it
    if (data.onboarding_url) {
      window.location.href = data.onboarding_url;
    } else {
      throw new Error('Onboarding link was not returned by the platform.');
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
        throw new Error(
          'Failed to update contract timeline status.'
        );
      }

      await fetchDashboardData();
    } catch (err) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const toggleExpandJob = (jobId) => {
    setExpandedJobId(
      expandedJobId === jobId ? null : jobId
    );
  };

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

  const {
    worker_info,
    stats,
    active_jobs,
    completed_jobs
  } = dashboardData || {};

  const jobFeed =
    activeTab === 'active'
      ? active_jobs
      : completed_jobs;

  const hasStripeSetup =
    worker_info?.stripe_account_id;

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Welcome */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">
                Welcome back, {worker_info?.name}
              </h2>

              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  worker_info?.verification_status ===
                  'verified'
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {worker_info?.verification_status ||
                  'Pending Verification'}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Profile Reference Token ID:{' '}
              <span className="font-mono text-slate-600">
                #WK-{worker_info?.worker_id}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl">
            <span className="text-amber-500 text-sm">★</span>

            <span className="text-xs font-bold text-slate-900">
              {Number(worker_info?.rating).toFixed(1)}
            </span>

            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 border-l border-slate-200">
              Score Rating
            </span>
          </div>
        </header>

{/* Stripe Setup */}
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
          Your Stripe account is connected! Your Account ID is:{' '}
          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 text-xs">
            {worker_info?.stripe_account_id}
          </span>
        </p>
        <p className="text-xs text-slate-400">
          Payout requests are fully unlocked.
        </p>
      </div>
    ) : (
      <div className="max-w-md mx-auto space-y-4">
        <p className="text-xs text-slate-500 font-medium">
          We use Stripe Express to securely deposit your earnings directly into your bank account. 
          Click below to set up your account details on Stripe's secure portal.
        </p>
        
        <button
          onClick={handleConnectStripe}
          disabled={savingStripe}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 mx-auto"
        >
          <CreditCard className="w-4 h-4" />
          {savingStripe ? 'Redirecting to Stripe...' : 'Connect Stripe Account'}
        </button>
      </div>
    )}
  </div>
</section>
        {/* Wallet */}
        <section className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-500" />

              <h3 className="text-sm font-bold text-slate-900">
                Financial Disbursal Balance Accounts
              </h3>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
              {hasStripeSetup
                ? 'Stripe Connected'
                : 'Stripe Missing'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>

              <div className="space-y-2 flex-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Available Balance
                  </span>

                  <span className="text-3xl font-black text-slate-900 mt-0.5 block">
                    $
                    {worker_info?.available_balance?.toFixed(
                      2
                    ) || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>

              <div className="space-y-2 flex-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pending Processing Queue
                  </span>

                  <span className="text-3xl font-black text-amber-600 mt-0.5 block">
                    $
                    {worker_info?.pending_balance?.toFixed(
                      2
                    ) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-slate-500" />

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Completed Pools
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
                Gross Invoiced
              </span>

              <span className="text-xl font-black text-slate-900">
                ${stats?.gross_earnings?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <Percent className="w-4 h-4 text-slate-400" />

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Platform Fee
              </span>

              <span className="text-xl font-black text-slate-400">
                -${stats?.platform_fees?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-emerald-600" />

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Net Yield
              </span>

              <span className="text-xl font-black text-emerald-600">
                ${stats?.net_earnings?.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('active');
                  setExpandedJobId(null);
                }}
                className={`text-xs font-bold pb-2.5 px-1 relative transition ${
                  activeTab === 'active'
                    ? 'text-blue-600'
                    : 'text-slate-400'
                }`}
              >
                Active Jobs
              </button>

              <button
                onClick={() => {
                  setActiveTab('completed');
                  setExpandedJobId(null);
                }}
                className={`text-xs font-bold pb-2.5 px-1 relative transition ${
                  activeTab === 'completed'
                    ? 'text-blue-600'
                    : 'text-slate-400'
                }`}
              >
                Completed Jobs
              </button>
            </div>

            <button
              onClick={() =>
                navigate('/browse-jobs')
              }
              className="text-xs font-bold bg-blue-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-blue-700 transition"
            >
              + Find Workload
            </button>
          </div>

          <div className="space-y-4">
            {jobFeed?.map((item) => (
              <div
                key={item.job_id}
                className="space-y-3"
              >
                <WorkersJobCard
                  job={item}
                  isExpanded={
                    expandedJobId === item.job_id
                  }
                  onToggleExpand={() =>
                    toggleExpandJob(item.job_id)
                  }
                  hasStripeSetup={hasStripeSetup}
                />

                {expandedJobId === item.job_id &&
                  (item.status === 'accepted' ||
                    item.status ===
                      'pending_confirmation') && (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between mx-2">
                      <span className="text-xs font-bold text-slate-500">
                        {item.status === 'accepted'
                          ? 'Finished field operational tasks?'
                          : 'Awaiting client confirmation.'}
                      </span>

                      {item.status ===
                        'accepted' && (
                        <button
                          disabled={
                            submittingId ===
                            item.job_id
                          }
                          onClick={() =>
                            handleMarkFinished(
                              item.job_id
                            )
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                        >
                          {submittingId ===
                          item.job_id
                            ? 'Processing...'
                            : 'Mark Complete'}
                        </button>
                      )}

                      {item.status ===
                        'pending_confirmation' && (
                        <span className="text-xs font-bold text-amber-700">
                          Awaiting Signoff
                        </span>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}