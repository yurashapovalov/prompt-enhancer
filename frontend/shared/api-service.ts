import { api } from './firebase-config';

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

// API для промптов
export const promptsApi = {
  // Получить все промпты пользователя
  getPrompts: async (token: string): Promise<Prompt[]> => {
    const response = await api.fetchWithAuth<PromptListResponse>('/api/prompts', { method: 'GET' }, token);
    return response.prompts;
  },
  
  // Получить конкретный промпт
  getPrompt: async (id: string, token: string): Promise<Prompt> => {
    return api.fetchWithAuth(`/api/prompts/${id}`, { method: 'GET' }, token);
  },
  
  // Создать новый промпт
  createPrompt: async (prompt: Prompt, token: string): Promise<Prompt> => {
    return api.fetchWithAuth('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(prompt)
    }, token);
  },
  
  // Обновить существующий промпт
  updatePrompt: async (id: string, prompt: Prompt, token: string): Promise<Prompt> => {
    return api.fetchWithAuth(`/api/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(prompt)
    }, token);
  },
  
  // Удалить промпт
  deletePrompt: async (id: string, token: string): Promise<void> => {
    await api.fetchWithAuth(`/api/prompts/${id}`, { method: 'DELETE' }, token);
  }
};

// API для переменных
export const variablesApi = {
  // Получить все переменные пользователя
  getVariables: async (token: string): Promise<Variable[]> => {
    const response = await api.fetchWithAuth<VariableListResponse>('/api/variables', { method: 'GET' }, token);
    return response.variables;
  },
  
  // Получить конкретную переменную
  getVariable: async (id: string, token: string): Promise<Variable> => {
    return api.fetchWithAuth(`/api/variables/${id}`, { method: 'GET' }, token);
  },
  
  // Создать новую переменную
  createVariable: async (variable: Variable, token: string): Promise<Variable> => {
    return api.fetchWithAuth('/api/variables', {
      method: 'POST',
      body: JSON.stringify(variable)
    }, token);
  },
  
  // Обновить существующую переменную
  updateVariable: async (id: string, variable: Variable, token: string): Promise<Variable> => {
    return api.fetchWithAuth(`/api/variables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(variable)
    }, token);
  },
  
  // Удалить переменную
  deleteVariable: async (id: string, token: string): Promise<void> => {
    await api.fetchWithAuth(`/api/variables/${id}`, { method: 'DELETE' }, token);
  }
};

// API для истории
export const historyApi = {
  // Получить историю пользователя
  getHistory: async (token: string, limit: number = 20, offset: number = 0): Promise<HistoryEntry[]> => {
    const response = await api.fetchWithAuth<HistoryListResponse>(`/api/history?limit=${limit}&offset=${offset}`, { method: 'GET' }, token);
    return response.history;
  },
  
  // Добавить запись в историю
  addHistoryEntry: async (entry: HistoryEntry, token: string): Promise<HistoryEntry> => {
    return api.fetchWithAuth('/api/history', {
      method: 'POST',
      body: JSON.stringify(entry)
    }, token);
  },
  
  // Удалить запись из истории
  deleteHistoryEntry: async (id: string, token: string): Promise<void> => {
    await api.fetchWithAuth(`/api/history/${id}`, { method: 'DELETE' }, token);
  },
  
  // Очистить всю историю пользователя
  clearHistory: async (token: string): Promise<void> => {
    await api.fetchWithAuth('/api/history', { method: 'DELETE' }, token);
  }
};

// API для улучшения промптов
export const enhanceApi = {
  // Улучшить промпт
  enhancePrompt: async (text: string, token: string): Promise<string> => {
    const response = await api.fetchWithAuth<EnhancePromptResponse>('/api/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify({ text })
    }, token);
    return response.enhancedText;
  }
};
