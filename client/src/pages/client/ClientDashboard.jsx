import React, { useState, useEffect } from 'react';
import { clientApi } from '../../services/clientApi';
import Navbar from '../../components/Navbar'; 
import Footer from '../../components/Footer'; 
import JobChatModal from '../../components/JobChatModal';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [activeChatJobId, setActiveChatJobId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active | completed

  // Interactive UI expansion state to trace open job items
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Selected focused context for reviewing applicants
  const [focusedJob, setFocusedJob] = useState(null);

  // Review Modal & Form States
  const [focusedReviewJob, setFocusedReviewJob] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

  // --- Profile View & Edit States ---
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', company: '' });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const metricsData = await clientApi.getDashboard();
      setData(metricsData);
      
      if (metricsData.client_info) {
        setProfileForm({
          name: metricsData.client_info.name || '',
          email: metricsData.client_info.email || '',
          phone: metricsData.client_info.phone || '',
          company: metricsData.client_info.company || '',
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileUpdateLoading(true);
      await clientApi.updateProfile(profileForm);
      setShowProfileModal(false);
      await loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const toggleExpandJob = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const handleCancelJob = async (jobId, e) => {
    e.stopPropagation(); 
    if (!window.confirm('Are you sure you want to delete and cancel this job listing?')) return;
    try {
      await clientApi.deleteJob(jobId);
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStripeCheckoutRedirect = async (jobId, e) => {
    e.stopPropagation();
    try {
      const response = await clientApi.initializePayment(jobId);
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 💬 FIXED: Auto-opens chat context directly upon acceptance confirmation
  const handleApproveCandidate = async (appId, jobId) => {
    try {
      await clientApi.approveWorker(appId);
      setFocusedJob(null);
      setActiveChatJobId(jobId); // 🔥 Pops open chat modal frame immediately
      setExpandedJobId(jobId);   // Expands item panel view for clarity
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeclineCandidate = async (appId) => {
    try {
      await clientApi.declineWorker(appId);
      if (focusedJob) {
        const updatedApplications = focusedJob.incoming_applications.filter(a => a.application_id !== appId);
        if (updatedApplications.length === 0) {
          setFocusedJob(null);
        } else {
          setFocusedJob({
            ...focusedJob,
            incoming_applications: updatedApplications
          });
        }
      }
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmReceipt = async (jobId, e) => {
    e.stopPropagation();
    if (!window.confirm('Confirming this execution closes escrow payouts. Proceed?')) return;
    try {
      await clientApi.confirmCompletion(jobId);
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setReviewSubmitLoading(true);
      await clientApi.submitReview(focusedReviewJob.job_id, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      });
      setFocusedReviewJob(null);
      setReviewForm({ rating: 5, comment: '' });
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-blue-600 border-slate-200" />
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto mt-20 p-6 bg-red-50 rounded-xl border border-red-200 text-center">
      <p className="text-red-700 font-medium">Dashboard configuration error: {error}</p>
      <button onClick={loadDashboardData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Retry Frame</button>
    </div>
  );

  const displayedJobs = activeTab === 'active' ? (data?.active_jobs || []) : (data?.completed_jobs || []);

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <Navbar setShowGetStarted={() => navigate('/create-job')} />
      
{/* --- CLIENT DASHBOARD SUB-HEADER BANNER --- */}
      <div className="bg-white border-b border-slate-200/80 top-[65px] z-30 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Control Dashboard</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              Welcome back,{' '}
              <span 
                onClick={() => setShowProfileModal(true)} 
                className="text-blue-600 underline cursor-pointer hover:text-blue-700 transition"
              >
                {data?.client_info?.name || 'Client'}
              </span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center relative z-50">
            {/* --- INBOX BUTTON INTEGRATION --- */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/chats');
              }}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm px-4 py-3 rounded-xl flex items-center gap-2 transition duration-200 shadow-xs active:scale-98 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Open Live Inbox</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileModal(true);
              }}
              className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm px-4 py-3 rounded-xl transition duration-200"
            >
              Account Profile ⚙️
            </button>
            
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/client/create-job');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/15 active:scale-98 cursor-pointer"
            >
              Deploy New Job +
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto w-full px-4 mt-8 flex-1 pb-16">
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Placed Capital', value: `$${(data?.metrics?.total_spent || 0).toFixed(2)}`, color: 'text-slate-900' },
            { label: 'Pipeline Postings', value: data?.metrics?.total_jobs || 0, color: 'text-blue-600' },
            { label: 'Active Projects', value: data?.metrics?.active_jobs || 0, color: 'text-amber-600' },
            { label: 'Completed Jobs', value: data?.metrics?.completed_jobs || 0, color: 'text-emerald-600' }
          ].map((m, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">{m.label}</span>
              <span className={`text-2xl font-black ${m.color} tracking-tight mt-2 block`}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* Tab Switch Layout */}
        <div className="flex gap-2 mt-10 border-b border-slate-200 pb-3">
          <button 
            type="button"
            onClick={() => { setActiveTab('active'); setExpandedJobId(null); }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'active' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Active Pipelines ({data?.active_jobs?.length || 0})
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('completed'); setExpandedJobId(null); }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Completed Vault ({data?.completed_jobs?.length || 0})
          </button>
        </div>

        {/* Jobs Feed Wrapper Container */}
        <div className="grid grid-cols-1 gap-4 mt-6">
          {displayedJobs.length === 0 ? (
            <div className="text-center py-16 bg-linear-to-b from-white to-slate-50/50 border border-slate-200 rounded-3xl max-w-2xl mx-auto w-full px-8 flex flex-col items-center shadow-xs">
              <div className="h-16 w-16 bg-blue-50/80 rounded-2xl flex items-center justify-center text-blue-600 text-2xl border border-blue-100/60 mb-5 shadow-inner">
                💼
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {activeTab === 'active' ? 'Your active pipeline is empty' : 'No historic archive data'}
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-2 max-w-md leading-relaxed text-center">
                {activeTab === 'active' 
                  ? "You don't have any projects running right now. Deploy a project description block to contract top developers across our open workforce ecosystems."
                  : "You haven't completed any project terms inside this tracking pipeline cluster yet."
                }
              </p>
              
              {activeTab === 'active' && (
                <button
                  type="button"
                  onClick={() => navigate('/client/create-job')}
                  className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20 active:scale-98"
                >
                  Post Your First Job Listing +
                </button>
              )}
            </div>
          ) : (
            displayedJobs.map((job) => {
              const isExpanded = expandedJobId === job.job_id;
              
              // 🔄 COGNITIVE CHANGE: Only display candidate pipelines if the status isn't already allocated/accepted!
              const isAssigned = job.status === 'accepted' || job.status === 'pending_confirmation' || job.status === 'completed';
              const hasApplicants = job.incoming_applications && job.incoming_applications.length > 0 && !isAssigned;
              
              return (
                <div 
                  key={job.job_id} 
                  onClick={() => toggleExpandJob(job.job_id)}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer select-none ${
                    isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/20'
                  }`}
                >
                  <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{job.title}</h3>
                        <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md border uppercase ${
                          job.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {job.payment_status}
                        </span>
                        <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md border uppercase ${
                          isAssigned ? 'bg-indigo-50 text-indigo-700 border-indigo-150' : 'bg-slate-50 text-slate-600 border-slate-200/60'
                        }`}>
                          Status: {job.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-black text-slate-800 tracking-tight">${job.budget}</p>
                        <span className="text-xs text-blue-600 font-bold bg-blue-50/60 px-2.5 py-1 rounded-lg">
                          {isExpanded ? 'Hide Details ▲' : 'Click to View Details ▼'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-stretch lg:self-center justify-between sm:justify-end flex-wrap">
                      {job.payment_status === 'unpaid' && (
                        <button 
                          type="button"
                          onClick={(e) => handleStripeCheckoutRedirect(job.job_id, e)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                        >
                          Fund to make Job Live (Stripe) 💳
                        </button>
                      )}

                      {/* 🛠️ CONDITIONAL CHANGE: Candidate review button vanishes when someone is already hired */}
                      {hasApplicants && (
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFocusedJob(job); }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                        >
                          Review Candidates ({job.incoming_applications.length}) 🔍
                        </button>
                      )}

                      {job.status === 'pending_confirmation' && (
                        <button 
                          type="button"
                          onClick={(e) => handleConfirmReceipt(job.job_id, e)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                        >
                          Confirm Complete & Payout 🏆
                        </button>
                      )}

                      {!isAssigned && (
                        <button 
                          type="button"
                          onClick={(e) => handleCancelJob(job.job_id, e)}
                          className="border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 p-2.5 rounded-xl transition hover:bg-rose-50/50"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-100 p-6 space-y-6 cursor-default" onClick={(e) => e.stopPropagation()}>
                      
                      {/* --- INLINE APPLICANT FEED --- */}
                      {/* 🛠️ CONDITIONAL CHANGE: Completely hides raw candidate submissions list if worker is assigned */}
                      {!isAssigned && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Incoming Job Applications ({job.incoming_applications?.length || 0})
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {job.incoming_applications && job.incoming_applications.length > 0 ? (
                              job.incoming_applications.map((app) => (
                                <div key={app.application_id} className="bg-white border border-slate-200/70 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 text-sm">{app.worker_name || 'Anonymous Applicant'}</span>
                                      {app.worker_rating && <span className="text-xs font-bold text-amber-500">⭐ {app.worker_rating.toFixed(1)}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 italic">"{app.worker_message || 'No submission message text provided.'}"</p>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleDeclineCandidate(app.application_id)}
                                      className="border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg bg-white transition"
                                    >
                                      Decline
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveCandidate(app.application_id, job.job_id)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                    >
                                      Accept
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="bg-white/60 border border-dashed border-slate-200 text-center py-4 rounded-xl text-xs font-medium text-slate-400 italic">
                                No one has submitted an application message for this listing frame yet.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Job Specifications</h4>
                        <div className="bg-white border border-slate-200/60 rounded-xl p-4">
                          <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{job.description || 'No detailed scope configuration text provided.'}</p>
                          <div className="flex gap-4 mt-3 text-xs font-bold text-slate-400 border-t border-slate-100 pt-3">
                            <div>📍 Location: <span className="text-slate-700">{job.location_text || 'Not Specified'}</span></div>
                            <div>🏷️ Category: <span className="text-slate-700">{job.category || 'General'}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Appointed Service Worker</h4>
                          <div className={`border rounded-xl p-4 flex items-center justify-between min-h-[74px] ${isAssigned ? 'bg-blue-50/40 border-blue-200/70' : 'bg-white border-slate-200/60'}`}>
                            {job.appointed_worker ? (
                              <>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{job.appointed_worker.name}</p>
                                  <p className="text-xs font-bold text-amber-500 mt-0.5">⭐ {job.appointed_worker.rating ? `${job.appointed_worker.rating.toFixed(1)} Rating` : 'N/A Rating Frame'}</p>
                                </div>
                                {(job.status === 'accepted' || job.status === 'pending_confirmation') && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setActiveChatJobId(job.job_id); }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                                  >
                                    💬 Chat with Worker
                                  </button>
                                )}
                              </>
                            ) : (
                              <p className="text-xs font-semibold text-slate-400 italic">No contractor appointed to pipeline yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Settlement</h4>
                          <div className="bg-white border border-slate-200/60 rounded-xl p-4 flex items-center justify-between min-h-[74px]">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amount Transacted</p>
                              <p className="text-lg font-black text-slate-900 mt-0.5">${job.budget}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block border uppercase ${
                                job.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>{job.payment_status === 'paid' ? 'Escrow Released' : 'Awaiting Capital'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
<div className="space-y-1.5">
  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Client Platform Feedback Review</h4>
  <div className="bg-white border border-slate-200/60 rounded-xl p-4">
    {/* 🟢 Refined Check: Checks if job.review exists as an object OR a raw flat string */}
    {job.review || job.comment || job.feedback ? (
      (() => {
        // 1. Safely extract rating score whether flat, nested, or fallback to full 5 stars
        const numericalRating = job.rating ?? job.review?.rating ?? 5;
        
        // 2. Safely extract textual review string regardless of database column scheme
        const textComment = job.review && typeof job.review === 'object'
          ? (job.review.comment || job.review.text)
          : (job.review || job.comment || job.feedback);

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, idx) => (
                <span 
                  key={idx} 
                  className={`text-sm select-none ${idx < numericalRating ? 'text-amber-400' : 'text-slate-200'}`}
                >
                  ★
                </span>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-1">
                ({Number(numericalRating).toFixed(1)} / 5.0)
              </span>
            </div>
            <p className="text-xs text-slate-500 italic leading-relaxed">
              "{textComment || 'No written summary parameters provided.'}"
            </p>
          </div>
        );
      })()
    ) : (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-xs font-semibold text-slate-400 italic">
          {job.status?.toLowerCase() === 'completed' 
            ? 'No evaluation feedback loop submitted for this position listing.' 
            : 'Feedback loops unlock once milestones achieve full closure.'}
        </p>
        
        {job.status?.toLowerCase() === 'completed' && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFocusedReviewJob(job); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition duration-150 cursor-pointer"
          >
            Write Review ⭐
          </button>
        )}
      </div>
    )}
  </div>
</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <Footer />

      {/* --- LIVE CHAT ENGINE OVERLAY LAYER --- */}
      {activeChatJobId && (
        <JobChatModal
          jobId={activeChatJobId}
          token={localStorage.getItem("token")}
          currentUserId={data?.client_info?.id || null}
          onClose={() => setActiveChatJobId(null)}
        />
      )}

   {/* --- RESPONSIVE GLASSMORPHISM ACCOUNT PROFILE EDITOR --- */}
{showProfileModal && (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
    <div className="w-full max-w-lg rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl flex flex-col relative overflow-hidden bg-linear-to-br from-white/70 to-white/30 backdrop-blur-xl">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-500 via-indigo-500 to-purple-600 opacity-80" />

      <div className="flex justify-between items-start pb-4 border-b border-slate-900/10">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Profile</h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">Manage details and information parameters</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowProfileModal(false)} 
          className="text-slate-500 text-2xl hover:text-slate-900 transition-colors focus:outline-hidden bg-slate-200/40 hover:bg-slate-200/80 rounded-full h-8 w-8 flex items-center justify-center"
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleProfileUpdateSubmit} className="space-y-5 pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Full Name Field */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 pl-1">Full Name</label>
            <input 
              required 
              type="text" 
              className="w-full border border-slate-300/60 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all bg-white/50 backdrop-blur-xs placeholder-slate-400 font-medium text-slate-900" 
              value={profileForm.name} 
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
            />
          </div>

          {/* Email Address Field */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 pl-1">Email Address</label>
            <input 
              required 
              type="email" 
              className="w-full border border-slate-300/60 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all bg-white/50 backdrop-blur-xs placeholder-slate-400 font-medium text-slate-900" 
              value={profileForm.email} 
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
            />
          </div>

          {/* Phone Number Field (Stretched to span full width layout cleanly) */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 pl-1">Phone Number (Optional)</label>
            <input 
              type="tel" 
              className="w-full border border-slate-300/60 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all bg-white/50 backdrop-blur-xs placeholder-slate-400 font-medium text-slate-900" 
              placeholder="+44 7123 456789"
              value={profileForm.phone} 
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
            />
          </div>

        </div>

        {/* Form CTA Buttons */}
        <div className="flex gap-3 pt-3 border-t border-slate-900/5 mt-6">
          <button
            type="button"
            onClick={() => setShowProfileModal(false)}
            className="flex-1 border border-slate-300/80 text-slate-700 font-bold text-xs py-3.5 rounded-xl transition-all bg-white/40 hover:bg-white/80 active:scale-98"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={profileUpdateLoading}
            className="flex-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20 active:scale-98"
          >
            {profileUpdateLoading ? 'Saving...' : 'Save Updates'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* --- WRITE TRANSACTION REVIEW MODAL --- */}
      {focusedReviewJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl p-6 border border-white/20 shadow-2xl flex flex-col relative overflow-hidden bg-linear-to-br from-white to-slate-50">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500 opacity-80" />

            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-md font-black text-slate-900 tracking-tight">Write Project Review</h2>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{focusedReviewJob.title}</p>
              </div>
              <button 
                type="button"
                onClick={() => setFocusedReviewJob(null)} 
                className="text-slate-400 text-xl hover:text-slate-900 transition-colors focus:outline-hidden"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 pl-0.5">Rating Evaluation</label>
                <select 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white font-medium text-slate-800 focus:outline-hidden"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                >
                  <option value="5">⭐⭐⭐⭐⭐ Excellent (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ Great Execution (4/5)</option>
                  <option value="3">⭐⭐⭐ Satisfactory Work (3/5)</option>
                  <option value="2">⭐⭐ Underperforming (2/5)</option>
                  <option value="1">⭐ Unacceptable (1/5)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 pl-0.5">Written Evaluation Summary</label>
                <textarea 
                  required
                  rows="3"
                  placeholder="Summarize performance milestones, speed, communication attributes..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder-slate-400"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFocusedReviewJob(null)}
                  className="flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl transition bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs py-3 rounded-xl transition shadow-xs"
                >
                  {reviewSubmitLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}