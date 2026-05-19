import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import JobCard from '../../components/JobCard'; // Verify path references point correctly here

export default function BrowseJobs() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // Core Listings State Matrix
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Client-Side Multi-Parameter Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [minBudget, setMinBudget] = useState('');

  const fetchPublicJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/jobs/open'); 
      if (!res.ok) {
        throw new Error('Ecosystem sync exception. Unable to parse active marketplace listings.');
      }
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicJobs();
  }, []);

  // Filter Pipeline Processing
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' ? true : job.status === selectedStatus;
    
    const cleanBudgetString = String(job.budget || '').replace(/[^0-9]/g, '');
    const numericBudget = parseInt(cleanBudgetString, 10) || 0;
    
    const matchesBudget = minBudget === '' ? true : numericBudget >= parseInt(minBudget, 10);

    return matchesSearch && matchesStatus && matchesBudget;
  });

  const handleApplyAction = (jobId) => {
    if (!token) {
      navigate('/login');
    } else {
      navigate(`/jobs/${jobId}/pitch`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-500 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Scanning Open Marketplace Taskboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800 selection:bg-blue-500 selection:text-white">
      
      {/* 🌐 Clean Aligned Header Element Layout */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r select-none from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-90 transition">
              Homehelp
            </span>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
              JOBS
            </span>
          </div>
          <div className="flex items-center gap-5">
            {!token ? (
              <>
                <button 
                  onClick={() => navigate('/login')} 
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 active:scale-98"
                >
                  Get Started
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/admin/dashboard')} 
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200"
                >
                  Control Dashboard
                </button>
                <button 
                  onClick={() => { logout(); navigate('/'); }} 
                  className="text-xs font-bold bg-slate-100 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition active:scale-98 cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 📊 Main Core Layout Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        
        <header className="mb-10 space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Discover Live Marketplace Assignments</h2>
          <p className="text-sm text-slate-500 max-w-2xl font-medium">Browse verified domestic, technical, and structural tasks active across the territory. Filter parameters down to secure matching contract workloads.</p>
        </header>

        <div className="grid lg:grid-cols-4 gap-8 items-start">
          
          {/* Side Control panel */}
          <aside className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-6 lg:sticky lg:top-24 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Refine Task Queries</h3>
              <input 
                type="text"
                placeholder="Search keywords, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <hr className="border-slate-100" />

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Minimum Task Value</h3>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                <input 
                  type="number"
                  placeholder="50"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assignment Lifecycle</h3>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 focus:bg-white transition cursor-pointer font-medium"
              >
                <option value="all">All Assignments</option>
                <option value="pending">Unassigned / Pending</option>
                <option value="assigned">Active In-Progress</option>
                <option value="completed">Completed Logs</option>
              </select>
            </div>
          </aside>

          {/* Core Modular Content List Feed */}
          <section className="lg:col-span-3 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
                ⚠️ <strong>Ecosystem Exception:</strong> {error}
              </div>
            )}

            {filteredJobs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-medium shadow-xs">
                🚫 Zero active platform listings match your filters. Clear metrics to widen range.
              </div>
            ) : (
              filteredJobs.map(job => (
                <JobCard 
                  key={job.id || job.job_id} 
                  job={job} 
                  onApply={handleApplyAction} 
                  token={token}
                />
              ))
            )}
          </section>

        </div>
      </main>

      <footer className="text-center py-10 text-xs text-slate-400 border-t border-slate-200/60 bg-white mt-20">
        <p className="font-semibold text-slate-500 tracking-wide">Homehelp Platform</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}