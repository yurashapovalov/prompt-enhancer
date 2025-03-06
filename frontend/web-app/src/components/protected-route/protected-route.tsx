import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import './protected-route.css';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Показываем индикатор загрузки, пока проверяем статус аутентификации
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Проверка аутентификации...</p>
      </div>
    );
  }
  
  // Если пользователь не авторизован, перенаправляем на страницу логина
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Если пользователь авторизован, отображаем защищенный контент
  return <Outlet />;
};

export default ProtectedRoute;
