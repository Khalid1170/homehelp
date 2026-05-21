import React, { useState, useEffect } from 'react';
import { clientApi } from '../../services/clientApi';
import Navbar from '../../components/Navbar'; 
import Footer from '../../components/Footer'; 

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active | completed

  // Interactive UI expansion state to trace open job items
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Job Posting Drawer State management 
  const [showPostModal, setShowPostModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', budget: '', category: '', location_text: '' });
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);

  // Selected focused context for reviewing applicants
  const [focusedJob, setFocusedJob] = useState(null);

  // --- NEW: Review Modal & Form States ---
  const [focusedReviewJob, setFocusedReviewJob] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const metricsData = await clientApi.getDashboard();
      setData(metricsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandJob = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const handlePostJobSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitLoading(true);
      await clientApi.createJob(formData);
      setShowPostModal(false);
      setFormData({ title: '', description: '', budget: '', category: '', location_text: '' });
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleCancelJob = async (jobId, e) => {
    e.stopPropagation(); // Stop parent container file card expansion trigger toggle
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

  const handleApproveCandidate = async (appId) => {
    try {
      await clientApi.approveWorker(appId);
      setFocusedJob(null);
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeclineCandidate = async (appId) => {
    try {
      await clientApi.declineWorker(appId);
      if (focusedJob) {
        setFocusedJob({
          ...focusedJob,
          incoming_applications: focusedJob.incoming_applications.filter(a => a.application_id !== appId)
        });
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

  // --- NEW: Submit Review Handler ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setReviewSubmitLoading(true);
      // Assumes your clientApi has a submitReview method taking (jobId, { rating, comment })
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

  const displayedJobs = activeTab === 'active' ? data.active_jobs : data.completed_jobs;

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <Navbar setShowGetStarted={() => setShowPostModal(true)} />
      
      <div className="bg-white border-b border-slate-200/80 sticky top-[65px] z-30 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Control Dashboard</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Welcome back, {data.client_info?.name || 'Client'}</p>
          </div>
          <button 
            onClick={() => setShowPostModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/15 active:scale-98 self-start sm:self-center"
          >
            Deploy New Job +
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 mt-8 flex-1 pb-16">
        
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Placed Capital', value: `$${data.metrics.total_spent.toFixed(2)}`, color: 'text-slate-900' },
            { label: 'Pipeline Postings', value: data.metrics.total_jobs, color: 'text-blue-600' },
            { label: 'Active Projects', value: data.metrics.active_jobs, color: 'text-amber-600' },
            { label: 'Completed Jobs', value: data.metrics.completed_jobs, color: 'text-emerald-600' }
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
            onClick={() => { setActiveTab('active'); setExpandedJobId(null); }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'active' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Active Pipelines ({data.active_jobs.length})
          </button>
          <button 
            onClick={() => { setActiveTab('completed'); setExpandedJobId(null); }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Completed Vault ({data.completed_jobs.length})
          </button>
        </div>

        {/* Jobs Feed Wrapper Container */}
        <div className="grid grid-cols-1 gap-4 mt-6">
          {displayedJobs.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl max-w-xl mx-auto w-full px-6 flex flex-col items-center">
              <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-bold text-lg border border-slate-100 mb-4">📂</div>
              <p className="text-sm font-bold text-slate-800 tracking-tight">No active tracking records</p>
              <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs leading-relaxed">
                You haven't posted any positions matching this status container profile inside your pipeline ecosystem.
              </p>
            </div>
          ) : (
            displayedJobs.map((job) => {
              const isExpanded = expandedJobId === job.job_id;
              return (
                <div 
                  key={job.job_id} 
                  onClick={() => toggleExpandJob(job.job_id)}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer select-none ${
                    isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/20'
                  }`}
                >
                  {/* Card Front Top Summary Line */}
                  <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{job.title}</h3>
                        
                        <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md border uppercase ${
                          job.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {job.payment_status}
                        </span>

                        <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/60 uppercase">
                          Status: {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-black text-slate-800 tracking-tight">${job.budget}</p>
                        <span className="text-xs text-blue-600 font-bold bg-blue-50/60 px-2.5 py-1 rounded-lg">
                          {isExpanded ? 'Hide Details ▲' : 'Click to View Details ▼'}
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Block triggers */}
                    <div className="flex items-center gap-3 self-stretch lg:self-center justify-between sm:justify-end flex-wrap">
                      {job.payment_status === 'unpaid' && (
                        <button 
                          onClick={(e) => handleStripeCheckoutRedirect(job.job_id, e)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                        >
                          Fund Escrow (Stripe) 💳
                        </button>
                      )}

                      {job.payment_status === 'paid' && job.incoming_applications?.length > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFocusedJob(job); }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                        >
                          Review Candidates ({job.incoming_applications.length}) 🔍
                        </button>
                      )}

                      {job.status === 'pending_confirmation' && (
                        <button 
                          onClick={(e) => handleConfirmReceipt(job.job_id, e)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                        >
                          Confirm Complete & Payout 🏆
                        </button>
                      )}

                      {job.status !== 'accepted' && job.status !== 'completed' && job.status !== 'pending_confirmation' && (
                        <button 
                          onClick={(e) => handleCancelJob(job.job_id, e)}
                          className="border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 p-2.5 rounded-xl transition hover:bg-rose-50/50"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Meta Panel Section */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-100 p-6 space-y-6 animate-fade-in cursor-default" onClick={(e) => e.stopPropagation()}>
                      
                      {/* Segment 1: Detailed Scope */}
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

                      {/* Segment 2: Worker & Financial Escrow Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Worker Assignment Card */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Appointed Service Worker</h4>
                          <div className="bg-white border border-slate-200/60 rounded-xl p-4 flex items-center justify-between min-h-[74px]">
                            {job.worker ? (
                              <div>
                                <p className="text-sm font-bold text-slate-900">{job.worker.name}</p>
                                <p className="text-xs font-bold text-amber-500 mt-0.5">⭐ {job.worker.rating ? `${job.worker.rating.toFixed(1)} Rating` : 'N/A Rating Frame'}</p>
                              </div>
                            ) : (
                              <p className="text-xs font-semibold text-slate-400 italic">No contractor appointed to pipeline yet.</p>
                            )}
                          </div>
                        </div>

                        {/* Financial Ledger Audit info */}
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
                              }`}>
                                {job.payment_status === 'paid' ? 'Escrow Released' : 'Awaiting Capital'}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Segment 3: Performance Review Feedback Engine Component */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Platform Feedback Review</h4>
                        <div className="bg-white border border-slate-200/60 rounded-xl p-4">
                          {job.review ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, idx) => (
                                  <span key={idx} className={`text-sm ${idx < job.review.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                                ))}
                                <span className="text-xs font-bold text-slate-700 ml-1">({job.review.rating}.0 / 5.0)</span>
                              </div>
                              <p className="text-xs text-slate-500 italic leading-relaxed">"{job.review.comment || 'No written summary parameters provided.'}"</p>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <p className="text-xs font-semibold text-slate-400 italic">
                                {job.status === 'completed' 
                                  ? 'No evaluation feedback loop submitted for this position listing.' 
                                  : 'Feedback loops unlock once milestones achieve full closure.'}
                              </p>
                              {/* --- NEW: Leave Review Trigger Button --- */}
                              {job.status === 'completed' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setFocusedReviewJob(job); }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition duration-150 active:scale-98"
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

      {/* MODAL WINDOW A: DEPLOY POSTING FORM */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Post a New Job</h2>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 text-2xl hover:text-slate-600 transition focus:outline-hidden">×</button>
            </div>
            
            <form onSubmit={handlePostJobSubmit} className="space-y-4 overflow-y-auto py-4 flex-1 pr-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Job Title</label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 transition bg-slate-50/30" placeholder="e.g. Clean and Organize 3 Bed House" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Budget ($ USD)</label>
                  <input required type="number" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 transition bg-slate-50/30" placeholder="150" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                  <input required type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 transition bg-slate-50/30" placeholder="Cleaning, Assembly" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Location Details</label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 transition bg-slate-50/30" placeholder="Downtown Bristol, BS1" value={formData.location_text} onChange={(e) => setFormData({...formData, location_text: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Scope Description</label>
                <textarea required rows={4} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 resize-none transition bg-slate-50/30" placeholder="Provide breakdown parameters here..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <button type="submit" disabled={formSubmitLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold p-3.5 rounded-xl text-sm transition mt-2 shadow-xs active:scale-99">
                {formSubmitLoading ? 'Configuring System...' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL WINDOW B: APPLICANT SUBMISSIONS EVALUATOR */}
      {focusedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Applicant Submissions</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{focusedJob.title}</p>
              </div>
              <button onClick={() => setFocusedJob(null)} className="text-slate-400 text-2xl hover:text-slate-600 transition focus:outline-hidden">×</button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
              {focusedJob.incoming_applications.map((app) => (
                <div key={app.application_id} className="border border-slate-200/70 p-4 rounded-xl space-y-3 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{app.name}</h4>
                      <p className="text-xs text-amber-600 font-bold mt-0.5">⭐ {app.rating ? `${app.rating.toFixed(1)} Average Rating` : 'New Contractor'}</p>
                    </div>
                  </div>
                  {app.worker_message && (
                    <p className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200/40 italic leading-relaxed">
                      "{app.worker_message}"
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => handleApproveCandidate(app.application_id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs active:scale-98"
                    >
                      Approve & Appoint
                    </button>
                    <button 
                      onClick={() => handleDeclineCandidate(app.application_id)}
                      className="px-4 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 hover:bg-rose-50/50 font-bold text-xs py-2.5 rounded-xl transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: MODAL WINDOW C: CLIENT FEEDBACK LEAVE REVIEW FORM --- */}
      {focusedReviewJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Leave a Review</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">For: {focusedReviewJob.title}</p>
              </div>
              <button 
                onClick={() => { setFocusedReviewJob(null); setReviewForm({ rating: 5, comment: '' }); }} 
                className="text-slate-400 text-2xl hover:text-slate-600 transition focus:outline-hidden"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                      className={`text-2xl transition-all duration-150 ${
                        num <= reviewForm.rating ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-600 ml-2">{reviewForm.rating}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Review Comments</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-hidden focus:border-blue-600 resize-none transition bg-slate-50/30"
                  placeholder="Share your experience working with this service worker..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setFocusedReviewJob(null); setReviewForm({ rating: 5, comment: '' }); }}
                  className="flex-1 border border-slate-200 text-slate-500 font-bold text-xs py-3 rounded-xl transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-xs py-3 rounded-xl transition shadow-xs active:scale-98"
                >
                  {reviewSubmitLoading ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}