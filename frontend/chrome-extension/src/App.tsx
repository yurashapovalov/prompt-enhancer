import { useState, useEffect } from 'react';
import { isAuthenticated, openAuthPage } from '@services/auth-service';
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
      <h1>Prompt Enhancer</h1>
      
      {isAuth ? (
        <div className="auth-status authenticated">
          <div className="status-icon">✓</div>
          <p>You are authenticated</p>
          <p className="status-description">
            You can now use all features of the extension.
          </p>
        </div>
      ) : (
        <div className="auth-status not-authenticated">
          <div className="status-icon">!</div>
          <p>Authentication required</p>
          <p className="status-description">
            You need to log in to use the extension.
          </p>
          <button className="login-button" onClick={handleLogin}>
            Log in via web app
          </button>
        </div>
      )}
      
      <div className="features">
        <h2>Features</h2>
        <ul>
          <li>Enhance prompts for ChatGPT</li>
          <li>Save prompt templates</li>
          <li>Quick access to frequently used prompts</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
