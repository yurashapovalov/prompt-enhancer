import { Prompt, Variable, HistoryEntry } from './api-service';

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Check if we're in a Chrome extension environment
const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;

// Cache keys
const CACHE_KEYS = {
  PROMPTS: 'cached_prompts',
  PROMPTS_TIMESTAMP: 'cached_prompts_timestamp',
  VARIABLES: 'cached_variables',
  VARIABLES_TIMESTAMP: 'cached_variables_timestamp',
  HISTORY: 'cached_history',
  HISTORY_TIMESTAMP: 'cached_history_timestamp',
};

// Helper function to check if cache is stale
const isCacheStale = (timestamp: number | null): boolean => {
  if (timestamp === null) return true;
  return Date.now() - timestamp > CACHE_TTL;
};

// Cache service for prompts
export const promptsCache = {
  // Get cached prompts
  get: async (): Promise<{ data: Prompt[] | null; timestamp: number | null }> => {
    console.log('Getting cached prompts...');
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      const data = localStorage.getItem(CACHE_KEYS.PROMPTS);
      const timestamp = localStorage.getItem(CACHE_KEYS.PROMPTS_TIMESTAMP);
      
      return {
        data: data ? JSON.parse(data) : null,
        timestamp: timestamp ? parseInt(timestamp, 10) : null,
      };
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.get([CACHE_KEYS.PROMPTS, CACHE_KEYS.PROMPTS_TIMESTAMP], (result) => {
        resolve({
          data: result[CACHE_KEYS.PROMPTS] || null,
          timestamp: result[CACHE_KEYS.PROMPTS_TIMESTAMP] || null,
        });
      });
    });
  },
  
  // Set cached prompts
  set: async (data: Prompt[]): Promise<void> => {
    console.log('Setting cached prompts...');
    const timestamp = Date.now();
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      localStorage.setItem(CACHE_KEYS.PROMPTS, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.PROMPTS_TIMESTAMP, timestamp.toString());
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [CACHE_KEYS.PROMPTS]: data,
        [CACHE_KEYS.PROMPTS_TIMESTAMP]: timestamp,
      }, () => {
        resolve();
      });
    });
  },
  
  // Check if cache is valid
  isValid: async (): Promise<boolean> => {
    const { timestamp } = await promptsCache.get();
    return timestamp !== null && !isCacheStale(timestamp);
  },
  
  // Clear cache
  clear: async (): Promise<void> => {
    console.log('Clearing prompts cache...');
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      localStorage.removeItem(CACHE_KEYS.PROMPTS);
      localStorage.removeItem(CACHE_KEYS.PROMPTS_TIMESTAMP);
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.remove([CACHE_KEYS.PROMPTS, CACHE_KEYS.PROMPTS_TIMESTAMP], () => {
        resolve();
      });
    });
  },
};

// Cache service for variables
export const variablesCache = {
  // Get cached variables
  get: async (): Promise<{ data: Variable[] | null; timestamp: number | null }> => {
    console.log('Getting cached variables...');
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      const data = localStorage.getItem(CACHE_KEYS.VARIABLES);
      const timestamp = localStorage.getItem(CACHE_KEYS.VARIABLES_TIMESTAMP);
      
      return {
        data: data ? JSON.parse(data) : null,
        timestamp: timestamp ? parseInt(timestamp, 10) : null,
      };
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.get([CACHE_KEYS.VARIABLES, CACHE_KEYS.VARIABLES_TIMESTAMP], (result) => {
        resolve({
          data: result[CACHE_KEYS.VARIABLES] || null,
          timestamp: result[CACHE_KEYS.VARIABLES_TIMESTAMP] || null,
        });
      });
    });
  },
  
  // Set cached variables
  set: async (data: Variable[]): Promise<void> => {
    console.log('Setting cached variables...');
    const timestamp = Date.now();
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      localStorage.setItem(CACHE_KEYS.VARIABLES, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.VARIABLES_TIMESTAMP, timestamp.toString());
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [CACHE_KEYS.VARIABLES]: data,
        [CACHE_KEYS.VARIABLES_TIMESTAMP]: timestamp,
      }, () => {
        resolve();
      });
    });
  },
  
  // Check if cache is valid
  isValid: async (): Promise<boolean> => {
    const { timestamp } = await variablesCache.get();
    return timestamp !== null && !isCacheStale(timestamp);
  },
  
  // Clear cache
  clear: async (): Promise<void> => {
    console.log('Clearing variables cache...');
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      localStorage.removeItem(CACHE_KEYS.VARIABLES);
      localStorage.removeItem(CACHE_KEYS.VARIABLES_TIMESTAMP);
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.remove([CACHE_KEYS.VARIABLES, CACHE_KEYS.VARIABLES_TIMESTAMP], () => {
        resolve();
      });
    });
  },
};

// Cache service for history
export const historyCache = {
  // Get cached history
  get: async (): Promise<{ data: HistoryEntry[] | null; timestamp: number | null }> => {
    console.log('Getting cached history...');
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      const data = localStorage.getItem(CACHE_KEYS.HISTORY);
      const timestamp = localStorage.getItem(CACHE_KEYS.HISTORY_TIMESTAMP);
      
      return {
        data: data ? JSON.parse(data) : null,
        timestamp: timestamp ? parseInt(timestamp, 10) : null,
      };
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.get([CACHE_KEYS.HISTORY, CACHE_KEYS.HISTORY_TIMESTAMP], (result) => {
        resolve({
          data: result[CACHE_KEYS.HISTORY] || null,
          timestamp: result[CACHE_KEYS.HISTORY_TIMESTAMP] || null,
        });
      });
    });
  },
  
  // Set cached history
  set: async (data: HistoryEntry[]): Promise<void> => {
    console.log('Setting cached history...');
    const timestamp = Date.now();
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      localStorage.setItem(CACHE_KEYS.HISTORY, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.HISTORY_TIMESTAMP, timestamp.toString());
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [CACHE_KEYS.HISTORY]: data,
        [CACHE_KEYS.HISTORY_TIMESTAMP]: timestamp,
      }, () => {
        resolve();
      });
    });
  },
  
  // Check if cache is valid
  isValid: async (): Promise<boolean> => {
    const { timestamp } = await historyCache.get();
    return timestamp !== null && !isCacheStale(timestamp);
  },
  
  // Clear cache
  clear: async (): Promise<void> => {
    console.log('Clearing history cache...');
    
    if (!isChromeExtension) {
      // For testing in browser, use localStorage
      localStorage.removeItem(CACHE_KEYS.HISTORY);
      localStorage.removeItem(CACHE_KEYS.HISTORY_TIMESTAMP);
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.remove([CACHE_KEYS.HISTORY, CACHE_KEYS.HISTORY_TIMESTAMP], () => {
        resolve();
      });
    });
  },
};

// Clear all cache
export const clearAllCache = async (): Promise<void> => {
  console.log('Clearing all cache...');
  await Promise.all([
    promptsCache.clear(),
    variablesCache.clear(),
    historyCache.clear(),
  ]);
};
