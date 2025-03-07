import React, { useState, useEffect } from 'react';
import './prompt-detail.css';
import { Button } from '@components/ui/button/button';
import { Prompt, promptsApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

interface PromptDetailProps {
  promptId: string;
  onBack: () => void;
}

export const PromptDetail: React.FC<PromptDetailProps> = ({ promptId, onBack }) => {
  // Состояние для хранения данных промпта
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  // Состояние для отображения загрузки
  const [loading, setLoading] = useState<boolean>(true);
  // Состояние для отображения ошибки
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных промпта при монтировании компонента
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setLoading(true);
        const token = await getCurrentUserToken();
        
        if (token) {
          // Если это тестовый промпт, создаем заглушку
          if (promptId === 'sample-prompt-id') {
            setPrompt({
              promptName: 'Тестовый промпт',
              promptDescription: 'Это тестовый промпт для демонстрации',
              promptText: 'Текст тестового промпта. Здесь будет содержимое промпта.',
              color: 'var(--color-prompt-tile-emerald)'
            });
          } else {
            // Иначе загружаем данные с сервера
            const promptData = await promptsApi.getPrompt(promptId, token);
            setPrompt(promptData);
          }
        } else {
          setError('Не удалось получить токен аутентификации');
        }
      } catch (err) {
        console.error('Ошибка при загрузке промпта:', err);
        setError('Не удалось загрузить промпт');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [promptId]);

  return (
    <div className="prompt-detail">
      <div className="prompt-detail__header">
        <Button 
          variant="transparent"
          onClick={onBack}
        >
          ← Back
        </Button>
        <h1 className="prompt-detail__title">Prompt Details</h1>
      </div>
      
      <div className="prompt-detail__content">
        {loading ? (
          <div className="prompt-detail__loading">
            <p>Загрузка промпта...</p>
          </div>
        ) : error ? (
          <div className="prompt-detail__error">
            <p>{error}</p>
            <Button 
              variant="transparent"
              onClick={() => window.location.reload()}
            >
              Попробовать снова
            </Button>
          </div>
        ) : prompt ? (
          <div className="prompt-detail__info">
            <div className="prompt-detail__header-info">
              <div 
                className="prompt-detail__color" 
                style={{ backgroundColor: prompt.color }}
              ></div>
              <h2 className="prompt-detail__name">{prompt.promptName}</h2>
            </div>
            
            <div className="prompt-detail__section">
              <h3 className="prompt-detail__section-title">Описание</h3>
              <p className="prompt-detail__description">{prompt.promptDescription}</p>
            </div>
            
            <div className="prompt-detail__section">
              <h3 className="prompt-detail__section-title">Текст промпта</h3>
              <div className="prompt-detail__text-box">
                {prompt.promptText}
              </div>
            </div>
          </div>
        ) : (
          <div className="prompt-detail__not-found">
            <p>Промпт не найден</p>
            <Button 
              variant="transparent"
              onClick={onBack}
            >
              Вернуться к списку
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
