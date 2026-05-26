import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 🔓 Public Page Imports
import Home from '../pages/public/Home';
import Login from '../pages/auth/Login';
import ClientRegister from '../pages/auth/ClientRegister'; // 👈 Specialized Client Registration
import WorkerRegister from '../pages/auth/WorkerRegister'; // 👈 Specialized Worker Registration
import BrowseJobs from '../pages/public/BrowseJobs';
import JobFullDetails from '../pages/public/JobFullDetails';
import WorkersDirectory from '../pages/public/WorkersDirectory'; 

// 💼 Client Page Imports
import ClientDashboard from '../pages/client/ClientDashboard';
import CreateJob from '../pages/client/CreateJob';

// 🛠️ Worker Page Imports
import WorkerDashboard from '../pages/worker/WorkerDashboard';
import WorkerProfile from '../pages/worker/WorkerProfile'; // 👈 NEW: Profile View & Edit Page Component
import JobPitchForm from '../pages/worker/JobPitchForm';
import StripeCallback from '../pages/worker/StripeCallback'; 

// 📊 Admin Page Imports
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPayoutDashboard from '../pages/admin/AdminPayoutDashboard';


// 🛡️ Protected Route Gatekeeper
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    // No active user session? Kick to authentication interface
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch? Halt access
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* 💥 Split Registration Pathing */}
      <Route path="/register/client" element={<ClientRegister />} />
      <Route path="/register/worker" element={<WorkerRegister />} />
      
      {/* Catch-all legacy registration redirect to prevent broken links */}
      <Route path="/register" element={<Navigate to="/register/client" replace />} />
      
      <Route path="/browse-jobs" element={<BrowseJobs />} />
      
      {/* 🌐 Publicly Accessible Worker Registry Directory */}
      <Route path="/workers" element={<WorkersDirectory />} />
      
      {/* 👁️ Publicly Accessible Job Details Profile View */}
      <Route path="/jobs/:id" element={<JobFullDetails />} />

      {/* Client Sub-Suite */}
      <Route path="/client/dashboard" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/client/create-job" element={
        <ProtectedRoute allowedRoles={['client']}>
          <CreateJob />
        </ProtectedRoute>
      } />

      {/* Worker Sub-Suite */}
      <Route path="/worker/dashboard" element={
        <ProtectedRoute allowedRoles={['worker']}>
          <WorkerDashboard />
        </ProtectedRoute>
      } />
      
      {/* 👤 NEW: Restricted Worker Settings Profile Route */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['worker']}>
          <WorkerProfile />
        </ProtectedRoute>
      } />
      
      {/* 📝 Restricted Worker Proposal Submission Route */}
      <Route path="/jobs/:id/pitch" element={
        <ProtectedRoute allowedRoles={['worker']}>
          <JobPitchForm />
        </ProtectedRoute>
      } />

      {/* 💳 Onboarding Handshake Landings for Express Connect Accounts */}
      <Route path="/stripe-callback" element={
        <ProtectedRoute allowedRoles={['worker']}>
          <StripeCallback />
        </ProtectedRoute>
      } />

      {/* Admin Suite */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* 💰 Integrated Escrow Balance & Payout Management Panel */}
      <Route path="/admin/payouts" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPayoutDashboard />
        </ProtectedRoute>
      } />

      {/* Fallback Boundaries */}
      <Route path="/unauthorized" element={
        <div className="p-8 text-center text-red-600 font-bold">⚠️ Access Denied: Insufficient Permissions</div>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}