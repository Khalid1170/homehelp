import React from 'react';

export default function WorkerCard({ worker, onViewProfile }) {
  const targetWorkerId = worker?.worker_id || worker?.id;

  return (
    <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:border-slate-300/80 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-4 group">
      
      {/* Profile Details Info */}
      <div className="space-y-2 min-w-0">
        <h4 className="font-black text-slate-900 tracking-tight text-base truncate group-hover:text-indigo-600 transition-colors duration-200">
          {worker.name}
        </h4>
        
        {/* Ratings & Metrics */}
        <div className="flex items-center gap-2 select-none text-xs">
          <span className="text-amber-500 font-extrabold flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
            ⭐ {worker.rating ? Number(worker.rating).toFixed(1) : '0.0'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-semibold tracking-tight">
            {worker.completed_jobs || 0} jobs split
          </span>
        </div>

        {/* Skill Pills */}
        {worker.skills && worker.skills.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {worker.skills.slice(0, 3).map((skill, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200/60 px-2.5 py-0.5 rounded-md uppercase tracking-wider"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      {onViewProfile && targetWorkerId && (
        <button
          onClick={() => onViewProfile(targetWorkerId)}
          className="text-xs font-black text-indigo-600 bg-indigo-50/60 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white border border-indigo-100/80 hover:border-transparent px-4 py-2.5 rounded-xl transition-all duration-300 shrink-0 shadow-xs hover:shadow-md hover:shadow-indigo-600/10 active:scale-95 cursor-pointer"
        >
          View Profile
        </button>
      )}
      
    </div>
  );
}