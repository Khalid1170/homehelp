import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function JobPitchForm() {
  const { token } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)

  // Form states
  const [pitchMessage, setPitchMessage] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API states
  const [loadingJob, setLoadingJob] = useState(true)
  const [errorFeedback, setErrorFeedback] = useState(null)
  const [successFeedback, setSuccessFeedback] = useState(false)

  // Validation
  const MAX_CHARS = 600
  const MIN_CHARS = 20

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoadingJob(true)
        const res = await fetch(`http://localhost:5000/jobs/${id}`)

        if (!res.ok) {
          throw new Error('Failed to load job details')
        }

        const data = await res.json()
        setJob(data)
      } catch (err) {
        setErrorFeedback(err.message)
      } finally {
        setLoadingJob(false)
      }
    }

    fetchJob()
  }, [id])

  const handleSubmitApplication = async (e) => {
    e.preventDefault()

    if (pitchMessage.length < MIN_CHARS || pitchMessage.length > MAX_CHARS) {
      return
    }

    setIsSubmitting(true)
    setErrorFeedback(null)

    try {
      const response = await fetch(
        `http://localhost:5000/jobs/${id}/apply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            worker_message: pitchMessage.trim()
          })
        }
      )

      const resData = await response.json()

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit application pitch')
      }

      setSuccessFeedback(true)
    } catch (err) {
      setErrorFeedback(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400">
            Loading Assignment Matrix...
          </p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans">
        <div className="bg-white border border-red-200 rounded-3xl p-8 text-center shadow-xl max-w-md w-full">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-slate-900">Failed To Load Job</h2>
          <p className="text-sm text-slate-500 mt-2">
            {errorFeedback || 'This assignment could not be retrieved'}
          </p>
          <button 
            onClick={() => navigate('/browse-jobs')}
            className="mt-5 inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  if (successFeedback) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans">
        <div className="bg-white border border-emerald-200 rounded-3xl p-8 text-center shadow-xl max-w-lg w-full animate-[fadeIn_0.2s_ease-out]">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Pitch Transmitted Successfully
          </h3>
          <p className="text-xs text-slate-500 mt-2 font-medium max-w-xs mx-auto">
            Your application has been securely delivered to the client.
          </p>
          <button 
            onClick={() => navigate('/browse-jobs')}
            className="mt-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 font-sans antialiased text-slate-800">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Navigation Action Hub */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/browse-jobs')} 
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Return to Browse Jobs
          </button>
        </div>

        {/* Dynamic Dual Grid Column Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT PANEL: Live Job Parameter Metrics Reference Display Box */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 lg:sticky lg:top-6">
            <div>
              <span className="text-[9px] font-extrabold uppercase bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-md tracking-wider">
                {job.category || 'General Brief'}
              </span>
              <h3 className="text-base font-black text-slate-900 mt-2 tracking-tight line-clamp-2">
                {job.title}
              </h3>
            </div>

            <div className="border-t border-b border-slate-100 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Guaranteed Payout</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">£{job.budget || job.amount_paid}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Region Scope</p>
                <p className="text-xs font-bold text-slate-700 mt-1">{job.location_text || job.location || 'Remote wide'}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Task Mandate Summary</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-h-48 overflow-y-auto pr-1 whitespace-pre-wrap">
                {job.description || 'No specific technical execution brief details logged.'}
              </p>
            </div>

           <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-semibold text-slate-400 flex items-center gap-2 border border-slate-100">
  <span>🛡️</span>
  <span>
    Client:{' '}
    <span className="text-slate-700 font-bold">
      {job.client?.name || job.client_info?.name || job.client_name || 'Verified Account'}
    </span>
  </span>
</div>
          </div>

          {/* RIGHT PANEL: The Active Proposal Pitch Matrix Interface Component */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/30 relative overflow-hidden">
            
            {/* Form Component Inner Header Block */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md tracking-wider">
                  Job Pitch Matrix
                </span>
                <h2 className="text-base font-black text-slate-900 tracking-tight mt-2.5">
                  Fulfill Proposal Parameters
                </h2>
              </div>

              {/* View Interface Tab Selectors */}
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 max-w-[200px]">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                    !isPreviewMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  disabled={pitchMessage.length === 0}
                  onClick={() => setIsPreviewMode(true)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    isPreviewMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Client View
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-5">
              {!isPreviewMode ? (
                <div>
                  <label htmlFor="worker_message" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Your Professional Pitch Message
                  </label>
                  <textarea
                    id="worker_message"
                    rows={6}
                    value={pitchMessage}
                    onChange={(e) => setPitchMessage(e.target.value)}
                    placeholder="Introduce your capabilities, explain your alignment roadmap for execution parameters, and reference your availability context..."
                    className="w-full text-sm font-medium p-4 border border-slate-200 rounded-2xl placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition resize-none leading-relaxed text-slate-800"
                    maxLength={MAX_CHARS}
                  />

                  {/* Character Tracking Threshold Row Lines */}
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className={`text-[11px] font-bold ${pitchMessage.length < MIN_CHARS ? 'text-amber-600' : 'text-slate-400'}`}>
                      {pitchMessage.length < MIN_CHARS
                        ? `Requires ${MIN_CHARS - pitchMessage.length} more characters`
                        : 'Length constraint valid'}
                    </span>
                    <span className={`text-[11px] font-bold ${pitchMessage.length >= MAX_CHARS ? 'text-rose-600' : 'text-slate-400'}`}>
                      {pitchMessage.length} / {MAX_CHARS}
                    </span>
                  </div>
                </div>
              ) : (
                /* Live Client Layout Preview Simulated Interface */
                <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-5 animate-[fadeIn_0.15s_ease-out]">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                    Preview of your application card
                  </p>
                  <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                        P
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Your Verified Worker Profile</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Applied just now</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                      {pitchMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Form Submission Dynamic Core Action Interface Trigger */}
              <div className="flex gap-3 justify-end items-center pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting || pitchMessage.length < MIN_CHARS || pitchMessage.length > MAX_CHARS}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-600/10 active:scale-[0.98] flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing Pitch...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}