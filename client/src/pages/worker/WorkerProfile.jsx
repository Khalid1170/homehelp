import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { CreditCard, Wallet, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

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

export default function WorkerProfile() {
  const navigate = useNavigate();
  
  // App states
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Profile data states
  const [workerName, setWorkerName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [locationText, setLocationText] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Stripe Integration states
  const [stripeOnboarded, setStripeOnboarded] = useState(false);
  const [stripeId, setStripeId] = useState("");
  const [savingStripe, setSavingStripe] = useState(false);

  // Fetch initial worker profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/worker/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch profile details.');
        }

        // Populating state values from backend response
        setWorkerName(data.name || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phone_number || '');
        setLocationText(data.location_text || '');
        setBio(data.bio || '');
        
        // Setting Stripe details received from backend API updates
        setStripeOnboarded(!!data.stripe_onboarding_complete || !!data.stripe_account_id);
        setStripeId(data.stripe_account_id || "");

        // Convert comma-separated string from backend into a clean array
        if (data.skills) {
          const skillsArray = data.skills.split(',').map(s => s.trim()).filter(Boolean);
          setSelectedTasks(skillsArray);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle Stripe Account Creation / Redirection Link
  const handleConnectStripe = async (e) => {
    e.preventDefault();
    if (savingStripe) return;
    setSavingStripe(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/worker/connect-stripe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect with Stripe.');

      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      } else {
        throw new Error('Stripe setup link was not found.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStripe(false);
    }
  };

  // Handle addition/removal of skills
  const handleToggleTask = (task) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter(item => item !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  // Submit profile edits to backend
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccessMessage('');

    const skillsString = selectedTasks.join(', ');

    if (!phoneNumber.trim() || !bio.trim() || !skillsString.trim()) {
      setError("Phone number, skills, and bio cannot be left completely empty.");
      setUpdating(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/worker/profile/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          location_text: locationText,
          skills: skillsString,
          bio: bio
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      setSuccessMessage('Profile details updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-500">Loading your profile hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans antialiased text-slate-800 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Full width container view fluid matching updated specs */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 space-y-8">
          
          {/* Navigation Link Area */}
          <div className="flex justify-start">
            <button 
              onClick={() => navigate('/worker/dashboard')}
              className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 tracking-wider uppercase transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT PROFILE HIGHLIGHT BANNER PANEL */}
            <section className="lg:col-span-1 bg-white shadow-xs border border-slate-200/70 rounded-3xl overflow-hidden sticky top-6">
              <div className="h-24 bg-gradient-to-br from-indigo-600 to-violet-700 relative" />
              <div className="px-6 pb-6 text-center -mt-10 relative space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border-4 border-white shadow-md mx-auto flex items-center justify-center text-white text-xl font-black">
                  {workerName ? workerName.charAt(0) : 'W'}
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">{workerName}</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{email}</p>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs active:scale-98 cursor-pointer"
                  >
                    Edit Profile Settings
                  </button>
                ) : (
                  <div className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] font-semibold text-indigo-700">
                    Currently Editing Profile Data
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT SIDE MAIN SETTINGS WORKPLACE */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Feedback messages */}
              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex gap-2 items-center animate-[fadeIn_0.2s_ease-out]">
                  <CheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-800 flex gap-2 items-start animate-[fadeIn_0.2s_ease-out]">
                  <AlertTriangle className="text-rose-500 w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-white shadow-xs border border-slate-200/70 rounded-3xl p-6 sm:p-8">
                
                {/* VIEW MODE LAYOUT HOOKS */}
                {!isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Contact Phone Number</h3>
                        <p className="text-sm font-bold text-slate-800">{phoneNumber || 'No verified phone number string saved'}</p>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Service Neighborhood</h3>
                        <p className="text-sm font-bold text-slate-800">{locationText || 'Global Platform Direct'}</p>
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">My Active Capabilities</h3>
                      {selectedTasks.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No custom capabilities selected from layout menu.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTasks.map((task, idx) => (
                            <span 
                              key={idx} 
                              className="bg-indigo-50 border border-indigo-100/60 text-indigo-700 text-xs font-bold px-3 py-1 rounded-xl"
                            >
                              {task}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Introduction Bio Profile Text</h3>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                        {bio || "You haven't written a biography yet. Click edit profile to add details about your service!"}
                      </p>
                    </div>
                  </div>
                ) : (
                  
                  /* EDIT MODE INPUT FORM LAYOUT */
                  <form onSubmit={handleSaveChanges} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-phone" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                        <input
                          id="edit-phone"
                          type="tel"
                          disabled={updating}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                          placeholder="07123 456789"
                        />
                      </div>

                      <div>
                        <label htmlFor="edit-location" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Service Neighborhood</label>
                        <input
                          id="edit-location"
                          type="text"
                          disabled={updating}
                          value={locationText}
                          onChange={(e) => setLocationText(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                          placeholder="e.g. Clifton, Bedminster"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Tasks You Can Provide</label>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-left flex justify-between items-center cursor-pointer select-none"
                      >
                        <span className="truncate">
                          {selectedTasks.length === 0 
                            ? "Select capabilities..." 
                            : `${selectedTasks.length} task(s) selected`}
                        </span>
                        <span className="text-slate-400 text-xs transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                      </button>

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

                      {selectedTasks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedTasks.map((task, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg animate-[fadeIn_0.1s_ease-out]"
                            >
                              {task}
                              <button 
                                type="button" 
                                onClick={() => handleToggleTask(task)}
                                className="text-slate-400 hover:text-slate-600 font-bold ml-0.5 focus:outline-hidden cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="edit-bio" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Introduction Bio</label>
                      <textarea
                        id="edit-bio"
                        rows="5"
                        required
                        disabled={updating}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all resize-none font-sans"
                        placeholder="Describe your skillset, experience, tools..."
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => { setError(null); setIsEditing(false); }}
                        className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updating}
                        className="w-2/3 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                      >
                        {updating ? 'Saving Changes...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Bank Payout Setup */}
              <section className="bg-white border border-slate-200/70 rounded-3xl shadow-xs overflow-hidden transition-all">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Bank Payout Setup</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Manage and check your platform payment configuration link.</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                    stripeOnboarded ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'
                  }`}>
                    {stripeOnboarded ? 'Stripe Ready' : 'Setup Needed'}
                  </span>
                </div>

                <div className="p-6 sm:p-8 text-center">
                  {stripeOnboarded ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-slate-50/60 border border-slate-100 p-4 rounded-2xl max-w-xl mx-auto">
                      <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="text-sm text-slate-600 font-bold tracking-tight">
                        Stripe Merchant Account Identity Token:{' '}
                        <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-indigo-600 text-xs">
                          {stripeId || "Active Linked Connection"}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto space-y-4">
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        We use Stripe to safely and directly transfer your earnings to your bank account. Set it up below to start receiving payouts automatically.
                      </p>
                      <button
                        onClick={handleConnectStripe}
                        disabled={savingStripe}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mx-auto shadow-xs hover:shadow-md hover:shadow-blue-600/15 active:scale-98 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        {savingStripe ? 'Connecting Payout Registry...' : 'Set Up Payouts'}
                      </button>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-200 mt-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs font-semibold tracking-tight">
          <p>© {new Date().getFullYear()} FlyBoy Clothing - TagMyCar Ecosystem. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#terms" className="hover:text-slate-600 transition-colors">Marketplace Terms</a>
            <a href="#privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#support" className="hover:text-slate-600 transition-colors">Support Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}