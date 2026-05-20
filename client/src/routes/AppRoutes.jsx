import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 🔓 Public Page Imports
import Home from '../pages/public/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import BrowseJobs from '../pages/public/BrowseJobs';
import JobFullDetails from '../pages/public/JobFullDetails'; // 👈 Added Detail Page Import

// 💼 Client Page Imports
import ClientDashboard from '../pages/client/ClientDashboard';
import CreateJob from '../pages/client/CreateJob';

// 🛠️ Worker Page Imports
import WorkerDashboard from '../pages/worker/WorkerDashboard';
import JobPitchForm from '../pages/worker/JobPitchForm'; // 👈 Added Worker Pitch Import

// 📊 Admin Page Imports
import AdminDashboard from '../pages/admin/AdminDashboard';

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
      <Route path="/register" element={<Register />} />
      <Route path="/browse-jobs" element={<BrowseJobs />} />
      
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
      
      {/* 📝 Restricted Worker Proposal Submission Route */}
      <Route path="/jobs/:id/pitch" element={
        <ProtectedRoute allowedRoles={['worker']}>
          <JobPitchForm />
        </ProtectedRoute>
      } />

      {/* Admin Suite */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
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