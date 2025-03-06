import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import './protected-route.css';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Display loading indicator while checking authentication status
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }
  
  // If user is not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is authenticated, render the protected content
  return <Outlet />;
};

export default ProtectedRoute;
