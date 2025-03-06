import React from 'react';
import './auth-page.css';
import { Button } from '@components/ui/button/button';

interface AuthPageProps {
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Prompt Enhancer</h1>
      
      <div className="auth-page__status">
        <div className="auth-page__status-icon">!</div>
        <h2 className="auth-page__status-title">Authentication required</h2>
        <p className="auth-page__status-description">
          You need to log in to use the extension.
        </p>
        
        <Button 
          variant="filled" 
          size="large" 
          onClick={onLogin}
          className="auth-page__login-button"
        >
          Log in via web app
        </Button>
      </div>
      
      <div className="auth-page__features">
        <h2 className="auth-page__features-title">Features</h2>
        <ul className="auth-page__features-list">
          <li>Enhance prompts for ChatGPT</li>
          <li>Save prompt templates</li>
          <li>Quick access to frequently used prompts</li>
        </ul>
      </div>
    </div>
  );
};
