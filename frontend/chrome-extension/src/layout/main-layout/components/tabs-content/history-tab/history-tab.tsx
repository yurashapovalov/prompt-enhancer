import React, { useState, useEffect } from 'react';
import './history-tab.css';
import { ItemCard } from '@components/shared/item-card/item-card';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import { Button } from '@components/ui/button/button';
import { HistoryEntry, historyApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

export const HistoryTab: React.FC = () => {
  // Состояние для хранения истории
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Состояние для отображения загрузки
  const [loading, setLoading] = useState<boolean>(true);
  // Состояние для отображения ошибки
  const [error, setError] = useState<string | null>(null);
  // Состояние для отображения детальной информации об ошибке
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  // Функция для выбора записи истории
  const handleSelectEntry = (entryId: string) => {
    console.log('Выбрана запись истории:', entryId);
    // TODO: Реализовать детальный просмотр записи истории
  };

  // Функция для форматирования даты
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Неизвестная дата';
    
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Загрузка истории при монтировании компонента
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
        
        console.log('Получение токена аутентификации...');
        const token = await getCurrentUserToken();
        
        if (token) {
          console.log('Токен получен, загрузка истории...');
          try {
            const historyData = await historyApi.getHistory(token);
            console.log('История загружена:', historyData);
            setHistory(historyData);
          } catch (apiError: any) {
            console.error('Ошибка API при загрузке истории:', apiError);
            setError('Не удалось загрузить историю');
            setErrorDetails(`Ошибка API: ${apiError.message || JSON.stringify(apiError)}`);
          }
        } else {
          console.error('Не удалось получить токен аутентификации');
          setError('Не удалось получить токен аутентификации');
          setErrorDetails('Токен аутентификации не получен. Возможно, вы не авторизованы.');
        }
      } catch (err: any) {
        console.error('Общая ошибка при загрузке истории:', err);
        setError('Не удалось загрузить историю');
        setErrorDetails(`Ошибка: ${err.message || JSON.stringify(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Проверяем, есть ли записи истории для отображения
  const hasHistory = history.length > 0;

  // Для отладки - показываем информацию о состоянии в консоли
  useEffect(() => {
    console.log('HistoryTab state:', { loading, error, errorDetails, history });
  }, [loading, error, errorDetails, history]);

  // Функция для очистки всей истории
  const handleClearHistory = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить всю историю?')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = await getCurrentUserToken();
      
      if (token) {
        await historyApi.clearHistory(token);
        setHistory([]);
      } else {
        setError('Не удалось получить токен аутентификации');
      }
    } catch (err: any) {
      console.error('Ошибка при очистке истории:', err);
      setError('Не удалось очистить историю');
      setErrorDetails(`Ошибка: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-tab">
      <div className="history-tab__header">
        <h1 className="history-tab__title">History</h1>
        {hasHistory && (
          <Button 
            variant="transparent"
            onClick={handleClearHistory}
          >
            Очистить историю
          </Button>
        )}
      </div>
      
      <div className="history-tab__content">
        {loading ? (
          <div className="history-tab__loading">
            <p>Загрузка истории...</p>
          </div>
        ) : error ? (
          <div className="history-tab__error">
            <p>{error}</p>
            {errorDetails && (
              <div className="history-tab__error-details">
                <p><small>{errorDetails}</small></p>
              </div>
            )}
            <Button 
              variant="transparent"
              onClick={() => window.location.reload()}
            >
              Попробовать снова
            </Button>
          </div>
        ) : hasHistory ? (
          <div className="history-tab__items">
            {history.map(entry => (
              <ItemCard
                key={entry.id}
                title={`Запрос от ${formatDate(entry.timestamp)}`}
                color="var(--color-prompt-tile-silver)"
                actionIcon={menuIconRaw}
                onAction={() => console.log('Action on history item', entry.id)}
                onClick={() => handleSelectEntry(entry.id || '')}
              />
            ))}
          </div>
        ) : (
          <div className="history-tab__empty-state">
            <p>История пуста</p>
            <p>Здесь будут отображаться ваши запросы на улучшение промптов</p>
          </div>
        )}
      </div>
    </div>
  );
};
