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
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function WorkersJobCard({
  job,
  isExpanded,
  onToggleExpand,
  hasStripeSetup
}) {
  const [requesting, setRequesting] =
    useState(false);

  const [payoutRequestedLocal, setPayoutRequestedLocal] =
    useState(job.payout_requested || false);

  const handleRequestPayout = async (e) => {
    e.stopPropagation();

    if (!hasStripeSetup) {
      alert(
        'Please configure your Stripe payout details before requesting withdrawals.'
      );
      return;
    }

    if (
      !window.confirm(
        `Request payout of $${job.budget}?`
      )
    ) {
      return;
    }

    setRequesting(true);

    try {
      const token =
        localStorage.getItem('token');

      const res = await fetch(
        'http://localhost:5000/worker/request-payout',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: job.budget
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Payout request failed.'
        );
      }

      alert(
        'Payout request submitted successfully.'
      );

      setPayoutRequestedLocal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${
        isExpanded
          ? 'border-blue-500 shadow-lg'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={onToggleExpand}
    >
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              {job.title}
            </h3>

            <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md border uppercase bg-blue-50 text-blue-700 border-blue-100">
              {job.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-2xl font-black text-slate-900 flex items-center">
              <span className="text-lg font-bold text-slate-400 mr-0.5">
                $
              </span>

              {job.budget}
            </p>

            {job.location_text && (
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />

                <span>{job.location_text}</span>
              </div>
            )}

            <button className="text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>
                {isExpanded
                  ? 'Hide Details'
                  : 'View Details'}
              </span>

              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-500" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Hiring Client
            </span>

            <span className="text-sm font-bold text-slate-700">
              {job.client_name || 'Verified Client'}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ${
          isExpanded
            ? 'max-h-[1000px] opacity-100 border-t border-slate-100'
            : 'max-h-0 opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-50 p-6 space-y-5">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Project Scope
            </h4>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Financial Matrix
            </h4>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Contract Revenue
                </p>

                <p className="text-base font-black text-slate-900 mt-0.5">
                  ${job.budget}
                </p>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-end">
                {job.status === 'completed' ? (
                  payoutRequestedLocal ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-wider">
                      Payout Pending
                    </span>
                  ) : hasStripeSetup ? (
                    <button
                      onClick={handleRequestPayout}
                      disabled={requesting}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
                    >
                      {requesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Request Payout
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                      <AlertTriangle className="w-4 h-4" />

                      Stripe setup required
                    </div>
                  )
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-lg border uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-100">
                    Held in Escrow
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Review
            </h4>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              {job.review ? (
                <>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${
                          idx < job.review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-600 italic">
                    "{job.review.comment}"
                  </p>
                </>
              ) : (
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <Info className="w-4 h-4 mt-0.5" />

                  <p>No review submitted yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}