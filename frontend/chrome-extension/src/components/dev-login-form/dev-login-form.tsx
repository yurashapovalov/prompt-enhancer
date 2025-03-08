import React, { useState } from 'react';
import { signIn, signInWithGoogle } from '@services/auth-service';
import './dev-login-form.css';

interface DevLoginFormProps {
  onLoginSuccess: () => void;
}

export const DevLoginForm: React.FC<DevLoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Пожалуйста, введите email и пароль');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      await signIn(email, password);
      console.log('Вход выполнен успешно');
      onLoginSuccess();
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    
    try {
      await signInWithGoogle();
      console.log('Вход через Google выполнен успешно');
      onLoginSuccess();
    } catch (err) {
      console.error('Ошибка входа через Google:', err);
      setError('Не удалось войти через Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="dev-login-form">
      <div className="dev-login-form__title">
        Вход в режиме разработки
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="dev-login-form__input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || googleLoading}
        />
        
        <input
          type="password"
          className="dev-login-form__input"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading || googleLoading}
        />
        
        {error && <div className="dev-login-form__error">{error}</div>}
        
        <button 
          type="submit" 
          className="dev-login-form__button"
          disabled={loading || googleLoading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      
      <div className="dev-login-form__divider">
        <span>ИЛИ</span>
      </div>
      
      <button 
        type="button" 
        className="dev-login-form__google-button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
      >
        <span className="dev-login-form__google-icon"></span>
        {googleLoading ? 'Вход...' : 'Войти через Google'}
      </button>
    </div>
  );
};
