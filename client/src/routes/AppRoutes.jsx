import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 🔓 Public Page Imports
import Home from '../pages/public/Home';
import Login from '../pages/auth/Login';
import ClientRegister from '../pages/auth/ClientRegister'; 
import WorkerRegister from '../pages/auth/WorkerRegister'; 
import BrowseJobs from '../pages/public/BrowseJobs';
import JobFullDetails from '../pages/public/JobFullDetails';
import WorkersDirectory from '../pages/public/WorkersDirectory'; 

// 💬 Shared Page Imports
import ChatsPage from '../components/ChatsPage'; // 👈 NEW: Centralized Live Messaging Inbox

// 💼 Client Page Imports
import ClientDashboard from '../pages/client/ClientDashboard';
import CreateJob from '../pages/client/CreateJob';

// 🛠️ Worker Page Imports
import WorkerDashboard from '../pages/worker/WorkerDashboard';
import WorkerProfile from '../pages/worker/WorkerProfile'; 
import JobPitchForm from '../pages/worker/JobPitchForm';
import StripeCallback from '../pages/worker/StripeCallback'; 

// 📊 Admin Page Imports
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPayoutDashboard from '../pages/admin/AdminPayoutDashboard';


// 🛡️ Protected Route Gatekeeper
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
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
      
      {/* Split Registration Pathing */}
      <Route path="/register/client" element={<ClientRegister />} />
      <Route path="/register/worker" element={<WorkerRegister />} />
      
      {/* Catch-all legacy registration redirect */}
      <Route path="/register" element={<Navigate to="/register/client" replace />} />
      
      <Route path="/browse-jobs" element={<BrowseJobs />} />
      <Route path="/workers" element={<WorkersDirectory />} />
      <Route path="/jobs/:id" element={<JobFullDetails />} />

      {/* 💬 Shared Messaging Infrastructure Suite */}
      <Route path="/chats" element={
        <ProtectedRoute allowedRoles={['client', 'worker']}> {/* 👈 Accessible by both dashboards */}
          <ChatsPage />
        </ProtectedRoute>
      } />

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
      
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['worker']}>
          <WorkerProfile />
        </ProtectedRoute>
      } />
      
      <Route path="/jobs/:id/pitch" element={
        <ProtectedRoute allowedRoles={['worker']}>
          <JobPitchForm />
        </ProtectedRoute>
      } />

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