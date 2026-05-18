import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('client');

  const handleGetStarted = (role) => {
    navigate('/register', { state: { selectedRole: role } });
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800 selection:bg-blue-500 selection:text-white">
      
      {/* 🌐 Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r select-none from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-90 transition">
              Homehelp
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              Sign In
            </button>
            <button 
              onClick={() => setShowGetStarted(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 active:scale-98"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* 🚀 Hero Section */}
      <header className="max-w-5xl mx-auto text-center px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-6 border border-blue-100 shadow-xs">
          ✨ Redefining Local Task Assistance
        </span>
        
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6 max-w-4xl mx-auto">
          Local tasks handled, <br className="hidden sm:block"/>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">flexibility guaranteed.</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          The trusted workspace for clients seeking fast, fair-priced local assistance, and a platform for young students and manual specialists looking for flexible honest work that fits their schedule.
        </p>

        {/* Dynamic Onboarding Selector Panel */}
        {!showGetStarted ? (
          <button
            onClick={() => setShowGetStarted(true)}
            className="inline-block bg-slate-950 text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-slate-800 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-slate-950/20"
          >
            Get Started Today
          </button>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md mx-auto shadow-2xl transition-all duration-300 scale-100 animate-[fadeIn_0.2s_ease-out]">
            <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Select your account objective</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGetStarted('client')}
                className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 group transition-all duration-200 text-center cursor-pointer"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">💼</span>
                <span className="font-bold text-slate-900 text-sm">I want to Hire</span>
                <span className="text-xs text-slate-400 mt-1.5 leading-normal">Post jobs & review custom pitches</span>
              </button>

              <button
                onClick={() => handleGetStarted('worker')}
                className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/20 group transition-all duration-200 text-center cursor-pointer"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🛠️</span>
                <span className="font-bold text-slate-900 text-sm">I want to Earn</span>
                <span className="text-xs text-slate-400 mt-1.5 leading-normal">Browse tasks & offer flexibility</span>
              </button>
            </div>
            <button 
              onClick={() => setShowGetStarted(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold tracking-wide uppercase mt-5 block mx-auto transition-colors"
            >
              Close Panel
            </button>
          </div>
        )}
      </header>

      {/* 🤝 Unified Value Pillars Section */}
      <section className="bg-white border-y border-slate-200/60 py-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Why Choose Our Marketplace?</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-base">Built around local efficiency, transparent economics, and mutual lifestyle growth.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200/50 hover:bg-white hover:border-blue-500/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center mb-6 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">⚡</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Fast & Affordable</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                By bypassing major corporate layers, clients secure prompt local help at prices significantly cheaper than traditional companies, without compromising on project clarity.
              </p>
            </div>
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200/50 hover:bg-white hover:border-blue-500/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center mb-6 text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">🎓</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Perfect for Students</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                An excellent, secure avenue for college students to earn extra money doing honest work. Choose tasks that perfectly adapt to your study schedule and lecture gaps.
              </p>
            </div>
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200/50 hover:bg-white hover:border-blue-500/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center mb-6 text-xl group-hover:bg-blue-600 transition-all duration-300">🛠️</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Flexible Handymen</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Whether you're an independent specialist or a local technician seeking extra work, you maintain absolute control over the projects you choose to engage with.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🔄 Flow Journey Mapping */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">How the Platform Works</h2>
          <p className="text-slate-500 mt-3 text-base">See how our end-to-end framework secures clarity for both roles.</p>
          
          {/* Flow Switcher Controls */}
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl mt-8 border border-slate-300/30">
            <button 
              onClick={() => setActiveTab('client')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${activeTab === 'client' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              For Clients
            </button>
            <button 
              onClick={() => setActiveTab('worker')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${activeTab === 'worker' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              For Workers
            </button>
          </div>
        </div>

        {/* Tab content wrappers */}
        <div className="transition-all duration-300 transform">
          {activeTab === 'client' ? (
            <div className="grid sm:grid-cols-4 gap-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Step 1</span>
                <h4 className="font-bold text-slate-900 mt-4 mb-1.5">Fund & Post</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Describe your project parameters and pay the job budget upfront to publish it to the active registry.</p>
              </div>
              <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Step 2</span>
                <h4 className="font-bold text-slate-900 mt-4 mb-1.5">Review Pitches</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Vetted operators submit applications detailing their specific experience and availability profiles.</p>
              </div>
              <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Step 3</span>
                <h4 className="font-bold text-slate-900 mt-4 mb-1.5">Assign Task</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Select the applicant that meets your needs. Funds are securely transferred into protected escrow holds.</p>
              </div>
              <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Step 4</span>
                <h4 className="font-bold text-slate-900 mt-4 mb-1.5">Approve Payout</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Once the work is done and verified, release the escrowed funds to your specialist's wallet instantly.</p>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-4 gap-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Step 1</span>
                <h4 className="font-bold text-slate-900 mt-4 mb-1.5">Vetting Approval</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Submit the required documentation. Our admin suite verifies your background parameters to maintain safety.</p>
              </div>
              <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Step 2</span>
                <h4 className="font-bold text-slate-900 mt-4 mb-1.5">Browse & Pitch</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Explore fully funded live listings. Submit a pitch highlighting your schedule and relevant experience.</p>
              </div>
              <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Step 3</span>
                <h4 className="font-bold text-slate-900 mt-4 mb-1.5">Execute Project</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Coordinate straight through the task layout card once the client selects your pitch.</p>
              </div>
              <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Step 4</span>
                <h4 className="font-bold text-slate-900 mt-4 mb-1.5">Earn Securely</h4>
                <p className="text-xs text-slate-500 leading-relaxed">When the project is finished, funds stored in the secure Stripe escrow are transferred directly to you.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 🛡️ Trust & Safety Framework */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Our Trust & Safety Framework</h2>
            <p className="text-slate-400 mt-3 text-base max-w-md mx-auto">Ensuring integrity, protection, and accountability across every single transaction.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="space-y-3 bg-white/5 p-6 rounded-2xl backdrop-blur-xs border border-white/10">
              <div className="text-blue-400 text-lg font-bold flex items-center gap-2">💳 Secure Stripe Escrow</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clients pay upfront to make a job go live, locking the funds safely in escrow. If a client cancels a job before assigning a worker, a full refund is processed automatically.
              </p>
            </div>
            <div className="space-y-3 bg-white/5 p-6 rounded-2xl backdrop-blur-xs border border-white/10">
              <div className="text-indigo-400 text-lg font-bold flex items-center gap-2">🕵️ Background Vetting</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Workers cannot view or apply to live listings until they pass an administrative vetting checkpoint, ensuring community standards remain exceptional.
              </p>
            </div>
            <div className="space-y-3 bg-white/5 p-6 rounded-2xl backdrop-blur-xs border border-white/10">
              <div className="text-blue-400 text-lg font-bold flex items-center gap-2">⚖️ Resolution Pipeline</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If a project hits a roadblock, our specialized mediation engine steps in. We thoroughly review parameters, inspect communications, and settle issues equitably.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ❓ FAQ Section */}
      <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold text-slate-900 text-center tracking-tight sm:text-4xl mb-14">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <details className="group bg-white p-6 rounded-2xl border border-slate-200/80 [&_summary::-webkit-details-marker]:hidden transition-all duration-200" open>
            <summary className="flex justify-between items-center font-bold text-slate-900 text-base cursor-pointer select-none">
              <span>What happens if a client cancels a job post?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-xl">&darr;</span>
            </summary>
            <p className="text-sm text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100 animate-[fadeIn_0.2s_ease-out]">
              Because clients pay to make a listing live, the budget is held securely. If you decide to cancel the project before a worker is assigned, a full refund is instantly issued through our secure payment processor.
            </p>
          </details>

          <details className="group bg-white p-6 rounded-2xl border border-slate-200/80 [&_summary::-webkit-details-marker]:hidden transition-all duration-200">
            <summary className="flex justify-between items-center font-bold text-slate-900 text-base cursor-pointer select-none">
              <span>How do workers establish project pricing?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-xl">&darr;</span>
            </summary>
            <p className="text-sm text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100 animate-[fadeIn_0.2s_ease-out]">
              Workers do not pitch alternative numbers. Instead, they apply directly to the fixed price you offer, providing clear details about their background and schedule compatibility so you can make an informed choice.
            </p>
          </details>

          <details className="group bg-white p-6 rounded-2xl border border-slate-200/80 [&_summary::-webkit-details-marker]:hidden transition-all duration-200">
            <summary className="flex justify-between items-center font-bold text-slate-900 text-base cursor-pointer select-none">
              <span>What is required for the worker vetting process?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-xl">&darr;</span>
            </summary>
            <p className="text-sm text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100 animate-[fadeIn_0.2s_ease-out]">
              To safeguard the platform, newly registered workers must submit standard verification documentation. This helps confirm your identity and background before you are approved to browse and pitch on listings.
            </p>
          </details>
        </div>
      </section>

      {/* 🚪 Global Public Footer */}
      <footer className="text-center py-10 text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        <p className="font-semibold text-slate-500 tracking-wide">Homehelp Platform</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} All rights reserved.</p>
      </footer>

    </div>
  );
}