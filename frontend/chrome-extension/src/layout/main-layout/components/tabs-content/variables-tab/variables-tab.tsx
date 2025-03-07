import React, { useState, useEffect } from 'react';
import './variables-tab.css';
import { ItemCard } from '@components/shared/item-card/item-card';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import { Button } from '@components/ui/button/button';
import { Variable, variablesApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

export const VariablesTab: React.FC = () => {
  // Состояние для хранения переменных
  const [variables, setVariables] = useState<Variable[]>([]);
  // Состояние для отображения загрузки
  const [loading, setLoading] = useState<boolean>(true);
  // Состояние для отображения ошибки
  const [error, setError] = useState<string | null>(null);
  // Состояние для отображения детальной информации об ошибке
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  // Функция для выбора переменной
  const handleSelectVariable = (variableId: string) => {
    console.log('Выбрана переменная:', variableId);
    // TODO: Реализовать детальный просмотр переменной
  };

  // Загрузка переменных при монтировании компонента
  useEffect(() => {
    const fetchVariables = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
        
        console.log('Получение токена аутентификации...');
        const token = await getCurrentUserToken();
        
        if (token) {
          console.log('Токен получен, загрузка переменных...');
          try {
            const variablesData = await variablesApi.getVariables(token);
            console.log('Переменные загружены:', variablesData);
            setVariables(variablesData);
          } catch (apiError: any) {
            console.error('Ошибка API при загрузке переменных:', apiError);
            setError('Не удалось загрузить переменные');
            setErrorDetails(`Ошибка API: ${apiError.message || JSON.stringify(apiError)}`);
          }
        } else {
          console.error('Не удалось получить токен аутентификации');
          setError('Не удалось получить токен аутентификации');
          setErrorDetails('Токен аутентификации не получен. Возможно, вы не авторизованы.');
        }
      } catch (err: any) {
        console.error('Общая ошибка при загрузке переменных:', err);
        setError('Не удалось загрузить переменные');
        setErrorDetails(`Ошибка: ${err.message || JSON.stringify(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, []);

  // Проверяем, есть ли переменные для отображения
  const hasVariables = variables.length > 0;

  // Для отладки - показываем информацию о состоянии в консоли
  useEffect(() => {
    console.log('VariablesTab state:', { loading, error, errorDetails, variables });
  }, [loading, error, errorDetails, variables]);

  return (
    <div className="variables-tab">
      <div className="variables-tab__header">
        <h1 className="variables-tab__title">Variables</h1>
      </div>
      
      <div className="variables-tab__content">
        {loading ? (
          <div className="variables-tab__loading">
            <p>Загрузка переменных...</p>
          </div>
        ) : error ? (
          <div className="variables-tab__error">
            <p>{error}</p>
            {errorDetails && (
              <div className="variables-tab__error-details">
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
        ) : hasVariables ? (
          <div className="variables-tab__items">
            {variables.map(variable => (
              <ItemCard
                key={variable.id}
                title={variable.variableName}
                color={variable.color}
                actionIcon={menuIconRaw}
                onAction={() => console.log('Action on variable', variable.id)}
                onClick={() => handleSelectVariable(variable.id || '')}
              />
            ))}
          </div>
        ) : (
          <div className="variables-tab__empty-state">
            <p>Нет доступных переменных</p>
            <Button 
              variant="transparent"
              onClick={() => console.log('Create new variable')}
            >
              Создать первую переменную
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
