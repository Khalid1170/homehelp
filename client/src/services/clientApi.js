const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const clientApi = {
  // --- FIXED: Added missing '/api' prefix to match backend routing ---
  getDashboard: async () => {
    const res = await fetch(`${API_BASE_URL}/api/client/dashboard`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  // --- NEW: Added missing profile update endpoint for your modal ---
  updateProfile: async (profileData) => {
    const res = await fetch(`${API_BASE_URL}/api/client/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update account profile parameters');
    }
    return res.json();
  },

  // Create a brand new job deployment draft
  createJob: async (jobData) => {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create job');
    }
    return res.json();
  },

  // Cancel/Delete an open or draft posting listing
  deleteJob: async (jobId) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel job');
    }
    return res.json();
  },

  // Kick off Stripe Checkout gateway session
  initializePayment: async (jobId) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/pay`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Stripe Gateway connection failed');
    return res.json(); // Returns { checkout_url: "https://checkout.stripe.com/..." }
  },

  // Onboard candidate applicant, lock posting, auto-decline competing alternatives
  approveWorker: async (appId) => {
    const res = await fetch(`${API_BASE_URL}/applications/${appId}/approve`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to onboard worker');
    }
    return res.json();
  },

  // Decline individual applicant submission profile card
  declineWorker: async (appId) => {
    const res = await fetch(`${API_BASE_URL}/applications/${appId}/decline`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to decline worker');
    return res.json();
  },

  // Confirm milestone fulfillment delivery completion
  confirmCompletion: async (jobId) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/confirm`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Fulfillment confirmation failed');
    return res.json();
  },

  // Submit client evaluation feedback
  submitReview: async (jobId, reviewData) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reviewData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit evaluation review');
    }
    return res.json();
  }
};