import { api } from '../../../shared/firebase-config';

// Типы данных
export interface Prompt {
  id?: string;
  promptName: string;
  promptDescription: string;
  promptText: string;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Variable {
  id?: string;
  variableName: string;
  variableValue: string;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HistoryEntry {
  id?: string;
  originalPrompt: string;
  enhancedPrompt: string;
  timestamp?: Date;
}

// Интерфейсы для ответов API
interface PromptListResponse {
  prompts: Prompt[];
}

interface VariableListResponse {
  variables: Variable[];
}

interface HistoryListResponse {
  history: HistoryEntry[];
}

interface EnhancePromptResponse {
  enhancedText: string;
}

// Вспомогательная функция для обработки ошибок
const handleApiError = (error: any, endpoint: string) => {
  console.error(`API Error (${endpoint}):`, error);
  
  // Создаем более информативное сообщение об ошибке
  let errorMessage = `Ошибка при обращении к ${endpoint}`;
  
  if (error.message) {
    errorMessage += `: ${error.message}`;
  }
  
  // Если есть дополнительная информация об ошибке
  if (error.response) {
    try {
      const responseData = error.response.data;
      errorMessage += ` (${error.response.status}: ${JSON.stringify(responseData)})`;
    } catch (e) {
      errorMessage += ` (${error.response.status})`;
    }
  }
  
  // Создаем новый объект ошибки с более подробной информацией
  const enhancedError = new Error(errorMessage);
  enhancedError.name = 'ApiError';
  // Не используем свойство cause, так как оно доступно только в ES2022+
  
  throw enhancedError;
};

// API для промптов
export const promptsApi = {
  // Получить все промпты пользователя
  getPrompts: async (token: string): Promise<Prompt[]> => {
    try {
      console.log('API: Запрос промптов...');
      const response = await api.fetchWithAuth<PromptListResponse>('/api/prompts', { method: 'GET' }, token);
      console.log('API: Получен ответ:', response);
      return response.prompts;
    } catch (error) {
      return handleApiError(error, '/api/prompts');
    }
  },
  
  // Получить конкретный промпт
  getPrompt: async (id: string, token: string): Promise<Prompt> => {
    try {
      return await api.fetchWithAuth(`/api/prompts/${id}`, { method: 'GET' }, token);
    } catch (error) {
      return handleApiError(error, `/api/prompts/${id}`);
    }
  },
  
  // Создать новый промпт
  createPrompt: async (prompt: Prompt, token: string): Promise<Prompt> => {
    try {
      return await api.fetchWithAuth('/api/prompts', {
        method: 'POST',
        body: JSON.stringify(prompt)
      }, token);
    } catch (error) {
      return handleApiError(error, '/api/prompts (POST)');
    }
  },
  
  // Обновить существующий промпт
  updatePrompt: async (id: string, prompt: Prompt, token: string): Promise<Prompt> => {
    try {
      return await api.fetchWithAuth(`/api/prompts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(prompt)
      }, token);
    } catch (error) {
      return handleApiError(error, `/api/prompts/${id} (PUT)`);
    }
  },
  
  // Удалить промпт
  deletePrompt: async (id: string, token: string): Promise<void> => {
    try {
      await api.fetchWithAuth(`/api/prompts/${id}`, { method: 'DELETE' }, token);
    } catch (error) {
      handleApiError(error, `/api/prompts/${id} (DELETE)`);
    }
  }
};

// API для переменных
export const variablesApi = {
  // Получить все переменные пользователя
  getVariables: async (token: string): Promise<Variable[]> => {
    try {
      const response = await api.fetchWithAuth<VariableListResponse>('/api/variables', { method: 'GET' }, token);
      return response.variables;
    } catch (error) {
      return handleApiError(error, '/api/variables');
    }
  },
  
  // Получить конкретную переменную
  getVariable: async (id: string, token: string): Promise<Variable> => {
    try {
      return await api.fetchWithAuth(`/api/variables/${id}`, { method: 'GET' }, token);
    } catch (error) {
      return handleApiError(error, `/api/variables/${id}`);
    }
  },
  
  // Создать новую переменную
  createVariable: async (variable: Variable, token: string): Promise<Variable> => {
    try {
      return await api.fetchWithAuth('/api/variables', {
        method: 'POST',
        body: JSON.stringify(variable)
      }, token);
    } catch (error) {
      return handleApiError(error, '/api/variables (POST)');
    }
  },
  
  // Обновить существующую переменную
  updateVariable: async (id: string, variable: Variable, token: string): Promise<Variable> => {
    try {
      return await api.fetchWithAuth(`/api/variables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(variable)
      }, token);
    } catch (error) {
      return handleApiError(error, `/api/variables/${id} (PUT)`);
    }
  },
  
  // Удалить переменную
  deleteVariable: async (id: string, token: string): Promise<void> => {
    try {
      await api.fetchWithAuth(`/api/variables/${id}`, { method: 'DELETE' }, token);
    } catch (error) {
      handleApiError(error, `/api/variables/${id} (DELETE)`);
    }
  }
};

// API для истории
export const historyApi = {
  // Получить историю пользователя
  getHistory: async (token: string, limit: number = 20, offset: number = 0): Promise<HistoryEntry[]> => {
    try {
      const response = await api.fetchWithAuth<HistoryListResponse>(`/api/history?limit=${limit}&offset=${offset}`, { method: 'GET' }, token);
      return response.history;
    } catch (error) {
      return handleApiError(error, '/api/history');
    }
  },
  
  // Добавить запись в историю
  addHistoryEntry: async (entry: HistoryEntry, token: string): Promise<HistoryEntry> => {
    try {
      return await api.fetchWithAuth('/api/history', {
        method: 'POST',
        body: JSON.stringify(entry)
      }, token);
    } catch (error) {
      return handleApiError(error, '/api/history (POST)');
    }
  },
  
  // Удалить запись из истории
  deleteHistoryEntry: async (id: string, token: string): Promise<void> => {
    try {
      await api.fetchWithAuth(`/api/history/${id}`, { method: 'DELETE' }, token);
    } catch (error) {
      handleApiError(error, `/api/history/${id} (DELETE)`);
    }
  },
  
  // Очистить всю историю пользователя
  clearHistory: async (token: string): Promise<void> => {
    try {
      await api.fetchWithAuth('/api/history', { method: 'DELETE' }, token);
    } catch (error) {
      handleApiError(error, '/api/history (DELETE all)');
    }
  }
};

// API для улучшения промптов
export const enhanceApi = {
  // Улучшить промпт
  enhancePrompt: async (text: string, token: string): Promise<string> => {
    try {
      const response = await api.fetchWithAuth<EnhancePromptResponse>('/api/enhance-prompt', {
        method: 'POST',
        body: JSON.stringify({ text })
      }, token);
      return response.enhancedText;
    } catch (error) {
      return handleApiError(error, '/api/enhance-prompt');
    }
  }
};
