import React, { useState } from 'react';
import { 
  MapPin, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Info, 
  User, 
  DollarSign, 
  Briefcase,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function WorkersJobCard({ job, isExpanded, onToggleExpand }) {
  const [requesting, setRequesting] = useState(false);
  const [payoutRequestedLocal, setPayoutRequestedLocal] = useState(job.payout_requested || false);

  const handleRequestPayout = async (e) => {
    e.stopPropagation(); // Avoid triggering the main card expand/collapse toggle
    
    if (!window.confirm(`Submit systematic authorization request to withdraw $${job.budget} from your available balance?`)) {
      return;
    }

    setRequesting(true);
    try {
      const token = localStorage.getItem('token'); // Retrieve auth context matrix token
      const res = await fetch('http://localhost:5000/worker/request-payout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: job.budget })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'The transaction processing engine encountered an operational failure.');
      }

      alert('Payout state committed. Funds transferred safely to pending processing queue.');
      setPayoutRequestedLocal(true);
    } catch (err) {
      alert(`Payout Execution Exception: ${err.message}`);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer select-none ${
        isExpanded 
          ? 'border-blue-500 shadow-lg ring-1 ring-blue-500/10 bg-white' 
          : 'border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/20'
      }`}
      onClick={onToggleExpand}
    >
      {/* Card Header: Summary Overview Line */}
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              {job.title}
            </h3>
            
            <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md border uppercase ${
              job.payment_status === 'paid' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {job.payment_status || 'Unpaid'}
            </span>

            <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md border uppercase ${
              job.status === 'completed'
                ? 'bg-blue-50 text-blue-700 border-blue-100'
                : 'bg-slate-50 text-slate-600 border-slate-200/60'
            }`}>
              {job.status?.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <p className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <span className="text-lg font-bold text-slate-400 mr-0.5">$</span>
              {job.budget}
            </p>
            
            {/* Context Location Preview Line Badge */}
            {job.location_text && (
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[180px]">{job.location_text}</span>
              </div>
            )}

            <button className="text-xs text-blue-600 font-bold bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition">
              <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Client General Info Block (Right Aligned Anchor) */}
        <div className="flex items-center gap-3 md:text-right md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 md:order-2">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="md:order-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Hiring Client</span>
            <span className="text-sm font-bold text-slate-700 block mt-0.5">{job.client_name || 'Verified Client'}</span>
          </div>
        </div>
      </div>

      {/* Expandable Details Section Container */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[1000px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-50/60 p-6 space-y-5">
          
          {/* Segment 1: Detailed Project Specifications */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Scope Specifications</h4>
            <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-2xs">
              <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                {job.description || 'No detailed scope text parameters supplied for this listing frame.'}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 border-t border-slate-100 pt-3.5 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assignment Location</span>
                    <span className="text-slate-800 font-bold">{job.location_text || 'Not Specified'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Tag className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Category Focus</span>
                    <span className="text-slate-800 font-bold">{job.category || 'General Operations'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segment 2: Financial Ledger Matrix */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contract Financial Matrix</h4>
            <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gross Contract Revenue</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">${job.budget}</p>
                </div>
              </div>
              
              <div className="w-full sm:w-auto flex items-center justify-end">
                {job.status === 'completed' ? (
                  payoutRequestedLocal ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      Payout Pending Processing
                    </span>
                  ) : (
                    <button
                      onClick={handleRequestPayout}
                      disabled={requesting}
                      className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-2 shadow-sm shadow-emerald-700/10"
                    >
                      {requesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Submitting Pipeline Data...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Request Funds Release
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-lg inline-block border uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-100">
                    Held securely in Escrow
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Segment 3: Performance Evaluation Loop */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Evaluation Feedback</h4>
            <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-2xs">
              {job.review ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star 
                        key={idx} 
                        className={`w-4 h-4 ${
                          idx < job.review.rating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-200 fill-slate-200'
                        }`} 
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-800 ml-1.5">({job.review.rating}.0 / 5.0)</span>
                  </div>
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-medium">
                    "{job.review.comment || 'Client completed payout collection milestones without supplying custom evaluation review commentary.'}"
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-400 bg-slate-50/50 p-3 rounded-lg border border-slate-100 border-dashed">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {job.status === 'completed' 
                      ? 'No operational evaluation feedback block has been appended to this ledger dataset yet.' 
                      : 'Client performance breakdown loops reveal immediately upon operational signoff metrics.'}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}