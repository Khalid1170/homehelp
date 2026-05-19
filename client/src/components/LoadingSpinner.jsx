import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8">
      <div className="animate-spin rounded-full h-9 w-9 border-2 border-slate-200 border-t-blue-600" />
      <p className="text-slate-400 text-xs font-bold tracking-wider uppercase mt-4 animate-pulse">
        Loading System Parameters...
      </p>
    </div>
  );
}