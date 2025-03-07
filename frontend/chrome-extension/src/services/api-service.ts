import { api } from '../../../shared/firebase-config';
import { promptsCache, variablesCache, historyCache } from './cache-service';

// Types
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

// API response interfaces
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

// Helper function for error handling
const handleApiError = (error: any, endpoint: string) => {
  console.error(`API Error (${endpoint}):`, error);
  
  // Create a more informative error message
  let errorMessage = `Error accessing ${endpoint}`;
  
  if (error.message) {
    errorMessage += `: ${error.message}`;
  }
  
  // If there is additional error information
  if (error.response) {
    try {
      const responseData = error.response.data;
      errorMessage += ` (${error.response.status}: ${JSON.stringify(responseData)})`;
    } catch (e) {
      errorMessage += ` (${error.response.status})`;
    }
  }
  
  // Create a new error object with more detailed information
  const enhancedError = new Error(errorMessage);
  enhancedError.name = 'ApiError';
  // We don't use the 'cause' property as it's only available in ES2022+
  
  throw enhancedError;
};

// API for prompts
export const promptsApi = {
  // Get all user prompts with caching
  getPrompts: async (token: string, forceRefresh = false): Promise<Prompt[]> => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const isValid = await promptsCache.isValid();
        if (isValid) {
          const { data } = await promptsCache.get();
          if (data && data.length > 0) {
            console.log('Using cached prompts data');
            return data;
          }
        }
      }
      
      // Cache invalid or empty, fetch from API
      console.log('API: Requesting prompts...');
      const response = await api.fetchWithAuth<PromptListResponse>('/api/prompts', { method: 'GET' }, token);
      console.log('API: Response received:', response);
      
      // Cache the result
      await promptsCache.set(response.prompts);
      
      return response.prompts;
    } catch (error) {
      return handleApiError(error, '/api/prompts');
    }
  },
  
  // Get a specific prompt with caching
  getPrompt: async (id: string, token: string, forceRefresh = false): Promise<Prompt> => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const isValid = await promptsCache.isValid();
        if (isValid) {
          const { data } = await promptsCache.get();
          if (data && data.length > 0) {
            // Try to find the prompt in the cached list
            const cachedPrompt = data.find(prompt => prompt.id === id);
            if (cachedPrompt) {
              console.log('Using cached prompt data for id:', id);
              return cachedPrompt;
            }
          }
        }
      }
      
      // Cache miss or forced refresh, fetch from API
      console.log('API: Requesting prompt details for id:', id);
      return await api.fetchWithAuth(`/api/prompts/${id}`, { method: 'GET' }, token);
    } catch (error) {
      return handleApiError(error, `/api/prompts/${id}`);
    }
  },
  
  // Create a new prompt
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
  
  // Update an existing prompt
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
  
  // Delete a prompt
  deletePrompt: async (id: string, token: string): Promise<void> => {
    try {
      await api.fetchWithAuth(`/api/prompts/${id}`, { method: 'DELETE' }, token);
    } catch (error) {
      handleApiError(error, `/api/prompts/${id} (DELETE)`);
    }
  }
};

// API for variables
export const variablesApi = {
  // Get all user variables with caching
  getVariables: async (token: string, forceRefresh = false): Promise<Variable[]> => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const isValid = await variablesCache.isValid();
        if (isValid) {
          const { data } = await variablesCache.get();
          if (data && data.length > 0) {
            console.log('Using cached variables data');
            return data;
          }
        }
      }
      
      // Cache invalid or empty, fetch from API
      console.log('API: Requesting variables...');
      const response = await api.fetchWithAuth<VariableListResponse>('/api/variables', { method: 'GET' }, token);
      console.log('API: Response received:', response);
      
      // Cache the result
      await variablesCache.set(response.variables);
      
      return response.variables;
    } catch (error) {
      return handleApiError(error, '/api/variables');
    }
  },
  
  // Get a specific variable with caching
  getVariable: async (id: string, token: string, forceRefresh = false): Promise<Variable> => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const isValid = await variablesCache.isValid();
        if (isValid) {
          const { data } = await variablesCache.get();
          if (data && data.length > 0) {
            // Try to find the variable in the cached list
            const cachedVariable = data.find(variable => variable.id === id);
            if (cachedVariable) {
              console.log('Using cached variable data for id:', id);
              return cachedVariable;
            }
          }
        }
      }
      
      // Cache miss or forced refresh, fetch from API
      console.log('API: Requesting variable details for id:', id);
      return await api.fetchWithAuth(`/api/variables/${id}`, { method: 'GET' }, token);
    } catch (error) {
      return handleApiError(error, `/api/variables/${id}`);
    }
  },
  
  // Create a new variable
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
  
  // Update an existing variable
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
  
  // Delete a variable
  deleteVariable: async (id: string, token: string): Promise<void> => {
    try {
      await api.fetchWithAuth(`/api/variables/${id}`, { method: 'DELETE' }, token);
      
      // Invalidate cache after deletion
      await variablesCache.clear();
    } catch (error) {
      handleApiError(error, `/api/variables/${id} (DELETE)`);
    }
  }
};

// API for history
export const historyApi = {
  // Get user history with caching
  getHistory: async (token: string, limit: number = 20, offset: number = 0, forceRefresh = false): Promise<HistoryEntry[]> => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const isValid = await historyCache.isValid();
        if (isValid) {
          const { data } = await historyCache.get();
          if (data && data.length > 0) {
            console.log('Using cached history data');
            return data;
          }
        }
      }
      
      // Cache invalid or empty, fetch from API
      console.log('API: Requesting history...');
      const response = await api.fetchWithAuth<HistoryListResponse>(`/api/history?limit=${limit}&offset=${offset}`, { method: 'GET' }, token);
      console.log('API: Response received:', response);
      
      // Cache the result
      await historyCache.set(response.history);
      
      return response.history;
    } catch (error) {
      return handleApiError(error, '/api/history');
    }
  },
  
  // Get a specific history entry with caching
  getHistoryEntry: async (id: string, token: string, forceRefresh = false): Promise<HistoryEntry | null> => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const isValid = await historyCache.isValid();
        if (isValid) {
          const { data } = await historyCache.get();
          if (data && data.length > 0) {
            // Try to find the history entry in the cached list
            const cachedEntry = data.find(entry => entry.id === id);
            if (cachedEntry) {
              console.log('Using cached history entry data for id:', id);
              return cachedEntry;
            }
          }
        }
      }
      
      // Cache miss or forced refresh, fetch all history and find the entry
      // (Since there's no direct API endpoint for a single history entry)
      console.log('API: Requesting all history to find entry with id:', id);
      const historyData = await historyApi.getHistory(token, 100, 0, true);
      const entry = historyData.find(item => item.id === id);
      
      return entry || null;
    } catch (error) {
      console.error(`Error getting history entry (${id}):`, error);
      return null;
    }
  },
  
  // Add an entry to history
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
  
  // Delete a history entry
  deleteHistoryEntry: async (id: string, token: string): Promise<void> => {
    try {
      await api.fetchWithAuth(`/api/history/${id}`, { method: 'DELETE' }, token);
      
      // Invalidate cache after deletion
      await historyCache.clear();
    } catch (error) {
      handleApiError(error, `/api/history/${id} (DELETE)`);
    }
  },
  
  // Clear all user history
  clearHistory: async (token: string): Promise<void> => {
    try {
      await api.fetchWithAuth('/api/history', { method: 'DELETE' }, token);
      
      // Invalidate cache after clearing
      await historyCache.clear();
    } catch (error) {
      handleApiError(error, '/api/history (DELETE all)');
    }
  }
};

// API for prompt enhancement
export const enhanceApi = {
  // Enhance a prompt
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
