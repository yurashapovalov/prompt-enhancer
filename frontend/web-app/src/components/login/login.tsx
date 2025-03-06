import React, { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const { signIn, signInWithGoogle, error, user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Получаем параметры из URL
  const queryParams = new URLSearchParams(location.search);
  const isFromExtension = queryParams.get('source') === 'extension';
  const extensionId = queryParams.get('extensionId');
  
  // Перенаправление на домашнюю страницу, если пользователь уже авторизован
  useEffect(() => {
    if (user) {
      // Если пользователь вошел и есть токен, отправляем его в расширение
      if (isFromExtension && extensionId && token) {
        console.log('Sending token to extension:', extensionId);
        try {
          // Отправляем сообщение в расширение Chrome
          chrome.runtime.sendMessage(extensionId, {
            action: 'auth_success',
            token: token
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error sending message to extension:', chrome.runtime.lastError);
            } else {
              console.log('Token sent to extension:', response);
            }
            
            // Закрываем вкладку или перенаправляем на домашнюю страницу
            if (window.opener) {
              window.close(); // Закрываем вкладку, если она была открыта из расширения
            } else {
              navigate('/');
            }
          });
        } catch (error) {
          console.error('Failed to send token to extension:', error);
          navigate('/');
        }
      } else {
        // Обычное перенаправление на домашнюю страницу
        navigate('/');
      }
    }
  }, [user, token, navigate, isFromExtension, extensionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await signIn(email, password);
      // Перенаправление будет выполнено через useEffect
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    
    try {
      await signInWithGoogle();
      // Перенаправление будет выполнено через useEffect
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        
        {isFromExtension && (
          <div className="extension-notice">
            Вход для расширения Chrome
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <button 
          type="button" 
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={isGoogleSubmitting}
        >
          <span className="google-icon"></span>
          {isGoogleSubmitting ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
