import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function JobCard({ job, onApply, token, userRole }) {
  const navigate = useNavigate();
  const isClient = userRole === 'client';
  const jobId = job.id || job.job_id || job._id;

  const getStatusStyles = (status) => {
    const normalize = String(status).toLowerCase();
    if (normalize === 'completed') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (normalize === 'assigned') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div 
      onClick={() => navigate(`/jobs/${jobId}`)}
      className="group bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs transition-all duration-300 flex flex-col justify-between gap-5 cursor-pointer select-none relative hover:border-blue-500 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-0.5"
    >
      <div className="space-y-3">
        {/* Title Block & Pricing Metadata Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusStyles(job.status)}`}>
                {job.status || 'open'}
              </span>
              {job.payment_status === 'paid' && (
                <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200/60 tracking-wide inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  💳 Funded Escrow
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100 transition group-hover:bg-blue-50/50 group-hover:border-blue-100">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Budget</span>
            <span className="text-lg font-black text-emerald-600 tracking-tight">
              ${job.budget || job.amount_paid}
            </span>
          </div>
        </div>
        
        {/* Explicit Tag Pillars */}
        <div className="flex gap-2 flex-wrap text-[11px] font-bold tracking-wide text-slate-400">
          <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/50">{job.category || 'General'}</span>
          <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/50 flex items-center gap-1">📍 {job.location_text || job.location || 'Territory Wide'}</span>
          {job.created_at && (
            <span className="bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/50 font-medium normal-case flex items-center gap-1">
              📅 {job.created_at.slice(0, 10)}
            </span>
          )}
        </div>

        {/* Truncated Description Container Block */}
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium line-clamp-2 pt-0.5">
          {job.description || 'No supplementary task specifics documented for this entry.'}
        </p>
      </div>

      {/* Footer System Control Area */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-4 mt-1"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <div className="w-6 h-6 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px] uppercase">
            {(job.client_name || job.client_info?.name || 'V')[0]}
          </div>
          <span>
            Posted by: <span className="font-bold text-slate-700 hover:text-blue-600 transition cursor-pointer">{job.client_name || job.client_info?.name || 'Verified Client'}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-98"
          >
            Details
          </button>

          {job.status !== 'completed' && job.status !== 'cancelled' && onApply && (
            <button 
              onClick={() => onApply(jobId)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-98 shadow-xs hover:shadow-md hover:shadow-blue-600/10 cursor-pointer whitespace-nowrap"
            >
              {!token 
                ? 'Sign In to Apply' 
                : isClient 
                  ? 'View Activity Ledger' 
                  : 'Place Application Pitch'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}