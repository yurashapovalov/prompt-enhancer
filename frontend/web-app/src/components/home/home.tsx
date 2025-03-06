import React from 'react';
import { useAuth } from '@contexts/AuthContext';
import './home.css';

const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Добро пожаловать!</h1>
        
        <div className="user-info">
          <p>Вы вошли как: <span className="user-email">{user?.email}</span></p>
        </div>
        
        <div className="dashboard-section">
          <h2>Панель управления</h2>
          <p>Это защищенная страница, доступная только авторизованным пользователям.</p>
          <p>Здесь может быть размещен основной функционал приложения.</p>
        </div>
        
        <button 
          className="btn-signout" 
          onClick={handleSignOut}
        >
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Home;
