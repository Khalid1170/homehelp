import React, { useState } from 'react';

export default function JobCard({ job, onApply, token }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-white border rounded-2xl p-6 shadow-xs transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer select-none ${
        isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500/10' : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/40'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900 tracking-tight leading-snug hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                job.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                job.status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {job.status || 'open'}
              </span>
              {job.payment_status === 'paid' && (
                <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/60 tracking-wide">
                  💳 FUNDED ESCROW
                </span>
              )}
            </div>
          </div>
          <span className="text-xl font-black text-emerald-600 tracking-tight">
            ${job.budget || job.amount_paid}
          </span>
        </div>
        
        <div className="flex gap-2 flex-wrap text-[11px] font-bold tracking-wider uppercase text-slate-400 pt-1">
          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/40">{job.category || 'General'}</span>
          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/40">📍 {job.location_text || job.location || 'Territory Wide'}</span>
          {job.created_at && <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/40 font-medium normal-case">📅 {job.created_at.slice(0, 10)}</span>}
        </div>

        {/* Dynamic Detail Body Scope toggled on row expansion */}
        <p className={`text-sm text-slate-500 leading-relaxed pt-1 transition-all duration-200 whitespace-pre-wrap ${
          isExpanded ? 'line-clamp-none' : 'line-clamp-2'
        }`}>
          {job.description || 'No supplementary task specifics documented for this entry.'}
        </p>
      </div>

      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-2"
        onClick={(e) => e.stopPropagation()} // Stop parent click bubble trigger loop
      >
        <div className="text-xs text-slate-400 font-medium">
          Posted by: <span className="font-bold text-slate-700">{job.client_name || job.client_info?.name || 'Verified Client'}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 px-3 py-2 rounded-xl transition"
          >
            {isExpanded ? 'Hide Info ▲' : 'View Details ▼'}
          </button>

          {job.status !== 'completed' && job.status !== 'cancelled' && onApply && (
            <button 
              onClick={() => onApply(job.id || job.job_id)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-98 shadow-xs"
            >
              {token ? 'Place Application Pitch' : 'Sign In to Apply'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}