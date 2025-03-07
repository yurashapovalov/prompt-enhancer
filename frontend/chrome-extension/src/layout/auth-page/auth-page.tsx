import React from 'react';
import './auth-page.css';
import { Button } from '@components/ui/button/button';

interface AuthPageProps {
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  return (
    <div className="auth-page">
      <Button 
        size="large" 
        onClick={onLogin}
        className="auth-page__login-button"
        icon={true}
      >
        Log in via web app
      </Button>
    </div>
  );
};
