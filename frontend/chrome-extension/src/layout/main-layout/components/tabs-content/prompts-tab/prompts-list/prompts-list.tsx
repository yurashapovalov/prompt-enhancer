import React, { useState, useEffect } from 'react';
import './prompts-list.css';
import { Button } from '@components/ui/button/button';
import { ItemCard } from '@components/shared/item-card/item-card';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import { Prompt, promptsApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

interface PromptsListProps {
  onPromptSelect: (promptId: string) => void;
}

export const PromptsList: React.FC<PromptsListProps> = ({ onPromptSelect }) => {
  // Состояние для хранения промптов
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  // Состояние для отображения загрузки
  const [loading, setLoading] = useState<boolean>(true);
  // Состояние для отображения ошибки
  const [error, setError] = useState<string | null>(null);
  // Состояние для отображения детальной информации об ошибке
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Функция для выбора промпта
  const handleSelectPrompt = (promptId: string) => {
    onPromptSelect(promptId);
  };

  // Загрузка промптов при монтировании компонента
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
        
        console.log('Получение токена аутентификации...');
        const token = await getCurrentUserToken();
        
        if (token) {
          console.log('Токен получен, загрузка промптов...');
          try {
            const promptsData = await promptsApi.getPrompts(token);
            console.log('Промпты загружены:', promptsData);
            setPrompts(promptsData);
          } catch (apiError: any) {
            console.error('Ошибка API при загрузке промптов:', apiError);
            setError('Не удалось загрузить промпты');
            setErrorDetails(`Ошибка API: ${apiError.message || JSON.stringify(apiError)}`);
          }
        } else {
          console.error('Не удалось получить токен аутентификации');
          setError('Не удалось получить токен аутентификации');
          setErrorDetails('Токен аутентификации не получен. Возможно, вы не авторизованы.');
        }
      } catch (err: any) {
        console.error('Общая ошибка при загрузке промптов:', err);
        setError('Не удалось загрузить промпты');
        setErrorDetails(`Ошибка: ${err.message || JSON.stringify(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  // Проверяем, есть ли промпты для отображения
  const hasPrompts = prompts.length > 0;

  // Для отладки - показываем информацию о состоянии в консоли
  useEffect(() => {
    console.log('PromptsList state:', { loading, error, errorDetails, prompts });
  }, [loading, error, errorDetails, prompts]);

  return (
    <div className="prompts-list">
      <div className="prompts-list__header">
        <h1 className="prompts-list__title">My Prompts</h1>
      </div>
      
      <div className="prompts-list__content">
        {loading ? (
          <div className="prompts-list__loading">
            <p>Загрузка промптов...</p>
          </div>
        ) : error ? (
          <div className="prompts-list__error">
            <p>{error}</p>
            {errorDetails && (
              <div className="prompts-list__error-details">
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
        ) : hasPrompts ? (
          <div className="prompts-list__items">
            {prompts.map(prompt => (
              <ItemCard
                key={prompt.id}
                title={prompt.promptName}
                color={prompt.color}
                actionIcon={menuIconRaw}
                onAction={() => console.log('Action on prompt', prompt.id)}
                onClick={() => handleSelectPrompt(prompt.id || '')}
              />
            ))}
          </div>
        ) : (
          <div className="prompts-list__empty-state">
            <p>Нет доступных промптов</p>
            <Button 
              variant="transparent"
              onClick={() => handleSelectPrompt('sample-prompt-id')}
            >
              Создать первый промпт
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
