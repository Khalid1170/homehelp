import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import JobCard from '../../components/JobCard';
import Navbar from '../../components/Navbar';

export default function BrowseJobs() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Core Listings State Matrix
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Client-Side Multi-Parameter Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [minBudget, setMinBudget] = useState('');

  const fetchPublicJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/jobs/open'); 
      if (!res.ok) {
        throw new Error('Unable to parse active marketplace listings.');
      }
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const searchTarget = `${job.title || ''} ${job.description || ''} ${job.category || ''}`.toLowerCase();
      const matchesSearch = searchTarget.includes(searchQuery.toLowerCase().trim());
      
      let numericBudget = 0;
      if (typeof job.budget === 'number') {
        numericBudget = job.budget;
      } else if (job.budget) {
        const cleanString = String(job.budget).replace(/[^0-9.]/g, '');
        numericBudget = parseFloat(cleanString) || 0;
      }
      
      const targetMin = parseFloat(minBudget);
      const matchesBudget = isNaN(targetMin) ? true : numericBudget >= targetMin;

      return matchesSearch && matchesBudget;
    });
  }, [jobs, searchQuery, minBudget]);

  const handleApplyAction = (jobId) => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (user?.role === 'client') {
      navigate(`/jobs/${jobId}`);
      return;
    }

    navigate(`/jobs/${jobId}/pitch`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setMinBudget('');
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        
        {/* Modern Hero Dashboard Section */}
        <header className="mb-10 relative bg-linear-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-400/20 text-blue-400 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Assignment Pool
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Discover Marketplace Assignments
            </h2>
            <p className="text-sm text-slate-400 max-w-xl font-medium leading-relaxed">
              Browse verified domestic, technical, and structural workloads. Refine parameters below to secure matching contract targets.
            </p>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8 items-start">
          
          {/* Side Structural Control Panel */}
          <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 lg:sticky lg:top-24 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Filter Parameters
              </h3>
              {(searchQuery || minBudget) && (
                <button 
                  onClick={clearFilters}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Search Keywords</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Keywords, skills, region..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Minimum Floor Budget</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input 
                    type="number"
                    placeholder="Payout threshold"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Core Content Feed Stream */}
          <section className="lg:col-span-3 space-y-4">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2 shadow-xs">
                ⚠️ <span><strong>System Sync Exception:</strong> {error}</span>
              </div>
            )}

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center shadow-xs">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold tracking-wider uppercase text-slate-400 animate-pulse">Scanning Open Taskboards...</p>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-xs max-w-xl mx-auto mt-6">
                <div className="text-3xl mb-3">🔍</div>
                <h4 className="font-bold text-slate-900 text-sm">No Matching Assignments Found</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 font-medium leading-relaxed">
                  Zero metrics overlap with your filtering stack. Broaden your keywords or clear budget boundaries.
                </p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Widen Filter Horizon
                </button>
              </div>
            ) : (
              <div className="grid gap-4.5">
                {filteredJobs.map(job => (
                  <JobCard 
                    key={job.id || job.job_id || job._id} 
                    job={job} 
                    onApply={handleApplyAction} 
                    token={token}
                    userRole={user?.role}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      <footer className="text-center py-12 text-xs text-slate-400 border-t border-slate-200/60 bg-white mt-24">
        <p className="font-bold text-slate-500 tracking-wide">Homehelp Platform</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}