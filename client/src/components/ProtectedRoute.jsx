import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { token } = useAuth();

  // If no auth token is saved locally, throw them back out to login view layer
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}