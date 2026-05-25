import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

export default function Home() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('client');
  
  const portalRef = useRef(null);

  const isClient = user?.role === 'client';
  const isWorker = user?.role === 'worker';

  const handleTriggerGetStarted = () => {
    setShowGetStarted(true);
    setTimeout(() => {
      portalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleGetStarted = (role) => {
    navigate('/register', { state: { selectedRole: role } });
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans antialiased text-slate-600 selection:bg-slate-200 selection:text-slate-900 overflow-x-hidden">
      
      {/* 🌐 Clean Navigation Header Wrap */}
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Navbar setShowGetStarted={handleTriggerGetStarted} />
      </div>

      {/* 🚀 Hero Section (Bright & Airy Aesthetic) */}
      <header className="max-w-5xl mx-auto text-center px-4 sm:px-6 pt-28 pb-32 relative overflow-visible">
        {/* Soft Ambient Light Glows */}
        <div className="absolute inset-0 top-0 bg-[radial-gradient(60rem_40rem_at_top,rgba(0,0,0,0.02),transparent)] -z-10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-slate-200/30 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        {/* Minimalist Pill Badge */}
        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 mb-8 border border-slate-200/60 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {token ? `Active Session: Welcome Back, ${user?.name || 'Partner'}` : 'An Easier Way to Get Things Done'}
        </span>
        
        {/* High-Contrast Crisp Typography */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Local tasks handled, <br className="hidden sm:block"/>
          <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">flexibility guaranteed.</span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-normal">
          The simple, trusted place to find quick help at a fair price—and the perfect platform for students and local specialists to find flexible work that fits around life.
        </p>

        {/* Hero Interactive Entry Portal */}
        <div ref={portalRef} className="transition-all duration-500 ease-in-out">
          {token ? (
            /* --- AUTHENTICATED USER SHORTCUT LINKS --- */
            <div className="flex justify-center gap-4 flex-wrap items-center">
              {isClient ? (
                <>
                  <button
                    onClick={() => navigate('/client/post-job')}
                    className="bg-slate-900 text-white font-bold text-sm px-8 py-4 rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-md active:scale-98"
                  >
                    Post a New Task
                  </button>
                  <button
                    onClick={() => navigate('/client/dashboard')}
                    className="bg-white text-slate-700 border border-slate-200 font-bold text-sm px-8 py-4 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-98"
                  >
                    Manage Assignments
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/browse-jobs')}
                    className="bg-slate-900 text-white font-bold text-sm px-8 py-4 rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-md active:scale-98"
                  >
                    Browse Active Marketplace
                  </button>
                  <button
                    onClick={() => navigate('/worker/dashboard')}
                    className="bg-white text-slate-700 border border-slate-200 font-bold text-sm px-8 py-4 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-98"
                  >
                    View My Pitches
                  </button>
                </>
              )}
            </div>
          ) : (
            /* --- GUEST / UNAUTHENTICATED USER ROUTE PORTAL --- */
            !showGetStarted ? (
              <div className="flex justify-center gap-4 flex-wrap items-center">
                <button
                  onClick={handleTriggerGetStarted}
                  className="bg-slate-900 text-white font-bold text-sm px-8 py-4 rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg active:scale-98"
                >
                  Get Started Today
                </button>
                <button
                  onClick={() => navigate('/browse-jobs')}
                  className="bg-white text-slate-700 border border-slate-200 font-bold text-sm px-8 py-4 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm"
                >
                  View Live Jobs
                </button>
              </div>
            ) : (
              /* Crisp Selector Panel */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-xl shadow-slate-100 transition-all duration-300 relative">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select your pathway option</p>
                  <button 
                    onClick={() => setShowGetStarted(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Client Portal Option */}
                  <button
                    onClick={() => handleGetStarted('client')}
                    className="flex flex-col items-center justify-center p-6 bg-slate-50/50 border border-slate-200/80 rounded-xl hover:border-slate-400 hover:bg-white group transition-all duration-200 text-center cursor-pointer active:scale-99"
                  >
                    <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-200 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <span className="font-bold text-slate-900 text-base">I want to Hire</span>
                    <span className="text-xs text-slate-500 mt-2 leading-normal">Post tasks and secure matching helpers quickly</span>
                  </button>

                  {/* Worker Portal Option */}
                  <button
                    onClick={() => handleGetStarted('worker')}
                    className="flex flex-col items-center justify-center p-6 bg-slate-50/50 border border-slate-200/80 rounded-xl hover:border-slate-400 hover:bg-white group transition-all duration-200 text-center cursor-pointer active:scale-99"
                  >
                    <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-200 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.381-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    <span className="font-bold text-slate-900 text-base">I want to Earn</span>
                    <span className="text-xs text-slate-500 mt-2 leading-normal">Claim dynamic gig listings around your schedule</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </header>

      {/* 🤝 Unified Value Pillars Section (Clean Card Grid) */}
      <section className="bg-slate-50 border-y border-slate-200/60 py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">Why Choose Homehelp?</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm">Built around fast help, transparent pricing, and honest local work.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-8 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
              <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Fast & Affordable</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                Get quick help without paying corporate overhead. Deal directly with local helpers to get tasks completed efficiently at rates that align with your actual project needs.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
              <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Great for Students</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                A safe, dependable way for students to generate revenue on their own terms. Claim micro-tasks that align cleanly between lectures, laboratory labs, and examination schedules.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
              <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Flexible for Handymen</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                Whether you are a seasoned local professional or simply handy around property structures, retain full authority over selected jobs, execution hours, and clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🔄 Flow Journey Mapping (Toggle Interface) */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">How the Platform Works</h2>
          <p className="text-slate-500 mt-2 text-sm">Simple steps to ensure an easy, smooth experience for everyone.</p>
          
          {/* Segmented Control Toggle Switch */}
          <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl mt-8">
            <button 
              onClick={() => setActiveTab('client')}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'client' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              For Clients
            </button>
            <button 
              onClick={() => setActiveTab('worker')}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'worker' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              For Workers
            </button>
          </div>
        </div>

        <div className="transition-all duration-300">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-[fadeIn_0.25s_ease-out]">
            {(activeTab === 'client' ? [
              { title: 'Post Your Job', desc: 'Fill out your job details and pay the job budget upfront to list it on our active board.' },
              { title: 'Check Offers', desc: 'Approved local helpers will review your job details and apply with their availability.' },
              { title: 'Pick a Helper', desc: 'Choose the person that fits your needs best. Your money is held safely by us until the job is done.' },
              { title: 'Release Payment', desc: 'Once the work is done and you’re satisfied, confirm it to send the money to your helper instantly.' }
            ] : [
              { title: 'Get Approved', desc: 'Submit a few simple details. Our team checks everything to keep our community safe.' },
              { title: 'Find & Apply', desc: 'Browse through active, fully-funded jobs in your area and apply to the ones you want.' },
              { title: 'Do the Work', desc: 'Once the client picks your offer, coordinate details and complete the task.' },
              { title: 'Get Paid Safely', desc: 'As soon as the job is marked complete, your money is sent directly to your account through Stripe.' }
            ]).map((step, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 rounded-xl relative flex flex-col justify-between hover:border-slate-300 transition duration-200 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600">
                    Step 0{idx + 1}
                  </span>
                  <h4 className="font-bold text-slate-900 mt-5 mb-2 text-sm tracking-tight">{step.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💳 Payments Section (Clean Slate Layout) */}
      <section className="bg-slate-50 border-y border-slate-200/60 py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-sm">
              Money Management Made Simple
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl mt-5">
              How payments are managed
            </h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
              No hidden fees, no stress. We track everything right inside your personal dashboard ledger.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Client Card */}
            <div className="bg-white border border-slate-200 p-8 rounded-2xl relative overflow-hidden group hover:border-slate-300 transition duration-300 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">The Client Dashboard</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total control over your funds</p>
                </div>
              </div>
              
              <ul className="space-y-4 text-xs sm:text-sm text-slate-500">
                <li className="flex gap-3 items-start">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span><strong>Upfront Visibility:</strong> Pay the fixed job budget securely when creating your listing so helpers can apply confidently.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span><strong>Safe Holding Hold:</strong> Your money sits protected in our payment vault—never released until you approve the finished work.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span><strong>One-Click Release:</strong> Review the results directly from your dashboard and hit "Approve" to send funds instantly.</span>
                </li>
              </ul>
            </div>

            {/* Worker Card */}
            <div className="bg-white border border-slate-200 p-8 rounded-2xl relative overflow-hidden group hover:border-slate-300 transition duration-300 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">The Worker Wallet</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Track your earnings live</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-500">
                <li className="flex gap-3 items-start">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span><strong>Guaranteed Payouts:</strong> See which jobs are fully funded beforehand so you can deploy labor with total peace of mind.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span><strong>Live Status Tracking:</strong> Track whether a job is "Funded," "In Progress," or "Ready for Cashout" in real-time.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span><strong>Direct Bank Deposits:</strong> Once approved, earnings are routed straight into your bank account via Stripe.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ Trust & Safety Framework (Clean White Protection Cards) */}
      <section className="bg-white text-slate-600 py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">Our Safety Promises</h2>
            <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto">Keeping every single job safe, clear, and protected.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4 bg-slate-50 p-7 rounded-xl border border-slate-200/60 hover:border-slate-300 transition duration-300">
              <div className="text-slate-900 text-sm font-bold flex items-center gap-2.5 tracking-tight">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                Secure Stripe Payments
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Clients fund escrow vaults when they post so workers know the money is secure. If a client cancels a job before picking a helper, they receive a full refund automatically.
              </p>
            </div>

            <div className="space-y-4 bg-slate-50 p-7 rounded-xl border border-slate-200/60 hover:border-slate-300 transition duration-300">
              <div className="text-slate-900 text-sm font-bold flex items-center gap-2.5 tracking-tight">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Helper Checkpoints
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Workers cannot look at or apply for jobs until our operations team verifies their credentials. This protocol guarantees our ecosystem stays safe and accountable.
              </p>
            </div>

            <div className="space-y-4 bg-slate-50 p-7 rounded-xl border border-slate-200/60 hover:border-slate-300 transition duration-300">
              <div className="text-slate-900 text-sm font-bold flex items-center gap-2.5 tracking-tight">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Easy Dispute Support
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                If a job hits an unexpected problem, our support team steps in quickly. We review documentation details, evaluate chat records, and settle parameters fairly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ❓ FAQ Section (Flush Light Accordion Elements) */}
      <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-black text-slate-900 text-center tracking-tight sm:text-3xl mb-16">Frequently Asked Questions</h2>
        
        <div className="space-y-3">
          {[
            { q: "What happens if a client cancels a job post?", a: "Since clients pay to put a job up, the money is safely held. If you cancel the job before picking a helper, a full refund is sent back to your card right away." },
            { q: "How does pricing work?", a: "Workers do not try to bid or change your price. They simply apply to the flat price you offer, showing you their experience and schedule so you can pick the best fit." },
            { q: "What do workers need to do to get approved?", a: "To keep everyone on the platform safe, new helpers must upload standard identification. This confirms who you are before you can start browsing and picking up shifts." }
          ].map((faq, index) => (
            <details key={index} className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 [&_summary::-webkit-details-marker]:hidden transition-all duration-200 shadow-sm">
              <summary className="flex justify-between items-center font-bold text-slate-900 text-sm sm:text-base cursor-pointer select-none">
                <span>{faq.q}</span>
                <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-100 font-normal animate-[fadeIn_0.15s_ease-out]">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Light Minimalist Footer */}
      <footer className="text-center py-12 text-[11px] text-slate-400 border-t border-slate-200/60 bg-white">
        <p className="font-semibold text-slate-500 tracking-wider uppercase">Homehelp Platform</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} All rights reserved.</p>
      </footer>

    </div>
  );
}