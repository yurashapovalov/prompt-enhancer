import { useState, useEffect } from 'react';
import { isAuthenticated, openAuthPage } from '@services/auth-service';
import { MainLayout } from '@layout/main-layout/main-layout';
import { DevLoginForm } from '@layout/dev-login-form/dev-login-form';
import { initializeServices } from '@services/services';
import './App.css';

function App() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize services
  useEffect(() => {
    // Инициализируем сервисы данных при запуске приложения
    initializeServices();
  }, []);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Проверка аутентификации...');
        const authenticated = await isAuthenticated();
        console.log('Статус аутентификации:', authenticated);
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
    // Only in Chrome extension environment
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage && typeof chrome.runtime.onMessage.addListener === 'function') {
      const handleAuthUpdate = (message: any) => {
        if (message.action === 'auth_updated') {
          checkAuth();
        }
      };

      chrome.runtime.onMessage.addListener(handleAuthUpdate);

      return () => {
        if (chrome.runtime && chrome.runtime.onMessage && typeof chrome.runtime.onMessage.removeListener === 'function') {
          chrome.runtime.onMessage.removeListener(handleAuthUpdate);
        }
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="app-container">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if we're in a Chrome extension environment
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;
  
  const handleLoginSuccess = async () => {
    setIsAuth(true);
  };

  return (
    <div className="app-container">
      {isAuth ? (
        <MainLayout />
      ) : (
        <div className="login-container">
          <h2>Prompt Enhancer</h2>
          <p>Пожалуйста, войдите в систему для доступа к приложению</p>
          
          {isChromeExtension ? (
            // In Chrome extension environment, show the button to open auth page
            <button onClick={openAuthPage}>Войти</button>
          ) : (
            // In development mode, show the login form
            <DevLoginForm onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
