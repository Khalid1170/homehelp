import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { user, token } = useAuth();

  // Verify token exist and explicitly assert client/admin authorization access permissions
  const hasAccess = token && (user?.role === 'client' || user?.role === 'admin');

  return hasAccess ? <Outlet /> : <Navigate to="/" replace />;
}