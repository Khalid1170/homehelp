import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StripeCallback() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying your Stripe account onboarding...');

  useEffect(() => {
    const verifyStripeSetup = async () => {
      try {
        const res = await fetch('http://localhost:5000/worker/verify-stripe', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('Account linked successfully! Synchronizing configuration details...');
          // 800ms delay ensures backend engine finishes committing before redirect
          setTimeout(() => {
            navigate('/worker/dashboard', { 
              replace: true, 
              state: { stripeUpdated: true } 
            });
          }, 800);
        } else {
          setStatus(`Verification failed: ${data.error || 'Please try again.'}`);
        }
      } catch (err) {
        setStatus('Network error syncing account status.');
      }
    };

    if (token) {
      verifyStripeSetup();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-bold text-slate-700">{status}</p>
    </div>
  );
}