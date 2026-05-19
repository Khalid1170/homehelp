import React from 'react';

export default function ReviewCard({ review }) {
  return (
    <div className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <span 
              key={i} 
              className={`text-sm ${i < review.rating ? 'text-amber-400' : 'text-slate-200'}`}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Verified Match</span>
      </div>
      
      {review.comment && (
        <p className="text-xs text-slate-600 leading-relaxed italic">
          "{review.comment}"
        </p>
      )}
    </div>
  );
}