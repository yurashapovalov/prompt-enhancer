import { DataService, ApiClient } from './data-service';
import { Prompt, HistoryEntry, promptsApi, historyApi } from './api-service';

// Создаем API клиент для промптов
const promptsApiClient: ApiClient<Prompt> = {
  getAll: (token) => promptsApi.getPrompts(token),
  create: (prompt, token) => promptsApi.createPrompt(prompt, token),
  update: (id, prompt, token) => promptsApi.updatePrompt(id, prompt, token),
  delete: (id, token) => promptsApi.deletePrompt(id, token)
};

// Создаем API клиент для истории
const historyApiClient: ApiClient<HistoryEntry> = {
  getAll: (token) => historyApi.getHistory(token),
  create: (entry, token) => historyApi.addHistoryEntry(entry, token),
  // История не обновляется, но нам нужна реализация для интерфейса
  update: (id, entry, token) => Promise.resolve(entry),
  delete: (id, token) => historyApi.deleteHistoryEntry(id, token)
};

// Создаем сервисы для каждого типа данных
export const promptsService = new DataService<Prompt>('local_prompts', promptsApiClient);
export const historyService = new DataService<HistoryEntry>('local_history', historyApiClient);

// Функция для инициализации всех сервисов
export const initializeServices = (): void => {
  // Загружаем данные с сервера в фоне с небольшой задержкой,
  // чтобы не блокировать рендеринг интерфейса
  setTimeout(() => {
    promptsService.loadFromServer();
    historyService.loadFromServer();
  }, 100);
};

// Функция для очистки всех данных (например, при выходе из аккаунта)
export const clearAllData = async (): Promise<void> => {
  // Очищаем локальное хранилище
  localStorage.removeItem('local_prompts');
  localStorage.removeItem('local_history');
  
  // Если мы в расширении Chrome, очищаем chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.runtime) {
    await new Promise<void>((resolve) => {
      chrome.storage.local.remove(['local_prompts', 'local_history'], () => {
        resolve();
      });
    });
  }
};
