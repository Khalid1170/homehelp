import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Pre-defined available tasks list for the multi-select interface
const AVAILABLE_TASKS = [
  "House Cleaning",
  "Plumbing Repairs",
  "Electrical Work",
  "Gardening & Landscaping",
  "Moving & Heavy Lifting",
  "Painting & Decorating",
  "Furniture Assembly",
  "General Handyman Tasks"
];

export default function WorkerRegister() {
  const navigate = useNavigate();

  // Multi-Step Layout Tracking
  const [step, setStep] = useState(1);

  // Step 1 State Fields: Core Account Credentials 🔑
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Step 2 State Fields: Professional Service Specs 🛠️
  const [bio, setBio] = useState('');
  const [locationText, setLocationText] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Structural Processing States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Step 1 Validation Gate
  const handleNextStep = (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password) {
      setError("Please complete all mandatory fields to continue.");
      return;
    }
    setStep(2);
  };

  // Dynamic Array Management for Selected Skills Dropdown
  const handleToggleTask = (task) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter(item => item !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  // Final Form Submit Implementation
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const skillsString = selectedTasks.join(', ');

    // Verification checkpoint against backend validation gate rules
    if (!bio.trim() || !skillsString.trim()) {
      setError("Please write an introductory bio and select at least one task capability.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: fullName, 
          email, 
          password,
          phone_number: phoneNumber,
          bio,
          skills: skillsString,
          location_text: locationText
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Could not register helper profile.');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2200);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      
      {/* Header Area */}
      <div className="sm:mx-auto w-full max-w-md animate-[fadeIn_0.3s_ease-out] text-center">
        <span 
          onClick={() => navigate('/')} 
          className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent cursor-pointer select-none"
        >
          Homehelp Providers
        </span>
        <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tight">
          Earn Money Helping Neighbors
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Looking to post tasks and find help?{' '}
          <button 
            type="button"
            onClick={() => navigate('/register/client')} 
            className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer focus:outline-hidden"
          >
            Create a client profile instead
          </button>
        </p>
      </div>

      {/* Form Content Block */}
      <div className="mt-8 sm:mx-auto w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/60">
          
          {/* Step Indicator Progress Bar */}
          {!success && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Step {step} of 2</span>
                <span className="text-xs font-bold text-slate-400">{step === 1 ? 'Account Setup' : 'Service Specs'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300"
                  style={{ width: `${(step / 2) * 100}%` }}
                />
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-8 space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold rounded-full flex items-center justify-center text-2xl mx-auto shadow-2xs">✓</div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Helper Profile Created!</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Taking you to the login dashboard loop...</p>
              </div>
            </div>
          ) : (
            <div>
              {/* ==========================================
                  STEP 1: ACCOUNT CREDENTIALS
                 ========================================== */}
              {step === 1 && (
                <form className="space-y-5 animate-[fadeIn_0.2s_ease-out]" onSubmit={handleNextStep}>
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="Alex Mercer"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="name@example.co.uk"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="07123 456789"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Create Password</label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-800 flex gap-2 items-start">
                      <span className="text-rose-500 text-sm">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-indigo-600/10 transition-all active:scale-98 cursor-pointer"
                  >
                    Continue to Specifics &rarr;
                  </button>
                </form>
              )}

              {/* ==========================================
                  STEP 2: SERVICE CAPABILITIES
                 ========================================== */}
              {step === 2 && (
                <form className="space-y-5 animate-[fadeIn_0.2s_ease-out]" onSubmit={handleRegister}>
                  <div>
                    <label htmlFor="location" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Service Area / Bristol Neighborhood</label>
                    <input
                      id="location"
                      type="text"
                      disabled={loading}
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="e.g. Clifton, Bedminster, Totterdown"
                    />
                  </div>

                  {/* CUSTOM MULTI-SELECT DROPDOWN BLOCK */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tasks You Can Provide</label>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-left flex justify-between items-center cursor-pointer"
                    >
                      <span className="truncate">
                        {selectedTasks.length === 0 
                          ? "Select capabilities..." 
                          : `${selectedTasks.length} task(s) selected`}
                      </span>
                      <span className="text-slate-400 text-xs transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>

                    {/* Collapsible Dropdown Context Menu */}
                    {dropdownOpen && (
                      <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-0.5 animate-[fadeIn_0.15s_ease-out]">
                        {AVAILABLE_TASKS.map((task, idx) => {
                          const isChecked = selectedTasks.includes(task);
                          return (
                            <div 
                              key={idx}
                              onClick={() => handleToggleTask(task)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                              />
                              <span>{task}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Render Selected Items Container Blocks */}
                    {selectedTasks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedTasks.map((task, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          >
                            {task}
                            <button 
                              type="button" 
                              onClick={() => handleToggleTask(task)}
                              className="text-slate-400 hover:text-slate-600 font-bold ml-0.5 focus:outline-hidden"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Introduction Bio</label>
                    <textarea
                      id="bio"
                      rows="4"
                      required
                      disabled={loading}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all resize-none font-sans"
                      placeholder="Tell customers about your experience, tools, and work standards..."
                    />
                  </div>

                  {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-800 flex gap-2 items-start">
                      <span className="text-rose-500 text-sm">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Step 2 Form Action Layout Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => { setError(null); setStep(1); }}
                      className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:bg-slate-300 disabled:cursor-not-allowed active:scale-98 cursor-pointer"
                    >
                      {loading ? 'Submitting profile...' : 'Register Profile'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Secondary Escape Navigation Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center flex flex-col gap-2">
            <button 
              onClick={() => navigate('/login')} 
              className="text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors"
            >
              Already listed? Access Dashboard
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="text-xs text-slate-400 hover:text-slate-600 font-bold tracking-wide uppercase transition-colors mt-1"
            >
              &larr; Return to home page
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}