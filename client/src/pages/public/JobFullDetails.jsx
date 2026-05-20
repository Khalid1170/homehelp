import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function JobFullDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isClient = user?.role === 'client';

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/jobs/${id}`);
        if (!res.ok) throw new Error('Failed to retrieve task file properties.');
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const handlePrimaryAction = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (isClient) {
      navigate('/client/dashboard');
      return;
    }
    navigate(`/jobs/${id}/pitch`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Loading Comprehensive Assignment Matrix...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-6 text-center shadow-xs">
          <span className="text-2xl">⚠️</span>
          <h3 className="font-bold text-slate-900 mt-2">Ecosystem Exception</h3>
          <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
          <button onClick={() => navigate('/browse-jobs')} className="mt-4 inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs">
          <span className="text-2xl">🚫</span>
          <h3 className="font-bold text-slate-900 mt-2">Record Missing</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">Assignment file could not be parsed or found.</p>
          <button onClick={() => navigate('/browse-jobs')} className="mt-4 inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 font-sans antialiased text-slate-800 selection:bg-blue-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Action Hub */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/browse-jobs')} 
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Return to Marketplace
          </button>
        </div>

        {/* Main Brief Profile Frame */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Header Layout */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md">
                  {job.category || 'General'}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  job.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  job.status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {job.status || 'open'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                {job.title}
              </h1>
            </div>
            
            <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-2 shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-100 sm:border-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Task Budget</span>
              <span className="text-3xl font-black text-emerald-600 tracking-tight">${job.budget || job.amount_paid}</span>
            </div>
          </div>

          {/* Quick-Scan Metadata Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 text-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">📍 Assignment Region</span>
              <span className="font-bold text-slate-700">{job.location_text || job.location || 'Territory Wide'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 text-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">📅 Posted On</span>
              <span className="font-bold text-slate-700">{job.created_at ? job.created_at.slice(0, 10) : 'Recent Logs'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 text-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">🛡️ Financial Trust</span>
              <span className="font-bold text-slate-700 flex items-center gap-1">
                {job.payment_status === 'paid' ? '💳 Funded Escrow' : '✅ Verified Contract'}
              </span>
            </div>
          </div>

          {/* Scope Text Body Block */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Task Mandate & Scope Description</h3>
            <div className="bg-slate-50/30 border border-slate-100 rounded-xl p-4 sm:p-5">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                {job.description || 'No supplementary task specifics documented for this entry.'}
              </p>
            </div>
          </div>

          {/* Structural Client Account Footer Row */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5 text-xs text-slate-400 font-medium">
            <div>
              Posted by: <span className="font-bold text-slate-700">{job.client_name || job.client_info?.name || 'Verified Client'}</span>
            </div>
          </div>

        </div>

        {/* Dynamic Contextual Sticky Action Tray */}
        {job.status !== 'completed' && job.status !== 'cancelled' && (
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="text-xs font-bold text-slate-800">Ready to fulfill this marketplace task?</h4>
              <p className="text-[11px] text-slate-400 font-medium">Ensure parameters line up with your active operational limits.</p>
            </div>
            <button
              onClick={handlePrimaryAction}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition active:scale-98 hover:shadow-lg hover:shadow-blue-600/10 tracking-wide uppercase"
            >
              {!token 
                ? 'Sign In to Apply' 
                : isClient 
                  ? 'Return to Dashboard' 
                  : 'Submit Application Pitch'
              }
            </button>
          </div>
        )}

      </div>
    </div>
  );
}