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
  
  // Get parameters from URL query string
  const queryParams = new URLSearchParams(location.search);
  const isFromExtension = queryParams.get('source') === 'extension';
  const extensionId = queryParams.get('extensionId');
  
  // Redirect to home page if user is already authenticated
  useEffect(() => {
    if (user) {
      // If user is logged in and has a token, send it to the extension
      if (isFromExtension && extensionId && token) {
        console.log('Sending token to extension:', extensionId);
        try {
          // Send message to Chrome extension
          chrome.runtime.sendMessage(extensionId, {
            action: 'auth_success',
            token: token
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error sending message to extension:', chrome.runtime.lastError);
            } else {
              console.log('Token sent to extension:', response);
            }
            
            // Close tab or redirect to home page
            if (window.opener) {
              window.close(); // Close tab if it was opened from the extension
            } else {
              navigate('/');
            }
          });
        } catch (error) {
          console.error('Failed to send token to extension:', error);
          navigate('/');
        }
      } else {
        // Standard redirect to home page
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
      // Redirection will be handled by the useEffect hook
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
      // Redirection will be handled by the useEffect hook
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
            Login for Chrome Extension
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
