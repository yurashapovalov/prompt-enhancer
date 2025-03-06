import { useState, useEffect } from 'react';
import { isAuthenticated, openAuthPage } from '@services/auth-service';
import { AuthPage } from '@layout/auth-page/auth-page';
import { HomePage } from '@layout/home-page/home-page';
import './App.css';

function App() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsAuth(authenticated);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for authentication update messages from background script
    const handleAuthUpdate = (message: any) => {
      if (message.action === 'auth_updated') {
        checkAuth();
      }
    };

    chrome.runtime.onMessage.addListener(handleAuthUpdate);

    return () => {
      chrome.runtime.onMessage.removeListener(handleAuthUpdate);
    };
  }, []);

  // Handler for login button click - opens authentication page
  const handleLogin = () => {
    openAuthPage();
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isAuth ? (
        <HomePage />
      ) : (
        <AuthPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
