import { api } from '../../../shared/firebase-config';
// import { promptsCache, historyCache } from './cache-service';

// Types
export interface PromptVariable {
  name: string;
  value: string;
}

export interface Prompt {
  id?: string;
  promptName: string;
  promptDescription: string;
  promptText: string;
  color: string;
  variables?: PromptVariable[];
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
  // Get all user prompts
  getPrompts: async (token: string): Promise<Prompt[]> => {
    try {
      console.log('API: Requesting prompts...');
      const response = await api.fetchWithAuth<PromptListResponse>('/prompts', { method: 'GET' }, token);
      console.log('API: Response received:', response);
      
      // Validate that the response contains the prompts array
      if (!response || !response.prompts) {
        console.error('API: Invalid response format for prompts:', response);
        return [];
      }
      
      return response.prompts;
    } catch (error) {
      console.error('API: Error getting prompts:', error);
      return [];
    }
  },
  
  // Get a specific prompt
  getPrompt: async (id: string, token: string): Promise<Prompt> => {
    try {
      console.log('API: Requesting prompt details for id:', id);
      return await api.fetchWithAuth(`/prompts/${id}`, { method: 'GET' }, token);
    } catch (error) {
      return handleApiError(error, `/prompts/${id}`);
    }
  },
  
  // Create a new prompt
  createPrompt: async (prompt: Prompt, token: string): Promise<Prompt> => {
    try {
      return await api.fetchWithAuth('/prompts', {
        method: 'POST',
        body: JSON.stringify(prompt)
      }, token);
    } catch (error) {
      return handleApiError(error, '/prompts (POST)');
    }
  },
  
  // Update an existing prompt
  updatePrompt: async (id: string, prompt: Prompt, token: string): Promise<Prompt> => {
    try {
      return await api.fetchWithAuth(`/prompts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(prompt)
      }, token);
    } catch (error) {
      return handleApiError(error, `/prompts/${id} (PUT)`);
    }
  },
  
  // Delete a prompt
  deletePrompt: async (id: string, token: string): Promise<void> => {
    try {
      await api.fetchWithAuth(`/prompts/${id}`, { method: 'DELETE' }, token);
    } catch (error) {
      handleApiError(error, `/prompts/${id} (DELETE)`);
    }
  }
};


// API for history
export const historyApi = {
  // Get user history
  getHistory: async (token: string, limit: number = 20, offset: number = 0): Promise<HistoryEntry[]> => {
    try {
      console.log('API: Requesting history...');
      const response = await api.fetchWithAuth<HistoryListResponse>(`/history?limit=${limit}&offset=${offset}`, { method: 'GET' }, token);
      console.log('API: Response received:', response);
      
      // Validate that the response contains the history array
      if (!response || !response.history) {
        console.error('API: Invalid response format for history:', response);
        return [];
      }
      
      return response.history;
    } catch (error) {
      console.error('API: Error getting history:', error);
      return [];
    }
  },
  
  // Get a specific history entry
  getHistoryEntry: async (id: string, token: string): Promise<HistoryEntry | null> => {
    try {
      // Fetch all history and find the entry
      // (Since there's no direct API endpoint for a single history entry)
      console.log('API: Requesting all history to find entry with id:', id);
      const historyData = await historyApi.getHistory(token, 100, 0);
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
      return await api.fetchWithAuth('/history', {
        method: 'POST',
        body: JSON.stringify(entry)
      }, token);
    } catch (error) {
      return handleApiError(error, '/history (POST)');
    }
  },
  
  // Delete a history entry
  deleteHistoryEntry: async (id: string, token: string): Promise<void> => {
    try {
      await api.fetchWithAuth(`/history/${id}`, { method: 'DELETE' }, token);
    } catch (error) {
      handleApiError(error, `/history/${id} (DELETE)`);
    }
  },
  
  // Clear all user history
  clearHistory: async (token: string): Promise<void> => {
    try {
      await api.fetchWithAuth('/history', { method: 'DELETE' }, token);
    } catch (error) {
      handleApiError(error, '/history (DELETE all)');
    }
  }
};

// API for prompt enhancement
export const enhanceApi = {
  // Enhance a prompt
  enhancePrompt: async (text: string, token: string): Promise<string> => {
    try {
      const response = await api.fetchWithAuth<EnhancePromptResponse>('/enhance', {
        method: 'POST',
        body: JSON.stringify({ text })
      }, token);
      return response.enhancedText;
    } catch (error) {
      return handleApiError(error, '/enhance');
    }
  }
};
