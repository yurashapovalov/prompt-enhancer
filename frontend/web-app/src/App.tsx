import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import Login from '@components/login/login';
import ProtectedRoute from '@components/protected-route/protected-route';
import Home from '@components/home/home';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes - require authentication to access */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
        </Route>
        
        {/* Redirect to home page for any unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
