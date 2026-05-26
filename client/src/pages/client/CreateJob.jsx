import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientApi } from '../../services/clientApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function CreateJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keeping your exact SQLAlchemy backend database keys, but using a friendly default category
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: 'House Cleaning', 
    location_text: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      ...formData,
      budget: parseFloat(formData.budget)
    };

    if (isNaN(payload.budget) || payload.budget <= 0) {
      setError('Please enter a valid pay rate or budget amount greater than 0.');
      setLoading(false);
      return;
    }

    try {
      await clientApi.createJob(payload);
      // Fixed: Seamlessly returns to your actual client dashboard route layout
      navigate('/client/dashboard'); 
    } catch (err) {
      setError(err.message || 'Something went wrong while posting your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        
        {/* Back Navigation Trigger */}
        <button 
          onClick={() => navigate('/client/dashboard')}
          className="group mb-6 text-slate-500 hover:text-slate-900 font-bold text-sm inline-flex items-center gap-2 transition-colors duration-150"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span> Back to Dashboard
        </button>

        {/* Core Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden relative">
          
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-linear-to-r from-blue-600 via-indigo-600 to-indigo-700" />

          <div className="p-6 md:p-10">
            <div className="border-b border-slate-100 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Post a New Help Request</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Fill out the details below to look for local, trusted home helpers.</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-semibold leading-relaxed animate-fade-in">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pt-6">
              
              {/* Job Title */}
              <div>
                <label htmlFor="title" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-0.5">
                  What do you need help with?
                </label>
                <input
                  required
                  type="text"
                  id="title"
                  name="title"
                  placeholder="e.g., Deep clean 3-bedroom house or Weekly lawn mowing and weeding"
                  className="w-full border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl p-3.5 text-sm transition-all focus:outline-hidden bg-slate-50/30 text-slate-900 font-medium placeholder-slate-400"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              {/* Responsive Inputs Grid Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Category Selector */}
                <div>
                  <label htmlFor="category" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-0.5">
                    Service Type
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="w-full border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl p-3.5 text-sm transition-all focus:outline-hidden bg-white text-slate-900 font-medium cursor-pointer"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="House Cleaning">House Cleaning & Ironing</option>
                    <option value="Gardening & Outdoor">Gardening & Outdoor Maintenance</option>
                    <option value="Child Care">Child Care & Nannying</option>
                    <option value="Elderly Companionship">Elderly Care & Companionship</option>
                    <option value="Pet Sitting">Pet Sitting & Dog Walking</option>
                    <option value="Handyman & Repairs">Handyman & Home Repairs</option>
                    <option value="General Home Help">General Home Help</option>
                  </select>
                </div>

                {/* Pay/Budget Field */}
                <div>
                  <label htmlFor="budget" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-0.5">
                    Estimated Budget / Total Pay (GBP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">£</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      id="budget"
                      name="budget"
                      placeholder="45.00"
                      className="w-full border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl p-3.5 pl-8 text-sm transition-all focus:outline-hidden bg-slate-50/30 text-slate-900 font-black placeholder-slate-400"
                      value={formData.budget}
                      onChange={handleChange}
                    />
                  </div>
                </div>

              </div>

              {/* Location */}
              <div>
                <label htmlFor="location_text" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-0.5">
                  Your Location
                </label>
                <input
                  type="text"
                  id="location_text"
                  name="location_text"
                  placeholder="e.g., Clifton, Bristol"
                  className="w-full border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl p-3.5 text-sm transition-all focus:outline-hidden bg-slate-50/30 text-slate-900 font-medium placeholder-slate-400"
                  value={formData.location_text}
                  onChange={handleChange}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-0.5">
                  Task Details & Requirements
                </label>
                <textarea
                  required
                  id="description"
                  name="description"
                  rows="6"
                  placeholder="Please describe exactly what needs doing, including specific days, preferred times, any special equipment needed, or requirements like 'must love pets'..."
                  className="w-full border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl p-3.5 text-sm transition-all focus:outline-hidden bg-slate-50/30 text-slate-900 font-medium placeholder-slate-400 leading-relaxed resize-none"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => navigate('/client/dashboard')}
                  className="w-full sm:flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-4 rounded-xl transition-all duration-150 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-xs py-4 rounded-xl transition-all duration-200 shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20 active:scale-98 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-t-white border-white/30 rounded-full animate-spin" />
                      Posting Request...
                    </>
                  ) : (
                    'Post Help Request'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}