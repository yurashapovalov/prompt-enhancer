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
        <h1>Welcome!</h1>
        
        <div className="user-info">
          <p>You are logged in as: <span className="user-email">{user?.email}</span></p>
        </div>
        
        <div className="dashboard-section">
          <h2>Dashboard</h2>
          <p>This is a protected page, accessible only to authenticated users.</p>
          <p>The main functionality of the application can be placed here.</p>
        </div>
        
        <button 
          className="btn-signout" 
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Home;
