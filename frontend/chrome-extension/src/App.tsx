import { useState, useEffect } from 'react';
import { isAuthenticated, openAuthPage } from '@services/auth-service';
import './App.css';

function App() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Проверяем статус аутентификации при загрузке
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

    // Слушаем сообщения об обновлении аутентификации
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

  // Обработчик для кнопки входа
  const handleLogin = () => {
    openAuthPage();
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1>Prompt Enhancer</h1>
      
      {isAuth ? (
        <div className="auth-status authenticated">
          <div className="status-icon">✓</div>
          <p>Вы авторизованы</p>
          <p className="status-description">
            Теперь вы можете использовать все функции расширения.
          </p>
        </div>
      ) : (
        <div className="auth-status not-authenticated">
          <div className="status-icon">!</div>
          <p>Требуется вход</p>
          <p className="status-description">
            Для использования расширения необходимо войти в аккаунт.
          </p>
          <button className="login-button" onClick={handleLogin}>
            Войти через веб-приложение
          </button>
        </div>
      )}
      
      <div className="features">
        <h2>Возможности</h2>
        <ul>
          <li>Улучшение промптов для ChatGPT</li>
          <li>Сохранение шаблонов промптов</li>
          <li>Быстрый доступ к часто используемым промптам</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
