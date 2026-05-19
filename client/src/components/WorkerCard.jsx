import React from 'react';

export default function WorkerCard({ worker, onViewProfile }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
      <div className="space-y-1">
        <h4 className="font-bold text-slate-900 tracking-tight text-sm">{worker.name}</h4>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-bold text-xs">⭐ {worker.rating ? worker.rating.toFixed(1) : '0.0'}</span>
          <span className="text-slate-300 text-xs">•</span>
          <span className="text-slate-400 text-xs font-semibold">{worker.completed_jobs || 0} jobs completed</span>
        </div>
        {worker.skills && (
          <div className="flex gap-1 flex-wrap pt-1">
            {worker.skills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="text-[10px] font-medium bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
                {skill.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {onViewProfile && (
        <button
          onClick={() => onViewProfile(worker.worker_id)}
          className="text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl transition"
        >
          View Profile
        </button>
      )}
    </div>
  );
}