import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Star,
  Info,
  User,
  Briefcase,
  Loader2,
  CheckCircle2,
  DollarSign,
  XCircle,
  MessageSquare
} from 'lucide-react';
import JobChatModal from './JobChatModal';

export default function WorkersJobCard({
  job,
  isExpanded,
  onToggleExpand,
  hasStripeSetup,
  onPayoutSuccess
}) {
  const [requesting, setRequesting] = useState(false);
  const [markingFinished, setMarkingFinished] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Tracking request state as string tokens: 'idle' | 'pending' | 'rejected'
  // Fallback defaults logic parsing backend state keys securely
  const [payoutStatus, setPayoutStatus] = useState(
    job.payout_status 
      ? job.payout_status.toLowerCase() 
      : (job.payout_requested ? 'pending' : 'idle')
  );

  // =========================
  // REQUEST PAYOUT
  // =========================
  const handleRequestPayout = async (e) => {
    e.stopPropagation();

    if (!hasStripeSetup) {
      alert('Please configure your Stripe payout details before requesting withdrawals.');
      return;
    }

    const payoutAmount = Number(
      job.available_payout ||
      job.max_payout ||
      job.budget
    );

    if (!payoutAmount || payoutAmount <= 0) {
      alert('No available payout logs mapped to this transaction context.');
      return;
    }

    if (!window.confirm(`Request payout execution for $${payoutAmount.toFixed(2)}?`)) {
      return;
    }

    setRequesting(true);

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        'http://localhost:5000/worker/request-payout',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: payoutAmount,
            job_id: job.job_id || job.id
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.status === 'already_requested') {
          setPayoutStatus('pending');
        }
        throw new Error(data.error || 'Payout runtime dispatch request failed.');
      }

      alert('Payout tracking request submitted to admin queues safely.');
      setPayoutStatus('pending');

      if (onPayoutSuccess) {
        await onPayoutSuccess();
      }

    } catch (err) {
      alert(err.message);
    } finally {
      setRequesting(false);
    }
  };

  // =========================
  // MARK JOB FINISHED
  // =========================
  const handleMarkFinished = async (e) => {
    e.stopPropagation();

    if (!window.confirm('Mark this contract job state as finished?')) return;

    setMarkingFinished(true);

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `http://localhost:5000/jobs/${job.job_id || job.id}/mark-finished`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to map contract state transition.');
      }

      alert('Job status updated successfully.');

      if (onPayoutSuccess) {
        await onPayoutSuccess();
      }

    } catch (err) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setMarkingFinished(false);
    }
  };

  const getStatusStyles = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s === 'in_progress' || s === 'accepted') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
        isExpanded
          ? 'border-blue-500 ring-4 ring-blue-500/5 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={onToggleExpand}
    >
      {/* HEADER */}
      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-3 max-w-xl flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{job.title}</span>
            </h3>

            <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border uppercase ${getStatusStyles(job.status)}`}>
              {job.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap">
            <p className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline">
              <span className="text-base font-medium text-slate-400 mr-0.5">$</span>
              {job.budget}
            </p>

            {job.location_text && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.location_text}</span>
              </div>
            )}

            <button className="text-xs text-blue-600 font-bold hover:bg-blue-100/70 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors">
              <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 md:bg-transparent md:border-0 md:p-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
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

      {/* EXPANDED CONTENT PANEL */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'max-h-[1200px] opacity-100 border-t border-slate-100'
            : 'max-h-0 opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-50/70 p-5 sm:p-6 space-y-5">
          {/* PROJECT SCOPE */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Project Scope
            </h4>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>
          </div>

          {/* FINANCIAL MATRIX LAYER */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Financial Matrix
            </h4>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Contract Revenue
                  </p>
                  <p className="text-base font-black text-slate-900">${job.budget}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">

                {/* 🟢 NEW: Live Chat Button (Visible if accepted, in progress, or completed) */}
{/* 🟢 LIVE CHAT BUTTON (ADD ONLY - NO OTHER CHANGES) */}
{(job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed') && (
  <button
    onClick={(e) => {
      e.stopPropagation(); // prevents card toggle
      setIsChatModalOpen(true);
    }}
    className="w-full sm:w-auto text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
  >
    <MessageSquare className="w-3.5 h-3.5" />
    <span>Live Chat</span>
  </button>
)}
                {(job.status === 'accepted' || job.status === 'in_progress') && (
                  <button
                    onClick={handleMarkFinished}
                    disabled={markingFinished}
                    className="w-full sm:w-auto text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    {markingFinished ? (
                      <>
                        <Loader2 className="animate-spin w-3.5 h-3.5" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Finished</span>
                      </>
                    )}
                  </button>
                )}

                {/* ADVANCED STATUS MATCH MATRIX FOR REJECTED STATE PIPELINES */}
                {job.status === 'completed' && (
                  <>
                    {/* CASE A: PENDING APPROVAL QUEUE */}
                    {payoutStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Approval
                      </span>
                    )}

                    {/* CASE B: ALREADY DISBURSED / COMPLETED */}
                    {payoutStatus === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">
                        ✓ Funds Settled
                      </span>
                    )}

                    {/* CASE C: PAYOUT DISPATCH REJECTED (Allows Re-request) */}
                    {payoutStatus === 'rejected' && (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border bg-rose-50 text-rose-700 border-rose-200 uppercase tracking-wider">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          Payout Rejected
                        </span>
                        <button
                          onClick={handleRequestPayout}
                          disabled={requesting}
                          className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-xl transition"
                        >
                          Try Again
                        </button>
                      </div>
                    )}

                    {/* CASE D: IDLE / NOT REQUESTED YET */}
                    {payoutStatus === 'idle' && (
                      hasStripeSetup ? (
                        <button
                          onClick={handleRequestPayout}
                          disabled={requesting}
                          className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                          {requesting ? (
                            <>
                              <Loader2 className="animate-spin w-3.5 h-3.5" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Request Payout</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs font-bold px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 inline-flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-rose-500" />
                          Stripe setup required
                        </span>
                      )
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* REVIEWS PANEL */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Review
            </h4>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              {job.review ? (
                <div className="space-y-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < job.review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 italic bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    "{job.review.comment}"
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>No review submitted yet.</span>
                </div>
              )}
              {/* 🟢 NEW: Render the Chat Modal when state is true */}
      {isChatModalOpen && (
        <JobChatModal
  jobId={job.job_id || job.id}
  token={localStorage.getItem('token')}   // ✅ ADD THIS
  // currentUserId={user?.id}                // optional but recommended
  onClose={() => setIsChatModalOpen(false)}
/>
      )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}