import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import WorkerCard from '../../components/WorkerCard';
import { 
  Search, 
  UserCheck, 
  Star, 
  Briefcase, 
  Calendar, 
  X, 
  AlertCircle,
  FileText,
  Users,
  ArrowRight
} from 'lucide-react';

export default function WorkersDirectory() {
  const [workers, setWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:5000/api/workers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setWorkers(data);
      } catch (err) {
        console.error('Error fetching workers directory:', err);
        setError('Failed to load the worker list. Please refresh or try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  const filteredWorkers = workers.filter(worker => {
    const query = searchQuery.toLowerCase();
    const matchesName = worker.name?.toLowerCase().includes(query);
    const matchesSkills = worker.skills?.some(skill => 
      skill.toLowerCase().includes(query)
    );
    return matchesName || matchesSkills;
  });

  const activeWorker = workers.find(w => w.worker_id === selectedWorkerId || w.id === selectedWorkerId);

  return (
    <div className="bg-slate-50/60 min-h-screen font-sans antialiased text-slate-700 pb-20">
      
      {/* 🧭 Global App Navigation */}
      <Navbar />

      {/* Directory Title Bar Banner */}
      <div className="border-b border-slate-200/70 bg-gradient-to-b from-white to-slate-50/50 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-2.5">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              Available Helpers
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Meet local specialists ready to assist, or{' '}
              <a href="/register?role=worker" className="text-indigo-600 hover:underline font-semibold">
                create your own helper profile
              </a>.
            </p>
          </div>
          
          {/* Action Row: Search & Low-Key Subtle Shortcuts */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
            {/* Subtle Text Links hidden on small mobile, clean on desktop */}
            <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-slate-400 mr-2">
              <a href="/register?role=client" className="hover:text-slate-600 transition">Post a Job</a>
              <span className="text-slate-200">|</span>
              <a href="/register?role=worker" className="hover:text-slate-600 transition">Earn as a Helper</a>
            </div>

            <div className="relative w-full sm:max-w-xs group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search name or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading || error}
                className="w-full text-xs font-semibold bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-xs disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View Controller */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* State A: Loading View Spinner */}
        {isLoading && (
          <div className="text-center py-32 flex flex-col items-center justify-center gap-4">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 w-full h-full border-4 border-indigo-600/20 rounded-full"></div>
              <div className="absolute inset-0 w-full h-full border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-xs font-black tracking-widest text-slate-400 uppercase animate-pulse">Finding local helpers...</p>
          </div>
        )}

        {/* State B: Error View Callout */}
        {!isLoading && error && (
          <div className="text-center py-16 bg-white border border-rose-100 rounded-3xl p-8 max-w-xl mx-auto shadow-xl shadow-rose-600/5 animate-[scaleUp_0.2s_ease-out]">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">{error}</p>
          </div>
        )}

        {/* State C: Loaded Data Layout */}
        {!isLoading && !error && (
          filteredWorkers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-xs space-y-5">
              <p className="text-sm font-bold text-slate-400">
                {workers.length === 0 ? 'No helpers are listed in your area yet.' : 'No results found matching your search.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <a href="/register?role=client" className="text-[11px] font-black tracking-tight text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl hover:bg-indigo-100/70 transition">
                  Post a New Need
                </a>
                <a href="/register?role=worker" className="text-[11px] font-black tracking-tight text-slate-600 bg-slate-100 border border-slate-200/60 px-3.5 py-2 rounded-xl hover:bg-slate-200/70 transition">
                  Be the First Helper
                </a>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.2s_ease-out]">
              {filteredWorkers.map((worker, index) => {
                const renderElements = [
                  <div key={worker.worker_id || worker.id} className="transition-all duration-300 hover:-translate-y-0.5">
                    <WorkerCard 
                      worker={worker} 
                      onViewProfile={(id) => setSelectedWorkerId(id)}
                    />
                  </div>
                ];

                {/* 🥷 PASSIVE INLINE CTA: Inject a subtle prompt structural card at position index 1 */}
                if (index === 1 && searchQuery === '') {
                  renderElements.push(
                    <div key="inline-cta-card" className="border border-dashed border-slate-300 rounded-2xl p-6 bg-linear-to-b from-slate-50 to-white flex flex-col justify-between min-h-[280px]">
                      <div className="space-y-2.5">
                        <span className="inline-block text-[9px] font-black tracking-wider text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          Platform Notice
                        </span>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Looking to offer your own skills?</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          Join our community dashboard registry. Build a profile block like these to capture active local jobs matching your availability.
                        </p>
                      </div>
                      <div className="space-y-2 pt-4">
                        <a 
                          href="/register?role=worker" 
                          className="w-full justify-between inline-flex items-center text-xs font-bold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition active:scale-98"
                        >
                          <span>List My Services</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                        <a 
                          href="/register?role=client" 
                          className="w-full text-center inline-block text-[11px] font-bold text-slate-500 hover:text-slate-800 transition py-1"
                        >
                          Or post a job instead
                        </a>
                      </div>
                    </div>
                  );
                }

                return renderElements;
              })}
            </div>
          )
        )}
      </main>

      {/* 🧾 Profile Centered Modal Section */}
      {activeWorker && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="absolute inset-0" onClick={() => setSelectedWorkerId(null)} />

          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl flex flex-col z-10 max-h-[90vh] overflow-hidden border border-slate-100 animate-[scaleUp_0.2s_ease-out]">
            <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{activeWorker.name}</h2>
                <p className="text-[11px] text-indigo-600 font-bold tracking-tight uppercase mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Community Partner {activeWorker.joined_date ? `since ${activeWorker.joined_date}` : ''}
                </p>
              </div>
              <button 
                onClick={() => setSelectedWorkerId(null)}
                className="text-slate-400 hover:text-slate-600 border border-slate-200 bg-white p-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 divide-y divide-slate-100/80 grow custom-scrollbar">
              <div className="space-y-3 pt-0">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  About This Helper
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-2xl border border-slate-100/70">
                  {activeWorker.bio || 'This helper hasn\'t written a bio yet.'}
                </p>
                
                {activeWorker.skills && activeWorker.skills.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap pt-1.5">
                    {activeWorker.skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] font-black bg-indigo-50 border border-indigo-100/50 text-indigo-600 px-2.5 py-1 rounded-lg tracking-tight select-none">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-5 space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  Task History
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-100 p-4 rounded-2xl text-center shadow-xs bg-slate-50/30">
                    <span className="text-xl font-black text-slate-900 flex items-center justify-center gap-1">
                      {activeWorker.rating ? activeWorker.rating.toFixed(1) : '0.0'} 
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mt-1">Rating</span>
                  </div>
                  <div className="border border-slate-100 p-4 rounded-2xl text-center shadow-xs bg-slate-50/30">
                    <span className="block text-xl font-black text-slate-900">
                      {activeWorker.completed_jobs || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mt-1">Tasks Completed</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  What Neighbors Say
                </h3>
                
                {!activeWorker.past_jobs || activeWorker.past_jobs.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 italic py-2 pl-1">No feedback entries left yet.</p>
                ) : (
                  <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                    {activeWorker.past_jobs.map((job, idx) => (
                      <div key={job.id || idx} className="border border-slate-200/60 bg-white rounded-2xl p-4 space-y-2 shadow-xs">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 tracking-tight leading-snug">{job.title || 'General Help'}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold tracking-tight mt-0.5">
                              {job.date ? `Finished: ${job.date}` : 'Completed'} {job.client ? ` • By: ${job.client}` : ''}
                            </p>
                          </div>
                          {job.rating && (
                            <span className="text-[10px] font-black bg-amber-50/60 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200/50 flex items-center gap-0.5 shrink-0 select-none">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {Number(job.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        {job.review && (
                          <p className="text-xs text-slate-500 italic leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                            "{job.review}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}