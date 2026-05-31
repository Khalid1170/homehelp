import React from 'react';
import { Star, CheckCircle2, ArrowUpRight } from 'lucide-react';

export default function WorkerCard({ worker, onViewProfile }) {
  const targetWorkerId = worker?.worker_id || worker?.id;
  
  // Extract initial for clean placeholder fallback UI state
  const workerInitial = worker?.name ? worker.name.charAt(0).toUpperCase() : 'W';

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-3xl p-5 hover:border-slate-300 hover:shadow-[0_20px_50px_rgba(99,102,241,0.05)] transition-all duration-300 flex flex-col justify-between gap-5 h-full min-h-[220px]">
      
      {/* Upper Context Block */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          
          {/* Avatar Profile Left Anchors */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-base shrink-0 overflow-hidden shadow-inner group-hover:scale-102 transition-transform duration-300">
              {worker?.profile_image ? (
                <img 
                  src={worker.profile_image} 
                  alt={`${worker.name}'s profile`}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span>{workerInitial}</span>
              )}
            </div>
            
            {/* Structural Labels */}
            <div className="min-w-0 space-y-0.5">
              <h4 className="font-black text-slate-900 tracking-tight text-sm sm:text-base truncate group-hover:text-indigo-600 transition-colors duration-200">
                {worker?.name || "Anonymous Partner"}
              </h4>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50/70 px-2 py-0.5 rounded-lg border border-emerald-100/50 w-fit select-none">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Active Now
              </div>
            </div>
          </div>

          {/* Rating Badge Positioned Separately */}
          <div className="flex items-center gap-1 font-black text-slate-900 bg-amber-50/60 border border-amber-200/60 rounded-xl px-2.5 py-1 text-xs select-none shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{worker?.rating ? Number(worker.rating).toFixed(1) : '0.0'}</span>
          </div>
        </div>

        {/* Task Professional Bio Preview snippet */}
        {worker?.bio && (
          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed pl-0.5">
            {worker.bio}
          </p>
        )}
      </div>

      {/* Footer Interface Control Row */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        
        {/* Dynamic Skill Tags Wrapper */}
        {worker?.skills && worker.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-0.5">
            {worker.skills.slice(0, 3).map((skill, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-black tracking-tight text-slate-500 bg-slate-100/80 border border-slate-200/40 rounded-lg px-2.5 py-1 uppercase"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mt-1">
          {/* Performance Count Metric Column */}
          <div className="flex items-center gap-1.5 text-slate-400 pl-0.5 select-none">
            <CheckCircle2 className="w-4 h-4 text-slate-400/80" />
            <span className="text-[11px] font-bold tracking-tight text-slate-500">
              {worker?.completed_jobs || 0} tasks finished
            </span>
          </div>

          {/* Core Navigation Controller Trigger */}
          {onViewProfile && targetWorkerId && (
            <button
              onClick={() => onViewProfile(targetWorkerId)}
              className="inline-flex items-center gap-1 text-xs font-black bg-slate-900 hover:bg-indigo-600 text-white px-3.5 py-2.5 rounded-xl shadow-md shadow-slate-900/5 hover:shadow-indigo-600/10 transition-all duration-300 active:scale-98 cursor-pointer group/btn"
            >
              <span>View Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}